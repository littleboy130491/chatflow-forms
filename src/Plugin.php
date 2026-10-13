<?php
namespace ChatFlow;

use ChatFlow\Contracts\Module;
use ChatFlow\Install\Installer;
use ChatFlow\Updates\Updater;
use ChatFlow\Fields\Registry;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Logic\Engine;

final class Plugin implements Module {
	public function register(): void {
		add_action( 'init', array( Installer::class, 'maybeUpgrade' ), 5 );
		add_action(
			'init',
			static function (): void {
				load_plugin_textdomain( 'chatflow-forms', false, dirname( plugin_basename( CFF_FILE ) ) . '/src/Admin/languages' );
			}
		);
		add_action( 'wp_initialize_site', array( Installer::class, 'initializeSite' ), 200 );
		add_action( 'wp_uninitialize_site', array( Installer::class, 'uninitializeSite' ) );
		( new Updater() )->register();
		$forms   = new FormRepository();
		$fields  = new Registry();
		$modules = apply_filters(
			'cff_modules',
			array(
				new \ChatFlow\Forms\FormsModule( $forms, $fields ),
				new \ChatFlow\Rest\RestModule( $forms, new Engine( $fields ), $fields ),
				new \ChatFlow\Submissions\MagicLinks(),
				new \ChatFlow\Frontend\FrontendModule( $forms ),
				new \ChatFlow\Privacy\PrivacyModule( $forms ),
				new \ChatFlow\Admin\AdminModule( $forms ),
				new \ChatFlow\Integrations\IntegrationsModule( $forms ),
				new \ChatFlow\Notifications\NotificationsModule( $forms ),
				new \ChatFlow\Admin\Translations(),
				new \ChatFlow\Integrations\Elementor\ElementorModule(),
			)
		);
		foreach ( $modules as $module ) {
			if ( $module instanceof Module ) {
				$module->register();
			}
		}
	}
}
