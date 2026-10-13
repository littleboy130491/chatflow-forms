<?php
use ChatFlow\Frontend\Renderer;

if ( ! function_exists( 'cff_render_form' ) ) {
	/** @param array<string,mixed> $attributes */
	function cff_render_form( int $id, array $attributes = array() ): string {
		return ( new Renderer() )->render( $id, $attributes ); }
}
