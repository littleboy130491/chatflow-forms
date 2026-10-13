<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Updates\Updater;
use PHPUnit\Framework\TestCase;

final class UpdaterTest extends TestCase {
	public function testOnlyPackagedReleaseAssetsFromTheRightRepositoryAreAccepted(): void {
		foreach ( array( 'https://api.github.com/repos/littleboy130491/chatflow-forms/releases/assets/123', 'https://github.com/littleboy130491/chatflow-forms/releases/download/v0.1.0/chatflow-forms.zip' ) as $url ) {
			$update = (object) array( 'download_url' => $url );
			$this->assertSame( $update, Updater::filterUpdate( $update ) );
		}
		foreach ( array( 'https://github.com/littleboy130491/chatflow-forms/archive/v0.1.0.zip', 'https://api.github.com/repos/littleboy130491/chatflow-forms/zipball/v0.1.0', 'https://evil.invalid/releases/download/v0.1.0/chatflow-forms.zip', 'https://api.github.com/repos/another/plugin/releases/assets/123', 'http://github.com/littleboy130491/chatflow-forms/releases/download/v0.1.0/chatflow-forms.zip', '' ) as $url ) {
			$this->assertNull( Updater::filterUpdate( (object) array( 'download_url' => $url ) ) );
		}
		$this->assertNull( Updater::filterUpdate( null ) );
	}
}
