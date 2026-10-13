<?php
/** Production autoloader: never load unscoped Composer runtime dependencies. */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/vendor-prefixed/autoload.php';

spl_autoload_register(
	static function ( string $class_name ): void {
		$prefix = 'ChatFlow\\';
		if ( ! str_starts_with( $class_name, $prefix ) || str_starts_with( $class_name, 'ChatFlow\\Vendor\\' ) ) {
			return;
		}
		$path = __DIR__ . '/src/' . str_replace( '\\', '/', substr( $class_name, strlen( $prefix ) ) ) . '.php';
		if ( is_file( $path ) ) {
			require_once $path;
		}
	}
);
