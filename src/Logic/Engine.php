<?php
namespace ChatFlow\Logic;

use ChatFlow\Fields\Registry;

final class Engine {
	private Registry $registry;

	public function __construct( ?Registry $registry = null ) {
		$this->registry = $registry ?? new Registry();
	}

	/** @param array<string,mixed> $schema
	 *  @param array<string,mixed> $supplied
	 *  @param array<string,mixed> $context
	 *  @return array<string,mixed>
	 */
	public function replay( array $schema, array $supplied, array $context = array(), string $mode = 'partial' ): array {
		$result           = array(
			'visited'       => array(),
			'answers'       => array(),
			'variables'     => array(),
			'currentStepId' => null,
			'endingId'      => null,
			'progress'      => 0,
			'errors'        => array(),
			'discardedKeys' => array(),
		);
		$result['errors'] = array_values( array_filter( Diagnostics::diagnoseSchema( $schema, $this->registry ), static fn( $e ) => ! in_array( $e['code'], array( 'potential_loop', 'unreachable_step', 'later_reference' ), true ) ) );
		if ( in_array( 'invalid_schema', array_column( $result['errors'], 'code' ), true ) ) {
			$result['discardedKeys'] = array_keys( $supplied );
			sort( $result['discardedKeys'], SORT_STRING );
			return $result;
		}
		if ( ! in_array( $mode, array( 'partial', 'complete' ), true ) ) {
			$result['errors'][] = Values::issue( '/mode', 'invalid_mode', 'Replay mode must be partial or complete.' );
		}
		foreach ( $schema['variables'] ?? array() as $v ) {
			$result['variables'][ $v['key'] ] = $v['default'];
		}
		$steps    = $schema['steps'] ?? array();
		$by_id    = array();
		$by_key   = array();
		$visible  = array();
		$required = array();
		foreach ( $steps as $i => $s ) {
			$by_id[ $s['id'] ]    = $i;
			$by_key[ $s['key'] ]  = $s;
			$visible[ $s['id'] ]  = ! ( $s['hiddenByDefault'] ?? false );
			$required[ $s['id'] ] = ( $s['required'] ?? false ) || 'consent' === $s['type'];
		}
		$ending_ids      = array_column( $schema['endings'] ?? array(), 'id' );
		$default_ending  = in_array( $context['defaultEndingId'] ?? null, $ending_ids, true ) ? $context['defaultEndingId'] : ( $ending_ids[0] ?? null );
		$seen            = array();
		$processed       = array();
		$discard         = array();
		$index           = 0;
		$answered_inputs = 0;
		if ( ! $result['errors'] ) {
			while ( $index < count( $steps ) ) {
				$s = $steps[ $index ];
				if ( isset( $seen[ $s['id'] ] ) || count( $seen ) >= 1000 ) {
					$result['currentStepId'] = $s['id'];
					$result['errors'][]      = Values::issue( '/steps/' . $index, 'cff_logic_loop', 'The logic path revisits a step.' );
					break;
				}
				$seen[ $s['id'] ] = true;
				if ( ! $visible[ $s['id'] ] ) {
					++$index;
					continue;
				}
				$result['visited'][] = $s['id'];
				$hidden              = 'hidden' === $s['type'];
				if ( ! self::isDisplay( $s['type'] ) ) {
					$exists = array_key_exists( $s['key'], $supplied );
					if ( ! $hidden && ! $exists && ( 'partial' === $mode || $required[ $s['id'] ] ) ) {
						$result['currentStepId'] = $s['id'];
						if ( 'complete' === $mode ) {
							$result['errors'][] = Values::issue( '/answers/' . Values::pointer( $s['key'] ), 'required', 'An answer is required.', $s['key'] );
						}
						break;
					}
					$field                  = $this->registry->get( $s['type'] );
					$value                  = $field->sanitize( $hidden ? self::hiddenValue( $s, $result['answers'], $context ) : ( $supplied[ $s['key'] ] ?? null ), $s, $context );
					$processed[ $s['key'] ] = true;
					if ( $hidden && $exists && ! Values::equal( $supplied[ $s['key'] ], $value ) ) {
						$discard[ $s['key'] ] = true;
						$result['errors'][]   = Values::issue( '/answers/' . Values::pointer( $s['key'] ), 'hidden_answer_tampered', 'Hidden answers are server-derived.', $s['key'] );
					}
					$validation = $field->validate( $value, array_merge( $s, array( 'required' => $required[ $s['id'] ] ) ), $context );
					if ( $validation ) {
						$result['errors']        = array_merge( $result['errors'], $validation );
						$result['currentStepId'] = $s['id'];
						if ( $exists ) {
							$discard[ $s['key'] ] = true;
						}
						break;
					}
					$result['answers'][ $s['key'] ] = $value;
					if ( ! $hidden ) {
						++$answered_inputs;
					}
				}
				$next = $index + 1;
				foreach ( self::rulesFor( $s, $result['answers'] ) as $rule ) {
					if ( ! Operators::evaluateCondition( $rule['if'], $result['answers'], $result['variables'], $context ) ) {
						continue;
					}
					$a = $rule['then'];
					if ( 'jump' === $a['action'] ) {
						$next = $by_id[ $a['to'] ];
						break;
					}
					if ( 'end' === $a['action'] ) {
						$result['endingId'] = $a['to'];
						break;
					}
					self::apply( $a, $result['variables'], $visible, $required, $result['errors'] );
				}
				if ( $result['endingId'] ) {
					break;
				}
				$index = $next;
			}
			if ( ! $result['currentStepId'] && ! $result['endingId'] ) {
				$result['endingId'] = $default_ending;
			}
		}
		$keys = array_keys( $supplied );
		sort( $keys, SORT_STRING );
		foreach ( $keys as $key ) {
			$step = $by_key[ $key ] ?? null;
			$code = ! $step ? 'unknown_answer' : ( self::isDisplay( $step['type'] ) ? 'display_answer' : ( ! isset( $processed[ $key ] ) ? 'unvisited_answer' : null ) );
			if ( $code ) {
				$messages           = array(
					'unknown_answer'   => 'The answer key does not exist.',
					'display_answer'   => 'Display steps do not store answers.',
					'unvisited_answer' => 'Answers to unvisited steps are not accepted.',
				);
				$discard[ $key ]    = true;
				$result['errors'][] = Values::issue( '/answers/' . Values::pointer( $key ), $code, $messages[ $code ], $key );
			}
		}
		$result['discardedKeys'] = array_keys( $discard );
		sort( $result['discardedKeys'], SORT_STRING );
		if ( $result['endingId'] ) {
			$result['progress'] = 100;
		} elseif ( $result['currentStepId'] && ! in_array( 'cff_logic_loop', array_column( $result['errors'], 'code' ), true ) ) {
			$cursor          = $by_id[ $result['currentStepId'] ];
			$vars            = $result['variables'];
			$estimates       = array();
			$remaining       = 0;
			$estimate_errors = array();
			while ( $cursor < count( $steps ) ) {
				$s = $steps[ $cursor ];
				if ( isset( $estimates[ $s['id'] ] ) ) {
					break;
				}
				$estimates[ $s['id'] ] = true;
				if ( ! $visible[ $s['id'] ] ) {
					++$cursor;
					continue;
				}
				if ( ! self::isDisplay( $s['type'] ) && 'hidden' !== $s['type'] ) {
					++$remaining;
				}
				$next = $cursor + 1;
				$end  = false;
				foreach ( self::rulesFor( $s, $result['answers'] ) as $rule ) {
					if ( ! self::known( $rule['if'], $result['answers'] ) || ! Operators::evaluateCondition( $rule['if'], $result['answers'], $vars, $context ) ) {
						continue;
					}
					$a = $rule['then'];
					if ( 'jump' === $a['action'] ) {
						$next = $by_id[ $a['to'] ];
						break;
					}
					if ( 'end' === $a['action'] ) {
						$end = true;
						break;
					}
					self::apply( $a, $vars, $visible, $required, $estimate_errors );
				}
				if ( $end ) {
					break;
				}
				$cursor = $next;
			}
			$result['progress'] = min( 99, (int) floor( 100 * $answered_inputs / max( 1, $answered_inputs + $remaining ) ) );
		}
		return $result;
	}

