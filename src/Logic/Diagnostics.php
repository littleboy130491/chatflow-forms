<?php
namespace ChatFlow\Logic;

use ChatFlow\Fields\Registry;

final class Diagnostics {

	/** @param array<string,mixed> $schema
	 *  @return list<array{path:string,code:string,message:string,fieldKey?:string}>
	 */
	public static function diagnoseSchema( array $schema, ?Registry $registry = null ): array {
		$errors = array();
		$add    = static function ( string $path, string $code, string $message ) use ( &$errors ): void {
			$errors[] = Values::issue( $path, $code, $message );
		};
		if ( ! isset( $schema['steps'], $schema['endings'] ) || ! is_array( $schema['steps'] ) || ! $schema['steps'] || count( $schema['steps'] ) > 500 || ! is_array( $schema['endings'] ) || ! $schema['endings'] ) {
			$add( '', 'invalid_schema', 'The schema needs 1–500 steps and an ending.' );
			return $errors;
		}
		$ids           = array();
		$keys          = array();
		$step_ids      = array();
		$variables     = array_column( $schema['variables'] ?? array(), 'type', 'key' );
		$variable_keys = array();
		foreach ( $schema['variables'] ?? array() as $i => $v ) {
			if ( isset( $variable_keys[ $v['key'] ] ) ) {
				$add( '/variables/' . $i . '/key', 'duplicate_key', 'Variable keys must be unique.' );
			}
			$variable_keys[ $v['key'] ] = true;
			if ( ! self::variableType( $v['default'], $v['type'] ) ) {
				$add( '/variables/' . $i . '/default', 'invalid_variable', 'The variable default has an invalid type.' );
			}
		}
		$endings = array_column( $schema['endings'], 'id' );
		$unique  = static function ( string $id, string $path ) use ( &$ids, $add ): void {
			if ( isset( $ids[ $id ] ) ) {
				$add( $path, 'duplicate_id', 'IDs must be globally unique.' );
			}
			$ids[ $id ] = true;
		};
		foreach ( $schema['steps'] as $i => $s ) {
			if ( isset( $keys[ $s['key'] ] ) ) {
				$add( '/steps/' . $i . '/key', 'duplicate_key', 'Field keys must be unique.' );
			}
			$keys[ $s['key'] ]    = $i;
			$step_ids[ $s['id'] ] = $i;
			$unique( $s['id'], '/steps/' . $i . '/id' );
			$values = array();
			foreach ( $s['options'] ?? array() as $j => $o ) {
				$unique( $o['id'], '/steps/' . $i . '/options/' . $j . '/id' );
				if ( in_array( $o['value'], $values, true ) ) {
					$add( '/steps/' . $i . '/options/' . $j . '/value', 'duplicate_value', 'Option values must be unique.' );
				}
				$values[] = $o['value'];
			}
		}
		foreach ( $schema['endings'] as $i => $e ) {
			$unique( $e['id'], '/endings/' . $i . '/id' );
			foreach ( $e['buttons'] ?? array() as $j => $b ) {
				$unique( $b['id'], '/endings/' . $i . '/buttons/' . $j . '/id' );
			}
		}
		foreach ( $schema['groups'] ?? array() as $i => $g ) {
			$unique( $g['id'], '/groups/' . $i . '/id' );
			foreach ( $g['stepIds'] as $j => $id ) {
				if ( ! isset( $step_ids[ $id ] ) ) {
					$add( '/groups/' . $i . '/stepIds/' . $j, 'missing_reference', 'The referenced step does not exist.' );
				}
			}
		}
		$edges     = array();
		$skippable = array();
		foreach ( $schema['steps'] as $s ) {
			if ( ! empty( $s['hiddenByDefault'] ) ) {
				$skippable[ $s['id'] ] = true;
			}
			$rules = $s['logic'] ?? array();
			foreach ( $s['options'] ?? array() as $o ) {
				$rules = array_merge( $rules, $o['logic'] ?? array() );
			}
			foreach ( $rules as $r ) {
				if ( 'hide' === $r['then']['action'] ) {
					$skippable[ $r['then']['to'] ] = true;
				}
			}
		}
		$types = ( $registry ?? new Registry() )->types();
		foreach ( $schema['steps'] as $i => $s ) {
			$path = '/steps/' . $i;
			if ( ! in_array( $s['type'], $types, true ) ) {
				$add( $path . '/type', 'unsupported_type', 'This field type is not supported.' );
			}
			if ( isset( $s['validation']->pattern ) || isset( $s['validation']['pattern'] ) ) {
				$v = (array) $s['validation'];
				if ( null === Pattern::compile( $v['pattern'] ) ) {
					$add( $path . '/validation/pattern', 'invalid_pattern', 'The validation pattern is not supported.' );
				}
			}
			$v = (array) ( $s['validation'] ?? array() );
			if ( ! empty( $v['mxCheck'] ) ) {
				$add( $path . '/validation/mxCheck', 'unsupported_validation', 'MX checking is not enabled.' );
			}
			if ( in_array( $s['type'], array( 'single_choice', 'multi_choice' ), true ) && empty( $s['options'] ) ) {
				$add( $path . '/options', 'missing_options', 'Choice fields need at least one option.' );
			}
			$inspect = static function ( array $rules, string $base ) use ( $add, $keys, $variables, $step_ids, $endings, $i, $s, &$edges ): void {
				if ( count( $rules ) > 100 ) {
					$add( $base, 'invalid_schema', 'A field may have at most 100 rules.' );
				}
				foreach ( $rules as $j => $r ) {
					self::condition( $r['if'], $base . '/' . $j . '/if', $i, $keys, $variables, $add );
					$a    = $r['then'];
					$path = $base . '/' . $j . '/then';
					if ( 'set_variable' === $a['action'] ) {
						$type = $variables[ $a['key'] ] ?? null;
						if ( ! $type ) {
							$add( $path . '/key', 'missing_reference', 'The referenced variable does not exist.' );
						} elseif ( ( null !== $a['value'] && ! self::variableType( $a['value'], $type ) ) || ( 'set' !== $a['operation'] && ( 'number' !== $type || ! Values::numeric( $a['value'] ) ) ) ) {
							$add( $path, 'invalid_variable', 'The variable action has an invalid type.' );
						}
					} elseif ( 'end' === $a['action'] ? ! in_array( $a['to'], $endings, true ) : ! isset( $step_ids[ $a['to'] ] ) ) {
						$add( $path . '/to', 'missing_reference', 'The navigation or visibility target does not exist.' );
					}
					if ( 'jump' === $a['action'] ) {
						$edges[ $s['id'] ][] = $a['to'];
					}
				}
			};
			$inspect( $s['logic'] ?? array(), $path . '/logic' );
			foreach ( $s['options'] ?? array() as $j => $o ) {
				$inspect( $o['logic'] ?? array(), $path . '/options/' . $j . '/logic' );
			}
			if ( count( $s['options'] ?? array() ) > 200 ) {
				$add( $path . '/options', 'invalid_schema', 'A field may have at most 200 options.' );
			}
			foreach ( array( array( 'minLength', 'maxLength' ), array( 'minSelections', 'maxSelections' ), array( 'min', 'max' ) ) as $pair ) {
				if ( isset( $v[ $pair[0] ], $v[ $pair[1] ] ) && ( gettype( $v[ $pair[0] ] ) === gettype( $v[ $pair[1] ] ) || ( Values::numeric( $v[ $pair[0] ] ) && Values::numeric( $v[ $pair[1] ] ) ) ) && $v[ $pair[0] ] > $v[ $pair[1] ] ) {
					$add( $path . '/validation', 'invalid_range', 'Minimum must not exceed maximum.' );
				}
			}
			if ( isset( $v['step'] ) && ( ! Values::numeric( $v['step'] ) || $v['step'] <= 0 ) ) {
				$add( $path . '/validation/step', 'invalid_range', 'The numeric increment must be positive.' );
			}
			if ( in_array( $s['type'], array( 'rating', 'scale', 'nps', 'slider' ), true ) && ! \ChatFlow\Fields\NumericScaleField::validConfig( $s ) ) {
				$add( $path . '/validation', 'invalid_range', 'Scale bounds and increments must be numeric and compatible.' );
			}
			if ( 'single_choice' !== $s['type'] && array_filter( $s['options'] ?? array(), static fn( $o ) => ! empty( $o['isOther'] ) ) ) {
				$add( $path . '/options', 'unsupported_other', 'Other free text is only supported for single-choice fields.' );
			}
			$falls_through = true;
			foreach ( $s['logic'] ?? array() as $r ) {
				if ( in_array( $r['then']['action'], array( 'jump', 'end' ), true ) && isset( $r['if']['all'] ) && ! $r['if']['all'] ) {
					$falls_through = false;
					break;
				}
			}
			if ( isset( $schema['steps'][ $i + 1 ] ) && ( $falls_through || isset( $skippable[ $s['id'] ] ) ) ) {
				$edges[ $s['id'] ][] = $schema['steps'][ $i + 1 ]['id'];
			}
		}
		foreach ( $schema['steps'] as $i => $s ) {
			if ( in_array( 'duplicate_id', array_column( $errors, 'code' ), true ) ) {
				break;
			}
			$queue = $edges[ $s['id'] ] ?? array();
			$seen  = array();
			while ( $queue ) {
				$id = array_shift( $queue );
				if ( $id === $s['id'] ) {
					$add( '/steps/' . $i . '/logic', 'potential_loop', 'Navigation rules may revisit this step.' );
					break;
				}
				if ( ! isset( $seen[ $id ] ) ) {
					$seen[ $id ] = true;
					$queue       = array_merge( $queue, $edges[ $id ] ?? array() );
				}
			}
		}
		$reachable = array();
		$queue     = array( 0 );
		while ( $queue ) {
			$i = array_shift( $queue );
			if ( isset( $reachable[ $i ] ) || ! isset( $schema['steps'][ $i ] ) ) {
				continue;
			}
			$reachable[ $i ] = true;
			$s               = $schema['steps'][ $i ];
			$falls_through   = true;
			foreach ( $s['logic'] ?? array() as $r ) {
				if ( 'jump' === $r['then']['action'] && isset( $step_ids[ $r['then']['to'] ] ) ) {
					$queue[] = $step_ids[ $r['then']['to'] ];
				}
				if ( in_array( $r['then']['action'], array( 'jump', 'end' ), true ) && isset( $r['if']['all'] ) && ! $r['if']['all'] ) {
					$falls_through = false;
					break;
				}
			}
			foreach ( $s['options'] ?? array() as $o ) {
				foreach ( $o['logic'] ?? array() as $r ) {
					if ( 'jump' === $r['then']['action'] && isset( $step_ids[ $r['then']['to'] ] ) ) {
						$queue[] = $step_ids[ $r['then']['to'] ];
					}
				}
			}
			if ( $falls_through || isset( $skippable[ $s['id'] ] ) ) {
				$queue[] = $i + 1;
			}
		}
		foreach ( $schema['steps'] as $i => $s ) {
			if ( ! isset( $reachable[ $i ] ) ) {
				$add( '/steps/' . $i, 'unreachable_step', 'No possible navigation path reaches this step.' );
			}
		}
		return array_merge( $errors, PowerDiagnostics::diagnose( $schema ) );
	}

