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
		return is_bool( $value ) ? ( $value ? 'true' : 'false' ) : (string) $value;
	}

	/** @param array<string,mixed> $answers
	 *  @param array<string,mixed> $meta
	 */
	private static function replace( string $text, array $answers, array $meta, bool $url ): string {
		return preg_replace_callback(
			'/\{\{\s*(?:(answer|meta):)?([a-z][a-z0-9_]*)\s*\}\}/',
			static function ( array $tag ) use ( $answers, $meta, $url ): string {
				$source = 'meta' === $tag[1] ? $meta : $answers;
				$value  = self::readable( $source[ $tag[2] ] ?? null );
				return $url ? rawurlencode( $value ) : $value;
			},
			$text
		) ?? $text;
	}
}
