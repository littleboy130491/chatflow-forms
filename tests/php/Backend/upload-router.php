<?php
// Isolated loopback HTTP fixture: required to exercise PHP's genuine multipart provenance.
if ( 'cli-server' !== PHP_SAPI || ! in_array( $_SERVER['REMOTE_ADDR'] ?? '', array( '127.0.0.1', '::1' ), true ) ) {
	http_response_code( 403 );
	exit;
}
require __DIR__ . '/bootstrap.php';
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
