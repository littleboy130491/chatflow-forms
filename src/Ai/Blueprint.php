<?php
namespace ChatFlow\Ai;

use ChatFlow\Fields\AbstractField;
use ChatFlow\Templates\Starter;

/**
 * The small intermediate shape Claude fills for "generate a form from a prompt",
 * and its mapping onto a real draft. Kept deliberately simpler than the form
 * schema: IDs, keys, option values and settings are always assigned here, never
 * by the model. Pure, so it is unit-testable without WordPress.
 */
final class Blueprint {
	public const TYPES     = array( 'short_text', 'long_text', 'email', 'phone', 'number', 'rating', 'scale', 'nps', 'date', 'single_choice', 'multi_choice', 'yes_no', 'consent', 'statement' );
	public const MAX_STEPS = 30;

	/**
	 * JSON Schema for `output_config.format` (structured outputs: no length or count constraints).
	 *
	 * @return array<string,mixed>
	 */
	public static function schema(): array {
		return array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'required'             => array( 'title', 'botName', 'steps', 'ending' ),
			'properties'           => array(
				'title'   => array( 'type' => 'string' ),
				'botName' => array( 'type' => 'string' ),
				'steps'   => array(
					'type'  => 'array',
					'items' => array(
						'type'                 => 'object',
						'additionalProperties' => false,
						'required'             => array( 'type', 'label', 'message', 'required', 'options' ),
						'properties'           => array(
							'type'     => array( 'enum' => self::TYPES ),
							'label'    => array( 'type' => 'string' ),
							'message'  => array( 'type' => 'string' ),
							'required' => array( 'type' => 'boolean' ),
							'options'  => array(
								'type'  => 'array',
								'items' => array( 'type' => 'string' ),
							),
						),
					),
				),
				'ending'  => array( 'type' => 'string' ),
			),
		);
	}

	/**
	 * Field key from a label, unique within the form (mirrors the builder's uniqueKey).
	 *
	 * @param list<string> $taken
	 */
	public static function key( string $label, array $taken ): string {
		$base = strtolower( $label );
		$base = preg_replace( '/[^a-z0-9_]+/', '_', $base ) ?? '';
		$base = substr( ltrim( $base, '_0123456789' ), 0, 55 );
		$base = rtrim( $base, '_' );
		$base = '' === $base ? 'field' : $base;
		$key  = $base;
		for ( $n = 2; in_array( $key, $taken, true ); $n++ ) {
			$key = $base . '_' . $n;
		}
		return $key;
	}

	private static function line( mixed $value, int $limit ): string {
		return is_string( $value ) ? mb_substr( AbstractField::plainText( $value ), 0, $limit, 'UTF-8' ) : '';
	}

	/**
	 * @param array<string,mixed> $blueprint decoded model output
	 * @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>}|string form definition, or an error code
	 */
	public static function toForm( array $blueprint ): array|string {
		$title = self::line( $blueprint['title'] ?? '', 120 );
		$steps = array();
		$keys  = array();
		foreach ( array_slice( is_array( $blueprint['steps'] ?? null ) ? $blueprint['steps'] : array(), 0, self::MAX_STEPS ) as $raw ) {
			$type    = is_array( $raw ) ? ( $raw['type'] ?? '' ) : '';
			$label   = self::line( $raw['label'] ?? '', 200 );
			$message = self::line( $raw['message'] ?? '', 1000 );
			if ( ! in_array( $type, self::TYPES, true ) || '' === $label ) {
				continue;
			}
			$key    = self::key( $label, $keys );
			$keys[] = $key;
			$extra  = array();
			if ( in_array( $type, array( 'single_choice', 'multi_choice' ), true ) ) {
				$labels = array_values( array_unique( array_filter( array_map( static fn( $option ) => self::line( $option, 100 ), (array) ( $raw['options'] ?? array() ) ) ) ) );
				if ( count( $labels ) < 2 ) {
					continue;
				}
				$extra['options'] = Starter::options( $key, array_slice( $labels, 0, 20 ) );
			}
			if ( 'consent' === $type ) {
				$extra['settings'] = array( 'consentText' => '' !== $message ? $message : $label );
			}
			if ( 'phone' === $type ) {
				$extra['settings'] = array( 'country' => 'ID' );
			}
			$required = 'consent' === $type || ( 'statement' !== $type && true === ( $raw['required'] ?? false ) );
			$steps[]  = Starter::step( $key, $type, $label, array( '' !== $message ? $message : $label ), $required, $extra );
		}
		if ( '' === $title || ! $steps ) {
			return 'cff_ai_empty_form';
		}
		$ending = self::line( $blueprint['ending'] ?? '', 500 );
		$form   = Starter::form( $title, $steps, '' !== $ending ? $ending : 'Thank you!' );
		$bot    = self::line( $blueprint['botName'] ?? '', 60 );
		if ( '' !== $bot ) {
			$form['schema']['bot']['name'] = $bot;
		}
		return $form;
	}

	/**
	 * Accept rewritten copy only for known IDs, as plain text, keeping every
	 * merge tag ({{key}}) of the original; otherwise the original stays.
	 *
	 * @param array<string,string> $originals id => text sent
	 * @param mixed                $output    decoded model output
	 * @return array<string,string> id => accepted rewrite
	 */
	public static function acceptRewrites( array $originals, mixed $output ): array {
		$accepted = array();
		foreach ( is_array( $output['items'] ?? null ) ? $output['items'] : array() as $item ) {
			$id = is_array( $item ) && is_string( $item['id'] ?? null ) ? $item['id'] : '';
			if ( ! isset( $originals[ $id ] ) || isset( $accepted[ $id ] ) ) {
				continue;
			}
			$text = is_string( $item['text'] ?? null ) ? mb_substr( AbstractField::plainText( $item['text'], true ), 0, 2000, 'UTF-8' ) : '';
			if ( '' === $text || self::tags( $text ) !== self::tags( $originals[ $id ] ) ) {
				continue;
			}
			$accepted[ $id ] = $text;
		}
		return $accepted;
	}

	/** @return list<string> sorted merge tags in a text */
	public static function tags( string $text ): array {
		preg_match_all( '/\{\{\s*[^{}]+?\s*\}\}/', $text, $matches );
		$tags = array_map( static fn( $tag ) => preg_replace( '/\s+/', '', $tag ) ?? '', $matches[0] );
		sort( $tags );
		return $tags;
	}
}
