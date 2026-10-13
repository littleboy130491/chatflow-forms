<?php
namespace ChatFlow\Admin;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;

final class Translations implements Module {
	public function register(): void {
		add_action( 'cff_form_published', array( $this, 'strings' ) );
		add_action( 'admin_init', array( $this, 'registerPublished' ) );
		add_filter( 'cff_public_display', array( $this, 'display' ) );
		add_filter( 'rest_pre_dispatch', array( $this, 'uncached' ), 30, 3 );
		add_filter( 'rest_post_dispatch', array( $this, 'response' ), 30, 3 );
	}
	public function registerPublished(): void {
		if ( ! current_user_can( 'cff_manage_forms' ) || ! function_exists( 'pll_register_string' ) && ! has_action( 'wpml_register_single_string' ) ) {
			return; }
		$forms = new FormRepository();
		$page  = 1;
		do {
			$query = new \WP_Query(
				array(
					'post_type'      => 'cff_form',
					'post_status'    => 'publish',
					'posts_per_page' => 100,
					'paged'          => $page,
					'fields'         => 'ids',
					'orderby'        => 'ID',
					'order'          => 'ASC',
				)
			);
			foreach ( $query->posts as $id ) {
				$form = $forms->getPublished( (int) $id );
				if ( $form ) {
					$this->strings( $form ); }
			}
			++$page;
		} while ( $page <= $query->max_num_pages );
	}
	public function strings( Form $form ): void {
		$register = static function ( string $name, string $value ) use ( $form ): string {
			$context = 'ChatFlow form ' . $form->id();
			do_action( 'wpml_register_single_string', $context, $name, $value );
			if ( function_exists( 'pll_register_string' ) ) {
				pll_register_string( $name, $value, $context, true ); }
			return $value;
		};
		self::copy(
			array(
				'schema'  => $form->schema(),
				'phrases' => $form->settings()['phrases'] ?? array(),
			),
			$register
		);
	}

	/** @param array<string,mixed> $display
	 * @return array<string,mixed> */
	public static function copy( array $display, callable $translate ): array {
		$text = static function ( $value, string $name ) use ( $translate ): string {
			$original = (string) $value;
			$result   = $translate( $name, $original );
			if ( ! is_string( $result ) || strlen( $result ) > 20000 ) {
				return $original; }
			preg_match_all( '/\{\{[^}]+\}\}/', $original, $before );
			preg_match_all( '/\{\{[^}]+\}\}/', $result, $after );
			sort( $before[0] );
			sort( $after[0] );
			return $before[0] === $after[0] ? $result : $original;
		};
		if ( isset( $display['schema']['bot']['name'] ) ) {
			$display['schema']['bot']['name'] = $text( $display['schema']['bot']['name'], 'bot.name' ); }
		foreach ( $display['schema']['steps'] ?? array() as $index => $step ) {
			foreach ( array( 'label', 'description', 'placeholder', 'help' ) as $key ) {
				if ( isset( $step[ $key ] ) ) {
					$display['schema']['steps'][ $index ][ $key ] = $text( $step[ $key ], $step['id'] . '.' . $key ); }
			}
			foreach ( $step['messages'] as $i => $message ) {
				$display['schema']['steps'][ $index ]['messages'][ $i ] = $text( $message, $step['id'] . '.message.' . $i ); }
			foreach ( $step['options'] ?? array() as $i => $option ) {
				foreach ( array( 'label', 'reaction' ) as $key ) {
					if ( isset( $option[ $key ] ) ) {
						$display['schema']['steps'][ $index ]['options'][ $i ][ $key ] = $text( $option[ $key ], $option['id'] . '.' . $key ); }
				}
			}
			foreach ( array( 'consentText', 'buttonLabel' ) as $key ) {
				if ( isset( $step['settings'][ $key ] ) ) {
					$display['schema']['steps'][ $index ]['settings'][ $key ] = $text( $step['settings'][ $key ], $step['id'] . '.' . $key ); }
			}
			if ( isset( $step['settings']['media']['alt'] ) ) {
				$display['schema']['steps'][ $index ]['settings']['media']['alt'] = $text( $step['settings']['media']['alt'], $step['id'] . '.media.alt' ); }
		}
		foreach ( $display['schema']['endings'] ?? array() as $index => $ending ) {
			foreach ( $ending['messages'] ?? array() as $i => $message ) {
				$display['schema']['endings'][ $index ]['messages'][ $i ] = $text( $message, $ending['id'] . '.message.' . $i ); }
			if ( isset( $ending['button']['label'] ) ) {
				$display['schema']['endings'][ $index ]['button']['label'] = $text( $ending['button']['label'], $ending['id'] . '.button.label' ); }
		}
		foreach ( (array) ( $display['phrases'] ?? array() ) as $key => $phrase ) {
			$phrases[ $key ] = $text( $phrase, 'phrase.' . $key ); }
		$display['phrases'] = (object) ( $phrases ?? array() );
		return $display;
	}

	/** @param array<string,mixed> $data
	 * @return array<string,mixed> */
	public function display( array $data ): array {
		if ( ! self::active() ) {
			return $data; }
		if ( ! isset( $data['form']['schema'], $data['form']['id'] ) ) {
			return $data; }
		$id           = (int) $data['form']['id'];
		$data['form'] = self::copy(
			$data['form'],
			static function ( $name, $value ) use ( $id ) {
				$value = apply_filters( 'wpml_translate_single_string', $value, 'ChatFlow form ' . $id, $name );
				return function_exists( 'pll__' ) ? pll__( $value ) : $value;
			}
		);
		return $data;
	}
	private static function active(): bool {
		return (bool) has_filter( 'wpml_translate_single_string' ) || function_exists( 'pll__' ); }
	public function uncached( mixed $response, \WP_REST_Server $server, \WP_REST_Request $request ): mixed {
		if ( self::active() && preg_match( '#^/cff/v1/forms/\d+$#D', $request->get_route() ) ) {
			$request->set_header( 'If-None-Match', '' ); }
		return $response;
	}
	public function response( \WP_REST_Response $response, \WP_REST_Server $server, \WP_REST_Request $request ): \WP_REST_Response {
		if ( ! self::active() || ! preg_match( '#^/cff/v1/forms/\d+$#D', $request->get_route() ) ) {
			return $response; }
		$data = $response->get_data();
		if ( ! is_array( $data ) || ! isset( $data['form']['schema'], $data['form']['id'] ) ) {
			return $response; }
		$data = $this->display( $data );
		$response->set_data( $data );
		$response->header( 'Cache-Control', 'private,no-store' );
		$response->header( 'ETag', '"' . hash( 'sha256', wp_json_encode( $data ) ) . '"' );
		return $response;
	}
}
