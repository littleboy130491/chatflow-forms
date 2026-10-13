<?php
namespace ChatFlow\Fields;

use ChatFlow\Logic\Values;

final class NumericScaleField extends AbstractField {

	public function __construct( private string $name ) {
		if ( ! in_array( $name, array( 'rating', 'scale', 'nps', 'slider' ), true ) ) {
			throw new \InvalidArgumentException( 'Unknown numeric scale.' );
		}
	}

	public function type(): string {
		return $this->name;
	}

	/** @param array<string,mixed> $step
	 * @return array{min:float,max:float,step:float} */
	public static function bounds( string $type, array $step ): array {
		$v = $step['validation'] ?? array();
		return array(
			'min'  => 'nps' === $type ? 0.0 : (float) ( $v['min'] ?? ( in_array( $type, array( 'rating', 'scale' ), true ) ? 1 : 0 ) ),
			'max'  => 'nps' === $type ? 10.0 : (float) ( $v['max'] ?? ( 'rating' === $type ? 5 : ( 'scale' === $type ? 10 : 100 ) ) ),
			'step' => 'slider' === $type ? (float) ( $v['step'] ?? 1 ) : 1.0,
		);
	}

	public function sanitize( mixed $value, array $step, array $context = array() ): mixed {
		return ( new NumberField() )->sanitize( $value, $step, $context );
	}

	public function validate( mixed $value, array $step, array $context = array() ): array {
		if ( null === $value ) {
			return ( $step['required'] ?? false ) ? array( Values::issue( '/answers/' . Values::pointer( $step['key'] ), 'required', 'An answer is required.', $step['key'] ) ) : array();
		}
		$code = null;
		$b    = self::bounds( $this->name, $step );
		if ( ! Values::numeric( $value ) ) {
			$code = 'type_mismatch';
		} elseif ( $value < $b['min'] ) {
			$code = 'min';
		} elseif ( $value > $b['max'] ) {
			$code = 'max';
		} elseif ( $b['step'] <= 0 || abs( ( $value - $b['min'] ) / $b['step'] - round( ( $value - $b['min'] ) / $b['step'] ) ) > 1e-8 || ( 'slider' !== $this->name && floor( $value ) !== (float) $value ) ) {
			$code = 'step';
		}
		return $code ? array( Values::issue( '/answers/' . Values::pointer( $step['key'] ), $code, 'Enter a configured scale value.', $step['key'] ) ) : array();
	}
}
