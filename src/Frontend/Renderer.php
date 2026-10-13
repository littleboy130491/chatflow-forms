<?php
namespace ChatFlow\Frontend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\PublicProjection;

final class Renderer {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}
	/**
	 * @param array<string,mixed> $attributes
	 */
	public function render( int $id, array $attributes = array() ): string {
		$form = $this->forms->getPublished( $id );
		if ( ! $form ) {
			return ''; }
		wp_enqueue_script( 'cff-runtime', plugins_url( 'build/runtime/runtime.js', CFF_FILE ), array(), CFF_VERSION, true );
		$envelope = PublicProjection::build( $form );
		if ( in_array( $attributes['theme'] ?? '', array( 'auto', 'light', 'dark' ), true ) ) {
			$envelope['form']['appearance']->theme = $attributes['theme'];
		}
		$data           = wp_json_encode( $envelope, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE );
		$height         = max( 200, min( 2000, (int) ( $attributes['height'] ?? $form->settings()['display']['height'] ?? 600 ) ) );
		$requested_mode = $attributes['mode'] ?? 'inline';
		$mode           = in_array( $requested_mode, array( 'inline', 'fullpage', 'launcher' ), true ) ? $requested_mode : 'inline';
		$position       = 'left' === ( $attributes['position'] ?? 'right' ) ? 'left' : 'right';
		$style          = 'launcher' === $mode ? 'display:block' : 'display:block;min-height:' . $height . 'px';
		return '<cff-chat data-mode="' . esc_attr( $mode ) . '" data-position="' . esc_attr( $position ) . '" data-form-id="' . $id . '" data-rest-url="' . esc_url( rest_url( 'cff/v1/' ) ) . '" style="' . $style . '"><span data-cff-loading>' . esc_html__( 'Loading chat…', 'chatflow-forms' ) . '</span><script type="application/json" data-cff-schema>' . $data . '</script></cff-chat>';
	}
}
