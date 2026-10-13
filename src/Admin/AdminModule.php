<?php
namespace ChatFlow\Admin;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;

final class AdminModule implements Module {
	/** @var array<string, string> */
	private array $screens = array();

	public function __construct( private FormRepository $forms ) {}

	public function register(): void {
		add_action( 'admin_menu', array( $this, 'menus' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
		add_action( 'init', array( $this, 'registerBlock' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueueBlock' ) );
		add_action( 'init', array( $this, 'loadTranslations' ), 5 );
	}
	public function loadTranslations(): void {
		load_plugin_textdomain( 'chatflow-forms', false, dirname( plugin_basename( CFF_FILE ) ) . '/src/Admin/languages' );
	}

	public function menus(): void {
		$pages     = array(
			'cff-forms'       => array( 'builder', 'cff_manage_forms', __( 'Forms', 'chatflow-forms' ) ),
			'cff-submissions' => array( 'submissions', 'cff_view_submissions', __( 'Submissions', 'chatflow-forms' ) ),
			'cff-settings'    => array( 'settings', 'cff_manage_settings', __( 'Settings', 'chatflow-forms' ) ),
			'cff-tools'       => array( 'submissions', $this->toolsCapability(), __( 'Tools', 'chatflow-forms' ) ),
		);
		$available = array_filter( $pages, static fn( array $page ): bool => current_user_can( $page[1] ) );
		if ( ! $available ) {
			return;
		}
		$parent = (string) array_key_first( $available );
		$first  = $available[ $parent ];
		add_menu_page( __( 'ChatFlow', 'chatflow-forms' ), __( 'ChatFlow', 'chatflow-forms' ), $first[1], $parent, array( $this, 'render' ), 'dashicons-format-chat', 26 );
		foreach ( $available as $slug => $page ) {
			$hook = add_submenu_page( $parent, $page[2], $page[2], $page[1], $slug, array( $this, 'render' ) );
			if ( $hook ) {
				$this->screens[ $hook ] = $page[0];
			}
		}
		$this->screens[ 'toplevel_page_' . $parent ] = $first[0];
	}

	public function render(): void {
		$screen = get_current_screen();
		$name   = $screen ? ( $this->screens[ $screen->id ] ?? '' ) : '';
		$cap    = array(
			'builder'     => 'cff_manage_forms',
			'submissions' => 'cff_view_submissions',
			'settings'    => 'cff_manage_settings',
		)[ $name ] ?? '';
		if ( 'cff-tools' === $this->pageSlug() ) {
			$cap = $this->toolsCapability();
		}
		if ( ! $cap || ! current_user_can( $cap ) ) {
			wp_die( esc_html__( 'You are not allowed to access this screen.', 'chatflow-forms' ), '', array( 'response' => 403 ) );
		}
		nocache_headers();
		echo '<div class="wrap"><div id="cff-admin-root"></div></div>';
	}

	public function enqueue( string $hook ): void {
		if ( ! isset( $this->screens[ $hook ] ) ) {
			return;
		}
		$screen = $this->screens[ $hook ];
		$entry  = 'builder' === $screen ? 'builder' : 'submissions';
		if ( ! $this->asset( $entry ) ) {
			return;
		}
		wp_enqueue_style( 'wp-components' );
		if ( 'builder' === $screen ) {
			wp_enqueue_editor();
			wp_enqueue_media();
		}
		$config = $this->config( $screen );
		wp_add_inline_script( 'cff-' . $entry, 'window.cffAdmin=' . wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';', 'before' );
		wp_add_inline_script( 'cff-' . $entry, 'window.CFFAdmin.' . $entry . '.mount' . ucfirst( $entry ) . '(document.getElementById("cff-admin-root"),window.cffAdmin);' );
	}

	/** @return array<string, mixed> */
	public function config( string $screen ): array {
		$caps = array();
		foreach ( array( 'manage_forms', 'view_submissions', 'edit_submissions', 'delete_submissions', 'export_submissions', 'purge_submissions', 'manage_settings' ) as $cap ) {
			$caps[ $cap ] = current_user_can( 'cff_' . $cap );
		}
		$types = array( 'short_text', 'long_text', 'email', 'phone', 'number', 'date', 'single_choice', 'multi_choice', 'yes_no', 'consent', 'hidden', 'statement', 'summary' );
		if ( class_exists( \ChatFlow\Fields\Registry::class ) ) {
			$types = ( new \ChatFlow\Fields\Registry() )->types();
		}
		$settings = get_option( 'cff_settings', array() );
		$defaults = array();
		if ( is_array( $settings ) ) {
			$defaults['appearance'] = array( 'theme' => $settings['defaultTheme'] ?? 'light' );
			foreach ( array(
				'ip'             => 'ipMode',
				'storeMeta'      => 'storeMeta',
				'storeUserAgent' => 'storeUserAgent',
				'respectDnt'     => 'respectDnt',
			) as $global => $local ) {
				if ( isset( $settings['privacy'][ $global ] ) ) {
					$defaults['privacy'][ $local ] = $settings['privacy'][ $global ]; }
			}
			foreach ( array( 'honeypotEnabled', 'minSeconds', 'rateLimit', 'rateWindowSeconds' ) as $key ) {
				if ( isset( $settings['spam'][ $key ] ) ) {
					$defaults['spam'][ $key ] = $settings['spam'][ $key ]; }
			}
			if ( isset( $settings['retention']['enabled'] ) ) {
				$defaults['privacy']['retentionEnabled'] = $settings['retention']['enabled']; }
			if ( isset( $settings['retention']['days'] ) ) {
				$defaults['privacy']['retentionDays'] = $settings['retention']['days']; }
			$defaults['privacy']['partialRetentionDays'] = $settings['retention']['partialDays'] ?? null;
		}
		$config = array(
			'defaults'     => $defaults,
			'restUrl'      => trailingslashit( rest_url( 'cff/v1' ) ),
			'nonce'        => wp_create_nonce( 'wp_rest' ),
			'pluginUrl'    => plugin_dir_url( CFF_FILE ),
			'screen'       => $screen,
			'locale'       => determine_locale(),
			'capabilities' => $caps,
			'adminUrl'     => admin_url( 'admin.php' ),
			'siteUrl'      => home_url( '/' ),
			'fullpageBase' => is_array( $settings ) ? ( $settings['fullpageBase'] ?? 'chat' ) : 'chat',
			'tools'        => 'cff-tools' === $this->pageSlug(),
			'features'     => array(
				'fieldTypes' => $types,
				'uploads'    => false,
			),
		);
		// This is an admin-only locator, not a write or authorization input.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$id = isset( $_GET['formId'] ) ? absint( $_GET['formId'] ) : 0;
		if ( $id && current_user_can( 'cff_manage_forms' ) && $this->forms->getDraft( $id ) ) {
			$config['formId'] = $id;
		}
		return $config;
	}

	public function registerBlock(): void {
		$this->asset( 'blocks', false );
		register_block_type(
			'chatflow/form',
			array(
				'api_version'     => '3',
				'editor_script'   => 'cff-blocks',
				'attributes'      => array(
					'formId' => array(
						'type'    => 'integer',
						'default' => 0,
					),
					'mode'   => array(
						'type'    => 'string',
						'default' => 'inline',
						'enum'    => array( 'inline', 'fullpage' ),
					),
					'height' => array(
						'type'    => 'integer',
						'default' => 600,
					),
					'theme'  => array(
						'type'    => 'string',
						'default' => 'auto',
						'enum'    => array( 'light', 'dark', 'auto' ),
					),
				),
				'render_callback' => array( $this, 'renderBlock' ),
			)
		);
	}

	public function enqueueBlock(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		$this->asset( 'blocks' );
		wp_add_inline_script( 'cff-blocks', 'window.cffBlock=' . wp_json_encode( $this->config( 'builder' ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';', 'before' );
	}

	/** @param array<string, mixed> $attributes */
	public function renderBlock( array $attributes ): string {
		$id = absint( $attributes['formId'] ?? 0 );
		if ( ! $id || ! function_exists( 'cff_render_form' ) ) {
			return '';
		}
		$mode = in_array( $attributes['mode'] ?? '', array( 'inline', 'fullpage' ), true ) ? $attributes['mode'] : 'inline';
		return cff_render_form(
			$id,
			array(
				'mode'   => $mode,
				'height' => max( 200, min( 2000, absint( $attributes['height'] ?? 600 ) ) ),
				'theme'  => in_array( $attributes['theme'] ?? '', array( 'light', 'dark', 'auto' ), true ) ? $attributes['theme'] : 'auto',
			)
		);
	}

	private function asset( string $entry, bool $enqueue = true ): bool {
		$file = CFF_PATH . 'build/admin/' . $entry . '.asset.php';
		if ( ! is_file( $file ) ) {
			return false;
		}
		$asset = require $file;
		wp_register_script( 'cff-' . $entry, plugin_dir_url( CFF_FILE ) . 'build/admin/' . $entry . '.js', $asset['dependencies'], $asset['version'], true );
		wp_set_script_translations( 'cff-' . $entry, 'chatflow-forms', CFF_PATH . 'src/Admin/languages' );
		if ( $enqueue ) {
			wp_enqueue_script( 'cff-' . $entry );
		}
		$css = 'build/admin/style-' . $entry . ( is_rtl() ? '-rtl' : '' ) . '.css';
		if ( $enqueue && is_file( CFF_PATH . $css ) ) {
			if ( 'submissions' === $entry ) {
				wp_enqueue_style( 'cff-admin-base', plugin_dir_url( CFF_FILE ) . 'build/admin/style-builder' . ( is_rtl() ? '-rtl' : '' ) . '.css', array( 'wp-components' ), $asset['version'] );
			}
			wp_enqueue_style( 'cff-' . $entry, plugin_dir_url( CFF_FILE ) . $css, array( 'wp-components' ), $asset['version'] );
		}
		return true;
	}

	private function pageSlug(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
	}
	private function toolsCapability(): string {
		foreach ( array( 'cff_purge_submissions', 'cff_export_submissions', 'cff_manage_forms', 'cff_manage_settings' ) as $cap ) {
			if ( current_user_can( $cap ) ) {
				return $cap; }
		}
		return 'cff_purge_submissions';
	}
}
