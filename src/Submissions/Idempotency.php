<?php
namespace ChatFlow\Submissions;

final class Idempotency {
	/** Called inside a transaction. @param array<string,mixed> $body
	 * @return array<string,mixed>|\WP_Error
	 */
	public function begin( string $scope, string $key, array $body, int $ttl = 86400 ): array|\WP_Error {
		global $wpdb;
		if ( ! preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $key ) ) {
			return Database::error( 'cff_invalid_idempotency_key', 'An Idempotency-Key UUID is required.', 422 );
		}
		$scope_hash   = hash( 'sha256', get_current_blog_id() . ':' . $scope );
		$key_hash     = hash( 'sha256', strtolower( $key ) );
		$request_hash = hash( 'sha256', Database::json( self::canonical( $body ) ) );
		$inserted     = $wpdb->query(
			$wpdb->prepare(
				"INSERT INTO {$wpdb->prefix}cff_requests (scope_hash,key_hash,request_hash,status,expires_at) VALUES (%s,%s,%s,'pending',%s) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
				$scope_hash,
				$key_hash,
				$request_hash,
				gmdate( 'Y-m-d H:i:s', time() + max( 86400, $ttl ) )
			)
		);
		Database::check( $inserted );
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_requests WHERE scope_hash=%s AND key_hash=%s FOR UPDATE", $scope_hash, $key_hash ), ARRAY_A );
		if ( ! $row ) {
			throw new \RuntimeException( 'Missing request row.' );
		}
		if ( ! hash_equals( $row['request_hash'], $request_hash ) ) {
			return Database::error( 'cff_idempotency_conflict', 'This key was already used for a different request.', 409 );
		}
		if ( 'pending' === $row['status'] && 1 !== $inserted ) {
			return Database::error( 'cff_request_pending', 'This request is still processing.', 409, array( 'retryAfter' => 1 ) ); }
		return array(
			'id'       => (int) $row['id'],
			'response' => 'done' === $row['status'] ? Database::decode( $row['response'] ) : null,
		);
	}
	public function receipt( string $scope, string $key, array $body ): array|\WP_Error|null {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_requests WHERE scope_hash=%s AND key_hash=%s", hash( 'sha256', get_current_blog_id() . ':' . $scope ), hash( 'sha256', strtolower( $key ) ) ), ARRAY_A );
		if ( ! $row || 'done' !== $row['status'] ) {
			return null; }
		if ( ! hash_equals( $row['request_hash'], hash( 'sha256', Database::json( self::canonical( $body ) ) ) ) ) {
			return Database::error( 'cff_idempotency_conflict', 'This key was already used for a different request.', 409 ); }
		return Database::decode( $row['response'] );
	}

	/** @param array<string,mixed> $response */
	public function finish( int $id, array $response, int $code = 200 ): void {
		global $wpdb;
		Database::check(
			$wpdb->update(
				$wpdb->prefix . 'cff_requests',
				array(
					'status'        => 'done',
					'response'      => Database::json( $response ),
					'response_code' => $code,
				),
				array( 'id' => $id )
			)
		);
	}

	private static function canonical( mixed $value ): mixed {
		if ( is_object( $value ) ) {
			$value = (array) $value;
		}
		if ( is_array( $value ) ) {
			if ( ! array_is_list( $value ) ) {
				ksort( $value, SORT_STRING );
			}
			return array_map( array( self::class, 'canonical' ), $value );
		}
		return $value;
	}
}
