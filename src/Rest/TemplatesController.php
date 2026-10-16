<?php
namespace ChatFlow\Rest;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Submissions\Database;
use ChatFlow\Templates\Imajiner;

final class TemplatesController {
	public function __construct( private FormRepository $forms ) {}

	public function register(): void {
		foreach ( array(
			array( '/admin/templates/gallery', 'GET', 'gallery' ),
			array( '/admin/templates/gallery/(?P<slug>[a-z-]+)', 'POST', 'create' ),
			array( '/admin/forms/(?P<id>\d+)/duplicate', 'POST', 'duplicate' ),
		) as [$route, $method, $callback] ) {
			register_rest_route(
				'cff/v1',
				$route,
				array(
					'methods'             => $method,
					'permission_callback' => static fn( $request ) => RestModule::authorize( $request, 'cff_manage_forms' ),
					'callback'            => array( $this, $callback ),
				)
			);
		}
	}

	public function gallery(): \WP_REST_Response {
		return $this->respond(
			array(
				'items' => array(
					...\ChatFlow\Templates\Starter::gallery(),
					array(
						'slug'        => 'imajiner-survey',
						'title'       => __( 'Imajiner website survey', 'chatflow-forms' ),
						'description' => __( 'Indonesian lead qualification with conditional branching.', 'chatflow-forms' ),
					),
					array(
						'slug'        => 'contact',
						'title'       => __( 'Contact enquiry', 'chatflow-forms' ),
						'description' => __( 'Name, email and a message; no external integrations.', 'chatflow-forms' ),
					),
					array(
						'slug'        => 'feedback',
						'title'       => __( 'Customer feedback', 'chatflow-forms' ),
						'description' => __( 'A satisfaction choice and optional comment.', 'chatflow-forms' ),
					),
				),
			)
		);
	}

	/** @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>} */
	public static function definition( string $slug ): array {
		if ( in_array( $slug, array_column( \ChatFlow\Templates\Starter::gallery(), 'slug' ), true ) ) {
			return \ChatFlow\Templates\Starter::definition( $slug );
		}
		if ( 'imajiner-survey' === $slug ) {
			return Imajiner::definition(); }
		if ( ! in_array( $slug, array( 'contact', 'feedback' ), true ) ) {
			throw new \InvalidArgumentException( 'Unknown template.' ); }
		$step  = static fn( $key, $type, $label, $required ) => array(
			'id'       => 'step_' . $key,
			'key'      => $key,
			'type'     => $type,
			'label'    => $label,
			'messages' => array( $label ),
			'required' => $required,
		);
		$steps = 'contact' === $slug ? array( $step( 'name', 'short_text', __( 'Your name', 'chatflow-forms' ), true ), $step( 'email', 'email', __( 'Your email', 'chatflow-forms' ), true ), $step( 'message', 'long_text', __( 'How can we help?', 'chatflow-forms' ), true ) ) : array(
			array_merge(
				$step( 'satisfaction', 'single_choice', __( 'How was your experience?', 'chatflow-forms' ), true ),
				array(
					'options' => array(
						array(
							'id'    => 'option_great',
							'value' => 'great',
							'label' => __( 'Great', 'chatflow-forms' ),
						),
						array(
							'id'    => 'option_okay',
							'value' => 'okay',
							'label' => __( 'Okay', 'chatflow-forms' ),
						),
						array(
							'id'    => 'option_improve',
							'value' => 'improve',
							'label' => __( 'Needs improvement', 'chatflow-forms' ),
						),
					),
				)
			),
			$step( 'comment', 'long_text', __( 'Anything else to share?', 'chatflow-forms' ), false ),
		);
		return array(
			'title'    => 'contact' === $slug ? __( 'Contact enquiry', 'chatflow-forms' ) : __( 'Customer feedback', 'chatflow-forms' ),
			'schema'   => array(
				'schemaVersion' => 1,
				'bot'           => array(
					'name'        => __( 'Assistant', 'chatflow-forms' ),
					'typingSpeed' => 'normal',
				),
				'steps'         => $steps,
				'endings'       => array(
					array(
						'id'       => 'ending_thanks',
						'type'     => 'message',
						'messages' => array( __( 'Thank you!', 'chatflow-forms' ) ),
					),
				),
			),
			'settings' => array( 'completion' => array( 'defaultEndingId' => 'ending_thanks' ) ),
		);
	}

	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		try {
			$d = self::definition( $request['slug'] );
			return $this->respondForm( $this->forms->create( $d['title'], $d['schema'], $d['settings'] ) );
		} catch ( \InvalidArgumentException $error ) {
			return Database::error( 'cff_not_found', 'Template not found.', 404 ); }
	}

	/** @param array<string,mixed> $settings
	 * @return array<string,mixed> */
	public static function safeSettings( array $settings ): array {
		if ( isset( $settings['integrations']['webhooks'] ) && is_array( $settings['integrations']['webhooks'] ) ) {
			foreach ( $settings['integrations']['webhooks'] as &$hook ) {
				if ( is_array( $hook ) ) {
					$hook['enabled'] = false;
					$hook['secret']  = '';
					$hook['headers'] = array(); }
			}
			unset( $hook );
		}
		return $settings;
	}

	public function duplicate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$form = $this->forms->getDraft( (int) $request['id'] );
		if ( ! $form ) {
			return Database::error( 'cff_not_found', 'Form not found.', 404 ); }
		return $this->respondForm( $this->forms->create( $form->title() . ' (' . __( 'Copy', 'chatflow-forms' ) . ')', $form->schema(), self::safeSettings( $form->settings() ) ) );
	}
	private function respondForm( Form|\WP_Error $form ): \WP_REST_Response|\WP_Error {
		return is_wp_error( $form ) ? $form : $this->respond( $form->toArray(), 201 );
	}
	/** @param array<string,mixed> $data */
	private function respond( array $data, int $status = 200 ): \WP_REST_Response {
		$response = new \WP_REST_Response( $data, $status );
		$response->header( 'Cache-Control', 'private,no-store' );
		return $response;
	}
}
