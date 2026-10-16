<?php
/** Run with wp eval-file --skip-wordpress after prepare-release-site.php. */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	exit( 1 );
}
$root = realpath( WP_CLI::get_runner()->config['path'] );
if ( ! $root || ! str_ends_with( $root, '/wp-content/cff-release-test' ) ) {
	throw new RuntimeException( 'Refusing to install outside the isolated release fixture.' );
}
define( 'WP_INSTALLING', true );
require $root . '/wp-load.php';
if ( is_blog_installed() || ! preg_match( '/^cff_pkg_[a-f0-9]{8}_$/D', $GLOBALS['wpdb']->prefix ) ) {
	throw new RuntimeException( 'Fresh-prefix installation required.' );
}
require ABSPATH . 'wp-admin/includes/upgrade.php';
add_filter( 'pre_wp_mail', '__return_true' );
$installed = wp_install( 'Isolated release fixture', 'fixture', 'fixture@example.test', false, '', wp_generate_password( 64, true, true ) );
if ( empty( $installed['user_id'] ) || ! is_blog_installed() ) {
	throw new RuntimeException( 'Isolated release WordPress installation failed.' );
}
unset( $installed );
WP_CLI::success( 'Fresh isolated WordPress installed without logging a credential or sending mail.' );
