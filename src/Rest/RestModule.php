<?php
namespace ChatFlow\Rest;

use ChatFlow\Contracts\Module;
use ChatFlow\Fields\Registry;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\PublicProjection;
use ChatFlow\Logic\Engine;
use ChatFlow\Privacy\Export;
use ChatFlow\Privacy\Purge;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Spam\RateLimiter;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\SessionService;
use ChatFlow\Tracking\IpResolver;

final class RestModule implements Module {
	private Repository $submissions;
	private SessionService $sessions;
	public function __construct( private FormRepository $forms, private Engine $engine, private Registry $fields ) {
		$this->submissions = new Repository( $forms );
		$this->sessions    = new SessionService( $forms, $engine, $fields ); }
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'routes' ) );
		add_filter( 'rest_post_dispatch', array( $this, 'cacheHeaders' ), 10, 3 );
		add_filter( 'rest_pre_dispatch', array( $this, 'requestBoundary' ), 10, 3 );
	}
	public function routes(): void {
		$this->route( '/forms/(?P<id>\d+)', 'GET', array( $this, 'publicForm' ) );
		$this->route( '/forms/(?P<id>\d+)/start-token', 'POST', array( $this, 'startToken' ) );
		$this->route( '/sessions', 'POST', fn( $r ) => $this->respond( $this->sessions->start( $this->body( $r ), $r->get_header( 'X-CFF-Start-Token' ) ?? '', $r->get_header( 'Idempotency-Key' ) ?? '' ), 201 ) );
		$this->route( '/sessions/resume', 'POST', fn( $r ) => $this->respond( $this->sessions->resume( absint( $this->body( $r )['formId'] ?? 0 ), $r->get_header( 'X-CFF-Resume-Token' ) ?? '' ) ) );
		$this->route( '/sessions/(?P<id>[a-fA-F0-9-]{36})', 'GET', fn( $r ) => $this->respond( $this->sessions->get( $r['id'], $r->get_header( 'X-CFF-Request-Token' ) ?? '' ) ) );
		foreach ( array(
			'PATCH'  => 'patch',
			'DELETE' => 'delete',
			'POST'   => 'submit',
		) as $method => $operation ) {
			$this->route( '/sessions/(?P<id>[a-fA-F0-9-]{36})' . ( 'submit' === $operation ? '/submit' : '' ), $method, fn( $r ) => $this->respond( $this->sessions->mutate( $operation, $r['id'], $this->body( $r ), $r->get_header( 'X-CFF-Request-Token' ) ?? '', $r->get_header( 'Idempotency-Key' ) ?? '' ) ) );
		}
		$this->route( '/admin/forms', 'GET', array( $this, 'formsList' ), 'cff_manage_forms' );
		$this->route( '/admin/forms', 'POST', fn( $r ) => $this->respond( $this->forms->create( (string) ( $this->body( $r )['title'] ?? '' ), $this->body( $r )['schema'] ?? array(), $this->body( $r )['settings'] ?? array() ), 201 ), 'cff_manage_forms' );
		$this->route( '/admin/forms/(?P<id>\d+)', 'GET', fn( $r ) => $this->respond( $this->forms->getDraft( (int) $r['id'] ) ?? Database::error( 'cff_not_found', 'Form not found.', 404 ) ), 'cff_manage_forms' );
		$this->route(
			'/admin/forms/(?P<id>\d+)',
			'PUT',
			function ( $r ) {
				$body = $this->body( $r );
				return $this->respond( $this->forms->saveDraft( (int) $r['id'], $body['schema'] ?? array(), $body['settings'] ?? array(), (int) ( $body['draftRevision'] ?? 0 ), isset( $body['title'] ) ? (string) $body['title'] : null ) );
			},
			'cff_manage_forms'
		);
		$this->route( '/admin/forms/(?P<id>\d+)/publish', 'POST', fn( $r ) => $this->respond( $this->forms->publish( (int) $r['id'], (int) ( $this->body( $r )['draftRevision'] ?? 0 ) ) ), 'cff_manage_forms' );
		$this->route( '/admin/forms/(?P<id>\d+)', 'DELETE', array( $this, 'trashForm' ), 'cff_manage_forms' );
		$this->route( '/admin/submissions', 'GET', array( $this, 'submissionsList' ), 'cff_view_submissions' );
		$this->route( '/admin/submissions/(?P<id>\d+)', 'GET', array( $this, 'detail' ), 'cff_view_submissions' );
		$this->route( '/admin/submissions/(?P<id>\d+)', 'PATCH', array( $this, 'updateSubmission' ), 'cff_edit_submissions' );
		$this->route( '/admin/submissions/(?P<id>\d+)', 'DELETE', array( $this, 'deleteSubmission' ), 'cff_delete_submissions' );
		$this->route( '/admin/submissions/bulk', 'POST', array( $this, 'bulk' ), 'cff_edit_submissions' );
		$this->route( '/admin/submissions/export', 'POST', fn( $r ) => $this->respond( ( new Export( $this->forms, $this->submissions ) )->create( $this->body( $r ) ) ), 'cff_export_submissions' );
		$this->route( '/admin/exports/(?P<id>\d+)', 'GET', fn( $r ) => $this->respond( ( new Export( $this->forms, $this->submissions ) )->progress( (int) $r['id'] ) ), 'cff_export_submissions' );
		$this->route( '/admin/purge/preview', 'POST', fn( $r ) => $this->respond( ( new Purge( $this->submissions ) )->preview( $this->body( $r )['criteria'] ?? array() ) ), 'cff_purge_submissions' );
		$this->route( '/admin/purge', 'POST', fn( $r ) => $this->respond( ( new Purge( $this->submissions ) )->start( $this->body( $r )['criteria'] ?? array(), (string) ( $this->body( $r )['confirmationToken'] ?? '' ), (string) ( $this->body( $r )['confirmation'] ?? '' ) ) ), 'cff_purge_submissions' );
		$this->route( '/admin/purge/(?P<id>[a-fA-F0-9-]{36})', 'GET', fn( $r ) => $this->respond( ( new Purge( $this->submissions ) )->progress( $r['id'] ) ), 'cff_purge_submissions' );
		$this->route( '/admin/purge-log', 'GET', array( $this, 'purgeLog' ), 'cff_purge_submissions' );
		$this->route( '/admin/settings', 'GET', fn() => $this->respond( array( 'settings' => Settings::get() ) ), 'cff_manage_settings' );
		$this->route(
			'/admin/settings',
			'PUT',
			function ( $r ) {
				$settings = Settings::save( $this->body( $r )['settings'] ?? array() );
				return $this->respond( is_wp_error( $settings ) ? $settings : array( 'settings' => $settings ) );
			},
			'cff_manage_settings'
		);
		$this->route( '/admin/system-status', 'GET', array( $this, 'systemStatus' ), 'cff_manage_settings' );
		$this->route(
			'/admin/templates',
			'GET',
			fn() => $this->respond(
				array(
					'items' => array(
						array(
							'id'     => 'imajiner-survey',
							'title'  => 'Imajiner website survey',
							'locale' => 'id_ID',
						),
					),
				)
			),
			'cff_manage_forms'
		);
		$this->route( '/admin/templates/imajiner-survey', 'GET', fn() => $this->respond( \ChatFlow\Templates\Imajiner::definition() ), 'cff_manage_forms' );
		$this->route( '/admin/templates/imajiner-survey', 'POST', fn() => $this->respond( ( new \ChatFlow\Templates\Templates( $this->forms ) )->create(), 201 ), 'cff_manage_forms' );
	}
	private function route( string $path, string $method, callable $callback, ?string $cap = null ): void {
		register_rest_route(
			'cff/v1',
			$path,
			array(
				'methods'             => $method,
				'callback'            => function ( $r ) use ( $callback ) {
					try {
						return $callback( $r );
					} catch ( \InvalidArgumentException | \TypeError $e ) {
						return Database::error( 'cff_invalid_request', 'Invalid request parameters.', 422 );
					} catch ( \Throwable $e ) {
						return Database::error( 'cff_storage_error', 'The request could not be saved.', 503 );
					} },
				'permission_callback' => $cap ? fn( $r ) => self::authorize( $r, $cap ) : '__return_true',
			)
		);
	}
	public static function authorize( \WP_REST_Request $request, string $cap ): bool|\WP_Error {
		if ( ! is_user_logged_in() || ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) || ! current_user_can( $cap ) ) {
			return Database::error( 'cff_forbidden', 'Cookie authentication, a REST nonce and the correct capability are required.', 403 ); }
		return true;
	}
	public function requestBoundary( mixed $result, \WP_REST_Server $server, \WP_REST_Request $r ): mixed {
		if ( ! str_starts_with( $r->get_route(), '/cff/v1/' ) ) {
			return $result; }
		$body = $r->get_body();
		if ( $body && strlen( $body ) > 1048576 ) {
			return Database::error( 'cff_request_too_large', 'Request too large.', 413 ); }
		foreach ( array_keys( $r->get_query_params() ) as $key ) {
			if ( preg_match( '/token|credential|nonce/i', $key ) ) {
				return Database::error( 'cff_credential_location', 'Credentials must be in request headers, not URLs.', 400 ); }
		}
		if ( in_array( $r->get_method(), array( 'POST', 'PUT', 'PATCH', 'DELETE' ), true ) && $r->get_header( 'Origin' ) && ! $this->sameOrigin( $r->get_header( 'Origin' ) ) ) {
			return Database::error( 'cff_origin_rejected', 'Request origin is not allowed.', 403 ); }
		return $result;
	}
	private function sameOrigin( string $origin ): bool {
		$parts = wp_parse_url( $origin );
		foreach ( array( home_url(), site_url() ) as $url ) {
			$site = wp_parse_url( $url );
			if ( is_array( $parts ) && ! isset( $parts['user'] ) && ! isset( $parts['pass'] ) && ( $parts['scheme'] ?? '' ) === ( $site['scheme'] ?? '' ) && strtolower( $parts['host'] ?? '' ) === strtolower( $site['host'] ?? '' ) && ( $parts['port'] ?? null ) === ( $site['port'] ?? null ) ) {
				return true; }
		}
		return false;
	}
	public function cacheHeaders( mixed $response, \WP_REST_Server $server, \WP_REST_Request $r ): mixed {
		if ( str_starts_with( $r->get_route(), '/cff/v1/' ) && ! ( 'GET' === $r->get_method() && preg_match( '#^/cff/v1/forms/\d+$#', $r->get_route() ) && $response instanceof \WP_REST_Response && $response->get_status() < 400 ) ) {
			nocache_headers();
			if ( $response instanceof \WP_HTTP_Response ) {
				$response->header( 'Cache-Control', 'private,no-store' ); }
		}
		return $response;
	}
	public function publicForm( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		$version = $r->get_param( 'version' );
		if ( null !== $version && ( ! ctype_digit( (string) $version ) || (int) $version < 1 ) ) {
			return Database::error( 'cff_invalid_version', 'Invalid version.', 422 ); }
		$form = $this->forms->getPublished( (int) $r['id'], null === $version ? null : (int) $version );
		if ( ! $form ) {
			return Database::error( 'cff_not_found', 'Published form not found.', 404 ); }
		$envelope = PublicProjection::build( $form, $this->fields->types() );
		$etag     = '"' . hash( 'sha256', Database::json( $envelope ) ) . '"';
		$response = new \WP_REST_Response( $r->get_header( 'If-None-Match' ) === $etag ? null : $envelope, $r->get_header( 'If-None-Match' ) === $etag ? 304 : 200 );
		$response->header( 'ETag', $etag );
		$response->header( 'Cache-Control', 'public,max-age=60,must-revalidate' );
		return $response;
	}
	public function startToken( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		$id      = (int) $r['id'];
		$version = $this->body( $r )['version'] ?? 0;
		$form    = $this->forms->getPublished( $id );
		if ( ! $form ) {
			return Database::error( 'cff_not_found', 'Published form not found.', 404 ); }
		if ( ! is_int( $version ) || $version !== $form->version() ) {
			return Database::error( 'cff_version_conflict', 'Load the current published form before starting.', 409, array( 'version' => $form->version() ) ); }
		$ip = ( new IpResolver() )->resolve( $_SERVER, Settings::get()['proxy'] );
		if ( ! ( new RateLimiter() )->consume( 'start:' . $id . ':' . $ip, 30, 600 ) ) {
			return Database::error( 'cff_rate_limit', 'Please wait before starting again.', 429, array( 'retryAfter' => 600 ) ); }
		return $this->respond(
			array(
				'startToken' => ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue(
					'start',
					array(
						'formId'  => $id,
						'version' => $version,
					),
					time()
				),
				'expiresAt'  => gmdate( 'c', time() + 900 ),
				'version'    => $version,
			)
		);
	}
	/**
	 * @return array<string,mixed>
	 */
	private function body( \WP_REST_Request $r ): array {
		$raw = json_decode( $r->get_body(), false, 64, JSON_THROW_ON_ERROR );
		if ( ! is_object( $raw ) ) {
			throw new \InvalidArgumentException( 'JSON object body required.' ); }
		foreach ( array( 'schema', 'settings', 'answers', 'meta', 'prefill', 'filters', 'criteria' ) as $key ) {
			if ( property_exists( $raw, $key ) && ! is_object( $raw->$key ) ) {
				throw new \InvalidArgumentException( 'JSON map required.' ); }
		}
		$convert = function ( mixed $value ) use ( &$convert ): mixed {
			if ( is_object( $value ) ) {
				if ( ! get_object_vars( $value ) ) {
					return $value;
				} $value = (array) $value;
			} return is_array( $value ) ? array_map( $convert, $value ) : $value;
		};
		$body    = (array) $convert( $raw );
		foreach ( array( 'schema', 'settings', 'answers', 'meta', 'prefill', 'filters', 'criteria', 'changes' ) as $key ) {
			if ( isset( $body[ $key ] ) && is_object( $body[ $key ] ) ) {
				$body[ $key ] = (array) $body[ $key ]; }
		}
		return $body;
	}
	private function respond( mixed $value, int $status = 200 ): \WP_REST_Response|\WP_Error {
		if ( is_wp_error( $value ) ) {
			return $value;
		} if ( $value instanceof \ChatFlow\Forms\Form ) {
			$value = $value->toArray();
		} return new \WP_REST_Response( $value, $status ); }
	/**
	 * @return array{int,int}
	 */
	private function pagination( \WP_REST_Request $r ): array {
		return array( max( 1, absint( $r->get_param( 'page' ) ?? 1 ) ), max( 1, min( 100, absint( $r->get_param( 'perPage' ) ?? 20 ) ) ) ); }
	public function formsList( \WP_REST_Request $r ): \WP_REST_Response {
		[$page, $per] = $this->pagination( $r );
		$query        = new \WP_Query(
			array(
				'post_type'      => 'cff_form',
				'post_status'    => array( 'draft', 'publish' ),
				'posts_per_page' => $per,
				'paged'          => $page,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				's'              => sanitize_text_field( (string) ( $r['search'] ?? '' ) ),
			)
		);
		$items        = array();
		foreach ( $query->posts as $post ) {
			$form = $this->forms->getDraft( $post->ID );
			if ( $form ) {
				$items[] = $form->toArray(); }
		}
		return $this->respond(
			array(
				'items'   => $items,
				'total'   => $query->found_posts,
				'page'    => $page,
				'perPage' => $per,
			)
		);
	}
	public function trashForm( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		$form = $this->forms->getDraft( (int) $r['id'] );
		if ( ! $form ) {
			return Database::error( 'cff_not_found', 'Form not found.', 404 );
		} if ( ! wp_trash_post( $form->id() ) ) {
			return Database::error( 'cff_storage_error', 'Form could not be trashed.', 503 );
		} return $this->respond( array( 'deleted' => true ) ); }
	public function submissionsList( \WP_REST_Request $r ): \WP_REST_Response {
		[$page, $per] = $this->pagination( $r );
		$filters      = $r->get_query_params();
		unset( $filters['page'], $filters['perPage'] );
		$data = $this->submissions->find( $filters, $page, $per );
		return $this->respond(
			array(
				'items'   => array_map( fn( $s ) => $s->admin(), $data['items'] ),
				'total'   => $data['total'],
				'page'    => $page,
				'perPage' => $per,
			)
		);
	}
	public function detail( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		global $wpdb;
		$submission = $this->submissions->get( (int) $r['id'] );
		if ( ! $submission ) {
			return Database::error( 'cff_not_found', 'Submission not found.', 404 ); }
		$data          = $submission->admin();
		$form          = $this->forms->getVersion( $submission->formId(), $submission->formVersion() );
		$data['form']  = $form ? array(
			'id'      => $form->id(),
			'title'   => $form->title(),
			'slug'    => $form->slug(),
			'version' => $form->version(),
			'schema'  => $form->schema(),
		) : null;
		$data['notes'] = array_map(
			fn( $row ) => array(
				'id'        => (int) $row['id'],
				'kind'      => $row['type'],
				'message'   => $row['body'],
				'userId'    => (int) $row['user_id'],
				'createdAt' => $row['created_at'],
			),
			$wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_submission_notes WHERE submission_id=%d ORDER BY id DESC LIMIT 500", $submission->id() ), ARRAY_A )
		);
		return $this->respond( $data );
	}
	/**
	 * @param array<string,mixed> $body
	 * @return array<string,mixed>|\WP_Error
	 */
	private function changes( array $body ): array|\WP_Error {
		if ( ! $body || array_diff( array_keys( $body ), array( 'isRead', 'isStarred', 'status', 'note' ) ) ) {
			return Database::error( 'cff_invalid_changes', 'Unknown or empty changes.', 422 ); }
		foreach ( array( 'isRead', 'isStarred' ) as $key ) {
			if ( isset( $body[ $key ] ) && ! is_bool( $body[ $key ] ) ) {
				return Database::error( 'cff_invalid_changes', 'Boolean required.', 422 ); }
		}
		if ( isset( $body['status'] ) && ! in_array( $body['status'], array( 'completed', 'partial', 'abandoned', 'spam', 'trash' ), true ) || isset( $body['note'] ) && ( ! is_string( $body['note'] ) || strlen( $body['note'] ) > 10000 ) ) {
			return Database::error( 'cff_invalid_changes', 'Invalid status or note.', 422 ); }
		return $body;
	}
	public function updateSubmission( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		$body = $this->changes( $this->body( $r ) );
		if ( is_wp_error( $body ) ) {
			return $body;
		} $submission = $this->submissions->update( (int) $r['id'], $body );
		return $this->respond( $submission ? $submission->admin() : Database::error( 'cff_not_found', 'Submission not found.', 404 ) ); }
	public function deleteSubmission( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		$id   = (int) $r['id'];
		$body = $this->body( $r );
		if ( ! $this->submissions->get( $id ) ) {
			return Database::error( 'cff_not_found', 'Submission not found.', 404 ); }
		if ( $body['permanent'] ?? false ) {
			if ( true !== $body['permanent'] || 'DELETE' !== ( $body['confirmation'] ?? '' ) ) {
				return Database::error( 'cff_delete_confirmation', 'DELETE confirmation required.', 422 );
			} $this->submissions->delete( $id ); } else {
			$this->submissions->update( $id, array( 'status' => 'trash' ) ); }
			return $this->respond( array( 'deleted' => true ) );
	}
	public function bulk( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		$body = $this->body( $r );
		$ids  = $body['ids'] ?? null;
		if ( ! is_array( $ids ) || ! $ids || count( $ids ) > 100 || array_filter( $ids, fn( $id ) => ! is_int( $id ) || $id < 1 ) ) {
			return Database::error( 'cff_bulk_invalid', 'Choose up to 100 submission IDs.', 422 ); }
		if ( isset( $body['permanent'] ) ) {
			$auth = self::authorize( $r, 'cff_delete_submissions' );
			if ( is_wp_error( $auth ) ) {
				return $auth;
			} if ( true !== $body['permanent'] || 'DELETE' !== ( $body['confirmation'] ?? '' ) ) {
				return Database::error( 'cff_delete_confirmation', 'DELETE confirmation required.', 422 );
			} foreach ( $ids as $id ) {
				$this->submissions->delete( $id ); }
		} else {
			$changes = $this->changes( $body['changes'] ?? array() );
			if ( is_wp_error( $changes ) ) {
				return $changes;
			} if ( 'trash' === ( $changes['status'] ?? '' ) && ! current_user_can( 'cff_delete_submissions' ) ) {
				return Database::error( 'cff_forbidden', 'Delete capability required.', 403 );
			} foreach ( $ids as $id ) {
				$this->submissions->update( $id, $changes ); }
		}
		return $this->respond( array( 'updated' => count( $ids ) ) );
	}
	public function purgeLog( \WP_REST_Request $r ): \WP_REST_Response {
		global $wpdb;
		[$page, $per] = $this->pagination( $r );
		return $this->respond(
			array(
				'items'   => $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_audit_log ORDER BY id DESC LIMIT %d OFFSET %d", $per, ( $page - 1 ) * $per ), ARRAY_A ),
				'total'   => (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_audit_log" ),
				'page'    => $page,
				'perPage' => $per,
			)
		); }
	public function systemStatus(): \WP_REST_Response {
		$private = false;
		try {
			( new \ChatFlow\Privacy\PrivateFiles() )->root();
			$private = true; } catch ( \Throwable $error ) {
			}
			return $this->respond(
				array(
					'php'            => PHP_VERSION,
					'wordpress'      => get_bloginfo( 'version' ),
					'https'          => is_ssl(),
					'privateStorage' => $private,
					'scheduler'      => function_exists( 'as_schedule_single_action' ) ? 'action-scheduler' : 'wp-cron',
					'ip'             => ( new IpResolver() )->resolve( $_SERVER, Settings::get()['proxy'] ),
					'smtpDetected'   => defined( 'WPMS_ON' ) || defined( 'FLUENTMAIL' ) || class_exists( 'Postman' ),
					'fieldTypes'     => $this->fields->types(),
					'uploads'        => false,
				)
			);
	}
}
