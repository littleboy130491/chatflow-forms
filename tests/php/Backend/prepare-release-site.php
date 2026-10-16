<?php
/** wp-env only: prepare a fresh-prefix WordPress core with the actual release ZIP. */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI || '/var/www/html/' !== ABSPATH ) {
	exit( 1 );
}
$root = WP_CONTENT_DIR . '/cff-release-test';
if ( file_exists( $root ) ) {
	throw new RuntimeException( 'Isolated release site already exists; refusing to overwrite it.' );
}
mkdir( $root, 0700 );
$copy = static function ( string $source, string $destination ) use ( &$copy ): void {
	if ( is_link( $source ) ) {
		throw new RuntimeException( 'Unexpected symlink in release fixture.' );
	}
	if ( is_dir( $source ) ) {
		mkdir( $destination, 0755 );
		foreach ( new DirectoryIterator( $source ) as $file ) {
			if ( ! $file->isDot() ) $copy( $file->getPathname(), $destination . '/' . $file->getFilename() );
		}
	} elseif ( ! copy( $source, $destination ) ) {
		throw new RuntimeException( 'Cannot copy WordPress core for release fixture.' );
	}
};
foreach ( new DirectoryIterator( ABSPATH ) as $file ) {
	$name = $file->getFilename();
	if ( in_array( $name, array( 'wp-admin', 'wp-includes' ), true ) || ( $file->isFile() && str_ends_with( $name, '.php' ) && 'wp-config.php' !== $name ) ) {
		$copy( $file->getPathname(), $root . '/' . $name );
	}
}
$config = file_get_contents( ABSPATH . 'wp-config.php' );
$prefix = 'cff_pkg_' . bin2hex( random_bytes( 4 ) ) . '_';
$config = preg_replace( '/\$table_prefix\s*=\s*[^;]+;/', '\$table_prefix = "' . $prefix . '";', $config, 1, $count );
if ( 1 !== $count ) throw new RuntimeException( 'WordPress prefix fixture could not be isolated.' );
file_put_contents( $root . '/wp-config.php', $config ); chmod( $root . '/wp-config.php', 0600 );
mkdir( $root . '/wp-content', 0755 ); mkdir( $root . '/wp-content/plugins', 0755 );
( new PharData( WP_PLUGIN_DIR . '/chatflow-forms/build/chatflow-forms.zip' ) )->extractTo( $root . '/wp-content/plugins' );
WP_CLI::success( 'Prepared isolated core and actual ZIP with a fresh table prefix.' );
