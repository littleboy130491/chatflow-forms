<?php
$root = dirname( __DIR__, 2 );
$test_dir = getenv( 'WP_TESTS_DIR' ) ?: '/wordpress-phpunit';
putenv( 'CFF_UPLOAD_TEST_CONFIG=' . ( defined( 'WP_TESTS_CONFIG_FILE_PATH' ) ? WP_TESTS_CONFIG_FILE_PATH : $test_dir . '/wp-tests-config.php' ) );
if ( ! defined( 'CFF_PRIVATE_DIR' ) ) {
	$private_dir = sys_get_temp_dir() . '/cff-wp-tests-' . bin2hex( random_bytes( 16 ) );
	if ( ! mkdir( $private_dir, 0700 ) ) {
		throw new RuntimeException( 'Cannot create isolated private test storage.' );
	}
	define( 'CFF_PRIVATE_DIR', $private_dir );
	register_shutdown_function( static function () use ( $private_dir ) {
		$files = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $private_dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
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
define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $root . '/vendor/yoast/phpunit-polyfills' );
require $root . '/vendor/autoload.php';
require $test_dir . '/includes/functions.php';
tests_add_filter( 'muplugins_loaded', static function () use ( $root ) {
	require $root . '/chatflow-forms.php';
} );
require $test_dir . '/includes/bootstrap.php';
