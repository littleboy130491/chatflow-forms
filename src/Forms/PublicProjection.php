<?php
namespace ChatFlow\Forms;

use ChatFlow\Integrations\HookDispatcher;

final class PublicProjection {
	/** @param list<string> $types @return array<string,mixed> */
	public static function build( Form $form, array $types = SchemaValidator::V1_TYPES ): array {
		$schema = $form->schema();
		// Cookie/default hidden sources stay on the server until an uncached handshake.
		foreach ( $schema['steps'] as &$step ) {
			if ( 'hidden' === $step['type'] ) {
				unset( $step['defaultValue'] ); }
		}
		unset( $step );
		$settings = $form->settings();
		$session  = $settings['sessions'] ?? array();
		$envelope = array(
			'form'     => array(
				'id'         => $form->id(),
				'title'      => $form->title(),
				'slug'       => $form->slug(),
				'version'    => $form->version(),
				'schema'     => $schema,
				'appearance' => (object) ( $settings['appearance'] ?? $schema['appearance'] ?? array() ),
				'phrases'    => (object) ( $settings['phrases'] ?? array() ),
				'session'    => array(
					'resumeEnabled' => ( $session['resumeEnabled'] ?? true ) && ( $session['savePartial'] ?? true ),
					'resumePrompt'  => $session['resumePrompt'] ?? true,
					'resumeDays'    => $session['resumeDays'] ?? 30,
					'savePartial'   => $session['savePartial'] ?? true,
				),
			),
			'features' => array(
				'fieldTypes' => $types,
				'uploads'    => false,
			),
		);
		$ids      = array();
		if ( ! empty( $schema['bot']['avatar'] ) ) {
			$ids[] = $schema['bot']['avatar']; }
		foreach ( $schema['steps'] as $step ) {
			foreach ( $step['options'] ?? array() as $option ) {
				if ( ! empty( $option['image'] ) ) {
					$ids[] = $option['image']; }
			}
		}
		$media = array();
		foreach ( array_unique( $ids ) as $id ) {
			$url = wp_get_attachment_image_url( (int) $id, 'large' );
			if ( $url ) {
				$media[ (string) $id ] = array(
					'url' => esc_url_raw( $url ),
					'alt' => sanitize_text_field( (string) get_post_meta( (int) $id, '_wp_attachment_image_alt', true ) ),
				); }
		}
		$envelope['form']['media'] = (object) $media;
		$filtered                  = HookDispatcher::filter( 'cff_public_schema', $envelope, array( $form ) );
		// Filters can safely customize display copy; never expand the credential/settings boundary.
		if ( is_array( $filtered ) ) {
			foreach ( array( 'appearance', 'phrases' ) as $key ) {
				$value = $filtered['form'][ $key ] ?? null;
				if ( is_array( $value ) || is_object( $value ) ) {
					$errors = ( new SchemaValidator() )->validateSettings( array( $key => (object) $value ) );
					if ( ! $errors ) {
						$envelope['form'][ $key ] = (object) $value; }
				}
			}
		}
		return $envelope;
	}
}
