<?php
namespace ChatFlow\Logic;

final class Pattern {

	public static function compile( mixed $pattern ): ?string {
		$portable = self::portable( $pattern );
		if ( null === $portable ) {
			return null;
		}
		$compiled = '~(*LIMIT_MATCH=100000)(*LIMIT_RECURSION=1000)' . str_replace( '~', '\\~', $portable ) . '~uD';
		// Invalid admin expressions must be diagnostics, not PHP warnings.
		return false === @preg_match( $compiled, '' ) ? null : $compiled; // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	public static function matches( mixed $value, mixed $pattern ): bool {
		$compiled = self::compile( $pattern );
		return is_string( $value ) && mb_strlen( $value, 'UTF-8' ) <= 4096 && null !== $compiled && 1 === preg_match( $compiled, $value );
	}

	private static function escape( string $char, bool $in_class ): ?string {
		$classes = array(
			'd' => '0-9',
			'w' => 'A-Za-z0-9_',
			's' => ' \t\r\n\f\x0b',
		);
		if ( isset( $classes[ $char ] ) ) {
			return $in_class ? $classes[ $char ] : '[' . $classes[ $char ] . ']';
		}
		if ( in_array( $char, array( 'D', 'W', 'S' ), true ) ) {
			return $in_class ? null : '[^' . $classes[ strtolower( $char ) ] . ']';
		}
		return str_contains( 'nrt\\.[]{}^$*+?-/', $char ) ? '\\' . $char : null;
	}

	private static function portable( mixed $pattern ): ?string {
		if ( ! is_string( $pattern ) || strlen( $pattern ) > 512 || preg_match( '/[^\x20-\x7e]|[()|]/', $pattern ) ) {
			return null;
		}
		$compiled = '';
		$atom     = false;
		$repeats  = 0;
		$length   = strlen( $pattern );
		for ( $i = 0; $i < $length; ++$i ) {
			$c = $pattern[ $i ];
			if ( '\\' === $c ) {
				$next    = $pattern[ ++$i ] ?? null;
				$escaped = null !== $next ? self::escape( $next, false ) : null;
				if ( null === $escaped ) {
					return null;
				}
				$compiled .= $escaped;
				$atom      = true;
			} elseif ( '[' === $c ) {
				$class  = '[';
				$closed = false;
				for ( ++$i; $i < $length; ++$i ) {
					$ch = $pattern[ $i ];
					if ( ']' === $ch ) {
						$class .= ']';
						$closed = true;
						break;
					}
					if ( '[' === $ch ) {
						return null;
					}
					if ( '\\' === $ch ) {
						$next    = $pattern[ ++$i ] ?? null;
						$escaped = null !== $next ? self::escape( $next, true ) : null;
						if ( null === $escaped ) {
							return null;
						}
						$class .= $escaped;
					} else {
						$class .= $ch;
					}
				}
				if ( ! $closed ) {
					return null;
				}
				$compiled .= $class;
				$atom      = true;
			} elseif ( in_array( $c, array( '*', '+', '?', '{' ), true ) ) {
				if ( ! $atom ) {
					return null;
				}
				$token    = $c;
				$flexible = true;
				if ( '{' === $c ) {
					if ( ! preg_match( '/^\{([0-9]+)(?:,([0-9]*))?\}/', substr( $pattern, $i ), $bounds ) ) {
						return null;
					}
					$min = (int) $bounds[1];
					$max = isset( $bounds[2] ) && '' === $bounds[2] ? INF : (int) ( $bounds[2] ?? $bounds[1] );
					if ( $min > 1000 || ( INF !== $max && ( $max > 1000 || $max < $min ) ) ) {
						return null;
					}
					$flexible = $min !== $max;
					$token    = $bounds[0];
					$i       += strlen( $token ) - 1;
				}
				if ( $flexible && ++$repeats > 1 ) {
					return null;
				}
				if ( ( '*' === $c || '+' === $c || str_ends_with( $token, ',}' ) ) && ! ( str_starts_with( $pattern, '^' ) && str_ends_with( $pattern, '$' ) ) ) {
					return null;
				}
				$compiled .= $token;
				$atom      = false;
			} elseif ( '^' === $c || '$' === $c ) {
				if ( ( '^' === $c && 0 !== $i ) || ( '$' === $c && $i !== $length - 1 ) ) {
					return null;
				}
				$compiled .= '$' === $c ? '$(?![\s\S])' : $c;
				$atom      = false;
			} elseif ( ']' === $c || '}' === $c ) {
				return null;
			} else {
				$compiled .= '.' === $c ? "[^\\n\\r\u{2028}\u{2029}]" : $c;
				$atom      = true;
			}
		}
		return $compiled;
	}
}
