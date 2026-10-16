<?php
define( 'ABSPATH', dirname( __DIR__, 2 ) . '/' );
require dirname( __DIR__, 2 ) . '/vendor/autoload.php';
require dirname( __DIR__, 2 ) . '/autoload.php';
if ( ! defined( 'CFF_PRIVATE_DIR' ) ) {
	$private_dir = sys_get_temp_dir() . '/cff-unit-tests-' . bin2hex( random_bytes( 16 ) );
	if ( ! mkdir( $private_dir, 0700 ) ) {
		throw new RuntimeException( 'Cannot create isolated private test storage.' );
	}
	define( 'CFF_PRIVATE_DIR', $private_dir );
	register_shutdown_function( static function () use ( $private_dir ) {
		$files = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $private_dir, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
		foreach ( $files as $file ) {
			if ( $file->isDir() && ! $file->isLink() ) {
				rmdir( $file->getPathname() );
			} else {
				unlink( $file->getPathname() );
			}
		}
		rmdir( $private_dir );
	} );
}
