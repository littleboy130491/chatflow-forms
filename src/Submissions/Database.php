<?php
namespace ChatFlow\Submissions;

final class Database {
	private static int $depth = 0;
	/** @var list<callable():void> */
	private static array $after_commit = array();
	public static function afterCommit( callable $callback ): void {
		if ( 0 === self::$depth ) {
			$callback();
		} else {
			self::$after_commit[] = $callback; } }
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
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
		$depth     = self::$depth++;
		$savepoint = 'cff_sp_' . $depth;
		$callbacks = count( self::$after_commit );
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
		$committed = false;
		try {
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
			self::check( $wpdb->query( $depth ? 'SAVEPOINT ' . $savepoint : 'START TRANSACTION' ) );
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
			$result = $callback();
			if ( is_wp_error( $result ) ) {
				// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
				$wpdb->query( $depth ? 'ROLLBACK TO SAVEPOINT ' . $savepoint : 'ROLLBACK' );
				// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
				return $result;
			}
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
			self::check( $wpdb->query( $depth ? 'RELEASE SAVEPOINT ' . $savepoint : 'COMMIT' ) );
			$committed = true;
			return $result;
		} catch ( \Throwable $e ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Fixed transaction keywords and integer-derived savepoint, never user input.
			$wpdb->query( $depth ? 'ROLLBACK TO SAVEPOINT ' . $savepoint : 'ROLLBACK' );
			return self::error( 'cff_storage_error', 'Unable to store data.', 500 );
		} finally {
			--self::$depth;
			if ( ! $committed ) {
				self::$after_commit = array_slice( self::$after_commit, 0, $callbacks ); }
			if ( 0 === self::$depth && $committed ) {
				$pending            = self::$after_commit;
				self::$after_commit = array();
				foreach ( $pending as $callback ) {
					try {
						$callback();
					} catch ( \Throwable $error ) {
						error_log( 'ChatFlow: deferred cleanup will be retried.' ); }
				}
			}
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
