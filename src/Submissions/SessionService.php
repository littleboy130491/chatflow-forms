<?php
namespace ChatFlow\Submissions;

use ChatFlow\Fields\Registry;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Integrations\HookDispatcher;
use ChatFlow\Integrations\Outbox;
use ChatFlow\Logic\Engine;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Spam\Protection;
use ChatFlow\Spam\RateLimiter;
use ChatFlow\Tracking\IpResolver;
use ChatFlow\Tracking\Metadata;

final class SessionService {
	private TokenSigner $signer;
	private Repository $submissions;
	private Idempotency $requests;
	/**
	 * @var list<array{hook:string,args:array<mixed>,id:int}> */
	private array $hooks = array();
	/**
	 * @var list<int> */
	private array $deliveries = array();
	public function __construct( private FormRepository $forms, private Engine $engine, private Registry $fields ) {
		$this->signer      = new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() );
		$this->submissions = new Repository( $forms );
		$this->requests    = new Idempotency();
	}

	/**
	 * @param array<string,mixed> $body
	 * @return array<string,mixed>|\WP_Error */
	public function start( array $body, string $token, string $key ): array|\WP_Error {
		$form_id = $body['formId'] ?? 0;
		$version = $body['version'] ?? 0;
		if ( ! is_int( $form_id ) || ! is_int( $version ) || ! $this->signer->verify(
			$token,
			'start',
			array(
				'formId'  => $form_id,
				'version' => $version,
			),
			time()
		) ) {
			return $this->unauthorized(); }
		$client  = $body['meta'] ?? array();
		$prefill = $body['prefill'] ?? array();
		if ( ! is_array( $client ) || ! is_array( $prefill ) || strlen( Database::json( $body ) ) > 1048576 ) {
			return Database::error( 'cff_invalid_request', 'Invalid session data.', 422 ); }
		$metadata = new Metadata();
		$client   = $metadata->validate( $client );
		if ( is_wp_error( $client ) ) {
			return $client; }
		$this->reset();
		$result = Database::transaction(
			function () use ( $body, $token, $key, $form_id, $version, $metadata, $client, $prefill ) {
				global $wpdb;
				$guard = $this->requests->begin( 'start:' . hash( 'sha256', $token ), $key, $body );
				if ( is_wp_error( $guard ) ) {
					return $guard; }
				if ( null !== $guard['response'] ) {
					return $guard['response']; }
				// Rate-limit actual sessions; handshake quotas alone can be bypassed with new keys.
				// Idempotent retries return before this counter.
				$ip = ( new IpResolver() )->resolve( $_SERVER, \ChatFlow\Rest\Settings::get()['proxy'] );
				if ( ! ( new RateLimiter() )->consume( 'session-start:' . $form_id . ':' . $ip, 30, 600 ) ) {
					return Database::error( 'cff_rate_limit', 'Please wait before starting again.', 429, array( 'retryAfter' => 600 ) ); }
				$this->lockForm( $form_id );
				$form = $this->forms->getPublished( $form_id, $version );
				if ( ! $form ) {
					return Database::error( 'cff_form_not_found', 'Published form not found.', 404 ); }
				$limit = $this->limits( $form );
				if ( $limit ) {
					return $limit; }
				$meta = $metadata->collect( $form, $client, $_SERVER );
				$meta = HookDispatcher::filter( 'cff_submission_meta', $meta, array( $form ) );
				// Revalidate extensions: arbitrary keys never become stored metadata.
				$meta                       = $this->safeMeta( is_array( $meta ) ? $meta : array() );
				$context                    = $metadata->context( $form, $meta );
				$context['defaultEndingId'] = $form->settings()['completion']['defaultEndingId'] ?? '';
				$replay                     = $this->replay( $form, $prefill, $context, 'partial' );
				if ( is_wp_error( $replay ) ) {
					return $replay; }
				$context['_answers']    = $replay['answers'];
				$context['_startScope'] = hash( 'sha256', get_current_blog_id() . ':start:' . hash( 'sha256', $token ) );
				$settings               = $form->settings()['sessions'] ?? array();
				$resume                 = ( $settings['resumeEnabled'] ?? true ) && ( $settings['savePartial'] ?? true );
				$days                   = max( 1, min( 90, (int) ( $settings['resumeDays'] ?? 30 ) ) );
				$credential             = $this->signer->issueResume( time(), $days );
				$expiry                 = gmdate( 'Y-m-d H:i:s', time() + ( $resume ? $days * 86400 : 86400 ) );
				$submission             = null;
				$meta['context']        = array_intersect_key( $context, array_flip( array( 'hidden', 'url', 'meta', 'now', 'defaultEndingId' ) ) );
				if ( $settings['savePartial'] ?? true ) {
					$submission = $this->submissions->savePartial( $this->data( $form, $replay, $meta ) ); }
				$context['_meta'] = $meta;
				Database::check(
					$wpdb->insert(
						$wpdb->prefix . 'cff_sessions',
						array(
							'public_id'     => wp_generate_uuid4(),
							'resume_hash'   => hash( 'sha256', $credential ),
							'form_id'       => $form_id,
							'form_version'  => $version,
							'submission_id' => $submission?->id(),
							'context'       => Database::json( $context ),
							'started_at'    => Database::now(),
							'last_seen_at'  => Database::now(),
							'expires_at'    => $expiry,
						)
					)
				);
				$row      = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE id=%d", $wpdb->insert_id ), ARRAY_A );
				$envelope = $this->envelope( $row, $form, $replay );
				if ( $resume ) {
					$envelope['resumeToken']     = $credential;
					$envelope['resumeExpiresAt'] = gmdate( 'c', strtotime( $expiry . ' UTC' ) ); }
				$this->requests->finish( $guard['id'], $envelope, 201 );
				$this->hooks[] = array(
					'hook' => 'cff_session_started',
					'args' => array(
						array(
							'sessionId' => $row['public_id'],
							'formId'    => $form_id,
							'version'   => $version,
							'startedAt' => $row['started_at'],
						),
						$form,
					),
					'id'   => $submission?->id() ?? 0,
				);
				return $envelope;
			}
		);
		$this->after( $result );
		return $result;
	}

	/**
	 * @return array<string,mixed>|\WP_Error */
	public function resume( int $form_id, string $credential ): array|\WP_Error {
		global $wpdb;
		if ( ! $this->signer->verifyResume( $credential, time() ) ) {
			return $this->unauthorized(); }
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE resume_hash=%s AND form_id=%d", hash( 'sha256', $credential ), $form_id ), ARRAY_A );
		if ( ! $row || ! hash_equals( $row['resume_hash'], hash( 'sha256', $credential ) ) || 'active' !== $row['status'] || strtotime( $row['expires_at'] . ' UTC' ) <= time() ) {
			return $this->unauthorized(); }
		$form = $this->snapshot( $row );
		if ( is_wp_error( $form ) ) {
			return $form; }
		if ( ! ( $form->settings()['sessions']['resumeEnabled'] ?? true ) || ! ( $form->settings()['sessions']['savePartial'] ?? true ) ) {
			return $this->unauthorized(); }
		$replay = $this->storedReplay( $row, $form );
		if ( is_wp_error( $replay ) ) {
			return $replay; }
		$envelope                    = $this->envelope( $row, $form, $replay );
		$envelope['resumeToken']     = $credential;
		$envelope['resumeExpiresAt'] = gmdate( 'c', strtotime( $row['expires_at'] . ' UTC' ) );
		return $envelope;
	}

	/**
	 * @return array<string,mixed>|\WP_Error */
	public function get( string $id, string $token ): array|\WP_Error {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $id ), ARRAY_A );
		if ( ! $row || ! $this->verify( $row, $token ) ) {
			return $this->unauthorized(); }
		$form = $this->snapshot( $row );
		if ( is_wp_error( $form ) ) {
			return $form; }
		$replay = $this->storedReplay( $row, $form );
		return is_wp_error( $replay ) ? $replay : $this->envelope( $row, $form, $replay );
	}

	/**
	 * @param array<string,mixed> $body
	 * @return array<string,mixed>|\WP_Error */
	public function mutate( string $operation, string $id, array $body, string $token, string $key ): array|\WP_Error {
		$this->reset();
		$result = Database::transaction(
			function () use ( $operation, $id, $body, $token, $key ) {
				global $wpdb;
				$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s FOR UPDATE", $id ), ARRAY_A );
				if ( ! $row ) {
					return $this->unauthorized(); }
				if ( 'submit' === $operation && 'completed' === $row['status'] && $this->verifyReceiptToken( $row, $token ) ) {
					$receipt = $this->requests->receipt( 'session:' . $id . ':submit', $key, $body );
					if ( null !== $receipt ) {
						return $receipt; }
				}
				if ( ! $this->verify( $row, $token ) ) {
					return $this->unauthorized(); }
				$guard = $this->requests->begin( 'session:' . $id . ':' . $operation, $key, $body, 'submit' === $operation ? 315360000 : 86400 );
				if ( is_wp_error( $guard ) ) {
					return $guard; }
				if ( null !== $guard['response'] ) {
					return $guard['response']; }
				if ( 'active' !== $row['status'] || strtotime( $row['expires_at'] . ' UTC' ) <= time() ) {
					return $this->unauthorized(); }
				if ( ( $body['version'] ?? null ) !== (int) $row['form_version'] ) {
					return Database::error( 'cff_version_conflict', 'Continue the pinned version or start over.', 409 ); }
				if ( ( $body['revision'] ?? null ) !== (int) $row['revision'] ) {
					return Database::error( 'cff_revision_conflict', 'The session changed. Reload before saving.', 409, array( 'revision' => (int) $row['revision'] ) ); }
				$this->lockForm( (int) $row['form_id'] );
				$form = $this->snapshot( $row );
				if ( is_wp_error( $form ) ) {
					return $form; }
				$context    = Database::decode( $row['context'] );
				$submission = $row['submission_id'] ? $this->submissions->get( (int) $row['submission_id'] ) : null;
				$revision   = (int) $row['revision'] + 1;
				if ( 'delete' === $operation ) {
					if ( $submission ) {
						if ( $form->settings()['sessions']['deletePartialOnRestart'] ?? false ) {
							$this->submissions->removeForRestart( $submission->id() );
						} else {
							$submission = $this->submissions->complete(
								$submission->id(),
								array(
									'status'       => 'abandoned',
									'abandoned_at' => Database::now(),
								)
							);
							$this->enqueue( $submission, $form, 'submission.abandoned' );
							$this->lifecycle( 'cff_submission_abandoned', $submission, $form );
						}
					}
					$changes  = array(
						'status'    => 'closed',
						'closed_at' => Database::now(),
					);
					$response = array( 'closed' => true );
				} else {
					$answers = $body['answers'] ?? null;
					if ( ! is_array( $answers ) || strlen( Database::json( $body ) ) > 1048576 ) {
						return Database::error( 'cff_invalid_answers', 'An answer map is required.', 422 ); }
					$replay = $this->replay( $form, $answers, $context, 'submit' === $operation ? 'complete' : 'partial' );
					if ( is_wp_error( $replay ) ) {
						return $replay; }
					$timings = $this->timings( $body['stepTimings'] ?? array(), $replay['visited'] );
					if ( is_wp_error( $timings ) ) {
						return $timings; }
					$meta                 = $context['_meta'] ?? array();
					$data                 = $this->data( $form, $replay, $meta );
					$data['step_timings'] = $timings;
					$changes              = array();
					if ( 'submit' === $operation ) {
						$limit = $this->limits( $form );
						if ( $limit ) {
							return $limit; }
						$spam = array_merge( \ChatFlow\Rest\Settings::get()['spam'], $form->settings()['spam'] ?? array() );
						$ip   = ( new IpResolver() )->resolve( $_SERVER, get_option( 'cff_settings', array() )['proxy'] ?? array() );
						if ( ! ( new RateLimiter() )->consume( 'submit:' . $form->id() . ':' . $ip, $spam['rateLimit'] ?? 10, $spam['rateWindowSeconds'] ?? 600 ) ) {
							return Database::error( 'cff_rate_limit', 'Please wait before submitting again.', 429, array( 'retryAfter' => $spam['rateWindowSeconds'] ?? 600 ) ); }
						$reasons                     = ( new Protection() )->reasons( $form, $body, strtotime( $row['started_at'] . ' UTC' ) );
						$data['status']              = $reasons ? 'spam' : 'completed';
						$data['spam_reasons']        = $reasons;
						$data['completed_at']        = Database::now();
						$data['duration_ms']         = max( 0, ( time() - strtotime( $row['started_at'] . ' UTC' ) ) * 1000 );
						$data['meta']['duration_ms'] = $data['duration_ms'];
						$submission                  = $submission ? $this->submissions->complete( $submission->id(), $data ) : $this->submissions->savePartial( array_merge( $data, array( 'started_at' => $row['started_at'] ) ) );
						$response                    = ( new Ending() )->build( $submission, $form, $replay['endingId'] );
						if ( is_wp_error( $response ) ) {
							return $response; }
						$changes = array(
							'status'        => 'completed',
							'closed_at'     => Database::now(),
							'submission_id' => $submission->id(),
						);
						if ( ! $reasons ) {
							$this->enqueue( $submission, $form, 'submission.completed' );
							$this->lifecycle( 'cff_submission_completed', $submission, $form ); }
					} else {
						if ( $form->settings()['sessions']['savePartial'] ?? true ) {
							$submission               = $submission ? $this->submissions->complete( $submission->id(), $data ) : $this->submissions->savePartial( $data );
							$changes['submission_id'] = $submission->id();
							$this->enqueue( $submission, $form, 'submission.partial', $revision );
							$this->lifecycle( 'cff_submission_partial_saved', $submission, $form );
						}
						$response = $this->envelope( array_merge( $row, array( 'revision' => $revision ) ), $form, $replay );
					}
				}
				$changes['revision'] = $revision;
				if ( isset( $replay ) ) {
					$context['_answers'] = $replay['answers'];
					$changes['context']  = Database::json( $context ); }
				$changes['last_seen_at'] = Database::now();
				Database::check( $wpdb->update( $wpdb->prefix . 'cff_sessions', $changes, array( 'id' => $row['id'] ) ) );
				$this->requests->finish( $guard['id'], $response );
				return $response;
			}
		);
		$this->after( $result );
		return $result;
	}

	/**
	 * @param array<string,mixed> $row */
	private function verify( array $row, string $token ): bool {
		return null !== $this->signer->verify(
			$token,
			'request',
			array(
				'sessionId' => $row['public_id'],
				'formId'    => (int) $row['form_id'],
				'version'   => (int) $row['form_version'],
			),
			time()
		);
	}
	/**
	 * @param array<string,mixed> $row
	 */
	private function verifyReceiptToken( array $row, string $token ): bool {
		$parts = explode( '.', $token );
		if ( count( $parts ) !== 3 || strlen( $token ) > 2048 ) {
			return false; }
		$claims = Database::decode( base64_decode( strtr( $parts[1], '-_', '+/' ), true ) );
		if ( ! is_int( $claims['iat'] ?? null ) ) {
			return false; }
		return null !== $this->signer->verify(
			$token,
			'request',
			array(
				'sessionId' => $row['public_id'],
				'formId'    => (int) $row['form_id'],
				'version'   => (int) $row['form_version'],
			),
			$claims['iat']
		);
	}
	/**
	 * @param array<string,mixed> $row */
	private function snapshot( array $row ): Form|\WP_Error {
		if ( ! $this->forms->getPublished( (int) $row['form_id'] ) ) {
			return Database::error( 'cff_form_not_found', 'Published form not found.', 404 ); }
		return $this->forms->getPublished( (int) $row['form_id'], (int) $row['form_version'] ) ?? Database::error( 'cff_version_conflict', 'The saved version is unavailable. Your partial was kept.', 409 );
	}
	private function lockForm( int $id ): void {
		global $wpdb;
		$wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE ID=%d AND post_type='cff_form' FOR UPDATE", $id ) );
		clean_post_cache( $id );
	}
	/**
	 * @param array<string,mixed> $row
	 * @return array<string,mixed>|\WP_Error */
	private function storedReplay( array $row, Form $form ): array|\WP_Error {
		$submission = $row['submission_id'] ? $this->submissions->get( (int) $row['submission_id'] ) : null;
		$context    = Database::decode( $row['context'] );
		return $this->replay( $form, $submission?->answers() ?? $context['_answers'] ?? array(), $context, 'partial' );
	}
	/**
	 * @param array<string,mixed> $answers
	 * @param array<string,mixed> $context
	 * @return array<string,mixed>|\WP_Error */
	private function replay( Form $form, array $answers, array $context, string $mode ): array|\WP_Error {
		$replay = $this->engine->replay( $form->schema(), $answers, $context, $mode );
		$issues = $replay['errors'];
		foreach ( $form->schema()['steps'] as $step ) {
			if ( in_array( $step['id'], $replay['visited'], true ) && array_key_exists( $step['key'], $replay['answers'] ) ) {
				$this->fields->get( $step['type'] );
				$extra = HookDispatcher::filter( 'cff_validate_answer', array(), array( $step, $replay['answers'][ $step['key'] ], $form ) );
				if ( is_array( $extra ) ) {
					$issues = array_merge( $issues, $extra ); }
			}
		}
		return $issues || $replay['discardedKeys'] ? Database::error( 'cff_validation_failed', 'Please check your answers.', 422, array( 'errors' => $issues ) ) : $replay;
	}
	/**
	 * @param array<string,mixed> $row
	 * @param array<string,mixed> $replay
	 * @return array<string,mixed> */
	private function envelope( array $row, Form $form, array $replay ): array {
		$context = Database::decode( $row['context'] );
		unset( $context['_meta'], $context['_answers'], $context['_startScope'] );
		foreach ( array( 'hidden', 'url', 'meta' ) as $key ) {
			$context[ $key ] = (object) ( $context[ $key ] ?? array() ); }
		return array(
			'sessionId'        => $row['public_id'],
			'formId'           => $form->id(),
			'version'          => $form->version(),
			'revision'         => (int) $row['revision'],
			'status'           => strtotime( $row['expires_at'] . ' UTC' ) <= time() ? 'expired' : $row['status'],
			'answers'          => (object) $replay['answers'],
			'visited'          => $replay['visited'],
			'currentStepId'    => $replay['currentStepId'],
			'progress'         => $replay['progress'],
			'context'          => $context,
			'requestToken'     => $this->signer->issue(
				'request',
				array(
					'sessionId' => $row['public_id'],
					'formId'    => $form->id(),
					'version'   => $form->version(),
				),
				time()
			),
			'requestExpiresAt' => gmdate( 'c', time() + 900 ),
		);
	}
	/**
	 * @param array<string,mixed> $replay
	 * @param array<string,mixed> $meta
	 * @return array<string,mixed> */
	private function data( Form $form, array $replay, array $meta ): array {
		$data = array(
			'form_id'         => $form->id(),
			'form_version'    => $form->version(),
			'answers'         => $replay['answers'],
			'variables'       => $replay['variables'],
			'visited'         => $replay['visited'],
			'ending_id'       => $replay['endingId'] ?? '',
			'current_step_id' => $replay['currentStepId'] ?? '',
			'progress'        => $replay['progress'],
			'meta'            => $meta,
			'consent'         => array(),
		);
		if ( ! empty( $form->settings()['limits']['perUser'] ) ) {
			$data['user_id'] = get_current_user_id(); }
		foreach ( $form->schema()['steps'] as $step ) {
			if ( 'consent' === $step['type'] && true === ( $replay['answers'][ $step['key'] ] ?? null ) ) {
				$data['consent'][] = array(
					'fieldKey'   => $step['key'],
					'text'       => $step['settings']['consentText'] ?? implode( '\n', $step['messages'] ),
					'version'    => $form->version(),
					'acceptedAt' => gmdate( 'c' ),
				); }
		}
		foreach ( array( 'user_id', 'user_agent', 'browser', 'browser_version', 'os', 'os_version', 'device_type', 'device_brand', 'page_url', 'referrer', 'landing_page', 'landing_referrer', 'locale', 'timezone', 'screen', 'country' ) as $key ) {
			if ( isset( $meta[ $key ] ) ) {
				$data[ $key ] = $meta[ $key ]; }
		}
		if ( isset( $meta['ip'] ) ) {
			$data['ip'] = inet_pton( $meta['ip'] ) ? inet_pton( $meta['ip'] ) : null; }
		foreach ( $meta['utm'] ?? array() as $key => $value ) {
			$data[ 'utm_' . $key ] = $value; }
		$data['click_ids'] = $meta['click_ids'] ?? array();
		return $data;
	}
	private function limits( Form $form ): ?\WP_Error {
		global $wpdb;
		$limits = $form->settings()['limits'] ?? array();
		if ( ( $limits['requireLogin'] ?? false ) && ! get_current_user_id() ) {
			return Database::error( 'cff_login_required', 'Please log in to continue.', 401 ); }
		if ( ! empty( $limits['closesAt'] ) && strtotime( $limits['closesAt'] ) <= time() ) {
			return Database::error( 'cff_form_closed', 'This form is closed.', 409 ); }
		if ( ! empty( $limits['total'] ) && (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND status='completed'", $form->id() ) ) >= $limits['total'] ) {
			return Database::error( 'cff_form_limit', 'This form has reached its limit.', 409 ); }
		if ( ! empty( $limits['perUser'] ) ) {
			if ( ! get_current_user_id() ) {
				return Database::error( 'cff_login_required', 'Log in for this per-user form.', 401 ); }
			if ( (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND user_id=%d AND status='completed'", $form->id(), get_current_user_id() ) ) >= $limits['perUser'] ) {
				return Database::error( 'cff_user_limit', 'You have reached this form limit.', 409 ); }
		}
		return null;
	}
	/**
	 * @param mixed $timings
	 * @param list<string> $visited
	 * @return array<string,int>|\WP_Error */
	private function timings( mixed $timings, array $visited ): array|\WP_Error {
		if ( is_object( $timings ) ) {
			$timings = (array) $timings; }
		if ( ! is_array( $timings ) || count( $timings ) > 500 ) {
			return Database::error( 'cff_invalid_timings', 'Invalid step timings.', 422 ); }
		foreach ( $timings as $id => $ms ) {
			if ( ! in_array( $id, $visited, true ) || ! is_int( $ms ) || $ms < 0 || $ms > 604800000 ) {
				return Database::error( 'cff_invalid_timings', 'Invalid step timing.', 422 ); }
		}
		return $timings;
	}
	/**
	 * @param array<string,mixed> $meta
	 * @return array<string,mixed> */
	private function safeMeta( array $meta ): array {
		$allowed = array( 'ip', 'user_id', 'user_agent', 'browser', 'browser_version', 'os', 'os_version', 'device_type', 'device_brand', 'page_url', 'referrer', 'landing_page', 'landing_referrer', 'utm', 'click_ids', 'locale', 'timezone', 'screen', 'country' );
		$meta    = array_intersect_key( $meta, array_flip( $allowed ) );
		foreach ( $meta as $key => $value ) {
			if ( is_string( $value ) ) {
				$meta[ $key ] = substr( sanitize_text_field( $value ), 0, 2000 ); }
		}
		return $meta;
	}
	private function enqueue( Submission $submission, Form $form, string $event, int $revision = 0 ): void {
		$this->deliveries = array_merge( $this->deliveries, ( new Outbox() )->enqueue( $submission, $form, $event, $revision ) );
	}
	private function lifecycle( string $hook, Submission $submission, Form $form ): void {
		$this->hooks[] = array(
			'hook' => $hook,
			'args' => array( $submission, $form ),
			'id'   => $submission->id(),
		); }
	private function reset(): void {
		$this->hooks      = array();
		$this->deliveries = array(); }
	private function after( mixed $result ): void {
		if ( is_wp_error( $result ) ) {
			$this->reset();
			return; }
		foreach ( $this->hooks as $hook ) {
			HookDispatcher::action( $hook['hook'], $hook['args'], $hook['id'] );
		}
		if ( $this->deliveries ) {
			HookDispatcher::action( 'cff_outbox_ready', array( $this->deliveries ) ); }
		$this->reset();
	}
	private function unauthorized(): \WP_Error {
		return Database::error( 'cff_invalid_credential', 'Invalid or expired session credential.', 401 ); }
}
