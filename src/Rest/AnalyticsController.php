<?php
namespace ChatFlow\Rest;

use ChatFlow\Analytics\Report;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Submissions\Database;

final class AnalyticsController {
	public function __construct( private FormRepository $forms ) {}
	public function register(): void {
		register_rest_route(
			'cff/v1',
			'/admin/analytics',
			array(
				'methods'             => 'GET',
				'permission_callback' => static fn( $request ) => RestModule::authorize( $request, 'cff_view_submissions' ),
				'callback'            => array( $this, 'get' ),
			)
		);
		register_rest_route(
			'cff/v1',
			'/admin/analytics/forms',
			array(
				'methods'             => 'GET',
				'permission_callback' => static fn( $request ) => RestModule::authorize( $request, 'cff_view_submissions' ),
				'callback'            => array( $this, 'forms' ),
			)
		);
	}
	public function forms( \WP_REST_Request $request ): \WP_REST_Response {
		$page  = max( 1, min( 100000, absint( $request['page'] ?? 1 ) ) );
		$query = new \WP_Query(
			array(
				'post_type'      => 'cff_form',
				'post_status'    => array( 'draft', 'publish' ),
				'posts_per_page' => 100,
				'paged'          => $page,
				'orderby'        => 'ID',
				'order'          => 'DESC',
				's'              => sanitize_text_field( (string) ( $request['search'] ?? '' ) ),
			)
		);
		$items = array();
		foreach ( $query->posts as $post ) {
			$items[] = array(
				'id'    => $post->ID,
				'title' => get_the_title( $post ),
			);
		}
		$response = new \WP_REST_Response(
			array(
				'items' => $items,
				'pages' => (int) $query->max_num_pages,
			)
		);
		$response->header( 'Cache-Control', 'private,no-store' );
		return $response;
	}
	public function get( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		try {
			if ( array_diff( array_keys( $request->get_query_params() ), array( 'formId', 'from', 'to' ) ) || ! ctype_digit( (string) $request['formId'] ) || ! is_string( $request['from'] ) || ! is_string( $request['to'] ) ) {
				throw new \InvalidArgumentException();
			}
			$data = ( new Report( $this->forms ) )->get( (int) $request['formId'], $request['from'], $request['to'] );
			if ( is_wp_error( $data ) ) {
				return $data; }
			$response = new \WP_REST_Response( $data );
			$response->header( 'Cache-Control', 'private,no-store' );
			return $response;
		} catch ( \InvalidArgumentException | \TypeError $error ) {
			return Database::error( 'cff_analytics_invalid', 'Choose a form and valid dates (maximum 367 days).', 422 );
		} catch ( \Throwable $error ) {
			return Database::error( 'cff_analytics_unavailable', 'Analytics storage is unavailable.', 503 );
		}
	}
}