	public static function variableType( mixed $value, string $type ): bool {
		return match ( $type ) {
			'number' => Values::numeric( $value ),
			'boolean' => is_bool( $value ),
			'string' => is_string( $value ),
			default => false,
		};
	}

	/** @param array<string,mixed> $c
	 *  @param array<string,int> $keys
	 *  @param array<string,string> $variables
	 *  @param callable(string,string,string):void $add
	 */
	private static function condition( array $c, string $path, int $index, array $keys, array $variables, callable $add, int $depth = 0 ): void {
		if ( $depth > 64 ) {
			$add( $path, 'condition_depth', 'Conditions may nest at most 64 levels.' );
			return;
		}
		foreach ( array( 'all', 'any' ) as $group ) {
			if ( isset( $c[ $group ] ) ) {
				foreach ( $c[ $group ] as $j => $child ) {
					self::condition( $child, $path . '/' . $group . '/' . $j, $index, $keys, $variables, $add, $depth + 1 );
				}
				return;
			}
		}
		$source = $c['source'] ?? 'answer';
		if ( 'answer' === $source ) {
			if ( ! isset( $keys[ $c['field'] ] ) ) {
				$add( $path . '/field', 'missing_reference', 'The referenced answer does not exist.' );
			} elseif ( $keys[ $c['field'] ] > $index ) {
				$add( $path . '/field', 'later_reference', 'This condition references a later answer.' );
			}
		} elseif ( 'variable' === $source && ! isset( $variables[ $c['field'] ] ) ) {
			$add( $path . '/field', 'missing_reference', 'The referenced variable does not exist.' );
		}
		if ( 'matches' === $c['op'] && null === Pattern::compile( $c['value'] ?? null ) ) {
			$add( $path . '/value', 'invalid_pattern', 'The validation pattern is not supported.' );
		}
	}
}
