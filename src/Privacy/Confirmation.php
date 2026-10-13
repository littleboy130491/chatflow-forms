<?php
namespace ChatFlow\Privacy;

use ChatFlow\Submissions\Database;

final class Confirmation {
	public static function issue( array $context ): string {
		$body = rtrim(
			strtr(
				base64_encode(
					Database::json(
						array(
							'context' => $context,
							'expires' => time() + 600,
						)
					)
				),
				'+/',
				'-_'
			),
			'='
		);
		return $body . '.' . self::mac( $body );
	}
	public static function verify( string $token, array $expected ): ?array {
		if ( strlen( $token ) > 4096 ) {
			return null; }
		$parts = explode( '.', $token );
		if ( count( $parts ) !== 2 || ! hash_equals( self::mac( $parts[0] ), $parts[1] ) ) {
			return null; }
		$data = Database::decode( base64_decode( strtr( $parts[0], '-_', '+/' ), true ) );
		if ( ! is_int( $data['expires'] ?? null ) || $data['expires'] <= time() ) {
			return null; }
		foreach ( $expected as $key => $value ) {
			if ( ( $data['context'][ $key ] ?? null ) !== $value ) {
				return null; }
		}
		return $data['context'];
	}
	private static function mac( string $body ): string {
		return hash_hmac( 'sha256', 'cff-purge:' . get_current_blog_id() . ':' . $body, wp_salt( 'auth' ) ); }
}
