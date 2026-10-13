<?php
namespace ChatFlow\Fields;

final class Registry {
	/** @var array<string,FieldType> */
	private array $fields = array();

	public function __construct() {
		$fields = array( new ShortTextField(), new LongTextField(), new EmailField(), new PhoneField(), new NumberField(), new DateField(), new SingleChoiceField(), new MultiChoiceField(), new YesNoField(), new ConsentField(), new HiddenField(), new StatementField(), new SummaryField() );
		if ( function_exists( 'apply_filters' ) ) {
			$fields = apply_filters( 'cff_field_types', $fields );
		}
		if ( ! is_array( $fields ) ) {
			throw new \UnexpectedValueException( 'cff_field_types must return FieldType instances.' );
		}
		foreach ( $fields as $field ) {
			if ( ! $field instanceof FieldType ) {
				throw new \UnexpectedValueException( 'cff_field_types must return FieldType instances.' );
			}
			$this->register( $field );
		}
	}

	public function register( FieldType $type ): void {
		$name = $type->type();
		if ( ! preg_match( '/^[a-z][a-z0-9_]{0,63}$/D', $name ) ) {
			throw new \InvalidArgumentException( 'Invalid field type name.' );
		}
		$this->fields[ $name ] = $type;
	}

	public function get( string $type ): FieldType {
		if ( ! isset( $this->fields[ $type ] ) ) {
			throw new \InvalidArgumentException( 'Unknown or unsupported field type.' );
		}
		return $this->fields[ $type ];
	}

	/** @return list<string> */
	public function types(): array {
		return array_keys( $this->fields );
	}
}
