<?php
namespace ChatFlow\Logic;

final class Pattern {

	public static function compile( mixed $pattern ): ?string {
		if ( ! is_string( $pattern ) || strlen( $pattern ) > 512 || preg_match( '/[^\x20-\x7e]/', $pattern ) ) {
			return null;
		}
		if ( preg_match( '/[()|]/', $pattern ) || preg_match( '~\\\\(?![dDwWsnrt\\\\.\[\]{}^$*+?\-/])~', $pattern ) ) {
			return null;
		}
		if ( preg_match( '/(?:[*+?]|\{[0-9]+(?:,[0-9]*)?\})\s*(?:[*+?]|\{)/', $pattern ) ) {
			return null;
		}
		preg_match_all( '/[*+]|\{[0-9]+,\}/', $pattern, $repeats );
		if ( count( $repeats[0] ) > 1 || ( $repeats[0] && ! ( str_starts_with( $pattern, '^' ) && str_ends_with( $pattern, '$' ) ) ) ) {
			return null;
		}
		preg_match_all( '/\{([0-9]+)(?:,([0-9]+))?\}/', $pattern, $bounds, PREG_SET_ORDER );
		foreach ( $bounds as $bound ) {
			if ( (int) $bound[1] > 1000 || (int) ( $bound[2] ?? 0 ) > 1000 ) {
				return null;
			}
		}
		$portable = str_replace( array( '\\s', '\\S' ), array( '[ \t\r\n\f\v]', '[^ \t\r\n\f\v]' ), $pattern );
		$compiled = '~(*LIMIT_MATCH=100000)(*LIMIT_RECURSION=1000)' . str_replace( '~', '\\~', $portable ) . '~uD';
		// Invalid admin expressions must be diagnostics, not PHP warnings.
		return false === @preg_match( $compiled, '' ) ? null : $compiled; // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	public static function matches( mixed $value, mixed $pattern ): bool {
		$compiled = self::compile( $pattern );
		return is_string( $value ) && mb_strlen( $value, 'UTF-8' ) <= 4096 && null !== $compiled && 1 === preg_match( $compiled, $value );
	}
}
