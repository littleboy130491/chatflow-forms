<?php
namespace ChatFlow\Frontend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\PublicProjection;
use ChatFlow\Support\Assets;

final class Renderer {
	/** @var array<int,bool> */
	private static array $rendered = array();

	public static function wasRendered( int $id ): bool {
		return isset( self::$rendered[ $id ] );
	}
	public function __construct( private FormRepository $forms = new FormRepository() ) {}
	/**
	 * @param array<string,mixed> $attributes
	 */
	public function render( int $id, array $attributes = array() ): string {
		$form = $this->forms->getPublished( $id );
		if ( ! $form ) {
			return ''; }
		self::$rendered[ $id ] = true;
		wp_enqueue_script( 'cff-runtime', plugins_url( 'build/runtime/runtime.js', CFF_FILE ), array(), Assets::version( CFF_PATH . 'build/runtime/runtime.js' ), true );
		$envelope = apply_filters( 'cff_public_display', PublicProjection::build( $form ) );
		if ( in_array( $attributes['theme'] ?? '', array( 'auto', 'light', 'dark' ), true ) ) {
			$envelope['form']['appearance']->theme = $attributes['theme'];
		}
		$data           = wp_json_encode( $envelope, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE );
		$height         = max( 200, min( 2000, (int) ( $attributes['height'] ?? $form->settings()['display']['height'] ?? 600 ) ) );
		$requested_mode = $attributes['mode'] ?? 'inline';
		$mode           = in_array( $requested_mode, array( 'inline', 'fullpage', 'launcher', 'popup' ), true ) ? $requested_mode : 'inline';
		$position       = 'left' === ( $attributes['position'] ?? 'right' ) ? 'left' : 'right';
		$style          = in_array( $mode, array( 'launcher', 'popup' ), true ) ? 'display:block' : 'display:block;min-height:' . $height . 'px';
		$delay          = isset( $attributes['auto_open'] ) && is_numeric( $attributes['auto_open'] ) ? max( 0, min( 3600, (int) $attributes['auto_open'] ) ) : '';
		$scroll         = isset( $attributes['scroll_percent'] ) && is_numeric( $attributes['scroll_percent'] ) ? max( 0, min( 100, (int) $attributes['scroll_percent'] ) ) : '';
		// A theme can replace the chat UI (chatflow/frontend.js) or restyle it (chatflow/frontend.css).
		$theme_script = ThemeFrontend::asset( 'js', $form );
		$theme_style  = ThemeFrontend::asset( 'css', $form );
		$theme_attrs  = '';
		if ( $theme_script ) {
			wp_enqueue_script( ThemeFrontend::handle( $theme_script ), $theme_script, array( 'cff-runtime' ), null, true );
			$theme_attrs .= ' data-frontend="theme"';
		}
		if ( $theme_style ) {
			$theme_attrs .= ' data-theme-style="' . esc_url( $theme_style ) . '"';
		}
		return '<cff-chat data-mode="' . esc_attr( $mode ) . '" data-position="' . esc_attr( $position ) . '" data-auto-open="' . esc_attr( (string) $delay ) . '" data-scroll-percent="' . esc_attr( (string) $scroll ) . '" data-form-id="' . $id . '" data-rest-url="' . esc_url( rest_url( 'cff/v1/' ) ) . '"' . $theme_attrs . ' style="' . $style . '"><span data-cff-loading>' . esc_html__( 'Loading chat…', 'chatflow-forms' ) . '</span><script type="application/json" data-cff-schema>' . $data . '</script></cff-chat>';
	}
}
