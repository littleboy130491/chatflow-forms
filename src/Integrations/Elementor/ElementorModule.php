<?php
namespace ChatFlow\Integrations\Elementor;

use ChatFlow\Contracts\Module;

final class ElementorModule implements Module {
	public function register(): void {
		add_action( 'elementor/widgets/register', array( $this, 'widgets' ) );
	}
	public function widgets( object $manager ): void {
		if ( ! class_exists( '\Elementor\Widget_Base' ) || ! method_exists( $manager, 'register' ) ) {
			return; }
		$manager->register( new FormWidget() );
	}
}