	/** @param array<string,mixed> $step
	 *  @param array<string,mixed> $answers
	 *  @param array<string,mixed> $context
	 */
	public static function hiddenValue( array $step, array $answers, array $context ): mixed {
		$hidden = (array) ( $context['hidden'] ?? array() );
		if ( array_key_exists( $step['key'], $hidden ) ) {
			return $hidden[ $step['key'] ];
		}
		$source = $step['settings']['source'] ?? 'default';
		$key    = $step['settings']['sourceKey'] ?? $step['key'];
		if ( in_array( $source, array( 'url', 'meta' ), true ) ) {
			$values = (array) ( $context[ $source ] ?? array() );
			return array_key_exists( $key, $values ) ? $values[ $key ] : ( $step['defaultValue'] ?? null );
		}
		if ( 'merge' === $source ) {
			return Interpolator::interpolate( Interpolator::readable( $step['defaultValue'] ?? null ), $answers, (array) ( $context['meta'] ?? array() ) );
		}
		return 'cookie' === $source ? null : ( $step['defaultValue'] ?? null );
	}

	private static function isDisplay( string $type ): bool {
		return in_array( $type, array( 'statement', 'summary', 'media' ), true );
	}

	/** @param array<string,mixed> $s
	 *  @param array<string,mixed> $answers
	 *  @return list<array<string,mixed>>
	 */
	private static function rulesFor( array $s, array $answers ): array {
		$rules = $s['logic'] ?? array();
		foreach ( $s['options'] ?? array() as $option ) {
			$value = Values::choiceValue( $answers[ $s['key'] ] ?? null );
			if ( is_array( $value ) ? in_array( $option['value'], $value, true ) : $value === $option['value'] ) {
				$rules = array_merge( $rules, $option['logic'] ?? array() );
			}
		}
		return $rules;
	}

