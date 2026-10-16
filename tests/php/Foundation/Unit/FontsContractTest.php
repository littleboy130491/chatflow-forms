<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Forms\SchemaValidator;
use PHPUnit\Framework\TestCase;

final class FontsContractTest extends TestCase {
	public function testSharedSettingsFontFixturesAndMirroredAppearanceDefinitions(): void {
		$root = dirname( __DIR__, 4 );
		$fixtures = json_decode( file_get_contents( $root . '/tests/fixtures/fonts.json' ), true, 512, JSON_THROW_ON_ERROR );
		foreach ( $fixtures as $fixture ) {
			$errors = ( new SchemaValidator() )->validateSettings( array( 'appearance' => (object) $fixture['appearance'] ) );
			self::assertSame( $fixture['valid'], ! $errors, $fixture['name'] );
		}
		$form = json_decode( file_get_contents( $root . '/schema/form.schema.json' ), true );
		$settings = json_decode( file_get_contents( $root . '/schema/settings.schema.json' ), true );
		self::assertSame( $form['$defs']['appearance'], $settings['$defs']['appearance'] );
	}
}
