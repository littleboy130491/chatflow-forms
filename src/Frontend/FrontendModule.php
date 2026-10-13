<?php
namespace ChatFlow\Frontend;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Rest\Settings;

final class FrontendModule implements Module {
	public function __construct( private FormRepository $forms ) {}
	public function register(): void {
		require_once __DIR__ . '/functions.php';
		add_shortcode(
			'chatflow',
			function ( $attributes ) {
				$attributes = shortcode_atts(
					array(
						'id'     => 0,
						'height' => 600,
						'mode'   => 'inline',
						'theme'  => 'auto',
					),
					$attributes,
					'chatflow'
				);
				return ( new Renderer( $this->forms ) )->render( absint( $attributes['id'] ), $attributes );
			}
		);
		add_action( 'init', array( $this, 'rewrite' ) );
		add_filter( 'query_vars', fn( $vars ) => array_merge( $vars, array( 'cff_form_slug' ) ) );
		add_filter( 'template_include', array( $this, 'template' ) );
		add_filter( 'script_loader_tag', array( $this, 'moduleTag' ), 10, 3 );
		add_action( 'wp_enqueue_scripts', array( $this, 'tracking' ) );
		foreach ( array( 'rocket_delay_js_exclusions', 'rocket_exclude_defer_js', 'litespeed_optm_js_defer_exc', 'autoptimize_filter_js_exclude' ) as $filter ) {
			add_filter( $filter, array( $this, 'optimizerExclusions' ) ); }
	}
	public function rewrite(): void {
		$base = Settings::get()['fullpageBase'];
		add_rewrite_rule( '^' . preg_quote( $base, '#' ) . '/([^/]+)/?$', 'index.php?cff_form_slug=$matches[1]', 'top' );
		if ( get_option( 'cff_flush_rewrites', false ) || get_option( 'cff_frontend_base' ) !== $base ) {
			update_option( 'cff_frontend_base', $base, false );
			delete_option( 'cff_flush_rewrites' );
			flush_rewrite_rules( false ); }
	}
	public function template( string $template ): string {
		$slug = get_query_var( 'cff_form_slug' );
		if ( ! $slug ) {
			return $template; }
		$post = get_page_by_path( sanitize_title( $slug ), OBJECT, 'cff_form' );
		$form = $post ? $this->forms->getPublished( $post->ID ) : null;
		if ( ! $form ) {
			global $wp_query;
			$wp_query->set_404();
			status_header( 404 );
			$fallback = get_404_template();
			return $fallback ? $fallback : $template; }
		$GLOBALS['cff_fullpage_form'] = $form;
		wp_enqueue_script( 'cff-runtime', plugins_url( 'build/runtime/runtime.js', CFF_FILE ), array(), CFF_VERSION, true );
		status_header( 200 );
		return CFF_PATH . 'templates/fullpage.php';
	}
	public function moduleTag( string $tag, string $handle, string $src ): string {
		if ( ! in_array( $handle, array( 'cff-runtime', 'cff-tracking' ), true ) ) {
			return $tag; }
		return '<script type="module" data-no-optimize="1" data-cfasync="false" src="' . esc_url( $src ) . '" id="' . esc_attr( $handle ) . '-js"></script>';
	}
	public function optimizerExclusions( mixed $excluded ): mixed {
		$assets = array( '/build/runtime/runtime.js', '/build/runtime/tracking.js' );
		if ( is_array( $excluded ) ) {
			return array_values( array_unique( array_merge( $excluded, $assets ) ) );
		} if ( is_string( $excluded ) ) {
			return implode( ',', array_filter( array_merge( array( $excluded ), $assets ) ) );
		} return $excluded; }
	public function tracking(): void {
		$settings = Settings::get();
		$tracking = $settings['tracking'];
		if ( ! $tracking['enabled'] || $settings['privacy']['respectDnt'] && '1' === ( $_SERVER['HTTP_DNT'] ?? '' ) ) {
			return; }
		wp_enqueue_script( 'cff-tracking', plugins_url( 'build/runtime/tracking.js', CFF_FILE ), array(), CFF_VERSION, true );
		wp_add_inline_script(
			'cff-tracking',
			'window.cffTracking=' . wp_json_encode(
				array_merge(
					$tracking,
					array(
						'consentGranted' => false,
						'respectDnt'     => $settings['privacy']['respectDnt'],
					)
				)
			) . ';',
			'before'
		);
	}
}
