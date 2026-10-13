<?php
namespace ChatFlow\Fields;

use ChatFlow\Logic\Pattern;
use ChatFlow\Logic\Values;

abstract class AbstractField implements FieldType {

	/** @param array<string,mixed> $step
	 *  @param array<string,mixed> $context
	 */
	public function sanitize( mixed $value, array $step, array $context = array() ): mixed {
		$type = $this->type();
		if ( in_array( $type, array( 'short_text', 'long_text', 'email', 'date' ), true ) && is_string( $value ) ) {
			return self::plainText( $value, 'long_text' === $type );
		}
		if ( 'phone' === $type && is_string( $value ) ) {
			return self::phone( $value, $step['settings']['country'] ?? 'ID' );
		}
		if ( 'number' === $type && is_string( $value ) && preg_match( '/^[ \t\n\r]*[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?[ \t\n\r]*$/D', $value ) && is_finite( (float) $value ) ) {
			return (float) $value;
		}
		return in_array( $type, array( 'statement', 'summary' ), true ) ? null : $value;
	}

	public static function plainText( string $value, bool $multiline = false ): string {
		$text = str_replace( array( "\r\n", "\r" ), "\n", $value );
		$text = preg_replace( '/<[^>]*>/u', '', $text ) ?? '';
		$text = preg_replace( '/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', '', $text ) ?? '';
		if ( ! $multiline ) {
			$text = preg_replace( '/[\t\n ]+/', ' ', $text ) ?? '';
		}
		return trim( $text, " \t\n" );
	}

	/** @param array<string,mixed> $step
	 *  @param array<string,mixed> $context
	 *  @return list<array{path:string,code:string,message:string,fieldKey?:string}>
	 */
	public function validate( mixed $value, array $step, array $context = array() ): array {
		$errors = array();
		$key    = $step['key'];
		$add    = static function ( string $code, string $message ) use ( &$errors, $key ): void {
			$errors[] = Values::issue( '/answers/' . Values::pointer( $key ), $code, $message, $key );
		};
		$type   = $this->type();
		if ( in_array( $type, array( 'statement', 'summary' ), true ) ) {
			return $errors;
		}
		$required = ( $step['required'] ?? false ) || 'consent' === $type;
		if ( null === $value ) {
			if ( $required ) {
				$add( 'required', 'An answer is required.' );
			}
			return $errors;
		}
		$typed = match ( $type ) {
			'number' => Values::numeric( $value ),
			'yes_no', 'consent' => is_bool( $value ),
			'multi_choice' => is_array( $value ) && array_is_list( $value ) && count( array_filter( $value, 'is_string' ) ) === count( $value ),
			'hidden' => is_string( $value ) || is_bool( $value ) || Values::numeric( $value ),
			default => is_string( $value ),
		};
		if ( ! $typed ) {
			$add( 'type_mismatch', 'The answer has an invalid type.' );
			return $errors;
		}
		if ( $required && ( Values::empty( $value ) || ( 'consent' === $type && true !== $value ) ) ) {
			$add( 'required', 'An answer is required.' );
			return $errors;
		}
		if ( Values::empty( $value ) ) {
			return $errors;
		}
		$v = (array) ( $step['validation'] ?? array() );
		if ( is_string( $value ) ) {
			$length = mb_strlen( $value, 'UTF-8' );
			$max    = $v['maxLength'] ?? ( 'long_text' === $type ? 100000 : 10000 );
			if ( isset( $v['minLength'] ) && $length < $v['minLength'] ) {
				$add( 'min_length', 'The answer is too short.' );
			}
			if ( $length > $max ) {
				$add( 'max_length', 'The answer is too long.' );
			}
			if ( isset( $v['pattern'] ) ) {
				if ( null === Pattern::compile( $v['pattern'] ) ) {
					$add( 'invalid_pattern', 'The validation pattern is not supported.' );
				} elseif ( ! Pattern::matches( $value, $v['pattern'] ) ) {
					$add( 'pattern', 'The answer does not match the pattern.' );
				}
			}
			if ( ( 'email' === $type || 'email' === ( $v['format'] ?? '' ) ) && ! self::email( $value ) ) {
				$add( 'invalid_email', 'Enter a valid email address.' );
			}
			if ( 'url' === ( $v['format'] ?? '' ) && ! self::url( $value ) ) {
				$add( 'invalid_url', 'Enter a valid website address.' );
			}
			if ( 'phone' === $type && ! preg_match( '/^\+[1-9][0-9]{6,14}$/D', $value ) ) {
				$add( 'invalid_phone', 'Enter a valid international phone number.' );
			}
			if ( 'date' === $type ) {
				if ( null === Values::dateParts( $value ) ) {
					$add( 'invalid_date', 'Enter a valid date in YYYY-MM-DD format.' );
				} else {
					if ( null !== Values::dateParts( $v['min'] ?? null ) && $value < $v['min'] ) {
						$add( 'min', 'The answer is below the minimum.' );
					}
					if ( null !== Values::dateParts( $v['max'] ?? null ) && $value > $v['max'] ) {
						$add( 'max', 'The answer exceeds the maximum.' );
					}
					if ( isset( $v['minAge'] ) ) {
						$age = Values::age( $value, $context['now'] ?? null );
						if ( null === $age ) {
							$add( 'invalid_context', 'A valid frozen UTC date is required.' );
						} elseif ( $age < $v['minAge'] ) {
							$add( 'min_age', 'The minimum age is not met.' );
						}
					}
				}
			}
		}
		if ( 'number' === $type && Values::numeric( $value ) ) {
			if ( Values::numeric( $v['min'] ?? null ) && $value < $v['min'] ) {
				$add( 'min', 'The answer is below the minimum.' );
			}
			if ( Values::numeric( $v['max'] ?? null ) && $value > $v['max'] ) {
				$add( 'max', 'The answer exceeds the maximum.' );
			}
			if ( isset( $v['step'] ) ) {
				$units = ( $value - ( Values::numeric( $v['min'] ?? null ) ? $v['min'] : 0 ) ) / $v['step'];
				if ( abs( $units - round( $units ) ) > 1e-8 ) {
					$add( 'step', 'The answer does not match the allowed increment.' );
				}
			}
		}
		if ( in_array( $type, array( 'single_choice', 'multi_choice' ), true ) ) {
			$selected = is_array( $value ) ? $value : array( $value );
			$options  = $step['options'] ?? array();
			foreach ( $selected as $item ) {
				if ( ! in_array( $item, array_column( $options, 'value' ), true ) ) {
					$add( 'invalid_choice', 'Choose a configured option value.' );
					break;
				}
			}
			if ( count( array_unique( $selected, SORT_STRING ) ) !== count( $selected ) ) {
				$add( 'duplicate_choice', 'Choose each option only once.' );
			}
			foreach ( $options as $option ) {
				if ( count( $selected ) > 1 && ( $option['isExclusive'] ?? false ) && in_array( $option['value'], $selected, true ) ) {
					$add( 'exclusive_choice', 'An exclusive option cannot be combined.' );
					break;
				}
			}
			if ( 'multi_choice' === $type ) {
				if ( isset( $v['minSelections'] ) && count( $selected ) < $v['minSelections'] ) {
					$add( 'min_selections', 'Choose more options.' );
				}
				if ( isset( $v['maxSelections'] ) && count( $selected ) > $v['maxSelections'] ) {
					$add( 'max_selections', 'Choose fewer options.' );
				}
			}
		}
		return $errors;
	}

