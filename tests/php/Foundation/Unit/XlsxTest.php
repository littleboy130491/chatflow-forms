<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Privacy\PrivateFiles;
use ChatFlow\Submissions\Xlsx;
use PHPUnit\Framework\TestCase;

final class XlsxTest extends TestCase {
	public function testRealScopedWriterUnicodeFormulaSafetyAndPrivateAtomicConversion(): void {
		if ( ! Xlsx::available() || ! defined( 'CFF_PRIVATE_DIR' ) ) {
			$this->markTestSkipped( 'Requires scoped OpenSpout, XML/ZIP, and an externally configured private test directory.' );
		}
		$files = new PrivateFiles();
		$key   = 'export-' . bin2hex( random_bytes( 32 ) ) . '.bin';
		$path  = $files->path( $key );
		try {
			file_put_contents( $path, "\xEF\xBB\xBFName,Answer\r\nNama,\"'\"\"=1+1\"\r\n日本語,Indonesia\r\n" );
			Xlsx::convert( $key, ',' );
			$zip = new \ZipArchive();
			self::assertTrue( $zip->open( $path ) );
			$sheet = $zip->getFromName( 'xl/worksheets/sheet1.xml' );
			self::assertIsString( $sheet );
			self::assertStringContainsString( 'Name', $sheet );
			self::assertStringContainsString( '日本語', $sheet );
			self::assertStringNotContainsString( '<f>', $sheet );
			$zip->close();
			self::assertFileDoesNotExist( $files->path( Xlsx::temporaryKey( $key ) ) );
			self::assertSame( 0600, fileperms( $path ) & 0777 );
			self::assertDirectoryDoesNotExist( $path . '.work' );
		} finally {
			$files->remove( $key );
			$files->remove( Xlsx::temporaryKey( $key ) );
		}
	}
}
