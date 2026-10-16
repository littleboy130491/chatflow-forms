<?php
namespace ChatFlow\Ai;

/**
 * Chat Completions client for OpenRouter and any OpenAI-compatible endpoint, over
 * the WordPress HTTP API. Server-side only: keys never reach the browser, and
 * provider response bodies are never returned or logged.
 */
final class OpenAiCompatible implements Provider {
	public const OPENROUTER_URL   = 'https://openrouter.ai/api/v1';
	public const OPENROUTER_MODEL = 'openrouter/auto';
	public const OPENROUTER_KEY   = '/^sk-or-[A-Za-z0-9_-]{10,300}$/D';
	/** Bearer tokens for other providers; empty is allowed for keyless local gateways. */
	public const KEY = '/^[A-Za-z0-9._~+\/=:-]{8,400}$/D';
	/** Model IDs such as gpt-4o-mini, openai/gpt-4o or meta-llama/Llama-3.3-70B-Instruct. */
	public const MODEL = '/^[A-Za-z0-9._:\/@+-]{1,200}$/D';

	/** @param array<string,string> $headers extra request headers */
	public function __construct( private string $base_url, private string $api_key, private string $model, private bool $openrouter = false, private array $headers = array() ) {}

	public static function openRouter( string $api_key, string $model ): self {
		return new self(
			self::OPENROUTER_URL,
			$api_key,
			'' !== $model ? $model : self::OPENROUTER_MODEL,
			true,
			array(
				'HTTP-Referer' => home_url( '/' ),
				'X-Title'      => 'ChatFlow Forms',
			)
		);
	}

	public static function validOpenRouterKey( string $key ): bool {
		return (bool) preg_match( self::OPENROUTER_KEY, $key );
	}

	public static function validKey( string $key ): bool {
		return '' === $key || (bool) preg_match( self::KEY, $key );
	}

	public static function validModel( string $model ): bool {
		return (bool) preg_match( self::MODEL, $model );
	}

	/**
	 * An https base URL such as https://api.openai.com/v1 (the client appends
	 * /chat/completions). Plain http is refused unless the cff_ai_allow_http_endpoint
	 * filter allows it, e.g. for a gateway on a trusted private network.
	 */
	public static function validBaseUrl( string $url ): bool {
		// Syntax only: wp_safe_remote_post() re-checks the resolved address on every request.
		if ( '' === $url || strlen( $url ) > 500 || false === filter_var( $url, FILTER_VALIDATE_URL ) ) {
			return false;
		}
		$parts  = wp_parse_url( $url );
		$scheme = is_array( $parts ) ? ( $parts['scheme'] ?? '' ) : '';
		if ( ! is_array( $parts ) || empty( $parts['host'] ) || isset( $parts['user'] ) || isset( $parts['pass'] ) || isset( $parts['query'] ) || isset( $parts['fragment'] ) ) {
			return false;
		}
		return 'https' === $scheme || ( 'http' === $scheme && (bool) apply_filters( 'cff_ai_allow_http_endpoint', false, $url ) );
	}

	public static function endpoint( string $base_url ): string {
		return rtrim( $base_url, '/' ) . '/chat/completions';
	}

	/**
	 * @param array<string,mixed> $schema
	 * @return array<string,mixed>
	 */
	public static function body( string $model, string $system, string $user, array $schema, bool $strict = true, bool $openrouter = false ): array {
		$body                    = array(
			'model'    => $model,
			'messages' => array(
				array(
					'role'    => 'system',
					'content' => $strict ? $system : $system . "\n\nReply with only a JSON object that matches this JSON Schema, with no other text:\n" . wp_json_encode( $schema ),
				),
				array(
					'role'    => 'user',
					'content' => $user,
				),
			),
		);
		$body['response_format'] = $strict
			? array(
				'type'        => 'json_schema',
				'json_schema' => array(
					'name'   => 'cff_output',
					'strict' => true,
					'schema' => $schema,
				),
			)
			: array( 'type' => 'json_object' );
		if ( $openrouter ) {
			// Only route to providers that honour the structured output request.
			$body['provider'] = array( 'require_parameters' => true );
		}
		return $body;
	}

	/**
	 * Decode a Chat Completions response into the JSON object it carries.
	 *
	 * @param array<string,mixed> $response decoded response body
	 * @return array<string,mixed>|string decoded JSON, or an error code
	 */
	public static function parse( array $response ): array|string {
		$choice  = is_array( $response['choices'][0] ?? null ) ? $response['choices'][0] : array();
		$message = is_array( $choice['message'] ?? null ) ? $choice['message'] : array();
		$finish  = $choice['finish_reason'] ?? '';
		if ( ! empty( $message['refusal'] ) || 'content_filter' === $finish ) {
			return 'cff_ai_refused';
		}
		if ( 'length' === $finish ) {
			return 'cff_ai_incomplete';
		}
		$text = is_string( $message['content'] ?? null ) ? trim( $message['content'] ) : '';
		// Models without native JSON mode sometimes wrap the object in a Markdown fence.
		if ( preg_match( '/^```(?:json)?\s*(.*?)\s*```$/s', $text, $fence ) ) {
			$text = $fence[1];
		}
		$data = json_decode( $text, true );
		return is_array( $data ) && ! array_is_list( $data ) ? $data : 'cff_ai_invalid_output';
	}

	/**
	 * @param array<string,mixed> $schema
	 * @return array<string,mixed>|\WP_Error
	 */
	public function json( string $system, string $user, array $schema, string $effort ): array|\WP_Error {
		$result = $this->request( self::body( $this->model, $system, $user, $schema, true, $this->openrouter ) );
		// Endpoints without JSON Schema support usually answer 400; retry once in plain JSON mode.
		if ( 400 === $result ) {
			$result = $this->request( self::body( $this->model, $system, $user, $schema, false, $this->openrouter ) );
		}
		if ( is_int( $result ) ) {
			return Claude::error( Claude::statusCode( $result ) ?? 'cff_ai_unavailable' );
		}
		return $result;
	}

	/**
	 * @param array<string,mixed> $body
	 * @return array<string,mixed>|int|\WP_Error decoded JSON, an HTTP error status, or an error
	 */
	private function request( array $body ): array|int|\WP_Error {
		$headers = array( 'Content-Type' => 'application/json' ) + $this->headers;
		if ( '' !== $this->api_key ) {
			$headers['Authorization'] = 'Bearer ' . $this->api_key;
		}
		$response = wp_safe_remote_post(
			self::endpoint( $this->base_url ),
			array(
				'headers'     => $headers,
				'body'        => (string) wp_json_encode( $body ),
				'timeout'     => 120,
				'redirection' => 0,
				'sslverify'   => true,
			)
		);
		if ( is_wp_error( $response ) ) {
			return Claude::error( 'cff_ai_unavailable' );
		}
		$status = (int) wp_remote_retrieve_response_code( $response );
		if ( $status < 200 || $status >= 300 ) {
			return $status;
		}
		$decoded = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		$data    = is_array( $decoded ) ? self::parse( $decoded ) : 'cff_ai_invalid_output';
		return is_string( $data ) ? Claude::error( $data ) : $data;
	}
}
