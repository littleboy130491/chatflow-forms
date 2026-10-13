<?php
namespace ChatFlow;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormPostType;
use ChatFlow\Install\Installer;
use ChatFlow\Updates\Updater;

final class Plugin implements Module {
	public function register(): void {
		add_action( 'init', array( new FormPostType(), 'register' ) );
		add_action( 'init', array( Installer::class, 'maybeUpgrade' ), 5 );
		add_action(
			'init',
			static function (): void {
				load_plugin_textdomain( 'chatflow-forms', false, dirname( plugin_basename( CFF_FILE ) ) . '/languages' );
			}
		);
		add_action( 'wp_initialize_site', array( Installer::class, 'initializeSite' ), 200 );
		add_action( 'wp_uninitialize_site', array( Installer::class, 'uninitializeSite' ) );
		( new Updater() )->register();
		/** @var list<mixed> $modules */
		$modules = apply_filters( 'cff_modules', array() );
		foreach ( $modules as $module ) {
			if ( $module instanceof Module ) {
				$module->register();
			}
		}
	}
}
