<?php
namespace ChatFlow\Mcp;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Rest\Settings;
use ChatFlow\Submissions\Database;

/**
 * Lets AI agents (Claude, ChatGPT, Cursor …) work with ChatFlow over the Model
 * Context Protocol. Off by default; once enabled under Settings, agents connect to
 * /wp-json/cff/v1/mcp with a WordPress application password and act as that user,
 * with that user's ChatFlow capabilities. On WordPress 6.9+ the same tools are also
 * registered as abilities, so the WordPress MCP Adapter can serve them too.
 */
final class McpModule implements Module {
	public const ROUTE = '/mcp';

	private Tools $tools;

	public function __construct( private FormRepository $forms ) {
		$this->tools = new Tools( $forms );
	}

	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'route' ) );
		add_action( 'wp_abilities_api_categories_init', array( $this, 'abilityCategory' ) );
		add_action( 'wp_abilities_api_init', array( $this, 'abilities' ) );
	}

	public static function enabled(): bool {
		/**
		 * Filter whether the MCP server (and the ChatFlow abilities) are available.
		 *
		 * @param bool $enabled The "Enable the MCP server" setting.
		 */
		return (bool) apply_filters( 'cff_mcp_enabled', (bool) ( Settings::get()['mcp']['enabled'] ?? false ) );
	}

	public static function url(): string {
		return rest_url( 'cff/v1' . self::ROUTE );
	}

	public function route(): void {
		register_rest_route(
			'cff/v1',
			self::ROUTE,
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'post' ),
					'permission_callback' => array( $this, 'authorize' ),
				),
				array(
					// Stateless server: no server-initiated stream and no sessions to end.
					'methods'             => 'GET, DELETE',
					'callback'            => static function (): \WP_REST_Response {
						$response = new \WP_REST_Response( null, 405 );
						$response->header( 'Allow', 'POST' );
						return $response;
					},
					'permission_callback' => array( $this, 'authorize' ),
				),
			)
		);
	}

	public function authorize(): bool|\WP_Error {
		if ( ! self::enabled() ) {
			return Database::error( 'cff_mcp_disabled', 'The ChatFlow MCP server is turned off. Enable it under ChatFlow → Settings.', 403 );
		}
		if ( ! is_user_logged_in() ) {
			return Database::error( 'cff_mcp_unauthorized', 'Authenticate with a WordPress application password (HTTP Basic: username and application password).', 401 );
		}
		if ( ! Tools::allowed( array( 'cff_manage_forms', 'cff_view_submissions' ) ) ) {
			return Database::error( 'cff_forbidden', 'This WordPress user has no ChatFlow permissions.', 403 );
		}
		return true;
	}

	public function post( \WP_REST_Request $request ): \WP_REST_Response {
		$payload = json_decode( $request->get_body(), true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			return new \WP_REST_Response( Server::error( null, Server::PARSE_ERROR, 'Parse error.' ), 400 );
		}
		$reply = ( new Server( $this->tools, new Resources() ) )->handle( $payload );
		return null === $reply ? new \WP_REST_Response( null, 202 ) : new \WP_REST_Response( $reply, 200 );
	}

	public function abilityCategory(): void {
		if ( function_exists( 'wp_register_ability_category' ) && self::enabled() ) {
			wp_register_ability_category(
				'chatflow-forms',
				array(
					'label'       => 'ChatFlow Forms',
					'description' => 'Build conversational forms and read their submissions.',
				)
			);
		}
	}

	public function abilities(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! self::enabled() ) {
			return;
		}
		foreach ( $this->tools->all() as $name => $tool ) {
			$args       = array(
				'label'               => $tool['title'],
				'description'         => $tool['description'],
				'category'            => 'chatflow-forms',
				'execute_callback'    => fn( $input = null ) => $this->tools->call( $name, is_array( $input ) ? $input : array() ),
				'permission_callback' => static fn(): bool => Tools::allowed( $tool['capabilities'] ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => (bool) ( $tool['annotations']['readOnlyHint'] ?? false ),
						'destructive' => (bool) ( $tool['annotations']['destructiveHint'] ?? false ),
						'idempotent'  => (bool) ( $tool['annotations']['idempotentHint'] ?? false ),
					),
					'show_in_rest' => true,
					'mcp'          => array( 'public' => true ),
				),
			);
			$properties = (array) ( $tool['inputSchema']['properties'] ?? array() );
			if ( $properties ) {
				// The abilities API validates with rest_validate_value_from_schema(), which needs arrays.
				$args['input_schema'] = array(
					'type'                 => 'object',
					'properties'           => $properties,
					'additionalProperties' => false,
				);
				if ( empty( $tool['inputSchema']['required'] ) ) {
					$args['input_schema']['default'] = array();
				} else {
					$args['input_schema']['required'] = $tool['inputSchema']['required'];
				}
			}
			wp_register_ability( 'chatflow-forms/' . str_replace( '_', '-', $name ), $args );
		}
	}
}
