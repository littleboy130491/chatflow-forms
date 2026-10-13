<?php
namespace ChatFlow\Submissions;

final class Database {
	public static function check( mixed $result ): void {
		if ( false === $result ) {
			throw new \RuntimeException( 'ChatFlow storage failed.' );
		}
	}

	/** @template T
	 * @param callable():T $callback
	 * @return T|\WP_Error
	 */
	public static function transaction( callable $callback ): mixed {
		global $wpdb;
		try {
			self::check( $wpdb->query( 'START TRANSACTION' ) );
			$result = $callback();
			if ( is_wp_error( $result ) ) {
				$wpdb->query( 'ROLLBACK' );
				return $result;
			}
			self::check( $wpdb->query( 'COMMIT' ) );
			return $result;
		} catch ( \Throwable $e ) {
			$wpdb->query( 'ROLLBACK' );
			return self::error( 'cff_storage_error', 'Unable to store data.', 500 );
		}
	}

	/** @param array<string,mixed> $data */
	public static function error( string $code, string $message, int $status, array $data = array() ): \WP_Error {
		return new \WP_Error( $code, $message, array_merge( $data, array( 'status' => $status ) ) );
	}

	public static function now(): string {
		return gmdate( 'Y-m-d H:i:s' );
	}

	public static function json( mixed $value ): string {
		return json_encode( $value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	}

	/** @return array<mixed> */
	public static function decode( mixed $json ): array {
		$value = is_string( $json ) ? json_decode( $json, true, 64, JSON_THROW_ON_ERROR ) : $json;
		return is_array( $value ) ? $value : array();
	}
}
