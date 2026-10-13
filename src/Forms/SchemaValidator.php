<?php
namespace ChatFlow\Forms;

use ChatFlow\Vendor\Opis\JsonSchema\Validator;
use ChatFlow\Vendor\Opis\JsonSchema\Errors\ErrorFormatter;

final class SchemaValidator {
	public const V1_TYPES      = array( 'short_text', 'long_text', 'email', 'phone', 'number', 'date', 'single_choice', 'multi_choice', 'yes_no', 'consent', 'hidden', 'statement', 'summary' );
	public const ENABLED_TYPES = array( ...self::V1_TYPES, 'rating', 'scale', 'nps', 'slider', 'address', 'media', 'file_upload' );

	/** @param array<string,mixed> $schema
	 *  @return list<array{path:string,code:string,message:string}>
	 */
	public function validate( array $schema ): array {
		$errors = $this->validateDocument( $schema, 'form' );
		if ( $errors ) {
			return $errors;
		}
		$ids       = array();
		$keys      = array();
		$steps     = array_column( $schema['steps'], 'id' );
		$endings   = array_column( $schema['endings'], 'id' );
		$variables = array_column( $schema['variables'] ?? array(), 'key' );
		foreach ( $schema['steps'] as $index => $step ) {
			$path = '/steps/' . $index;
			$this->unique( $step['id'], $ids, $path . '/id', $errors );
			$this->unique( $step['key'], $keys, $path . '/key', $errors );
			$values = array();
			foreach ( $step['options'] ?? array() as $oi => $option ) {
				$this->unique( $option['id'], $ids, $path . '/options/' . $oi . '/id', $errors );
				$this->unique( $option['value'], $values, $path . '/options/' . $oi . '/value', $errors );
			}
			if ( in_array( $step['type'], array( 'single_choice', 'multi_choice' ), true ) && empty( $step['options'] ) ) {
				$errors[] = $this->error( $path . '/options', 'missing_options', 'Choice fields need at least one option.' );
			}
			$this->checkRules( $step['logic'] ?? array(), $schema, $path . '/logic', $errors );
			foreach ( $step['options'] ?? array() as $oi => $option ) {
				$this->checkRules( $option['logic'] ?? array(), $schema, $path . '/options/' . $oi . '/logic', $errors );
			}
			$v = $step['validation'] ?? array();
			if ( in_array( $step['type'], array( 'rating', 'scale', 'nps', 'slider' ), true ) && ! \ChatFlow\Fields\NumericScaleField::validConfig( $step ) ) {
				$errors[] = $this->error( $path . '/validation', 'invalid_range', 'Scale bounds and increments must be numeric and compatible.' );
			}
			foreach ( array( array( 'minLength', 'maxLength' ), array( 'minSelections', 'maxSelections' ), array( 'min', 'max' ) ) as $pair ) {
				if ( isset( $v[ $pair[0] ], $v[ $pair[1] ] ) && $v[ $pair[0] ] > $v[ $pair[1] ] ) {
					$errors[] = $this->error( $path . '/validation', 'invalid_range', 'Minimum must not exceed maximum.' );
				}
			}
		}
		foreach ( $schema['endings'] as $index => $ending ) {
			$this->unique( $ending['id'], $ids, '/endings/' . $index . '/id', $errors );
			if ( 'redirect' === $ending['type'] && empty( $ending['url'] ) ) {
				$errors[] = $this->error( '/endings/' . $index . '/url', 'missing_url', 'Redirect endings need a URL.' );
			}
			foreach ( $ending['buttons'] ?? array() as $bi => $button ) {
				$this->unique( $button['id'], $ids, '/endings/' . $index . '/buttons/' . $bi . '/id', $errors );
				if ( 'link' === $button['action'] && empty( $button['url'] ) ) {
					$errors[] = $this->error( '/endings/' . $index . '/buttons/' . $bi . '/url', 'missing_url', 'Link buttons need a URL.' );
				}
			}
		}
		foreach ( $schema['groups'] ?? array() as $index => $group ) {
			$this->unique( $group['id'], $ids, '/groups/' . $index . '/id', $errors );
			foreach ( $group['stepIds'] as $sid ) {
				if ( ! in_array( $sid, $steps, true ) ) {
					$errors[] = $this->error( '/groups/' . $index . '/stepIds', 'unknown_step', 'Group references an unknown step.' );
				}
			}
		}
		$variable_keys = array();
		foreach ( $schema['variables'] ?? array() as $index => $variable ) {
			$this->unique( $variable['key'], $variable_keys, '/variables/' . $index . '/key', $errors );
			$type = gettype( $variable['default'] );
			if ( ( 'number' === $variable['type'] && ! in_array( $type, array( 'integer', 'double' ), true ) ) || ( 'number' !== $variable['type'] && $type !== $variable['type'] ) ) {
				$errors[] = $this->error( '/variables/' . $index . '/default', 'type', 'Variable default must match its type.' );
			}
		}
		return $errors;
	}

