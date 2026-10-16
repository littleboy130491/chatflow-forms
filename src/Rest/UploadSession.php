<?php
namespace ChatFlow\Rest;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Submissions\Database;

final class UploadSession {
	/** Call within Database::transaction; serializes uploads/events against restart/submit.
	 * @return array<string,mixed>|\WP_Error */
	public static function lock( string $id, string $token ): array|\WP_Error {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s FOR UPDATE", $id ), ARRAY_A );
		if ( ! $row || 'active' !== $row['status'] || strtotime( $row['expires_at'] . ' UTC' ) <= time() || ! ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->verify(
			$token,
			'request',
			array(
				'sessionId' => $row['public_id'],
				'formId'    => (int) $row['form_id'],
				'version'   => (int) $row['form_version'],
			),
			time()
		) ) {
			return Database::error( 'cff_unauthorized', 'A valid session is required.', 401 );
		}
		$forms = new FormRepository();
		if ( ! $forms->getPublished( (int) $row['form_id'] ) || ! $forms->getPublished( (int) $row['form_id'], (int) $row['form_version'] ) ) {
			return Database::error( 'cff_form_not_found', 'Published form not found.', 404 ); }
		return $row;
	}
	public static function guard( \WP_REST_Request $request ): bool|\WP_Error {
		foreach ( array_keys( $request->get_query_params() ) as $key ) {
			if ( preg_match( '/token|nonce|credential|secret|authorization/i', $key ) ) {
				return Database::error( 'cff_credentials_in_query', 'Use request headers for credentials.', 400 ); }
		}
		$origin = $request->get_header( 'Origin' ) ?? '';
		if ( '' !== $origin && self::origin( $origin ) !== self::origin( home_url() ) ) {
			return Database::error( 'cff_cross_origin', 'Same-origin requests are required.', 403 ); }
		if ( 'cross-site' === $request->get_header( 'Sec-Fetch-Site' ) ) {
			return Database::error( 'cff_cross_origin', 'Same-origin requests are required.', 403 ); }
		return true;
	}
	private static function origin( string $url ): string {
		$parts = wp_parse_url( $url );
		return is_array( $parts ) ? strtolower( ( $parts['scheme'] ?? '' ) . '://' . ( $parts['host'] ?? '' ) . ':' . ( $parts['port'] ?? ( 'https' === ( $parts['scheme'] ?? '' ) ? 443 : 80 ) ) ) : '';
	}
}
