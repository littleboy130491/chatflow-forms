<?php
namespace ChatFlow\Logic;

final class PowerDiagnostics {
	/** @param array<string,mixed> $schema
	 * @return list<array{path:string,code:string,message:string}> */
	public static function diagnose( array $schema ): array {
		$errors    = array();
		$add       = static function ( string $path, string $message ) use ( &$errors ): void {
			$errors[] = Values::issue( $path, 'invalid_power', $message );
		};
		$nodes     = array_merge( array_column( $schema['steps'], 'id' ), array_column( $schema['endings'], 'id' ) );
		$positions = array();
		foreach ( $schema['flowPositions'] ?? array() as $i => $pos ) {
			if ( ! in_array( $pos['id'], $nodes, true ) || isset( $positions[ $pos['id'] ] ) ) {
				$add( '/flowPositions/' . $i, 'Graph positions must reference unique existing nodes.' ); }
			$positions[ $pos['id'] ] = true;
		}
		$steps     = array_column( $schema['steps'], null, 'key' );
		$positions = array_flip( array_column( $schema['steps'], 'key' ) );
		$variables = array_column( $schema['variables'] ?? array(), 'type', 'key' );
		foreach ( $schema['variables'] ?? array() as $i => $v ) {
			if ( Values::numeric( $v['default'] ) && abs( $v['default'] ) > Calculation::LIMIT ) {
				$add( '/variables/' . $i, 'Numeric variables are limited to +/- 1e12.' ); }
		}
		foreach ( $schema['steps'] as $i => $s ) {
			$rules = $s['logic'] ?? array();
			foreach ( $s['options'] ?? array() as $o ) {
				$rules = array_merge( $rules, $o['logic'] ?? array() ); }
			foreach ( $rules as $rule ) {
				if ( 'set_variable' === $rule['then']['action'] && Values::numeric( $rule['then']['value'] ) && abs( $rule['then']['value'] ) > Calculation::LIMIT ) {
					$add( '/steps/' . $i . '/logic', 'Numeric variables are limited to +/- 1e12.' ); }
			}
			if ( 'calculated' !== $s['type'] ) {
				continue; }
			$path = '/steps/' . $i . '/settings/expression';
			try {
				foreach ( Calculation::references( $s['settings']['expression'] ?? '' ) as $ref ) {
					if ( 'variable' === $ref['source'] ) {
						if ( 'number' !== ( $variables[ $ref['key'] ] ?? null ) ) {
							$add( $path, 'Calculations reference numeric variables only.' ); }
					} elseif ( ! isset( $steps[ $ref['key'] ] ) || $positions[ $ref['key'] ] >= $i || ! in_array( $steps[ $ref['key'] ]['type'], array( 'number', 'rating', 'scale', 'nps', 'slider', 'calculated' ), true ) ) {
						$add( $path, 'Calculations reference earlier numeric answers only.' ); }
				}
			} catch ( \InvalidArgumentException $e ) {
				$add( $path, 'Use bounded arithmetic with answer.key or variable.key.' ); }
		}
		$check = static function ( array $condition, string $path, int $depth = 0 ) use ( &$check, $steps, $variables, $add ): void {
			if ( $depth > 16 ) {
				$add( $path, 'Outcome conditions may nest at most 16 levels.' );
				return; }
			if ( isset( $condition['all'] ) || isset( $condition['any'] ) ) {
				foreach ( $condition['all'] ?? $condition['any'] as $child ) {
					$check( $child, $path, $depth + 1 ); }
			} elseif ( ( 'answer' === ( $condition['source'] ?? 'answer' ) ) ? ! isset( $steps[ $condition['field'] ] ) : ( 'variable' === $condition['source'] && ! isset( $variables[ $condition['field'] ] ) ) ) {
				$add( $path, 'Outcome references a missing answer or variable.' ); }
		};
		foreach ( $schema['outcomes'] ?? array() as $i => $o ) {
			if ( ! in_array( $o['endingId'], array_column( $schema['endings'], 'id' ), true ) ) {
				$add( '/outcomes/' . $i, 'Outcome references a missing ending.' ); }
			$check( $o['if'], '/outcomes/' . $i . '/if' );
		}
		$experiment_ids = array();
		foreach ( $schema['experiments'] ?? array() as $i => $e ) {
			if ( isset( $experiment_ids[ $e['id'] ] ) ) {
				$add( '/experiments/' . $i, 'Experiment IDs must be unique.' );
			} $experiment_ids[ $e['id'] ] = true;
			$ids                          = array();
			foreach ( $e['variants'] as $j => $v ) {
				$path = '/experiments/' . $i . '/variants/' . $j;
				if ( isset( $ids[ $v['id'] ] ) ) {
					$add( $path, 'Variant IDs must be unique.' );
				} $ids[ $v['id'] ] = true;
				$copies            = array();
				foreach ( $v['copy'] ?? array() as $copy ) {
					if ( ! in_array( $copy['stepId'], array_column( $schema['steps'], 'id' ), true ) || isset( $copies[ $copy['stepId'] ] ) ) {
						$add( $path, 'Copy references must be unique existing steps.' );
					} $copies[ $copy['stepId'] ] = true; }
				if ( ! isset( $v['stepOrder'] ) ) {
					continue; }
				$targets = array();
				foreach ( $schema['steps'] as $node ) {
					foreach ( $node['logic'] ?? array() as $rule ) {
						if ( 'jump' === $rule['then']['action'] ) {
							$targets[ $rule['then']['to'] ] = true;
						}
					} foreach ( $node['options'] ?? array() as $option ) {
						foreach ( $option['logic'] ?? array() as $rule ) {
							if ( 'jump' === $rule['then']['action'] ) {
											$targets[ $rule['then']['to'] ] = true; }
						}
					}
				}
				foreach ( $schema['steps'] as $index => $s ) {
					$has_rules = ! empty( $s['logic'] );
					foreach ( $s['options'] ?? array() as $o ) {
						$has_rules = $has_rules || ! empty( $o['logic'] ); }
					if ( $has_rules || ( $s['hiddenByDefault'] ?? false ) || isset( $targets[ $s['id'] ] ) || in_array( $s['type'], array( 'hidden', 'summary', 'calculated' ), true ) ) {
						if ( ( $v['stepOrder'][ $index ] ?? null ) !== $s['id'] ) {
							$add( $path, 'Order variants must keep branching, hidden, summary and calculated steps fixed.' ); }
						if ( array_diff( array_slice( $v['stepOrder'], 0, $index ), array_column( array_slice( $schema['steps'], 0, $index ), 'id' ) ) ) {
							$add( $path, 'Order variants cannot cross a dependency boundary.' ); }
					}
				}
				try {
					Experiments::applyVariant( $schema, $v );
				} catch ( \InvalidArgumentException $e ) {
					$add( $path, 'Step order must be an exact permutation of all steps.' ); }
			}
		}
		return $errors;
	}
}