	/** @param array<string,mixed> $settings
	 *  @param array<string,mixed>|null $schema
	 *  @return list<array{path:string,code:string,message:string}>
	 */
	public function validateSettings( array $settings, ?array $schema = null ): array {
		$errors  = $this->validateDocument( (object) $settings, 'settings' );
		$default = $settings['completion']['defaultEndingId'] ?? null;
		if ( $schema && $default && ! in_array( $default, array_column( $schema['endings'], 'id' ), true ) ) {
			$errors[] = $this->error( '/completion/defaultEndingId', 'unknown_ending', 'Unknown default ending.' );
		}
		return $errors;
	}

	/** @param array<string,mixed> $schema
	 *  @param list<string> $enabled_types
	 *  @return list<array{path:string,code:string,message:string}>
	 */
	public function validatePublishable( array $schema, array $enabled_types = self::ENABLED_TYPES ): array {
		$errors = $this->validate( $schema );
		if ( $errors ) {
			return $errors;
		}
		foreach ( $schema['steps'] as $index => $step ) {
			if ( ! in_array( $step['type'], $enabled_types, true ) ) {
				$errors[] = $this->error( '/steps/' . $index . '/type', 'unsupported_type', 'This known field type is not enabled in this release.' );
			}
		}
		return $errors;
	}

	/** @param array<string,mixed>|object $document
	 *  @return list<array{path:string,code:string,message:string}>
	 */
	private function validateDocument( array|object $document, string $kind ): array {
		$json = json_encode( $document, JSON_THROW_ON_ERROR );
		if ( strlen( $json ) > 1048576 ) {
			return array( $this->error( '', 'too_large', 'Schema exceeds 1 MiB.' ) );
		}
		$definition = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/schema/' . $kind . '.schema.json' ), false, 512, JSON_THROW_ON_ERROR );
		$validator  = new Validator();
		$validator->setMaxErrors( 100 );
		$result = $validator->validate( json_decode( $json, false, 512, JSON_THROW_ON_ERROR ), $definition );
		if ( $result->isValid() ) {
			return array();
		}
		$errors = array();
		foreach ( ( new ErrorFormatter() )->format( $result->error(), false ) as $path => $message ) {
			$errors[] = $this->error( $path, 'schema', $message );
		}
		return $errors;
	}

	/** @param list<array<string,mixed>> $rules
	 *  @param array<string,mixed> $schema
	 *  @param list<array{path:string,code:string,message:string}> $errors
	 */
	private function checkRules( array $rules, array $schema, string $path, array &$errors ): void {
		foreach ( $rules as $i => $rule ) {
			$action  = $rule['then'];
			$targets = 'end' === $action['action'] ? array_column( $schema['endings'], 'id' ) : array_column( $schema['steps'], 'id' );
			if ( isset( $action['to'] ) && ! in_array( $action['to'], $targets, true ) ) {
				$errors[] = $this->error( $path . '/' . $i . '/then/to', 'unknown_target', 'Rule references an unknown target.' );
			}
			if ( 'set_variable' === $action['action'] && ! in_array( $action['key'], array_column( $schema['variables'] ?? array(), 'key' ), true ) ) {
				$errors[] = $this->error( $path . '/' . $i . '/then/key', 'unknown_variable', 'Unknown variable.' );
			}
			$this->checkCondition( $rule['if'], $schema, $path . '/' . $i . '/if', $errors );
		}
	}

	/** @param array<string,mixed> $condition
	 *  @param array<string,mixed> $schema
	 *  @param list<array{path:string,code:string,message:string}> $errors
	 */
	private function checkCondition( array $condition, array $schema, string $path, array &$errors ): void {
		foreach ( array( 'all', 'any' ) as $group ) {
			if ( isset( $condition[ $group ] ) ) {
				foreach ( $condition[ $group ] as $i => $child ) {
					$this->checkCondition( $child, $schema, $path . '/' . $group . '/' . $i, $errors );
				}
				return;
			}
		}
		$source = $condition['source'] ?? 'answer';
		if ( 'url' !== $source ) {
			$keys = array_column( 'variable' === $source ? ( $schema['variables'] ?? array() ) : $schema['steps'], 'key' );
			if ( ! in_array( $condition['field'], $keys, true ) ) {
				$errors[] = $this->error( $path . '/field', 'unknown_field', 'Condition references an unknown field.' );
			}
		}
		if ( ! in_array( $condition['op'], array( 'is_empty', 'is_not_empty' ), true ) && ! array_key_exists( 'value', $condition ) ) {
			$errors[] = $this->error( $path . '/value', 'missing_value', 'This operator needs a value.' );
		}
	}

	/** @param array<string,bool> $seen
	 *  @param list<array{path:string,code:string,message:string}> $errors
	 */
	private function unique( string $value, array &$seen, string $path, array &$errors ): void {
		if ( isset( $seen[ $value ] ) ) {
			$errors[] = $this->error( $path, 'duplicate', 'Identifiers and keys must be unique.' );
		}
		$seen[ $value ] = true;
	}

	/** @return array{path:string,code:string,message:string} */
	private function error( string $path, string $code, string $message ): array {
		return array(
			'path'    => $path,
			'code'    => $code,
			'message' => $message,
		);
	}
}
