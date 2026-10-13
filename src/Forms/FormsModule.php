<?php
namespace ChatFlow\Forms;

use ChatFlow\Contracts\Module;
use ChatFlow\Fields\Registry;

final class FormsModule implements Module {
	public function __construct( private FormRepository $forms, private Registry $fields ) {}
	public function register(): void {
		( new \ChatFlow\Tracking\CloudflareRanges() )->register();
		( new \ChatFlow\Templates\Templates( $this->forms ) )->register();
		add_filter( 'cff_publishable_field_types', fn( $types ) => array_values( array_intersect( $types, $this->fields->types() ) ) );
		add_action( 'init', array( new FormPostType(), 'register' ) );
	}
}
