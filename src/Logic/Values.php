<?php
namespace ChatFlow\Logic;

final class Values {

	public static function isOtherAnswer( mixed $value ): bool {
		if ( ! is_array( $value ) && ! is_object( $value ) ) {
			return false;
		}
		$answer = (array) $value;
		$keys   = array_keys( $answer );
		sort( $keys, SORT_STRING );
		return array( 'other', 'value' ) === $keys && is_string( $answer['value'] ) && is_string( $answer['other'] );
	}

	public static function choiceValue( mixed $value ): mixed {
		return self::isOtherAnswer( $value ) ? ( (array) $value )['value'] : $value;
	}

	public static function equal( mixed $a, mixed $b ): bool {
		if ( self::numeric( $a ) && self::numeric( $b ) ) {
			return (float) $a === (float) $b;
		}
		if ( gettype( $a ) !== gettype( $b ) ) {
			return false;
		}
		if ( is_array( $a ) || is_object( $a ) ) {
			if ( is_array( $a ) && array_is_list( $a ) !== array_is_list( $b ) ) {
				return false;
			}
			$aa = (array) $a;
			$bb = (array) $b;
			if ( count( $aa ) !== count( $bb ) ) {
				return false;
			}
			foreach ( $aa as $key => $value ) {
				if ( ! array_key_exists( $key, $bb ) || ! self::equal( $value, $bb[ $key ] ) ) {
					return false;
				}
			}
			return true;
		}
		return $a === $b;
	}

	public static function numeric( mixed $value ): bool {
		return ( is_int( $value ) || is_float( $value ) ) && is_finite( (float) $value );
	}

	public static function empty( mixed $value ): bool {
		return null === $value || '' === $value || array() === $value || ( is_object( $value ) && array() === (array) $value );
	}

	/** @return list<int>|null */
	public static function dateParts( mixed $value ): ?array {
		if ( ! is_string( $value ) || ! preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/D', $value ) ) {
			return null;
		}
		$parts = array_map( 'intval', explode( '-', $value ) );
		return $parts[0] >= 1 && checkdate( $parts[1], $parts[2], $parts[0] ) ? $parts : null;
	}

	public static function age( mixed $value, ?string $now ): ?int {
		$born = self::dateParts( $value );
		if ( ! $now || ! preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]{1,6})?Z$/D', $now ) ) {
			return null;
		}
		$today = self::dateParts( substr( $now, 0, 10 ) );
		if ( ! $born || ! $today || $value > substr( $now, 0, 10 ) ) {
			return null;
		}
		return $today[0] - $born[0] - ( $today[1] * 100 + $today[2] < $born[1] * 100 + $born[2] ? 1 : 0 );
	}

	/** @return array{path:string,code:string,message:string,fieldKey?:string} */
	public static function issue( string $path, string $code, string $message, ?string $key = null ): array {
		$result = array(
			'path'    => $path,
			'code'    => $code,
			'message' => $message,
		);
		if ( null !== $key ) {
			$result['fieldKey'] = $key;
		}
		return $result;
	}

	public static function pointer( string $key ): string {
		return str_replace( array( '~', '/' ), array( '~0', '~1' ), $key );
	}
}
