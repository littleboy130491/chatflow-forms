<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Privacy\PrivacyModule;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class ExportDownloadAccessTest extends TestCase {
	protected function setUp(): void {
		require __DIR__ . '/../../fixtures/export-download-wp.php';
		$GLOBALS['cff_download_hooks']        = array();
		$GLOBALS['cff_download_logged_in']    = false;
		$GLOBALS['cff_download_capable']      = false;
		$GLOBALS['cff_download_nonce']        = false;
		$GLOBALS['cff_download_nonce_checks'] = 0;
		( new PrivacyModule( new FormRepository() ) )->register();
	}

	public function testAnonymousDownloadExplicitlyDeniesWithoutInspectingPrivateData(): void {
		$callback = $GLOBALS['cff_download_hooks']['admin_post_nopriv_cff_download'] ?? null;
		self::assertIsCallable( $callback, 'Anonymous exports need an explicit denial rather than WordPress default HTTP 400.' );
		$query_with_credentials = array(
			'exportId' => 42,
			'ticket'   => 'private-ticket',
			'_wpnonce' => 'private-nonce',
		);
		foreach ( array( array(), $query_with_credentials ) as $query ) {
			$_GET = $query;
			$this->assertForbidden( $callback );
		}
		self::assertSame( 0, $GLOBALS['cff_download_nonce_checks'], 'Anonymous requests must not inspect nonces or query exports.' );
	}

	public function testLoggedInDownloadStillRequiresCapabilityAndNonce(): void {
		$callback                          = $GLOBALS['cff_download_hooks']['admin_post_cff_download'];
		$GLOBALS['cff_download_logged_in'] = true;
		$_GET                              = array(
			'exportId' => 42,
			'ticket'   => 'private-ticket',
			'_wpnonce' => 'private-nonce',
		);
		$this->assertForbidden( $callback );
		self::assertSame( 0, $GLOBALS['cff_download_nonce_checks'] );
		$GLOBALS['cff_download_capable'] = true;
		$this->assertForbidden( $callback );
		self::assertSame( 1, $GLOBALS['cff_download_nonce_checks'] );
	}

	private function assertForbidden( callable $callback ): void {
		ob_start();
		try {
			$callback();
			self::fail( 'Download must terminate with an explicit denial.' );
		} catch ( \RuntimeException $error ) {
			self::assertSame( 403, $error->getCode() );
			self::assertSame( 'Forbidden export download.', $error->getMessage() );
		} finally {
			self::assertSame( '', ob_get_clean(), 'No file bytes or credentials may be emitted.' );
		}
	}
}
