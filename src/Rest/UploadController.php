<?php
namespace ChatFlow\Rest;

use ChatFlow\Frontend\Uploads;
use ChatFlow\Submissions\Database;

final class UploadController {
	public function __construct( private Uploads $uploads = new Uploads() ) {}
	public function register(): void {
		register_rest_route(
			'cff/v1',
			'/sessions/(?P<id>[a-f0-9-]{36})/uploads',
			array(
				'methods'             => 'POST',
				'permission_callback' => array( UploadSession::class, 'guard' ),
				'callback'            => array( $this, 'receive' ),
			)
		);
		register_rest_route(
			'cff/v1',
			'/admin/uploads/(?P<id>[a-f0-9-]{36})',
			array(
				'methods'             => 'GET',
				'permission_callback' => array( $this, 'authorize' ),
				'callback'            => array( $this, 'download' ),
			)
		);
		add_filter( 'rest_pre_serve_request', array( $this, 'serve' ), 10, 4 );
	}
	public function authorize( \WP_REST_Request $request ): bool|\WP_Error {
		$guard = UploadSession::guard( $request );
		if ( is_wp_error( $guard ) ) {
			return $guard; }
		return is_user_logged_in() && wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ) ?? '', 'wp_rest' ) && current_user_can( 'cff_view_submissions' ) ? true : Database::error( 'cff_forbidden', 'Permission denied.', 403 );
	}
	public function receive( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$guard = UploadSession::guard( $request );
		if ( is_wp_error( $guard ) ) {
			return $guard; }
		$file = $request->get_file_params()['file'] ?? array();
		if ( ! is_array( $file ) || ! is_string( $request->get_param( 'fieldId' ) ) ) {
			return Database::error( 'cff_upload_invalid', 'Select an upload field and file.', 422 ); }
		$result = $this->uploads->receive( (string) $request['id'], $request->get_header( 'X-CFF-Request-Token' ) ?? '', $request['fieldId'], $file, $request->get_header( 'Idempotency-Key' ) ?? '' );
		return is_wp_error( $result ) ? $result : new \WP_REST_Response( $result, 201, array( 'Cache-Control' => 'private, no-store' ) );
	}
	public function download( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$authorized = $this->authorize( $request );
		if ( is_wp_error( $authorized ) ) {
			return $authorized; }
		try {
			$file = $this->uploads->download( (string) $request['id'] );
		} catch ( \Throwable $error ) {
			return Database::error( 'cff_private_storage', 'Private storage is unavailable.', 503 ); }
		return is_wp_error( $file ) ? $file : new \WP_REST_Response( array( 'uploadId' => (string) $request['id'] ), 200, array( 'Cache-Control' => 'private, no-store' ) );
	}
	public function serve( bool $served, \WP_HTTP_Response $response, \WP_REST_Request $request, \WP_REST_Server $server ): bool {
		if ( $served || 200 !== $response->get_status() || ! preg_match( '#^/cff/v1/admin/uploads/[a-f0-9-]{36}$#D', $request->get_route() ) || true !== $this->authorize( $request ) ) {
			return $served; }
		try {
			$file = $this->uploads->download( (string) $request['id'] );
		} catch ( \Throwable $error ) {
			$file = null; }
		if ( ! is_array( $file ) ) {
			status_header( 404 );
			return true; }
		$handle = fopen( $file['path'], 'rb' );
		if ( false === $handle ) {
			status_header( 404 );
			return true; }
		try {
			header( 'Content-Type: application/octet-stream' );
			header( 'Content-Disposition: attachment; filename="upload"; filename*=UTF-8\'\'' . rawurlencode( $file['name'] ) );
			header( 'Content-Length: ' . $file['bytes'] );
			header( 'Cache-Control: private, no-store' );
			header( 'X-Content-Type-Options: nosniff' );
			header( "Content-Security-Policy: default-src 'none'; sandbox" );
			fpassthru( $handle );
		} finally {
			fclose( $handle ); }
		return true;
	}
}
