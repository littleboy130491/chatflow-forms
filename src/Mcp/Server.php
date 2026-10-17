<?php
namespace ChatFlow\Mcp;

/**
 * A stateless Model Context Protocol server (JSON-RPC 2.0 over Streamable HTTP,
 * JSON responses only). Transport-free, so it is testable without HTTP: the REST
 * route hands every decoded message to handle() and returns what comes back.
 */
final class Server {
	public const PROTOCOL_VERSIONS = array( '2025-06-18', '2025-03-26', '2024-11-05' );
	public const PARSE_ERROR       = -32700;
	public const INVALID_REQUEST   = -32600;
	public const METHOD_NOT_FOUND  = -32601;
	public const INVALID_PARAMS    = -32602;
	public const INTERNAL_ERROR    = -32603;

	public function __construct( private Tools $tools, private Resources $resources ) {}

	/**
	 * Handle one message or a batch; null when nothing needs a reply (notifications).
	 *
	 * @return array<mixed>|null
	 */
	public function handle( mixed $payload ): ?array {
		if ( is_array( $payload ) && array_is_list( $payload ) && $payload ) {
			$replies = array_values( array_filter( array_map( fn( $message ) => $this->message( $message ), $payload ) ) );
			return $replies ? $replies : null;
		}
		return $this->message( $payload );
	}

	/** @return array<string,mixed>|null */
	private function message( mixed $message ): ?array {
		if ( ! is_array( $message ) || ( $message['jsonrpc'] ?? null ) !== '2.0' ) {
			return self::error( null, self::INVALID_REQUEST, 'Invalid JSON-RPC message.' );
		}
		$has_id = array_key_exists( 'id', $message );
		$id     = $message['id'] ?? null;
		if ( $has_id && ! is_string( $id ) && ! is_int( $id ) ) {
			return self::error( null, self::INVALID_REQUEST, 'Invalid request id.' );
		}
		if ( ! isset( $message['method'] ) ) {
			// A response to a server request; this server never sends any.
			return null;
		}
		if ( ! is_string( $message['method'] ) ) {
			return self::error( $id, self::INVALID_REQUEST, 'Invalid method.' );
		}
		if ( ! $has_id ) {
			// Notifications (initialized, cancelled …) need no reply.
			return null;
		}
		$params = $message['params'] ?? array();
		if ( ! is_array( $params ) ) {
			return self::error( $id, self::INVALID_PARAMS, 'Params must be an object.' );
		}
		try {
			$result = match ( $message['method'] ) {
				'initialize'     => $this->initialize( $params ),
				'ping'           => new \stdClass(),
				'tools/list'     => array( 'tools' => $this->tools->definitions() ),
				'tools/call'     => $this->call( $params ),
				'resources/list' => array( 'resources' => $this->resources->definitions() ),
				'resources/templates/list' => array( 'resourceTemplates' => array() ),
				'resources/read' => $this->read( $params ),
				'prompts/list'   => array( 'prompts' => array() ),
				default          => null,
			};
		} catch ( \InvalidArgumentException $e ) {
			return self::error( $id, self::INVALID_PARAMS, $e->getMessage() );
		} catch ( \Throwable $e ) {
			return self::error( $id, self::INTERNAL_ERROR, 'The request could not be completed.' );
		}
		if ( null === $result ) {
			return self::error( $id, self::METHOD_NOT_FOUND, 'Method not found: ' . $message['method'] );
		}
		return array(
			'jsonrpc' => '2.0',
			'id'      => $id,
			'result'  => $result,
		);
	}

	/**
	 * @param array<mixed> $params
	 * @return array<string,mixed>
	 */
	private function initialize( array $params ): array {
		$requested = $params['protocolVersion'] ?? '';
		return array(
			'protocolVersion' => in_array( $requested, self::PROTOCOL_VERSIONS, true ) ? $requested : self::PROTOCOL_VERSIONS[0],
			'capabilities'    => array(
				'tools'     => array( 'listChanged' => false ),
				'resources' => array(
					'listChanged' => false,
					'subscribe'   => false,
				),
			),
			'serverInfo'      => array(
				'name'    => 'chatflow-forms',
				'title'   => 'ChatFlow Forms',
				'version' => defined( 'CFF_VERSION' ) ? CFF_VERSION : '0.0.0',
			),
			'instructions'    => 'ChatFlow Forms builds conversational forms on this WordPress site. Read the form schema (get_form_schema) before writing one, check drafts with validate_form, and publish only when the user asks. Edits go to the draft; visitors see a form only after publish_form. Submissions can contain personal data: show only what the user needs.',
		);
	}

	/**
	 * @param array<mixed> $params
	 * @return array<string,mixed>
	 */
	private function call( array $params ): array {
		$name = $params['name'] ?? null;
		$args = $params['arguments'] ?? array();
		if ( ! is_string( $name ) || ! $this->tools->has( $name ) ) {
			throw new \InvalidArgumentException( 'Unknown tool.' );
		}
		if ( ! is_array( $args ) ) {
			throw new \InvalidArgumentException( 'Tool arguments must be an object.' );
		}
		$result = $this->tools->call( $name, $args );
		if ( is_wp_error( $result ) ) {
			$data    = $result->get_error_data();
			$details = array(
				'code'    => $result->get_error_code(),
				'message' => $result->get_error_message(),
			);
			if ( is_array( $data ) && isset( $data['errors'] ) ) {
				$details['errors'] = $data['errors'];
			}
			return array(
				'content' => array(
					array(
						'type' => 'text',
						'text' => self::json( $details ),
					),
				),
				'isError' => true,
			);
		}
		return array(
			'content'           => array(
				array(
					'type' => 'text',
					'text' => self::json( $result ),
				),
			),
			'structuredContent' => (object) $result,
			'isError'           => false,
		);
	}

	/**
	 * @param array<mixed> $params
	 * @return array<string,mixed>
	 */
	private function read( array $params ): array {
		$uri      = $params['uri'] ?? null;
		$resource = is_string( $uri ) ? $this->resources->read( $uri ) : null;
		if ( null === $resource ) {
			throw new \InvalidArgumentException( 'Unknown resource.' );
		}
		return array( 'contents' => array( $resource ) );
	}

	/** @return array<string,mixed> */
	public static function error( mixed $id, int $code, string $message ): array {
		return array(
			'jsonrpc' => '2.0',
			'id'      => $id,
			'error'   => array(
				'code'    => $code,
				'message' => $message,
			),
		);
	}

	public static function json( mixed $value ): string {
		return (string) wp_json_encode( $value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
	}
}
