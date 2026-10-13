<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Security\TokenSigner;
use PHPUnit\Framework\TestCase;

final class TokenSignerTest extends TestCase {
	public function testShortLivedTokensArePurposeContextSiteAndExpiryBound(): void {
		$signer = new TokenSigner( str_repeat( 'k', 64 ), 1 );
		$token = $signer->issue( 'start', array( 'formId' => 42, 'version' => 1 ), 1000 );
		$this->assertNotNull( $signer->verify( $token, 'start', array( 'formId' => 42, 'version' => 1 ), 1001 ) );
		$this->assertNull( $signer->verify( $token, 'request', array(), 1001 ) );
		$this->assertNull( $signer->verify( $token, 'start', array( 'formId' => 43 ), 1001 ) );
		$this->assertNull( $signer->verify( $token, 'start', array(), 2500 ) );
		$this->assertNull( $signer->verify( $token, 'start', array(), 999 ) );
		$this->assertNull( $signer->verify( $token . 'x', 'start', array(), 1001 ) );
		$this->assertNull( ( new TokenSigner( str_repeat( 'k', 64 ), 2 ) )->verify( $token, 'start', array(), 1001 ) );
	}

	public function testResumeCredentialSurvivesRequestExpiryButNotThirtyDays(): void {
		$signer = new TokenSigner( str_repeat( 'k', 64 ), 1 );
		$token = $signer->issueResume( 1000 );
		$this->assertTrue( $signer->verifyResume( $token, 1000 + 2 * 86400 ) );
		$this->assertFalse( $signer->verifyResume( $token, 1000 + 30 * 86400 ) );
		$this->assertFalse( $signer->verifyResume( $token . 'x', 1001 ) );
		$this->assertFalse( ( new TokenSigner( str_repeat( 'k', 64 ), 2 ) )->verifyResume( $token, 1001 ) );
		$this->assertNotSame( $token, $signer->issueResume( 1000 ) );
	}

	public function testShortProtectionCannotBeIssuedForThirtyDays(): void {
		$this->expectException( \InvalidArgumentException::class );
		( new TokenSigner( str_repeat( 'k', 64 ), 1 ) )->issue( 'request', array(), 1000, 30 * 86400 );
	}
}
