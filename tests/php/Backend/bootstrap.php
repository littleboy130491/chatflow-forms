<?php
$root = getenv( 'CFF_BACKEND_WP_ROOT' );
if ( ! $root || ! is_file( $root . '/wp-load.php' ) ) {
	throw new RuntimeException( 'CFF_BACKEND_WP_ROOT must point to an installed isolated test WordPress.' ); }
require $root . '/wp-load.php';
if ( ! str_contains( DB_NAME, 'test' ) ) {
	throw new RuntimeException( 'Backend checks refuse a non-test database.' ); }
$repo = dirname( __DIR__, 3 );
require $repo . '/vendor/autoload.php';
foreach ( array(
	'CFF_PATH'    => $repo . '/',
	'CFF_FILE'    => $repo . '/chatflow-forms.php',
	'CFF_VERSION' => '0.1.0',
) as $key => $value ) {
	if ( ! defined( $key ) ) {
		define( $key, $value ); }
}
if ( ! class_exists( \ChatFlow\Vendor\Opis\JsonSchema\Validator::class ) ) {
	require $repo . '/autoload.php';
}
$dependencies = getenv( 'CFF_BACKEND_DEPENDENCIES' );
if ( $dependencies ) {
	spl_autoload_register(
		static function ( string $class_name ) use ( $dependencies ) {
			if ( ! preg_match( '/^ChatFlow\\\\(?:Fields|Logic|Integrations|Notifications)\\\\/', $class_name ) ) {
				return; }
			$path = $dependencies . '/src/' . str_replace( '\\', '/', substr( $class_name, 9 ) ) . '.php';
			if ( is_file( $path ) ) {
				require_once $path; }
		}
	);
}
$private = getenv( 'CFF_BACKEND_PRIVATE_DIR' );
if ( $private && ! defined( 'CFF_PRIVATE_DIR' ) ) {
	define( 'CFF_PRIVATE_DIR', $private ); }
( new ChatFlow\Forms\FormPostType() )->register();
ChatFlow\Install\Installer::migrate();
ChatFlow\Install\Installer::activate();
