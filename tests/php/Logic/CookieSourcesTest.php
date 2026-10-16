<?php
namespace ChatFlow\Tests\Logic;
use ChatFlow\Security\CookieSources;
use ChatFlow\Logic\Diagnostics;
use ChatFlow\Forms\SchemaValidator;
use PHPUnit\Framework\TestCase;
final class CookieSourcesTest extends TestCase {
	public function testSharedCookiePolicyAndDiagnostics(): void {
		$cases = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/cookie-sources.json' ), true );
		foreach ( $cases as $case ) {
			self::assertSame( $case['allowed'], CookieSources::allows( $case['name'] ) );
			$schema = array( 'schemaVersion' => 1, 'bot' => array( 'name' => 'Test' ), 'steps' => array( array( 'id' => 'cookie', 'key' => 'cookie', 'label' => 'Cookie', 'type' => 'hidden', 'messages' => array(), 'settings' => array( 'source' => 'cookie', 'sourceKey' => $case['name'] ) ) ), 'endings' => array( array( 'id' => 'done', 'type' => 'message', 'messages' => array( 'Done' ) ) ) );
			self::assertSame( $case['allowed'], ! Diagnostics::diagnoseSchema( $schema ) );
			self::assertSame( $case['allowed'], ! ( new SchemaValidator() )->validate( $schema ) );
		}
	}
}
