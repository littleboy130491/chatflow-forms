<?php
namespace ChatFlow\Integrations\Connectors;

abstract class BaseConnector implements Connector {
	public const KEY = '/^[a-z][a-z0-9_]{0,63}$/D';

	/** Answer as a single bounded line of text; arrays join, booleans read yes/no. */
	public static function text( mixed $value, int $limit = 500 ): string {
		if ( is_array( $value ) ) {
			if ( isset( $value['value'] ) && array_key_exists( 'other', $value ) ) {
				$value = $value['other'] ?? $value['value'];
			} else {
				$value = implode( ', ', array_map( static fn( $item ) => self::text( $item, $limit ), array_values( array_filter( $value, static fn( $item ) => is_scalar( $item ) || is_array( $item ) ) ) ) );
			}
		}
		if ( is_bool( $value ) ) {
			$value = $value ? 'yes' : 'no';
		}
		if ( ! is_scalar( $value ) ) {
			return '';
		}
		$text = trim( preg_replace( '/[\x00-\x1f\x7f]+/u', ' ', (string) $value ) ?? '' );
		return mb_substr( $text, 0, $limit, 'UTF-8' );
	}

	/** @param array<string,mixed> $payload */
	public static function answer( array $payload, string $key ): mixed {
		return '' !== $key && is_array( $payload['answers'] ?? null ) ? ( $payload['answers'][ $key ] ?? null ) : null;
	}

	/** @param array<string,mixed> $payload */
	public static function email( array $payload, string $key ): string {
		$email = strtolower( self::text( self::answer( $payload, $key ), 254 ) );
		return filter_var( $email, FILTER_VALIDATE_EMAIL ) ? $email : '';
	}

	/**
	 * A configured consent field must hold an explicit true answer.
	 *
	 * @param array<string,mixed> $config
	 * @param array<string,mixed> $payload
	 */
	public static function consented( array $config, array $payload ): bool {
		$key = (string) ( $config['consentField'] ?? '' );
		return '' === $key || true === self::answer( $payload, $key );
	}

	/**
	 * Mapped provider fields: remote name => answer key, skipping empty answers.
	 *
	 * @param array<string,mixed> $config
	 * @param array<string,mixed> $payload
	 * @return array<string,string>
	 */
	public static function mapped( array $config, array $payload, string $pattern ): array {
		$out = array();
		foreach ( (array) ( $config['fields'] ?? array() ) as $remote => $key ) {
			if ( ! is_string( $key ) || ! preg_match( $pattern, (string) $remote ) ) {
				continue;
			}
			$value = self::text( self::answer( $payload, $key ) );
			if ( '' !== $value ) {
				$out[ (string) $remote ] = $value;
			}
		}
		return $out;
	}

	/**
	 * Shared reference checks: every named answer key must exist in the form.
	 *
	 * @param array<string,mixed> $config
	 * @param list<string>        $keys
	 * @param list<string>        $required config members that must name a field
	 * @return list<string>
	 */
	protected function referenceIssues( array $config, array $keys, array $required, string $remote_pattern ): array {
		$issues = array();
		foreach ( $required as $member ) {
			if ( '' === (string) ( $config[ $member ] ?? '' ) ) {
				$issues[] = sprintf( '%s requires %s.', $this->type(), $member );
			}
		}
		foreach ( array( 'emailField', 'phoneField', 'consentField' ) as $member ) {
			$key = (string) ( $config[ $member ] ?? '' );
			if ( '' !== $key && ! in_array( $key, $keys, true ) ) {
				$issues[] = sprintf( '%s %s references a missing field.', $this->type(), $member );
			}
		}
		foreach ( (array) ( $config['fields'] ?? array() ) as $remote => $key ) {
			if ( ! preg_match( $remote_pattern, (string) $remote ) ) {
				$issues[] = sprintf( '%s field name "%s" is not valid for this provider.', $this->type(), (string) $remote );
			} elseif ( ! is_string( $key ) || ! in_array( $key, $keys, true ) ) {
				$issues[] = sprintf( '%s field "%s" references a missing answer.', $this->type(), (string) $remote );
			}
		}
		return $issues;
	}

	/**
	 * @param array<string,string> $headers
	 * @return array{method:string,url:string,headers:array<string,string>,body:string}
	 */
	protected static function request( string $method, string $url, array $headers, mixed $body ): array {
		return array(
			'method'  => $method,
			'url'     => $url,
			'headers' => $headers + array( 'Content-Type' => 'application/json; charset=utf-8' ),
			'body'    => json_encode( $body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR ),
		);
	}
}
