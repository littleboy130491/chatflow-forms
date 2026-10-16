<?php
namespace ChatFlow\Templates;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Submissions\Database;

final class Templates {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}

	/** @return list<array{id:string,title:string,description:string,locale:string}> */
	public static function catalog(): array {
		return array(
			array(
				'id'          => 'imajiner-survey',
				'title'       => 'Survei Website Imajiner',
				'description' => 'Qualify website project inquiries, with conditional questions.',
				'locale'      => 'id_ID',
			),
			array(
				'id'          => 'contact-request',
				'title'       => 'Contact request',
				'description' => 'Collect a name, email address, topic, message, and permission to reply.',
				'locale'      => 'en_US',
			),
			array(
				'id'          => 'customer-feedback',
				'title'       => 'Customer feedback',
				'description' => 'Gather experience ratings, suggestions, and recommendation intent without contact details.',
				'locale'      => 'en_US',
			),
			...array_map(
				static fn( array $item ): array => array(
					'id'          => $item['slug'],
					'title'       => $item['title'],
					'description' => $item['description'],
					'locale'      => 'en_US',
				),
				array_values( array_filter( Starter::gallery(), static fn( array $item ): bool => 'blank' !== $item['slug'] ) )
			),
		);
	}

	/** @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>}|\WP_Error */
	public static function definition( string $id ): array|\WP_Error {
		return match ( $id ) {
			'imajiner-survey'   => Imajiner::definition(),
			'contact-request'   => Starter::contact(),
			'customer-feedback' => Starter::feedback(),
			default             => in_array( $id, array_column( self::catalog(), 'id' ), true ) ? Starter::definition( $id ) : Database::error( 'cff_template_not_found', 'Unknown template.', 404 ),
		};
	}

	public function create( string $id = 'imajiner-survey' ): Form|\WP_Error {
		$template = self::definition( $id );
		if ( is_wp_error( $template ) ) {
			return $template;
		}
		return $this->forms->create( $template['title'], $template['schema'], $template['settings'] );
	}

	public function register(): void {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			\WP_CLI::add_command(
				'cff template imajiner',
				function ( $args, $options ) {
					$form = $this->create();
					if ( is_wp_error( $form ) ) {
						\WP_CLI::error( $form->get_error_message() );
					}
					if ( isset( $options['publish'] ) ) {
						$form = $this->forms->publish( $form->id(), $form->draftRevision() );
						if ( is_wp_error( $form ) ) {
							\WP_CLI::error( $form->get_error_message() );
						}
					}
					\WP_CLI::success( 'Created Imajiner survey form ' . $form->id() );
				}
			);
		}
	}
}
