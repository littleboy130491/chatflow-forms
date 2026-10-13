<?php
namespace ChatFlow\Submissions;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Rest\UploadSession;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Spam\RateLimiter;

final class MagicLinks implements Module {
	private const GENERIC = array( 'accepted' => true );
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'routes' ) );
		add_action( 'cff_send_magic_link', array( $this, 'deliver' ) );
		add_action( 'cff_recover_magic_links', array( $this, 'recover' ) );
		if ( ! wp_next_scheduled( 'cff_recover_magic_links' ) ) {
			wp_schedule_event( time() + 300, 'hourly', 'cff_recover_magic_links' ); }
	}
	public function routes(): void {
		register_rest_route(
			'cff/v1',
			'/sessions/(?P<id>[a-fA-F0-9-]{36})/magic-link',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'issue' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			'cff/v1',
			'/sessions/magic-resume',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'consume' ),
				'permission_callback' => '__return_true',
			)
		);
	}
	/** @param array<string,mixed> $value */
	private static function response( array $value ): \WP_REST_Response {
		$response = new \WP_REST_Response( $value );
		$response->header( 'Cache-Control', 'no-store, private' );
		return $response;
	}
	public function issue( \WP_REST_Request $request ): \WP_REST_Response {
		$guard = UploadSession::guard( $request );
		if ( is_wp_error( $guard ) || array_diff( array_keys( $request->get_query_params() ), array( 'rest_route' ) ) ) {
			return self::response( self::GENERIC ); }
		$body = $request->get_json_params();
		// WP REST can decode JSON scalar bodies despite its PHPDoc array return type.
		// @phpstan-ignore function.alreadyNarrowedType
		if ( ! is_array( $body ) || array_diff( array_keys( $body ), array( 'channel', 'consent' ) ) || true !== ( $body['consent'] ?? false ) || ! in_array( $body['channel'] ?? '', array( 'email', 'whatsapp' ), true ) ) {
			return self::response( self::GENERIC ); }
		$channel = $body['channel'];
		$result  = Database::transaction(
			static function () use ( $request, $channel ) {
				global $wpdb;
				$row = UploadSession::lock( (string) $request['id'], (string) $request->get_header( 'X-CFF-Request-Token' ) );
				if ( is_wp_error( $row ) ) {
					return self::GENERIC; }
				$form   = ( new FormRepository() )->getPublished( (int) $row['form_id'], (int) $row['form_version'] );
				$config = $form?->settings()['sessions']['magicLinks'] ?? array();
				if ( ! ( $config['enabled'] ?? false ) || 'whatsapp' === $channel && ! ( $config['whatsapp'] ?? false ) || ! ( $form->settings()['sessions']['savePartial'] ?? true ) || ! ( $form->settings()['sessions']['resumeEnabled'] ?? true ) ) {
					return self::GENERIC; }
				$context = Database::decode( $row['context'] );
				$email   = $context['_answers'][ $config['emailField'] ?? '' ] ?? null;
				if ( 'email' === $channel && ( ! is_string( $email ) || ! is_email( $email ) || preg_match( '/[\r\n]/', $email ) ) ) {
					return self::GENERIC; }
				$ip    = ( new \ChatFlow\Tracking\IpResolver() )->resolve( $_SERVER, \ChatFlow\Rest\Settings::get()['proxy'] ?? array() );
				$limit = new RateLimiter();
				if ( ! $limit->consume( 'magic:session:' . $row['id'], 3, 3600 ) || ! $limit->consume( 'magic:ip:' . $ip, 15, 3600 ) || 'email' === $channel && ! $limit->consume( 'magic:recipient:' . hash( 'sha256', strtolower( $email ) ), 3, 3600 ) ) {
					return self::GENERIC; }
				$token   = rtrim( strtr( base64_encode( random_bytes( 32 ) ), '+/', '-_' ), '=' );
				$expires = gmdate( 'Y-m-d H:i:s', min( strtotime( $row['expires_at'] . ' UTC' ), time() + max( 5, min( 1440, (int) ( $config['ttlMinutes'] ?? 30 ) ) ) * 60 ) );
				$base    = \ChatFlow\Rest\Settings::get()['fullpageBase'];
				$link    = home_url( '/' . trim( $base, '/' ) . '/' . rawurlencode( $form->slug() ) . '/#cff-magic=' . $token );
				$payload = 'email' === $channel ? self::encrypt(
					Database::json(
						array(
							'to'   => $email,
							'link' => $link,
						)
					)
				) : null;
				Database::check(
					$wpdb->insert(
						$wpdb->prefix . 'cff_magic_links',
						array(
							'session_id'      => $row['id'],
							'token_hash'      => hash( 'sha256', $token ),
							'payload'         => $payload,
							'status'          => 'email' === $channel ? 'pending' : 'ready',
							'next_attempt_at' => Database::now(),
							'expires_at'      => $expires,
							'created_at'      => Database::now(),
						)
					)
				);
				if ( 'email' === $channel ) {
					$id = (int) $wpdb->insert_id;
					Database::afterCommit( static fn() => self::schedule( $id ) );
					return self::GENERIC;
				}
				return array(
					'accepted' => true,
					'link'     => $link,
				);
			}
		);
		return self::response( is_array( $result ) ? $result : self::GENERIC );
	}
	public function consume( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$guard = UploadSession::guard( $request );
		if ( is_wp_error( $guard ) ) {
			return $guard; }
		if ( array_diff( array_keys( $request->get_query_params() ), array( 'rest_route' ) ) ) {
			return self::denied(); }
		$ip = ( new \ChatFlow\Tracking\IpResolver() )->resolve( $_SERVER, \ChatFlow\Rest\Settings::get()['proxy'] ?? array() );
		if ( ! ( new RateLimiter() )->consume( 'magic:redeem:' . $ip, 30, 3600 ) ) {
			return self::denied(); }
		$token = $request->get_header( 'X-CFF-Magic-Token' );
		$body  = $request->get_json_params();
		// @phpstan-ignore function.alreadyNarrowedType
		if ( ! is_string( $token ) || ! preg_match( '/^[A-Za-z0-9_-]{43}$/D', $token ) || ! is_array( $body ) || array_keys( $body ) !== array( 'formId' ) || ! is_int( $body['formId'] ) ) {
			return self::denied(); }
		$result = Database::transaction(
			static function () use ( $token, $body ) {
				global $wpdb;
				$link = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_magic_links WHERE token_hash=%s FOR UPDATE", hash( 'sha256', $token ) ), ARRAY_A );
				if ( ! $link || ! hash_equals( $link['token_hash'], hash( 'sha256', $token ) ) || null !== $link['consumed_at'] || strtotime( $link['expires_at'] . ' UTC' ) <= time() || ! in_array( $link['status'], array( 'ready', 'sent' ), true ) ) {
					return self::denied(); }
				$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE id=%d FOR UPDATE", $link['session_id'] ), ARRAY_A );
				if ( ! $row || (int) $row['form_id'] !== $body['formId'] || 'active' !== $row['status'] || strtotime( $row['expires_at'] . ' UTC' ) <= time() ) {
					return self::denied(); }
				$credential = ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issueResume( time(), 1 );
				Database::check( $wpdb->update( $wpdb->prefix . 'cff_sessions', array( 'resume_hash' => hash( 'sha256', $credential ) ), array( 'id' => $row['id'] ) ) );
				Database::check(
					$wpdb->update(
						$wpdb->prefix . 'cff_magic_links',
						array(
							'consumed_at' => Database::now(),
							'payload'     => null,
						),
						array( 'id' => $link['id'] )
					)
				);
				return ( new SessionService( new FormRepository(), new \ChatFlow\Logic\Engine(), new \ChatFlow\Fields\Registry() ) )->resume( $body['formId'], $credential );
			}
		);
		return is_wp_error( $result ) ? $result : self::response( $result );
	}
	private static function denied(): \WP_Error {
		return Database::error( 'cff_magic_invalid', 'This resume link is unavailable.', 401 ); }
	private static function encrypt( string $plaintext ): string {
		$iv         = random_bytes( 12 );
		$tag        = '';
		$ciphertext = openssl_encrypt( $plaintext, 'aes-256-gcm', hash( 'sha256', wp_salt( 'secure_auth' ), true ), OPENSSL_RAW_DATA, $iv, $tag );
		if ( false === $ciphertext ) {
			throw new \RuntimeException( 'Cannot encrypt the delivery.' ); }
		return base64_encode( $iv . $tag . $ciphertext );
	}
	/** @return array<string,mixed> */
	private static function decrypt( string $payload ): array {
		$bytes = base64_decode( $payload, true );
		if ( false === $bytes || strlen( $bytes ) < 28 ) {
			return array(); }
		$text = openssl_decrypt( substr( $bytes, 28 ), 'aes-256-gcm', hash( 'sha256', wp_salt( 'secure_auth' ), true ), OPENSSL_RAW_DATA, substr( $bytes, 0, 12 ), substr( $bytes, 12, 16 ) );
		return false === $text ? array() : Database::decode( $text );
	}
	private static function schedule( int $id ): void {
		global $wpdb;
		$due           = $wpdb->get_var( $wpdb->prepare( "SELECT next_attempt_at FROM {$wpdb->prefix}cff_magic_links WHERE id=%d", $id ) );
		$due_timestamp = strtotime( (string) $due . ' UTC' );
		$when          = max( time(), false === $due_timestamp ? time() : $due_timestamp );
		if ( function_exists( 'as_schedule_single_action' ) && did_action( 'action_scheduler_init' ) > 0 ) {
			as_schedule_single_action( $when, 'cff_send_magic_link', array( $id ), 'cff', true ); } elseif ( ! wp_next_scheduled( 'cff_send_magic_link', array( $id ) ) ) {
			wp_schedule_single_event( $when, 'cff_send_magic_link', array( $id ) ); }
	}
	public function deliver( int $id ): void {
		global $wpdb;
		$row = Database::transaction(
			static function () use ( $id ) {
				global $wpdb;
				$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_magic_links WHERE id=%d FOR UPDATE", $id ), ARRAY_A );
				if ( ! $row || 'pending' !== $row['status'] || strtotime( $row['expires_at'] . ' UTC' ) <= time() || strtotime( $row['next_attempt_at'] . ' UTC' ) > time() ) {
					return null; }
				Database::check(
					$wpdb->update(
						$wpdb->prefix . 'cff_magic_links',
						array(
							'status'   => 'sending',
							'attempts' => (int) $row['attempts'] + 1,
						),
						array( 'id' => $id )
					)
				);
				return $row;
			}
		);
		if ( ! is_array( $row ) ) {
			return; }
		$data = self::decrypt( $row['payload'] );
		// translators: %s is the single-use resume URL in the email body.
		$sent  = isset( $data['to'], $data['link'] ) && is_email( $data['to'] ) && wp_mail( $data['to'], __( 'Resume your form', 'chatflow-forms' ), sprintf( __( "Use this one-time link to resume your form:\n%s\n\nIf you did not request it, ignore this email.", 'chatflow-forms' ), $data['link'] ) );
		$retry = ! $sent && (int) $row['attempts'] < 3 && strtotime( $row['expires_at'] . ' UTC' ) > time() + 120;
		Database::check(
			$wpdb->update(
				$wpdb->prefix . 'cff_magic_links',
				array(
					'status'          => $sent ? 'sent' : ( $retry ? 'pending' : 'failed' ),
					'payload'         => $retry ? $row['payload'] : null,
					'next_attempt_at' => gmdate( 'Y-m-d H:i:s', time() + 60 * ( (int) $row['attempts'] + 1 ) ),
				),
				array(
					'id'     => $id,
					'status' => 'sending',
				)
			)
		);
		if ( $retry ) {
			self::schedule( $id ); }
	}
	public function recover(): void {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}cff_magic_links SET payload=NULL,status='failed' WHERE expires_at<%s AND status IN ('pending','sending')", Database::now() ) );
		$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}cff_magic_links SET status=IF(attempts<3,'pending','failed'),payload=IF(attempts<3,payload,NULL) WHERE status='sending' AND next_attempt_at<%s", gmdate( 'Y-m-d H:i:s', time() - 300 ) ) );
		$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_magic_links WHERE status='pending' AND next_attempt_at<=%s AND expires_at>%s LIMIT 100", Database::now(), Database::now() ) );
		foreach ( $ids as $id ) {
			self::schedule( (int) $id ); }
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}cff_magic_links WHERE expires_at<%s LIMIT 1000", Database::now() ) );
	}
}
