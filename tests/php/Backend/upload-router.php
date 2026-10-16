<?php
// Isolated loopback HTTP fixture: required to exercise PHP's genuine multipart provenance.
if ( 'cli-server' !== PHP_SAPI || ! in_array( $_SERVER['REMOTE_ADDR'] ?? '', array( '127.0.0.1', '::1' ), true ) ) {
	http_response_code( 403 );
	exit;
}
if ( getenv( 'CFF_BACKEND_WP_ROOT' ) ) {
	require __DIR__ . '/bootstrap.php';
} else {
	$config = getenv( 'CFF_UPLOAD_TEST_CONFIG' );
	$prefix = getenv( 'CFF_UPLOAD_TEST_PREFIX' );
	if ( ! $config || ! is_file( $config ) || 'wp-tests-config.php' !== basename( $config ) || ! $prefix || ! preg_match( '/^[a-zA-Z0-9_]+$/D', $prefix ) ) {
		throw new RuntimeException( 'Multipart fixture requires the isolated WordPress test configuration.' );
	}
	define( 'CFF_PRIVATE_DIR', getenv( 'CFF_UPLOAD_TEST_PRIVATE' ) );
	require $config;
	$table_prefix = $prefix;
	if ( getenv( 'CFF_UPLOAD_TEST_MULTISITE' ) ) {
		define( 'MULTISITE', true );
		define( 'SUBDOMAIN_INSTALL', false );
		define( 'DOMAIN_CURRENT_SITE', WP_TESTS_DOMAIN );
		define( 'PATH_CURRENT_SITE', '/' );
		define( 'SITE_ID_CURRENT_SITE', 1 );
		define( 'BLOG_ID_CURRENT_SITE', 1 );
	}
	$_SERVER['HTTP_HOST'] = WP_TESTS_DOMAIN;
	require ABSPATH . 'wp-settings.php';
	require_once dirname( __DIR__, 3 ) . '/chatflow-forms.php';
}
if ( '/ready' === ( $_SERVER['REQUEST_URI'] ?? '' ) ) {
	echo 'ready';
	return; }
add_action(
	'rest_api_init',
	static function () {
		( new \ChatFlow\Rest\UploadController() )->register();
	}
);
$server = rest_get_server();
$server->serve_request( wp_parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ) );
