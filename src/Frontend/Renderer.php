<?php
namespace ChatFlow\Frontend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\PublicProjection;

final class Renderer {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}
	public function render( int $id, array $attributes = array() ): string {
		$form = $this->forms->getPublished( $id );
		if ( ! $form ) {
			return ''; }
		wp_enqueue_script( 'cff-runtime', CFF_URL . 'build/runtime/runtime.js', array(), CFF_VERSION, true );
		$data   = wp_json_encode( PublicProjection::build( $form ), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE );
		$height = max( 200, min( 2000, (int) ( $attributes['height'] ?? $form->settings()['display']['height'] ?? 600 ) ) );
		return '<cff-chat data-form-id="' . $id . '" data-rest-url="' . esc_url( rest_url( 'cff/v1/' ) ) . '" style="display:block;min-height:' . $height . 'px"><script type="application/json" data-cff-schema>' . $data . '</script></cff-chat>';
	}
}
