<?php
namespace ChatFlow\Security;

final class CookieSources {
	public const ALLOWED = array( 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'campaign', 'tracking', 'cff_locale', 'cff_theme' );
	public const MESSAGE = 'Cookie sources are restricted to supported attribution/preference cookies.';
	public static function allows( string $name ): bool {
		if ( ! in_array( $name, self::ALLOWED, true ) ) {
			return false;
		}
		foreach ( array( 'AUTH_COOKIE', 'SECURE_AUTH_COOKIE', 'LOGGED_IN_COOKIE' ) as $constant ) {
			if ( defined( $constant ) && is_string( constant( $constant ) ) && 0 === strcasecmp( $name, constant( $constant ) ) ) {
				return false;
			}
		}
		return true;
	}
	/** @param array<string,mixed> $schema
	 * @return list<string> */
	public static function deniedKeys( array $schema ): array {
		$keys = array();
		foreach ( $schema['steps'] ?? array() as $step ) {
			if ( 'hidden' === $step['type'] && 'cookie' === ( $step['settings']['source'] ?? '' ) && ! self::allows( $step['settings']['sourceKey'] ?? $step['key'] ) ) {
				$keys[] = $step['key'];
			}
		}
		return $keys;
	}
	/** @param array<string,mixed> $schema
	 * @param array<string,mixed> $context
	 * @return array<string,mixed> */
	public static function context( array $schema, array $context ): array {
		foreach ( self::deniedKeys( $schema ) as $key ) {
			$context['hidden'][ $key ] = null;
			unset( $context['_answers'][ $key ] );
			if ( isset( $context['_meta']['context'] ) ) {
				$context['_meta']['context']['hidden'][ $key ] = null;
			}
		}
		return $context;
	}
	/** @param array<string,mixed> $schema
	 * @param array<string,mixed> $answers
	 * @return array<string,mixed> */
	public static function answers( array $schema, array $answers ): array {
		return array_diff_key( $answers, array_flip( self::deniedKeys( $schema ) ) );
	}
	/** @param array<string,mixed> $schema
	 * @return array<string,mixed> */
	public static function projection( array $schema ): array {
		$denied = self::deniedKeys( $schema );
		foreach ( $schema['steps'] as &$step ) {
			if ( in_array( $step['key'], $denied, true ) ) {
				$step['settings']['source'] = 'default';
				unset( $step['settings']['sourceKey'], $step['defaultValue'] );
			}
		}
		unset( $step );
		return $schema;
	}
}
