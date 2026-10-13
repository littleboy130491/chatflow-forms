<?php
namespace ChatFlow\Notifications;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Submission;
use ChatFlow\Submissions\Repository;
use ChatFlow\Integrations\Outbox;
use ChatFlow\Integrations\Payload;

final class NotificationsModule implements Module {
	public function __construct( private FormRepository $forms ) {}

	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'routes' ) );
	}

	public function routes(): void {
		foreach ( array( 'test', 'preview' ) as $operation ) {
			register_rest_route(
				'cff/v1',
				'/admin/notifications/' . $operation,
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, $operation ),
					'permission_callback' => fn( \WP_REST_Request $request ) => $this->authorize( $request, 'cff_manage_forms' ),
				)
			);
		}
		register_rest_route(
			'cff/v1',
			'/admin/submissions/(?P<id>\d+)/retry',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'retry' ),
				'permission_callback' => fn( \WP_REST_Request $request ) => $this->authorize( $request, 'cff_edit_submissions' ),
			)
		);
		register_rest_route(
			'cff/v1',
			'/admin/submissions/(?P<id>\d+)/activity',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'activity' ),
				'permission_callback' => fn( \WP_REST_Request $request ) => $this->authorize( $request, 'cff_view_submissions' ),
			)
		);
	}

	public function authorize( \WP_REST_Request $request, string $capability ): bool|\WP_Error {
		nocache_headers();
		if ( ! is_user_logged_in() || ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) || ! current_user_can( $capability ) ) {
			return new \WP_Error( 'cff_forbidden', __( 'You are not allowed to manage deliveries.', 'chatflow-forms' ), array( 'status' => 403 ) );
		}
		return true;
	}

	public function test( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$form = $this->forms->getPublished( (int) $request->get_param( 'formId' ) );
		$to   = $request->get_param( 'to' );
		if ( ! $form ) {
			return new \WP_Error( 'cff_form_unpublished', __( 'Publish the form before queuing a test; draft previews are available separately.', 'chatflow-forms' ), array( 'status' => 422 ) );
		}
		if ( ! is_string( $to ) || ! is_email( $to ) || preg_match( '/[\r\n]/', $to ) ) {
			return new \WP_Error( 'cff_invalid_email', __( 'Enter a valid test email address.', 'chatflow-forms' ), array( 'status' => 422 ) );
		}
		$found = $this->notification( $form, (string) $request->get_param( 'notificationId' ) );
		if ( ! $found ) {
			return $this->missing();
		}
		try {
			$sample  = $this->sample( $form, $request );
			$payload = array(
				'form'      => array( 'id' => $form->id() ),
				'recipient' => $to,
				'sample'    => Payload::build( $sample, $form ),
			);
			$id      = ( new Outbox() )->insert( 0, $form->version(), 'notification.test', $found['channel'], $found['notification']['id'], $payload, wp_generate_uuid4() );
			( new Outbox() )->schedule( array( $id ) );
			return $this->response(
				array(
					'queued'     => true,
					'deliveryId' => $id,
				)
			);
		} catch ( \Throwable $error ) {
			return new \WP_Error( 'cff_test_queue_failed', __( 'The test could not be queued.', 'chatflow-forms' ), array( 'status' => 500 ) );
		}
	}

	public function preview( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$form  = $this->forms->getDraft( (int) $request->get_param( 'formId' ) );
		$found = $form ? $this->notification( $form, (string) $request->get_param( 'notificationId' ) ) : null;
		if ( ! $found ) {
			return $this->missing();
		}
		try {
			return $this->response( ( new Renderer() )->render( $found['notification'], $this->sample( $form, $request ), $form, 'admin_mail' === $found['channel'] ) );
		} catch ( \Throwable $error ) {
			return new \WP_Error( 'cff_preview_failed', __( 'The notification could not be previewed.', 'chatflow-forms' ), array( 'status' => 500 ) );
		}
	}

	public function retry( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id         = (int) $request->get_param( 'id' );
		$submission = ( new Repository() )->get( $id );
		if ( ! $submission || in_array( $submission->status(), array( 'spam', 'trash' ), true ) ) {
			return $this->missing();
		}
		$delivery_id = (int) $request->get_param( 'deliveryId' );
		if ( ! ( new Outbox() )->retry( $delivery_id, $id ) ) {
			return new \WP_Error( 'cff_retry_conflict', __( 'Only a sent or failed delivery belonging to this submission can be retried.', 'chatflow-forms' ), array( 'status' => 409 ) );
		}
		return $this->response( array( 'queued' => true ) );
	}

	public function activity( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		global $wpdb;
		$id = (int) $request->get_param( 'id' );
		if ( ! ( new Repository() )->get( $id ) ) {
			return $this->missing();
		}
		$page       = max( 1, (int) ( $request->get_param( 'page' ) ?? 1 ) );
		$limit      = min( 100, max( 1, (int) ( $request->get_param( 'perPage' ) ?? 20 ) ) );
		$rows       = $wpdb->get_results( $wpdb->prepare( "SELECT id,type,body,created_at FROM {$wpdb->prefix}cff_submission_notes WHERE submission_id=%d AND type='delivery' ORDER BY id DESC LIMIT %d OFFSET %d", $id, $limit, ( $page - 1 ) * $limit ), ARRAY_A );
		$deliveries = $wpdb->get_results( $wpdb->prepare( "SELECT id,event,channel,destination_id,status,attempts,last_error,next_attempt_at,created_at,updated_at FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d ORDER BY id DESC LIMIT %d OFFSET %d", $id, $limit, ( $page - 1 ) * $limit ), ARRAY_A );
		return $this->response(
			array(
				'items'      => $rows,
				'deliveries' => $deliveries,
				'page'       => $page,
				'perPage'    => $limit,
			)
		);
	}

	private function sample( Form $form, \WP_REST_Request $request ): Submission {
		$answers = array();
		$past_id = (int) $request->get_param( 'submissionId' );
		if ( $past_id ) {
			$past = ( new Repository() )->get( $past_id );
			if ( ! $past || $past->formId() !== $form->id() || in_array( $past->status(), array( 'trash', 'spam' ), true ) || ! current_user_can( 'cff_view_submissions' ) ) {
				throw new \InvalidArgumentException( 'Past submission unavailable.' );
			}
			$answers = $past->answers();
		} else {
			$input = $request->get_param( 'answers' );
			if ( null !== $input && ( ! is_array( $input ) || strlen( wp_json_encode( $input ) ) > 1048576 ) ) {
				throw new \InvalidArgumentException( 'Invalid sample answers.' );
			}
			foreach ( $form->schema()['steps'] ?? array() as $step ) {
				if ( in_array( $step['type'], array( 'statement', 'summary', 'media', 'hidden' ), true ) ) {
					continue;
				}
				$value = match ( $step['type'] ) {
					'email' => 'sample@example.org', 'phone' => '+628123456789', 'number' => 1,
					'date' => gmdate( 'Y-m-d' ), 'yes_no', 'consent' => true,
					'single_choice' => $step['options'][0]['value'] ?? '',
					'multi_choice' => array( $step['options'][0]['value'] ?? '' ),
					default => __( 'Sample answer', 'chatflow-forms' ),
				};
				$answers[ $step['key'] ] = Payload::jsonValue( $input[ $step['key'] ] ?? $value );
			}
		}
		return new Submission(
			array(
				'id'           => 0,
				'uuid'         => wp_generate_uuid4(),
				'form_id'      => $form->id(),
				'form_version' => $form->version(),
				'status'       => 'completed',
				'answers'      => $answers,
				'meta'         => array(),
				'ending_id'    => '',
				'created_at'   => gmdate( 'Y-m-d H:i:s' ),
				'duration_ms'  => 0,
			),
			$form
		);
	}

	/** @return array{channel:string,notification:array<string,mixed>}|null */
	private function notification( Form $form, string $id ): ?array {
		foreach ( array(
			'admin'          => 'admin_mail',
			'autoresponders' => 'autoresponder',
		) as $group => $channel ) {
			foreach ( $form->settings()['notifications'][ $group ] ?? array() as $notification ) {
				if ( $notification['id'] === $id ) {
					return array(
						'channel'      => $channel,
						'notification' => $notification,
					);
				}
			}
		}
		return null;
	}

	private function missing(): \WP_Error {
		return new \WP_Error( 'cff_not_found', __( 'Notification or submission not found.', 'chatflow-forms' ), array( 'status' => 404 ) );
	}

	/** @param array<string,mixed> $data */
	private function response( array $data ): \WP_REST_Response {
		$response = new \WP_REST_Response( $data );
		$response->header( 'Cache-Control', 'private, no-store' );
		return $response;
	}
}