	/** @param array{action:'show'|'hide'|'jump'|'require'|'unrequire'|'end',to:string}|array{action:'set_variable',key:string,operation:'set'|'add'|'subtract',value:mixed} $a
	 *  @param array<string,mixed> $vars
	 *  @param array<string,bool> $visible
	 *  @param array<string,bool> $required
	 *  @param list<array{path:string,code:string,message:string,fieldKey?:string}> $errors
	 */
	private static function apply( array $a, array &$vars, array &$visible, array &$required, array &$errors ): void {
		if ( in_array( $a['action'], array( 'show', 'hide' ), true ) ) {
			$visible[ $a['to'] ] = 'show' === $a['action'];
		} elseif ( in_array( $a['action'], array( 'require', 'unrequire' ), true ) ) {
			$required[ $a['to'] ] = 'require' === $a['action'];
		} elseif ( 'set_variable' === $a['action'] ) {
			if ( 'set' === $a['operation'] ) {
				$vars[ $a['key'] ] = $a['value'];
			} elseif ( Values::numeric( $vars[ $a['key'] ] ?? null ) && Values::numeric( $a['value'] ) ) {
				$next = $vars[ $a['key'] ] + ( 'add' === $a['operation'] ? $a['value'] : -$a['value'] );
				if ( is_finite( (float) $next ) ) {
					$vars[ $a['key'] ] = $next;
				} else {
					$errors[] = Values::issue( '/variables/' . Values::pointer( $a['key'] ), 'invalid_variable', 'The variable value is not finite.' );
				}
			} else {
				$errors[] = Values::issue( '/variables/' . Values::pointer( $a['key'] ), 'invalid_variable', 'The variable action has an invalid type.' );
			}
		}
	}

	/** @param array<string,mixed> $c
	 *  @param array<string,mixed> $answers
	 */
	private static function known( array $c, array $answers ): bool {
		foreach ( array( 'all', 'any' ) as $group ) {
			if ( isset( $c[ $group ] ) ) {
				foreach ( $c[ $group ] as $child ) {
					if ( ! self::known( $child, $answers ) ) {
						return false;
					}
				}
				return true;
			}
		}
		return ( isset( $c['source'] ) && 'answer' !== $c['source'] ) || array_key_exists( $c['field'], $answers );
	}
}
