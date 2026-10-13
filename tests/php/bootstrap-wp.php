<?php
$root = dirname( __DIR__, 2 );
$test_dir = getenv( 'WP_TESTS_DIR' ) ?: '/wordpress-phpunit';
define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $root . '/vendor/yoast/phpunit-polyfills' );
require $root . '/vendor/autoload.php';
require $test_dir . '/includes/functions.php';
tests_add_filter( 'muplugins_loaded', static function () use ( $root ) {
	require $root . '/chatflow-forms.php';
} );
require $test_dir . '/includes/bootstrap.php';
