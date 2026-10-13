<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Fields\Registry;
use PHPUnit\Framework\TestCase;

final class EngagementFieldsTest extends TestCase {
	private function field( string $type ): \ChatFlow\Fields\FieldType {
		foreach ( Registry::engagementFields() as $field ) {
			if ( $field->type() === $type ) {
				return $field; }
		}
		throw new \LogicException( 'Unknown test field.' );
	}
	public function testAllScaleTypesValidateNumericBoundsAndRequiredWithoutCoercingBooleans(): void {
		foreach ( array(
			'rating' => 5,
			'scale'  => 10,
			'nps'    => 10,
			'slider' => 100,
		) as $name => $max ) {
			$field = $this->field( $name );
			$step  = array(
				'key'      => 'value',
				'required' => true,
			);
			self::assertSame( array(), $field->validate( $max, $step ) );
			self::assertSame( 'required', $field->validate( null, $step )[0]['code'] );
			self::assertSame( 'type_mismatch', $field->validate( true, $step )[0]['code'] );
			self::assertSame( 'max', $field->validate( $max + 1, $step )[0]['code'] );
			self::assertSame( 'min', $field->validate( -1, $step )[0]['code'] );
			self::assertSame( array(), $field->validate( $field->sanitize( (string) $max, $step ), $step ) );
			self::assertNotEmpty( $field->validate( INF, $step ) );
		}
	}
	public function testIntegerAndSliderIncrements(): void {
		self::assertSame( 'step', $this->field( 'rating' )->validate( 2.5, array( 'key' => 'r' ) )[0]['code'] );
		$step = array(
			'key'        => 's',
			'validation' => array(
				'min'  => 0.1,
				'max'  => 1,
				'step' => 0.2,
			),
		);
		self::assertSame( array(), $this->field( 'slider' )->validate( 0.3, $step ) );
		self::assertSame( 'step', $this->field( 'slider' )->validate( 0.4, $step )[0]['code'] );
		self::assertSame(
			'max',
			$this->field( 'nps' )->validate(
				11,
				array(
					'key'        => 'n',
					'validation' => array( 'max' => 100 ),
				)
			)[0]['code']
		);
	}
	public function testAddressStrictKeysRequiredAndTextSanitization(): void {
		$field = $this->field( 'address' );
		$step  = array(
			'key'      => 'address',
			'required' => true,
			'settings' => array( 'addressFields' => array( 'city', 'postcode' ) ),
		);
		$value = $field->sanitize(
			(object) array(
				'city'     => '<b>Jakarta</b>',
				'postcode' => '12345',
			),
			$step
		);
		self::assertSame( 'Jakarta', $value->city );
		self::assertSame( array(), $field->validate( $value, $step ) );
		self::assertSame(
			'type_mismatch',
			$field->validate(
				array(
					'city'   => 'Jakarta',
					'secret' => 'forged',
				),
				$step
			)[0]['code']
		);
		self::assertSame( 'required', $field->validate( (object) array( 'city' => 'Jakarta' ), $step )[0]['code'] );
		self::assertSame(
			'max_length',
			$field->validate(
				(object) array(
					'city'     => str_repeat( 'a', 501 ),
					'postcode' => '123',
				),
				$step
			)[0]['code']
		);
		self::assertSame( 'type_mismatch', $field->validate( array( 'list' ), $step )[0]['code'] );
	}
	public function testUploadIsOnlyOpaqueUuidAndMediaIsDisplayOnly(): void {
		$field = $this->field( 'file_upload' );
		$step  = array(
			'key'      => 'file',
			'required' => true,
		);
		self::assertSame( array(), $field->validate( 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', $step ) );
		foreach ( array( '../../file', array( 'uploadId' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' ), 'https://example.test/upload.bin' ) as $value ) {
			self::assertSame( 'type_mismatch', $field->validate( $value, $step )[0]['code'] ); }
		self::assertSame( 'required', $field->validate( null, $step )[0]['code'] );
		self::assertNull( $this->field( 'media' )->sanitize( 'forged', $step ) );
		self::assertSame( array(), $this->field( 'media' )->validate( null, $step ) );
		self::assertNotContains( 'file_upload', ( new Registry() )->types() );
	}
}
