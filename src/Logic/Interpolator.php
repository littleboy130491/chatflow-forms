<?php
namespace ChatFlow\Logic;

final class Interpolator {

	/** @param array<string,mixed> $answers
	 *  @param array<string,mixed> $meta
	 */
	public static function interpolate( string $text, array $answers = array(), array $meta = array() ): string {
		return self::replace( $text, $answers, $meta, false );
	}

	/** @param array<string,mixed> $answers
	 *  @param array<string,mixed> $meta
	 */
	public static function interpolateUrl( string $text, array $answers = array(), array $meta = array() ): string {
		return self::replace( $text, $answers, $meta, true );
	}

	public static function readable( mixed $value ): string {
		if ( null === $value ) {
			return '';
		}
		if ( Values::isOtherAnswer( $value ) ) {
			$answer = (array) $value;
			return $answer['value'] . ': ' . $answer['other'];
		}
		if ( is_array( $value ) && array_is_list( $value ) ) {
			return implode( ', ', array_map( array( self::class, 'readable' ), $value ) );
		}
		if ( is_array( $value ) || is_object( $value ) ) {
			$values = (array) $value;
			ksort( $values, SORT_STRING );
			$result = array();
			foreach ( $values as $key => $item ) {
				$result[] = $key . ': ' . self::readable( $item );
			}
			return implode( ', ', $result );
		}
		if ( Values::numeric( $value ) ) {
			return self::numberText( $value );
		}
		return is_bool( $value ) ? ( $value ? 'true' : 'false' ) : (string) $value;
	}

	private static function numberText( int|float $value ): string {
		if ( 0.0 === (float) $value ) {
			return '0';
		}
		$text = (string) json_encode( $value );
		if ( ! preg_match( '/^(-?)([0-9]+)(?:\.([0-9]+))?e([+-]?[0-9]+)$/i', $text, $parts ) ) {
			return $text;
		}
		$exponent = (int) $parts[4];
		$fraction = rtrim( $parts[3], '0' );
		if ( $exponent < -6 || $exponent >= 21 ) {
			return $parts[1] . $parts[2] . ( '' !== $fraction ? '.' . $fraction : '' ) . 'e' . ( $exponent >= 0 ? '+' : '' ) . $exponent;
		}
		$digits = $parts[2] . $fraction;
		$point  = strlen( $parts[2] ) + $exponent;
		if ( $point <= 0 ) {
			return $parts[1] . '0.' . str_repeat( '0', -$point ) . $digits;
		}
		if ( $point >= strlen( $digits ) ) {
			return $parts[1] . $digits . str_repeat( '0', $point - strlen( $digits ) );
		}
		return $parts[1] . substr( $digits, 0, $point ) . '.' . substr( $digits, $point );
	}

	/** @param array<string,mixed> $answers
	 *  @param array<string,mixed> $meta
	 */
	private static function replace( string $text, array $answers, array $meta, bool $url ): string {
		return preg_replace_callback(
			'/\{\{([^{}]*)\}\}/',
			static function ( array $tag ) use ( $answers, $meta, $url ): string {
				if ( ! preg_match( '/^[ \t\r\n]*(?:(answer|meta):)?([a-z][a-z0-9_]*)[ \t\r\n]*$/D', $tag[1], $parts ) ) {
					return '';
				}
				$source = 'meta' === $parts[1] ? $meta : $answers;
				$value  = self::readable( $source[ $parts[2] ] ?? null );
				return $url ? rawurlencode( $value ) : $value;
			},
			$text
		) ?? $text;
	}
}
