<?php
namespace ChatFlow\Templates;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;

final class Templates {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}
	public function create(): Form|\WP_Error {
		$template = Imajiner::definition();
		return $this->forms->create( $template['title'], $template['schema'], $template['settings'] ); }
	public function register(): void {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			\WP_CLI::add_command(
				'cff template imajiner',
				function ( $args, $options ) {
					$form = $this->create();
					if ( is_wp_error( $form ) ) {
						\WP_CLI::error( $form->get_error_message() );
					} if ( isset( $options['publish'] ) ) {
						$form = $this->forms->publish( $form->id(), $form->draftRevision() );
						if ( is_wp_error( $form ) ) {
							\WP_CLI::error( $form->get_error_message() );
						}
					} \WP_CLI::success( 'Created Imajiner survey form ' . $form->id() );
				}
			);
		}
	}
}
