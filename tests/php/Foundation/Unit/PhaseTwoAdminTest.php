<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Admin\Translations;
use ChatFlow\Analytics\DateRange;
use ChatFlow\Analytics\Report;
use ChatFlow\Forms\SchemaValidator;
use ChatFlow\Rest\TemplatesController;
use PHPUnit\Framework\TestCase;

final class PhaseTwoAdminTest extends TestCase {
	public function testDateBoundsRespectTimezoneAndDaylightSaving(): void {
		$range = DateRange::bounds( '2026-03-08', '2026-03-08', new \DateTimeZone( 'America/New_York' ) );
		self::assertSame( '2026-03-08 05:00:00', $range['start'] );
		self::assertSame( '2026-03-09 04:00:00', $range['end'] );
	}
	/** @dataProvider invalidDates */
	public function testInvalidDatesFailClosed( string $from, string $to ): void {
		$this->expectException( \InvalidArgumentException::class );
		DateRange::bounds( $from, $to, new \DateTimeZone( 'UTC' ) );
	}
	public function invalidDates(): array {
		return array( array( '2026-02-30', '2026-03-01' ), array( '2026-03-01', '2026-02-28' ), array( '2025-01-01', '2026-12-31' ), array( '2026-1-1', '2026-01-02' ), array( "2026-01-01' OR 1=1", '2026-01-02' ) );
	}
	public function testChoiceDistributionsExcludeOtherFreeTextAndDeduplicate(): void {
		self::assertSame(
			array( 'other' ),
			Report::choiceValues(
				array(
					'value' => 'other',
					'other' => 'private respondent comment',
				)
			)
		);
		self::assertSame( array( 'a', 'b' ), Report::choiceValues( array( 'a', 'b', 'a' ) ) );
		self::assertSame( array( 'false' ), Report::choiceValues( false ) );
	}
	public function testTemplateSettingsNeverCarryCredentialHeadersOrLiveWebhooks(): void {
		$original = array(
			'integrations' => array(
				'webhooks' => array(
					array(
						'enabled' => true,
						'secret'  => 'fixture-secret',
						'headers' => array( 'Authorization' => 'fixture-token' ),
					),
				),
			),
			'appearance'   => array( 'confetti' => false ),
		);
		$copy     = TemplatesController::safeSettings( $original );
		self::assertTrue( $original['integrations']['webhooks'][0]['enabled'] );
		self::assertFalse( $copy['integrations']['webhooks'][0]['enabled'] );
		self::assertSame( '', $copy['integrations']['webhooks'][0]['secret'] );
		self::assertSame( array(), $copy['integrations']['webhooks'][0]['headers'] );
	}
	public function testConfettiIsStrictBooleanInBothContracts(): void {
		$validator = new SchemaValidator();
		self::assertSame( array(), $validator->validateSettings( array( 'appearance' => array( 'confetti' => false ) ) ) );
		self::assertNotEmpty( $validator->validateSettings( array( 'appearance' => array( 'confetti' => 'yes' ) ) ) );
	}
	public function testTranslationOnlyChangesPresentationAndPreservesMergeTags(): void {
		$schema                         = json_decode( file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/schema.json' ), true )[0]['schema'];
		$schema['steps'][0]['messages'] = array( 'Hello {{name}}' );
		$display                        = array(
			'schema'  => $schema,
			'phrases' => array( 'continue' => 'Continue' ),
		);
		$result                         = Translations::copy( $display, static fn( $name, $value ) => 'Translated ' . $value );
		self::assertSame( $schema['steps'][0]['id'], $result['schema']['steps'][0]['id'] );
		self::assertSame( $schema['steps'][0]['key'], $result['schema']['steps'][0]['key'] );
		self::assertSame( 'Translated Hello {{name}}', $result['schema']['steps'][0]['messages'][0] );
		$invalid = Translations::copy( $display, static fn() => 'Hello {{wrong}}' );
		self::assertSame( 'Hello {{name}}', $invalid['schema']['steps'][0]['messages'][0] );
		self::assertSame( $schema, $display['schema'] );
	}
}
