<?php
/**
 * Plugin Name: ChatFlow Forms
 * Description: Private conversational questionnaires. Foundation build; visitor/builder modules are not yet enabled.
 * Version: 0.1.0
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Author: Imajiner
 * License: GPL-3.0-or-later
 * Text Domain: chatflow-forms
 * Domain Path: /languages
 */

defined( 'ABSPATH' ) || exit;

define( 'CFF_VERSION', '0.1.0' );
define( 'CFF_FILE', __FILE__ );
define( 'CFF_PATH', __DIR__ . '/' );

if ( version_compare( PHP_VERSION, '8.1', '<' ) || version_compare( get_bloginfo( 'version' ), '6.4', '<' ) ) {
	add_action(
		'admin_notices',
		static function () {
			echo '<div class="notice notice-error"><p>' . esc_html__( 'ChatFlow Forms requires PHP 8.1 and WordPress 6.4 or newer.', 'chatflow-forms' ) . '</p></div>';
		}
	);
	return;
}

if ( ! is_file( CFF_PATH . 'vendor-prefixed/autoload.php' ) || ! is_file( CFF_PATH . 'vendor/woocommerce/action-scheduler/action-scheduler.php' ) ) {
	add_action(
		'admin_notices',
		static function () {
			echo '<div class="notice notice-error"><p>' . esc_html__( 'ChatFlow Forms dependencies are missing. Install a release zip or run the documented development setup.', 'chatflow-forms' ) . '</p></div>';
		}
	);
	return;
}

require_once CFF_PATH . 'autoload.php';
// Action Scheduler intentionally participates in its official shared version arbitration.
require_once CFF_PATH . 'vendor/woocommerce/action-scheduler/action-scheduler.php';

register_activation_hook( __FILE__, array( \ChatFlow\Install\Installer::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( \ChatFlow\Install\Installer::class, 'deactivate' ) );
add_action(
	'plugins_loaded',
	static function () {
		( new \ChatFlow\Plugin() )->register();
	}
);