	private static function email( string $value ): bool {
		$parts = explode( '@', $value );
		if ( strlen( $value ) > 254 || ! preg_match( "/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\\.[A-Za-z]{2,63}$/D", $value ) || strlen( $parts[0] ) > 64 || str_contains( $value, '..' ) || str_starts_with( $parts[0], '.' ) || str_ends_with( $parts[0], '.' ) ) {
			return false;
		}
		foreach ( explode( '.', $parts[1] ) as $part ) {
			if ( strlen( $part ) > 63 || str_starts_with( $part, '-' ) || str_ends_with( $part, '-' ) ) {
				return false;
			}
		}
		return true;
	}

	private static function url( string $value ): bool {
		return ! str_contains( $value, '..' ) && 1 === preg_match( '~^(?:https?://)?[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}(?::[0-9]{1,5})?(?:[/?#][^\s<>]*)?$~D', $value );
	}

	private static function phone( string $value, string $country ): string {
		$text = trim( $value, " \t\n\r" );
		if ( ! preg_match( '/^(?:\+|00)?[0-9 ()\-.]+$/D', $text ) ) {
			return $text;
		}
		$digits = str_replace( array( ' ', '(', ')', '-', '.' ), '', $text );
		if ( str_starts_with( $digits, '00' ) ) {
			$digits = '+' . substr( $digits, 2 );
		}
		if ( str_starts_with( $digits, '+' ) ) {
			return $digits;
		}
		$codes = json_decode( (string) file_get_contents( __DIR__ . '/calling-codes.json' ), true );
		if ( ! isset( $codes[ $country ] ) ) {
			return $text;
		}
		$code = $codes[ $country ];
		if ( str_starts_with( $digits, '0' ) && 'IT' !== $country ) {
			$digits = substr( $digits, 1 );
		} elseif ( str_starts_with( $digits, $code ) ) {
			return '+' . $digits;
		}
		return '+' . $code . $digits;
	}
}
