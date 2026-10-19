<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Support\Assets;
use PHPUnit\Framework\TestCase;

final class PackagedAssetCacheVersionTest extends TestCase {
	public function testContentChangesInvalidateWithoutPluginVersionChanges(): void {
		self::assertTrue( class_exists( Assets::class ), 'Packaged assets need a content version helper.' );
		$file = tempnam( sys_get_temp_dir(), 'cff-asset-' );
		self::assertNotFalse( $file );
		try {
			file_put_contents( $file, 'first' );
			$first = Assets::version( $file );
			self::assertSame( substr( hash( 'sha256', 'first' ), 0, 16 ), $first );
			self::assertSame( $first, Assets::version( $file ) );
			touch( $file, 1000000000 );
			self::assertSame( $first, Assets::version( $file ), 'Timestamps must not affect content versions.' );
			file_put_contents( $file, 'other' );
			touch( $file, 1000000000 );
			self::assertNotSame( $first, Assets::version( $file ), 'Same-length content and mtime still invalidate.' );
		} finally {
			unlink( $file );
		}
	}

	public function testMissingFileFallsBackWithoutExposingItsPath(): void {
		self::assertTrue( class_exists( Assets::class ), 'Packaged assets need a content version helper.' );
		if ( ! defined( 'CFF_VERSION' ) ) {
			define( 'CFF_VERSION', '0.1.0' );
		}
		$missing = sys_get_temp_dir() . '/cff-missing-' . bin2hex( random_bytes( 16 ) );
		self::assertSame( CFF_VERSION, Assets::version( $missing ) );
		self::assertSame( CFF_VERSION, Assets::version( sys_get_temp_dir() ) );
	}
}
