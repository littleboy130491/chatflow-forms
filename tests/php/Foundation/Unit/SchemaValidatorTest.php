<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Forms\SchemaValidator;
use PHPUnit\Framework\TestCase;

final class SchemaValidatorTest extends TestCase {
	public function testSharedStructuralFixtures(): void {
		$fixtures = json_decode( file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/schema.json' ), true, 512, JSON_THROW_ON_ERROR );
		$v = new SchemaValidator();
		foreach ( $fixtures as $fixture ) {
			$this->assertSame( $fixture['valid'], array() === $v->validate( $fixture['schema'] ), $fixture['name'] );
			$this->assertSame( $fixture['publishable'], array() === $v->validatePublishable( $fixture['schema'] ), $fixture['name'] );
		}
	}

	public function testDuplicateIdsBrokenReferencesAndInvalidRanges(): void {
		$fixture = json_decode( file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/schema.json' ), true, 512, JSON_THROW_ON_ERROR )[0]['schema'];
		$fixture['steps'][] = $fixture['steps'][0];
		$fixture['steps'][0]['logic'] = array( array( 'if' => array( 'field' => 'deleted', 'op' => 'eq', 'value' => 'x' ), 'then' => array( 'action' => 'jump', 'to' => 'missing' ) ) );
		$fixture['steps'][0]['validation'] = array( 'minLength' => 20, 'maxLength' => 10 );
		$codes = array_column( ( new SchemaValidator() )->validate( $fixture ), 'code' );
		$this->assertContains( 'duplicate', $codes );
		$this->assertContains( 'unknown_target', $codes );
		$this->assertContains( 'unknown_field', $codes );
		$this->assertContains( 'invalid_range', $codes );
	}

	public function testPrivateSettingsAreStrictAndDefaultEndingMustExist(): void {
		$v = new SchemaValidator();
		$this->assertSame( array(), $v->validateSettings( array() ) );
		$this->assertNotEmpty( $v->validateSettings( array( 'githubToken' => 'not-a-secret' ) ) );
		$schema = json_decode( file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/schema.json' ), true, 512, JSON_THROW_ON_ERROR )[0]['schema'];
		$this->assertNotEmpty( $v->validateSettings( array( 'completion' => array( 'defaultEndingId' => 'missing' ) ), $schema ) );
	}
}
