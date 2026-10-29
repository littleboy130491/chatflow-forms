<?php
namespace ChatFlow\Admin;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Support\Assets;

final class AdminModule implements Module {
	/** @var array<string, string> */
	private array $screens = array();

	public function __construct( private FormRepository $forms ) {}

	public function register(): void {
		add_action( 'admin_menu', array( $this, 'menus' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( CFF_FILE ), array( $this, 'pluginLinks' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
		add_action( 'init', array( $this, 'registerBlock' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueueBlock' ) );
		add_action( 'init', array( $this, 'loadTranslations' ), 5 );
		add_action( 'admin_post_cff_restore_form', array( $this, 'restoreForm' ) );
		add_action( 'admin_post_cff_delete_form', array( $this, 'deleteForm' ) );
		add_filter( 'wp_untrash_post_status', array( $this, 'untrashStatus' ), 10, 3 );
		add_action( 'current_screen', array( $this, 'redirectClassicScreens' ) );
	}

	/** Restored forms return to their previous status instead of core's default draft. */
	public function untrashStatus( string $status, int $id, string $previous ): string {
		return 'cff_form' === get_post_type( $id ) && in_array( $previous, array( 'draft', 'publish' ), true ) ? $previous : $status;
	}

	/** The classic list/editor screens bypass the builder, so send admins to the builder instead. */
	public function redirectClassicScreens( \WP_Screen $screen ): void {
		if ( 'cff_form' !== $screen->post_type ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen routing.
		$action = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen routing.
		$id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
		if ( 'edit' === $screen->base ) {
			$target = add_query_arg( 'page', 'cff-forms', admin_url( 'admin.php' ) );
		} elseif ( 'post' === $screen->base && ( 'add' === $screen->action || 'edit' === $action ) ) {
			$target = add_query_arg(
				array_filter(
					array(
						'page'   => 'cff-builder',
						'formId' => 'edit' === $action ? $id : 0,
					)
				),
				admin_url( 'admin.php' )
			);
		} else {
			return;
		}
		wp_safe_redirect( $target );
		exit;
	}

	public function restoreForm(): void {
		$id = $this->trashedFormFromRequest( 'restore' );
		$this->backToTrash( wp_untrash_post( $id ) ? 'restored' : 'failed' );
	}

	public function deleteForm(): void {
		global $wpdb;
		$id = $this->trashedFormFromRequest( 'delete' );
		// Submissions keep personal data and files; they must be purged deliberately first.
		$submissions = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE form_id = %d', $wpdb->prefix . 'cff_submissions', $id ) );
		if ( $submissions > 0 ) {
			$this->backToTrash( 'has_submissions' );
		}
		if ( ! wp_delete_post( $id, true ) ) {
			$this->backToTrash( 'failed' );
		}
		// Sessions (and their temporary uploads) are left to the regular expiry jobs.
		foreach ( array( 'cff_form_versions', 'cff_stats_daily', 'cff_events' ) as $table ) {
			$wpdb->delete( $wpdb->prefix . $table, array( 'form_id' => $id ), array( '%d' ) );
		}
		$this->backToTrash( 'deleted' );
	}

	public static function trashActionUrl( string $action, int $id ): string {
		return wp_nonce_url(
			add_query_arg(
				array(
					'action' => 'cff_' . $action . '_form',
					'formId' => $id,
				),
				admin_url( 'admin-post.php' )
			),
			'cff_' . $action . '_form_' . $id
		);
	}

	private function trashedFormFromRequest( string $action ): int {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- The nonce is bound to this ID and verified next.
		$id = isset( $_GET['formId'] ) ? absint( $_GET['formId'] ) : 0;
		check_admin_referer( 'cff_' . $action . '_form_' . $id );
		if ( ! current_user_can( 'cff_manage_forms' ) ) {
			wp_die( esc_html__( 'You are not allowed to manage forms.', 'chatflow-forms' ), '', array( 'response' => 403 ) );
		}
		$post = $id ? get_post( $id ) : null;
		if ( ! $post || 'cff_form' !== $post->post_type || 'trash' !== $post->post_status ) {
			wp_die( esc_html__( 'Only trashed forms can be restored or deleted permanently.', 'chatflow-forms' ), '', array( 'response' => 404 ) );
		}
		return $id;
	}

	private function backToTrash( string $notice ): void {
		wp_safe_redirect(
			add_query_arg(
				array(
					'page'       => 'cff-forms',
					'status'     => 'trash',
					'cff_notice' => $notice,
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}
	public function loadTranslations(): void {
		load_plugin_textdomain( 'chatflow-forms', false, dirname( plugin_basename( CFF_FILE ) ) . '/src/Admin/languages' );
	}

	public function menus(): void {
		$pages     = array(
			'cff-forms'       => array( 'forms', 'cff_manage_forms', __( 'Forms', 'chatflow-forms' ) ),
			'cff-submissions' => array( 'submissions', 'cff_view_submissions', __( 'Submissions', 'chatflow-forms' ) ),
			'cff-analytics'   => array( 'analytics', 'cff_view_submissions', __( 'Analytics', 'chatflow-forms' ) ),
			'cff-settings'    => array( 'settings', 'cff_manage_settings', __( 'Site defaults', 'chatflow-forms' ) ),
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
			$title = 'cff-submissions' === $slug ? $this->submissionsMenuTitle() : $page[2];
			$hook  = add_submenu_page( $parent, $page[2], $title, $page[1], $slug, array( $this, 'render' ) );
			if ( $hook ) {
				$this->screens[ $hook ] = $page[0];
			}
			// WordPress convention: "Add new" sits directly under the list it adds to.
			if ( 'cff-forms' === $slug ) {
				$this->addBuilderMenu( $parent );
			}
		}
		$this->screens[ 'toplevel_page_' . $parent ] = $first[0];
		if ( ! isset( $available['cff-forms'] ) ) {
			$this->addBuilderMenu( $parent );
		}
		if ( current_user_can( 'cff_manage_forms' ) ) {
			$hook = add_submenu_page( $parent, __( 'Build forms with an AI agent', 'chatflow-forms' ), __( 'AI guide', 'chatflow-forms' ), 'cff_manage_forms', AiGuide::SLUG, array( $this, 'render' ) );
			if ( $hook ) {
				$this->screens[ $hook ] = 'guide';
			}
		}
	}

	/**
	 * @param array<string|int, string> $links
	 * @return array<string|int, string>
	 */
	public function pluginLinks( array $links ): array {
		if ( current_user_can( 'cff_manage_forms' ) ) {
			$links['cff-ai-guide'] = '<a href="' . esc_url( AiGuide::url() ) . '">' . esc_html__( 'AI guide', 'chatflow-forms' ) . '</a>';
		}
		return $links;
	}

	private function addBuilderMenu( string $menu_slug ): void {
		if ( ! current_user_can( 'cff_manage_forms' ) ) {
			return;
		}
		$hook = add_submenu_page( $menu_slug, __( 'Form builder', 'chatflow-forms' ), __( 'Add new form', 'chatflow-forms' ), 'cff_manage_forms', 'cff-builder', array( $this, 'render' ) );
		if ( $hook ) {
			$this->screens[ $hook ] = 'builder';
		}
	}

	public function render(): void {
		$screen = get_current_screen();
		$name   = $screen ? ( $this->screens[ $screen->id ] ?? '' ) : '';
		$cap    = array(
			'forms'       => 'cff_manage_forms',
			'builder'     => 'cff_manage_forms',
			'submissions' => 'cff_view_submissions',
			'analytics'   => 'cff_view_submissions',
			'settings'    => 'cff_manage_settings',
			'guide'       => 'cff_manage_forms',
		)[ $name ] ?? '';
		if ( 'cff-tools' === $this->pageSlug() ) {
			$cap = $this->toolsCapability();
		}
		if ( ! $cap || ! current_user_can( $cap ) ) {
			wp_die( esc_html__( 'You are not allowed to access this screen.', 'chatflow-forms' ), '', array( 'response' => 403 ) );
		}
		nocache_headers();
		if ( 'guide' === $name ) {
			AiGuide::render();
			return;
		}
		if ( 'forms' === $name ) {
			$table = new FormsTable( $this->forms );
			$table->prepare_items();
			echo '<div class="wrap" id="cff-forms-list"><h1>' . esc_html__( 'ChatFlow Forms', 'chatflow-forms' ) . ' <a class="page-title-action" href="' . esc_url( add_query_arg( 'page', 'cff-builder', admin_url( 'admin.php' ) ) ) . '">' . esc_html__( 'Create form', 'chatflow-forms' ) . '</a></h1>';
			echo '<p>' . esc_html__( 'Conversational forms that feel like a chat. Draft here, publish when you are ready to share.', 'chatflow-forms' ) . '</p>';
			$this->trashNotice();
			echo '<div data-cff-status role="status" aria-live="polite"></div><form method="get"><input type="hidden" name="page" value="cff-forms">';
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only list filter.
			$status = isset( $_GET['status'] ) && is_string( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : '';
			if ( in_array( $status, array( 'draft', 'publish', 'trash' ), true ) ) {
				echo '<input type="hidden" name="status" value="' . esc_attr( $status ) . '">';
			}
			$table->views();
			$table->search_box( __( 'Search forms', 'chatflow-forms' ), 'cff-forms' );
			$table->display();
			echo '</form></div>';
			return;
		}
		echo '<div class="wrap"><div id="cff-admin-root"></div></div>';
	}

	private function trashNotice(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Display-only result of a nonce-checked redirect.
		$notice   = isset( $_GET['cff_notice'] ) ? sanitize_key( wp_unslash( $_GET['cff_notice'] ) ) : '';
		$messages = array(
			'restored'        => array( 'success', __( 'Form restored.', 'chatflow-forms' ) ),
			'deleted'         => array( 'success', __( 'Form deleted permanently.', 'chatflow-forms' ) ),
			'has_submissions' => array( 'error', __( 'This form still has submissions. Purge them in Tools before deleting the form permanently.', 'chatflow-forms' ) ),
			'failed'          => array( 'error', __( 'The form could not be changed. Please try again.', 'chatflow-forms' ) ),
		);
		if ( isset( $messages[ $notice ] ) ) {
			echo '<div class="notice notice-' . esc_attr( $messages[ $notice ][0] ) . '"><p>' . esc_html( $messages[ $notice ][1] ) . '</p></div>';
		}
	}

	public function enqueue( string $hook ): void {
		if ( ! isset( $this->screens[ $hook ] ) ) {
			return;
		}
		$screen = $this->screens[ $hook ];
		if ( 'guide' === $screen ) {
			AiGuide::enqueue();
			return;
		}
		$entry = in_array( $screen, array( 'builder', 'forms' ), true ) ? 'builder' : 'submissions';
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
		$mount = 'forms' === $screen ? 'mountFormsList(document.getElementById("cff-forms-list"),window.cffAdmin)' : 'mount' . ucfirst( $entry ) . '(document.getElementById("cff-admin-root"),window.cffAdmin)';
		wp_add_inline_script( 'cff-' . $entry, 'window.CFFAdmin.' . $entry . '.' . $mount . ';' );
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
		// Global values a form inherits while it has no per-form override. The builder
		// shows them as inherited values and never writes them into the form.
		$global   = \ChatFlow\Rest\Settings::get();
		$defaults = array(
			'appearance' => array( 'theme' => $global['defaultTheme'] ?? 'light' ),
			'privacy'    => array(
				'ipMode'               => $global['privacy']['ip'] ?? 'anonymized',
				'storeMeta'            => (bool) ( $global['privacy']['storeMeta'] ?? true ),
				'storeUserAgent'       => (bool) ( $global['privacy']['storeUserAgent'] ?? false ),
				'respectDnt'           => (bool) ( $global['privacy']['respectDnt'] ?? true ),
				'retentionEnabled'     => (bool) ( $global['retention']['enabled'] ?? false ),
				'retentionDays'        => (int) ( $global['retention']['days'] ?? 360 ),
				'partialRetentionDays' => $global['retention']['partialDays'] ?? null,
			),
			'spam'       => array(),
		);
		foreach ( array( 'honeypotEnabled', 'minSeconds', 'rateLimit', 'rateWindowSeconds', 'captcha', 'akismetEnabled' ) as $key ) {
			if ( isset( $global['spam'][ $key ] ) ) {
				$defaults['spam'][ $key ] = $global['spam'][ $key ]; }
		}
		$config = array(
			'defaults'      => $defaults,
			'restUrl'       => trailingslashit( rest_url( 'cff/v1' ) ),
			'nonce'         => wp_create_nonce( 'wp_rest' ),
			'pluginUrl'     => plugin_dir_url( CFF_FILE ),
			'runtimeUrl'    => add_query_arg( 'ver', Assets::version( CFF_PATH . 'build/runtime/runtime.js' ), plugins_url( 'build/runtime/runtime.js', CFF_FILE ) ),
			'screen'        => $screen,
			'locale'        => determine_locale(),
			'capabilities'  => $caps,
			'adminUrl'      => admin_url( 'admin.php' ),
			'siteUrl'       => home_url( '/' ),
			'timezone'      => wp_timezone_string(),
			// The theme's chatflow/frontend.{js,css}, so the builder preview shows the theme's chat.
			'themeFrontend' => array_filter(
				array(
					'script' => \ChatFlow\Frontend\ThemeFrontend::asset( 'js' ),
					'style'  => \ChatFlow\Frontend\ThemeFrontend::asset( 'css' ),
				)
			),
			'mcp'           => array(
				'url'          => \ChatFlow\Mcp\McpModule::url(),
				'profileUrl'   => admin_url( 'profile.php#application-passwords-section' ),
				'appPasswords' => wp_is_application_passwords_available_for_user( wp_get_current_user() ),
				'user'         => wp_get_current_user()->user_login,
			),
			'fullpageBase'  => is_array( $settings ) ? ( $settings['fullpageBase'] ?? 'chat' ) : 'chat',
			'tools'         => 'cff-tools' === $this->pageSlug(),
			'features'      => array(
				'fieldTypes' => $types,
				'uploads'    => in_array( 'file_upload', $types, true ),
				'xlsx'       => \ChatFlow\Submissions\Xlsx::available(),
				'ai'         => \ChatFlow\Rest\AiController::configured(),
			),
		);
		// This is an admin-only locator, not a write or authorization input.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$id = isset( $_GET['formId'] ) ? absint( $_GET['formId'] ) : 0;
		if ( $id && current_user_can( 'cff_manage_forms' ) && $this->forms->getDraft( $id ) ) {
			$config['formId'] = $id;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only draft preview locator.
		$config['preview'] = isset( $_GET['preview'] ) && '1' === $_GET['preview'];
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only export resource locator; REST checks ownership.
		$export_id = isset( $_GET['exportId'] ) ? absint( $_GET['exportId'] ) : 0;
		if ( $export_id && current_user_can( 'cff_export_submissions' ) ) {
			$config['exportId'] = $export_id;
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
					'formId'   => array(
						'type'    => 'integer',
						'default' => 0,
					),
					'mode'     => array(
						'type'    => 'string',
						'default' => 'inline',
						'enum'    => array( 'inline', 'fullpage', 'launcher' ),
					),
					'position' => array(
						'type'    => 'string',
						'default' => 'right',
						'enum'    => array( 'left', 'right' ),
					),
					'height'   => array(
						'type'    => 'integer',
						'default' => 600,
					),
					'theme'    => array(
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
		$mode = in_array( $attributes['mode'] ?? '', array( 'inline', 'fullpage', 'launcher' ), true ) ? $attributes['mode'] : 'inline';
		return cff_render_form(
			$id,
			array(
				'mode'     => $mode,
				'position' => 'left' === ( $attributes['position'] ?? 'right' ) ? 'left' : 'right',
				'height'   => max( 200, min( 2000, absint( $attributes['height'] ?? 600 ) ) ),
				'theme'    => in_array( $attributes['theme'] ?? '', array( 'light', 'dark', 'auto' ), true ) ? $attributes['theme'] : 'auto',
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
				$base_css = 'build/admin/style-builder' . ( is_rtl() ? '-rtl' : '' ) . '.css';
				wp_enqueue_style( 'cff-admin-base', plugin_dir_url( CFF_FILE ) . $base_css, array( 'wp-components' ), Assets::version( CFF_PATH . $base_css ) );
			}
			wp_enqueue_style( 'cff-' . $entry, plugin_dir_url( CFF_FILE ) . $css, array( 'wp-components' ), Assets::version( CFF_PATH . $css ) );
		}
		return true;
	}

	private function pageSlug(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
	}
	public function submissionsMenuTitle(): string {
		$title = __( 'Submissions', 'chatflow-forms' );
		if ( ! current_user_can( 'cff_view_submissions' ) ) {
			return $title;
		}
		global $wpdb;
		$count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM %i WHERE is_read=0 AND status NOT IN ('spam','trash')", $wpdb->prefix . 'cff_submissions' ) );
		return $count ? $title . ' <span class="awaiting-mod"><span class="pending-count">' . esc_html( number_format_i18n( $count ) ) . '</span></span>' : $title;
	}
	private function toolsCapability(): string {
		// Export-only users still reach Tools for their "export ready" download links.
		foreach ( array( 'cff_purge_submissions', 'cff_manage_settings', 'cff_export_submissions' ) as $cap ) {
			if ( current_user_can( $cap ) ) {
				return $cap; }
		}
		return 'cff_purge_submissions';
	}
}
