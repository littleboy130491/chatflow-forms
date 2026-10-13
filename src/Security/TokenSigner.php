<?php
namespace ChatFlow\Security;

final class TokenSigner {
	public function __construct( private string $key, private int $site_id ) {
		if ( strlen( $key ) < 32 ) {
			throw new \InvalidArgumentException( 'A signing key of at least 32 bytes is required.' );
		}
	}

	/** @param array<string,int|string> $context */
	public function issue( string $purpose, array $context, int $now, int $ttl = 900 ): string {
		if ( ! in_array( $purpose, array( 'start', 'request' ), true ) || $ttl < 1 || $ttl > 86400 ) {
			throw new \InvalidArgumentException( 'Invalid short-lived token parameters.' );
		}
		$claims = array(
			'purpose' => $purpose,
			'siteId'  => $this->site_id,
			'iat'     => $now,
			'exp'     => $now + $ttl,
			'jti'     => self::encode( random_bytes( 32 ) ),
			'context' => $context,
		);
		$body   = 's1.' . self::encode( json_encode( $claims, JSON_THROW_ON_ERROR ) );
		return $body . '.' . $this->mac( $body );
	}

	/** @param array<string,int|string> $expected_context
	 *  @return array<string,mixed>|null
	 */
	public function verify( string $token, string $purpose, array $expected_context, int $now ): ?array {
		if ( strlen( $token ) > 2048 ) {
			return null;
		}
		$parts = explode( '.', $token );
		if ( 3 !== count( $parts ) || 's1' !== $parts[0] || ! hash_equals( $this->mac( $parts[0] . '.' . $parts[1] ), $parts[2] ) ) {
			return null;
		}
		try {
			$claims = json_decode( self::decode( $parts[1] ), true, 32, JSON_THROW_ON_ERROR );
		} catch ( \Throwable $e ) {
			return null;
		}
		if ( ! is_array( $claims ) || ( $claims['purpose'] ?? null ) !== $purpose || ( $claims['siteId'] ?? null ) !== $this->site_id || ! is_int( $claims['iat'] ?? null ) || ! is_int( $claims['exp'] ?? null ) || $claims['iat'] > $now || $claims['exp'] <= $now || $claims['exp'] - $claims['iat'] > 86400 ) {
			return null;
		}
		foreach ( $expected_context as $name => $value ) {
			if ( ( $claims['context'][ $name ] ?? null ) !== $value ) {
				return null;
			}
		}
		return $claims;
	}

	public function issueResume( int $now, int $days = 30 ): string {
		if ( $days < 1 || $days > 90 ) {
			throw new \InvalidArgumentException( 'Invalid resume duration.' );
		}
		$body = 'r1.' . self::encode( random_bytes( 32 ) ) . '.' . ( $now + $days * 86400 );
		return $body . '.' . $this->mac( $body );
	}

	public function verifyResume( string $token, int $now ): bool {
		if ( ! preg_match( '/^r1\.[A-Za-z0-9_-]{43}\.[0-9]{1,12}\.[A-Za-z0-9_-]{43}$/D', $token ) ) {
			return false;
		}
		$parts = explode( '.', $token );
		return (int) $parts[2] > $now && hash_equals( $this->mac( implode( '.', array_slice( $parts, 0, 3 ) ) ), $parts[3] );
	}

	private function mac( string $body ): string {
		return self::encode( hash_hmac( 'sha256', 'cff:' . $this->site_id . ':' . $body, $this->key, true ) );
	}

	private static function encode( string $value ): string {
		return rtrim( strtr( base64_encode( $value ), '+/', '-_' ), '=' );
	}

	private static function decode( string $value ): string {
		$decoded = base64_decode( strtr( $value, '-_', '+/' ), true );
		if ( false === $decoded ) {
			throw new \InvalidArgumentException( 'Invalid encoding.' );
		}
		return $decoded;
	}
}
