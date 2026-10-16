<?php
namespace ChatFlow\Ai;

use ChatFlow\Submissions\Database;

/**
 * Minimal Claude Messages API client (the Anthropic provider) over the WordPress HTTP API (the site owner
 * chose this over bundling the PHP SDK). Server-side only: the key never reaches
 * the browser, and provider response bodies are never returned or logged.
 */
final class Claude implements Provider {
	public const ENDPOINT = 'https://api.anthropic.com/v1/messages';
	public const MODEL    = 'claude-opus-5-5';
	public const KEY      = '/^sk-ant-[A-Za-z0-9_-]{20,300}$/D';

	public function __construct( private string $api_key ) {}

	public static function validKey( string $key ): bool {
		return (bool) preg_match( self::KEY, $key );
	}

	/**
	 * The request body: structured JSON output, refusal fallback routed by
	 * category, and effort as the only depth control (thinking stays adaptive).
	 *
	 * @param array<string,mixed> $schema
	 * @return array<string,mixed>
	 */
	public static function body( string $system, string $user, array $schema, string $effort ): array {
		return array(
			'model'         => function_exists( 'apply_filters' ) ? (string) apply_filters( 'cff_ai_model', self::MODEL ) : self::MODEL,
			'max_tokens'    => 16000,
			'system'        => $system,
			'messages'      => array(
				array(
					'role'    => 'user',
					'content' => $user,
				),
			),
			'output_config' => array(
				'effort' => $effort,
				'format' => array(
					'type'   => 'json_schema',
					'schema' => $schema,
				),
			),
			'fallbacks'     => 'default',
		);
	}

	/**
	 * Decode a Messages API response into the structured JSON it carries.
	 *
	 * @param array<string,mixed> $response decoded response body
	 * @return array<string,mixed>|string decoded JSON, or an error code
	 */
	public static function parse( array $response ): array|string {
		$stop = $response['stop_reason'] ?? '';
		if ( 'refusal' === $stop ) {
			return 'cff_ai_refused';
		}
		if ( 'max_tokens' === $stop ) {
			return 'cff_ai_incomplete';
		}
		$text = '';
		foreach ( is_array( $response['content'] ?? null ) ? $response['content'] : array() as $block ) {
			if ( is_array( $block ) && 'text' === ( $block['type'] ?? '' ) && is_string( $block['text'] ?? null ) ) {
				$text .= $block['text'];
			}
		}
		$data = json_decode( $text, true );
		return is_array( $data ) ? $data : 'cff_ai_invalid_output';
	}

	/** Generic, user-facing message per error code; provider bodies are never shown. */
	public static function error( string $code ): \WP_Error {
		$messages             = array(
			'cff_ai_not_configured' => array( 'Configure an AI provider in ChatFlow Settings to use AI assist.', 400 ),
			'cff_ai_auth'           => array( 'The AI provider rejected the API key. Check it in ChatFlow Settings.', 502 ),
			'cff_ai_rate_limited'   => array( 'AI assist is busy or rate limited. Wait a moment and try again.', 429 ),
			'cff_ai_unavailable'    => array( 'The AI provider is unavailable right now. Try again shortly.', 502 ),
			'cff_ai_refused'        => array( 'The AI model declined this request. Rephrase it and try again.', 422 ),
			'cff_ai_incomplete'     => array( 'The response was cut off. Ask for a shorter form and try again.', 502 ),
			'cff_ai_invalid_output' => array( 'The AI model returned an unusable response. Try again, or choose a model that supports JSON output.', 502 ),
			'cff_ai_empty_form'     => array( 'No usable questions were generated. Describe the form in more detail.', 422 ),
		);
		[ $message, $status ] = $messages[ $code ] ?? array( 'AI assist failed. Try again.', 502 );
		return Database::error( $code, $message, $status );
	}

	/** Map an HTTP status to an error code (null for success). */
	public static function statusCode( int $status ): ?string {
		if ( $status >= 200 && $status < 300 ) {
			return null;
		}
		if ( 401 === $status || 403 === $status ) {
			return 'cff_ai_auth';
		}
		if ( 429 === $status ) {
			return 'cff_ai_rate_limited';
		}
		return 'cff_ai_unavailable';
	}

	/**
	 * @param array<string,mixed> $schema
	 * @return array<string,mixed>|\WP_Error
	 */
	public function json( string $system, string $user, array $schema, string $effort ): array|\WP_Error {
		$response = wp_safe_remote_post(
			self::ENDPOINT,
			array(
				'headers'     => array(
					'Content-Type'      => 'application/json',
					'x-api-key'         => $this->api_key,
					'anthropic-version' => '2023-06-01',
					'anthropic-beta'    => 'server-side-fallback-2026-07-01',
				),
				'body'        => (string) wp_json_encode( self::body( $system, $user, $schema, $effort ) ),
				'timeout'     => 120,
				'redirection' => 0,
				'sslverify'   => true,
			)
		);
		if ( is_wp_error( $response ) ) {
			return self::error( 'cff_ai_unavailable' );
		}
		$code = self::statusCode( (int) wp_remote_retrieve_response_code( $response ) );
		if ( $code ) {
			return self::error( $code );
		}
		$decoded = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		$data    = is_array( $decoded ) ? self::parse( $decoded ) : 'cff_ai_invalid_output';
		return is_string( $data ) ? self::error( $data ) : $data;
	}
}
