<?php
namespace ChatFlow\Fields;

use ChatFlow\Logic\Values;

final class AddressField extends AbstractField {
	public function type(): string {
		return 'address';
	}

	public function sanitize( mixed $value, array $step, array $context = array() ): mixed {
		if ( is_array( $value ) && array_is_list( $value ) || ! is_array( $value ) && ! $value instanceof \stdClass ) {
			return $value;
		}
		return (object) array_map( static fn( $item ) => is_string( $item ) ? self::plainText( $item ) : $item, (array) $value );
	}

	public function validate( mixed $value, array $step, array $context = array() ): array {
		$fields = $step['settings']['addressFields'] ?? array( 'street', 'city', 'postcode', 'country' );
		$key    = $step['key'];
		$issue  = static fn( $code ) => array( Values::issue( '/answers/' . Values::pointer( $key ), $code, 'Enter a valid configured address.', $key ) );
		if ( null === $value ) {
			return ( $step['required'] ?? false ) ? $issue( 'required' ) : array();
		}
		if ( ! $value instanceof \stdClass && ( ! is_array( $value ) || array_is_list( $value ) ) ) {
			return $issue( 'type_mismatch' );
		}
		$value = (array) $value;
		if ( array_diff( array_keys( $value ), $fields ) ) {
			return $issue( 'type_mismatch' );
		}
		foreach ( $fields as $field ) {
			$text = $value[ $field ] ?? '';
			if ( ! is_string( $text ) ) {
				return $issue( 'type_mismatch' );
			}
			if ( mb_strlen( $text, 'UTF-8' ) > 500 ) {
				return $issue( 'max_length' );
			}
			if ( ( $step['required'] ?? false ) && '' === $text ) {
				return $issue( 'required' );
			}
		}
		return array();
	}
}
