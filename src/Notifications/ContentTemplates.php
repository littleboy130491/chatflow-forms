<?php
namespace ChatFlow\Notifications;

use ChatFlow\Rest\RestModule;
use ChatFlow\Submissions\Database;

final class ContentTemplates {

	public function register(): void {
		foreach ( array( 'GET', 'POST', 'DELETE' ) as $method ) {
			register_rest_route(
				'cff/v1',
				'/admin/notifications/templates',
				array(
					'methods'             => $method,
					'permission_callback' => static fn( $r ) => RestModule::authorize( $r, 'cff_manage_forms' ),
					'callback'            => array( $this, 'handle' ),
				)
			);
		}
	}

	public function handle( \WP_REST_Request $r ): \WP_REST_Response|\WP_Error {
		$templates = get_option( 'cff_email_content_templates', array() );
		if ( ! is_array( $templates ) ) {
			$templates = array();
		}
		if ( 'POST' === $r->get_method() ) {
			$body = (array) $r->get_json_params();
			if ( array_diff( array_keys( $body ), array( 'title', 'subject', 'body' ) ) || ! is_string( $body['title'] ?? null ) || ! trim( $body['title'] ) || strlen( $body['title'] ) > 200 || ! is_string( $body['subject'] ?? null ) || strlen( $body['subject'] ) > 500 || preg_match( '/[\r\n]/', $body['subject'] ) || ! is_string( $body['body'] ?? null ) || strlen( $body['body'] ) > 100000 || count( $templates ) >= 50 ) {
				return Database::error( 'cff_template_invalid', 'Choose a title and bounded email content (maximum 50 templates).', 422 );
			}
			$templates[] = array(
				'id'      => wp_generate_uuid4(),
				'title'   => sanitize_text_field( $body['title'] ),
				'subject' => sanitize_text_field( $body['subject'] ),
				'body'    => wp_kses_post( $body['body'] ),
			);
			update_option( 'cff_email_content_templates', $templates, false );
		} elseif ( 'DELETE' === $r->get_method() ) {
			$id = $r->get_param( 'id' );
			if ( ! is_string( $id ) || ! wp_is_uuid( $id ) ) {
				return Database::error( 'cff_template_invalid', 'Template ID required.', 422 );
			}
			$templates = array_values( array_filter( $templates, static fn( $template ) => $template['id'] !== $id ) );
			update_option( 'cff_email_content_templates', $templates, false );
		}
		$response = new \WP_REST_Response( array( 'items' => $templates ) );
		$response->header( 'Cache-Control', 'private,no-store' );
		return $response;
	}
}
