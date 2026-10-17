<?php
namespace ChatFlow\Mcp;

use ChatFlow\Analytics\Report;
use ChatFlow\Forms\EditLock;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\SchemaValidator;
use ChatFlow\Forms\Statistics;
use ChatFlow\Frontend\ThemeFrontend;
use ChatFlow\Logic\Diagnostics;
use ChatFlow\Rest\Settings;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Templates\Templates;

/**
 * The tools ChatFlow offers AI agents over MCP (and as WordPress abilities).
 * Every tool runs as the authenticated WordPress user and needs one of its
 * capabilities; a user only sees the tools they may call.
 */
final class Tools {
	private const READ   = array(
		'readOnlyHint'    => true,
		'destructiveHint' => false,
		'idempotentHint'  => true,
		'openWorldHint'   => false,
	);
	private const WRITE  = array(
		'readOnlyHint'    => false,
		'destructiveHint' => false,
		'idempotentHint'  => false,
		'openWorldHint'   => false,
	);
	private const FORMS  = array( 'cff_manage_forms' );
	private const VIEW   = array( 'cff_view_submissions' );
	private const SEARCH = array( 'cff_manage_forms', 'cff_view_submissions' );

	/** @var array<string,array{title:string,description:string,inputSchema:array<string,mixed>,annotations:array<string,bool>,capabilities:list<string>,handler:callable}>|null */
	private ?array $catalog = null;

	public function __construct( private FormRepository $forms ) {}

	/**
	 * Tool definitions for tools/list, filtered by the current user's capabilities.
	 *
	 * @return list<array<string,mixed>>
	 */
	public function definitions(): array {
		$tools = array();
		foreach ( $this->catalog() as $name => $tool ) {
			if ( self::allowed( $tool['capabilities'] ) ) {
				$tools[] = array(
					'name'        => $name,
					'title'       => $tool['title'],
					'description' => $tool['description'],
					'inputSchema' => $tool['inputSchema'],
					'annotations' => array( 'title' => $tool['title'] ) + $tool['annotations'],
				);
			}
		}
		return $tools;
	}

	/** @return array<string,array{title:string,description:string,inputSchema:array<string,mixed>,annotations:array<string,bool>,capabilities:list<string>,handler:callable}> */
	public function all(): array {
		return $this->catalog();
	}

	public function has( string $name ): bool {
		return isset( $this->catalog()[ $name ] );
	}

	/** @param list<string> $capabilities */
	public static function allowed( array $capabilities ): bool {
		foreach ( $capabilities as $capability ) {
			if ( current_user_can( $capability ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Run a tool; failures (permissions, validation, conflicts) come back as WP_Error.
	 *
	 * @param array<mixed> $args
	 * @return array<string,mixed>|\WP_Error
	 */
	public function call( string $name, array $args ): array|\WP_Error {
		$tool = $this->catalog()[ $name ] ?? null;
		if ( ! $tool ) {
			return Database::error( 'cff_mcp_unknown_tool', 'Unknown tool.', 404 );
		}
		if ( ! self::allowed( $tool['capabilities'] ) ) {
			return Database::error( 'cff_forbidden', 'Your WordPress user may not use this tool.', 403 );
		}
		try {
			return ( $tool['handler'] )( $args );
		} catch ( \InvalidArgumentException | \TypeError $e ) {
			return Database::error( 'cff_invalid_request', $e instanceof \InvalidArgumentException ? $e->getMessage() : 'Invalid tool arguments.', 422 );
		}
	}

	/** @return array<string,array{title:string,description:string,inputSchema:array<string,mixed>,annotations:array<string,bool>,capabilities:list<string>,handler:callable}> */
	private function catalog(): array {
		if ( null !== $this->catalog ) {
			return $this->catalog;
		}
		$id       = array(
			'type'        => 'integer',
			'minimum'     => 1,
			'description' => 'Form ID.',
		);
		$revision = array(
			'type'        => 'integer',
			'minimum'     => 0,
			'description' => 'The draftRevision from get_form (or the last save). A stale value fails with a conflict instead of overwriting newer edits.',
		);
		$schema   = array(
			'type'        => 'object',
			'description' => 'The form schema (see get_form_schema).',
		);
		$settings = array(
			'type'        => 'object',
			'description' => 'Form settings: appearance, completion, notifications, spam, sessions … (see get_form_schema).',
		);
		$date     = array(
			'type'    => 'string',
			'pattern' => '^\d{4}-\d{2}-\d{2}$',
		);
		$catalog  = array(
			'list_forms'         => array(
				'title'        => 'List forms',
				'description'  => 'Lists ChatFlow forms (newest edits first) with their status, published version and submission statistics.',
				'inputSchema'  => self::input(
					array(
						'search'  => array(
							'type'        => 'string',
							'description' => 'Filter by title.',
						),
						'page'    => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
						'perPage' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 100,
						),
					)
				),
				'annotations'  => self::READ,
				'capabilities' => self::SEARCH,
				'handler'      => array( $this, 'listForms' ),
			),
			'get_form'           => array(
				'title'        => 'Get form',
				'description'  => 'Returns a form\'s schema, settings and draftRevision. Defaults to the draft (what the builder edits); pass version "published" for what visitors see.',
				'inputSchema'  => self::input(
					array(
						'id'      => $id,
						'version' => array(
							'type' => 'string',
							'enum' => array( 'draft', 'published' ),
						),
					),
					array( 'id' )
				),
				'annotations'  => self::READ,
				'capabilities' => self::FORMS,
				'handler'      => array( $this, 'getForm' ),
			),
			'get_form_schema'    => array(
				'title'        => 'Get form schema',
				'description'  => 'Returns the JSON Schema for form schemas and settings, the enabled field types and an example form. Read it before creating or editing a form.',
				'inputSchema'  => self::input( array() ),
				'annotations'  => self::READ,
				'capabilities' => self::FORMS,
				'handler'      => array( $this, 'formSchema' ),
			),
			'list_templates'     => array(
				'title'        => 'List templates',
				'description'  => 'Lists the built-in form templates that create_form can start from.',
				'inputSchema'  => self::input( array() ),
				'annotations'  => self::READ,
				'capabilities' => self::FORMS,
				'handler'      => static fn(): array => array( 'items' => Templates::catalog() ),
			),
			'validate_form'      => array(
				'title'        => 'Validate form',
				'description'  => 'Checks a schema (and optional settings) without saving: schema errors, problems that would block publishing, and logic diagnostics such as unreachable steps.',
				'inputSchema'  => self::input(
					array(
						'schema'   => $schema,
						'settings' => $settings,
					),
					array( 'schema' )
				),
				'annotations'  => self::READ,
				'capabilities' => self::FORMS,
				'handler'      => array( $this, 'validateForm' ),
			),
			'create_form'        => array(
				'title'        => 'Create form',
				'description'  => 'Creates a draft form from a template or from a full schema. Visitors cannot see it until publish_form.',
				'inputSchema'  => self::input(
					array(
						'title'    => array(
							'type'        => 'string',
							'description' => 'Form title (optional with a template).',
						),
						'template' => array(
							'type'        => 'string',
							'description' => 'A template ID from list_templates.',
						),
						'schema'   => $schema,
						'settings' => $settings,
					)
				),
				'annotations'  => self::WRITE,
				'capabilities' => self::FORMS,
				'handler'      => array( $this, 'createForm' ),
			),
			'update_form'        => array(
				'title'        => 'Update form draft',
				'description'  => 'Saves a new draft: title, schema and/or settings (each replaces the whole value; omitted ones are kept). Published forms keep serving their live version until publish_form.',
				'inputSchema'  => self::input(
					array(
						'id'            => $id,
						'draftRevision' => $revision,
						'title'         => array( 'type' => 'string' ),
						'schema'        => $schema,
						'settings'      => $settings,
					),
					array( 'id', 'draftRevision' )
				),
				'annotations'  => array( 'idempotentHint' => true ) + self::WRITE,
				'capabilities' => self::FORMS,
				'handler'      => array( $this, 'updateForm' ),
			),
			'publish_form'       => array(
				'title'        => 'Publish form',
				'description'  => 'Publishes the current draft so visitors get it. Only call this when the user asked to publish.',
				'inputSchema'  => self::input(
					array(
						'id'            => $id,
						'draftRevision' => $revision,
					),
					array( 'id', 'draftRevision' )
				),
				'annotations'  => self::WRITE,
				'capabilities' => self::FORMS,
				'handler'      => array( $this, 'publishForm' ),
			),
			'list_submissions'   => array(
				'title'        => 'List submissions',
				'description'  => 'Lists submissions (newest first) with their answers. Answers can contain personal data.',
				'inputSchema'  => self::input(
					array(
						'formId'  => $id,
						'status'  => array(
							'type'        => 'string',
							'enum'        => array( 'completed', 'partial', 'abandoned', 'spam', 'trash' ),
							'description' => 'Default: everything except trash.',
						),
						'from'    => $date + array( 'description' => 'From date (YYYY-MM-DD, UTC).' ),
						'to'      => $date + array( 'description' => 'To date (YYYY-MM-DD, UTC).' ),
						'search'  => array(
							'type'        => 'string',
							'description' => 'Search in answers.',
						),
						'page'    => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
						'perPage' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 100,
						),
					)
				),
				'annotations'  => self::READ,
				'capabilities' => self::VIEW,
				'handler'      => array( $this, 'listSubmissions' ),
			),
			'get_submission'     => array(
				'title'        => 'Get submission',
				'description'  => 'Returns one submission with its answers, metadata, notes and the form version it was answered on.',
				'inputSchema'  => self::input(
					array(
						'id' => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => 'Submission ID.',
						),
					),
					array( 'id' )
				),
				'annotations'  => self::READ,
				'capabilities' => self::VIEW,
				'handler'      => array( $this, 'getSubmission' ),
			),
			'get_analytics'      => array(
				'title'        => 'Get analytics',
				'description'  => 'Views, starts, completions, completion rate, drop-off by step and traffic sources, for one form or all forms. Defaults to the last 30 days; at most 366 days.',
				'inputSchema'  => self::input(
					array(
						'formId' => $id + array( 'description' => 'Form ID; omit for all forms.' ),
						'from'   => $date,
						'to'     => $date,
					)
				),
				'annotations'  => self::READ,
				'capabilities' => self::VIEW,
				'handler'      => array( $this, 'analytics' ),
			),
			'get_theme_frontend' => array(
				'title'        => 'Get theme frontend',
				'description'  => 'Shows whether the active (child) theme replaces or restyles the chat (chatflow/frontend.js and frontend.css), for the site or one form, and where the files go. Read the chatflow://docs/custom-frontend resource to write one.',
				'inputSchema'  => self::input( array( 'formId' => $id ) ),
				'annotations'  => self::READ,
				'capabilities' => self::FORMS,
				'handler'      => array( $this, 'themeFrontend' ),
			),
		);
		/**
		 * Filter the MCP tools. Each entry: title, description, inputSchema, annotations,
		 * capabilities (any of) and handler (receives the arguments, returns an array or WP_Error).
		 *
		 * @param array<string,array<string,mixed>> $catalog
		 */
		$this->catalog = (array) apply_filters( 'cff_mcp_tools', $catalog, $this->forms );
		return $this->catalog;
	}

	/**
	 * @param array<string,mixed> $properties
	 * @param list<string>        $required
	 * @return array<string,mixed>
	 */
	private static function input( array $properties, array $required = array() ): array {
		$input = array(
			'type'                 => 'object',
			'properties'           => (object) $properties,
			'additionalProperties' => false,
		);
		if ( $required ) {
			$input['required'] = $required;
		}
		return $input;
	}

	/** @param array<mixed> $args */
	private static function int( array $args, string $key, int $fallback = 0, int $max = PHP_INT_MAX ): int {
		if ( ! isset( $args[ $key ] ) ) {
			return $fallback;
		}
		$value = $args[ $key ];
		if ( ! is_int( $value ) && ! ( is_string( $value ) && ctype_digit( $value ) ) || (int) $value < 0 ) {
			throw new \InvalidArgumentException( esc_html( $key ) . ' must be a whole number.' );
		}
		return min( $max, (int) $value );
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>|null
	 */
	private static function object( array $args, string $key ): ?array {
		if ( ! array_key_exists( $key, $args ) ) {
			return null;
		}
		if ( ! is_array( $args[ $key ] ) ) {
			throw new \InvalidArgumentException( esc_html( $key ) . ' must be an object.' );
		}
		return $args[ $key ];
	}

	/** @param array<mixed> $args */
	private static function string( array $args, string $key ): ?string {
		if ( ! isset( $args[ $key ] ) ) {
			return null;
		}
		if ( ! is_string( $args[ $key ] ) ) {
			throw new \InvalidArgumentException( esc_html( $key ) . ' must be a string.' );
		}
		return $args[ $key ];
	}

	/** @return array<string,mixed> */
	private static function summary( Form $form ): array {
		$published = 'publish' === $form->status() && $form->version() > 0;
		return array(
			'id'            => $form->id(),
			'title'         => $form->title(),
			'slug'          => $form->slug(),
			'status'        => $form->status(),
			'version'       => $form->version(),
			'draftRevision' => $form->draftRevision(),
			'editUrl'       => admin_url( 'admin.php?page=cff-builder&formId=' . $form->id() ),
			'shortcode'     => '[chatflow id="' . $form->id() . '"]',
			'url'           => $published && '' !== $form->slug() ? home_url( '/' . trim( (string) Settings::get()['fullpageBase'], '/' ) . '/' . rawurlencode( $form->slug() ) . '/' ) : null,
		);
	}

	private function draft( int $id ): Form|\WP_Error {
		$form = $id ? $this->forms->getDraft( $id ) : null;
		return $form ? $form : Database::error( 'cff_not_found', 'Form not found.', 404 );
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>
	 */
	public function listForms( array $args ): array {
		$page     = max( 1, self::int( $args, 'page', 1 ) );
		$per_page = max( 1, self::int( $args, 'perPage', 20, 100 ) );
		$query    = new \WP_Query(
			array(
				'post_type'      => 'cff_form',
				'post_status'    => array( 'draft', 'publish' ),
				'posts_per_page' => $per_page,
				'paged'          => $page,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				's'              => sanitize_text_field( (string) self::string( $args, 'search' ) ),
			)
		);
		$items    = array();
		foreach ( $query->posts as $post ) {
			$form = $this->forms->getDraft( $post instanceof \WP_Post ? $post->ID : (int) $post );
			if ( $form ) {
				$items[] = self::summary( $form ) + array( 'statistics' => Statistics::get( $form->id() ) );
			}
		}
		return array(
			'items'   => $items,
			'total'   => (int) $query->found_posts,
			'page'    => $page,
			'perPage' => $per_page,
		);
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>|\WP_Error
	 */
	public function getForm( array $args ): array|\WP_Error {
		$id = self::int( $args, 'id' );
		if ( 'published' === self::string( $args, 'version' ) ) {
			$form = $this->forms->getPublished( $id );
			if ( ! $form ) {
				return Database::error( 'cff_not_found', 'This form has no published version.', 404 );
			}
		} else {
			$form = $this->draft( $id );
			if ( is_wp_error( $form ) ) {
				return $form;
			}
		}
		return self::summary( $form ) + array(
			'schema'   => $form->schema(),
			'settings' => (object) $form->settings(),
		);
	}

	/** @return array<string,mixed> */
	public function formSchema(): array {
		$read     = static function ( string $file ): mixed {
			$path = dirname( __DIR__, 2 ) . '/schema/' . $file;
			return is_readable( $path ) ? json_decode( (string) file_get_contents( $path ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local plugin file.
		};
		$schema   = $read( 'form.schema.json' );
		$settings = $read( 'settings.schema.json' );
		$example  = Templates::definition( 'contact-request' );
		return array(
			'formSchema'     => $schema,
			'settingsSchema' => $settings,
			'fieldTypes'     => SchemaValidator::ENABLED_TYPES,
			'example'        => is_wp_error( $example ) ? null : $example,
			'notes'          => 'Step IDs and field keys must be unique. Each step is one message from the bot; field steps also collect an answer under their key. Use statement steps for text without an answer. Logic rules jump between steps; endings are chosen by completion settings.',
		);
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>
	 */
	public function validateForm( array $args ): array {
		$schema    = self::object( $args, 'schema' ) ?? array();
		$settings  = self::object( $args, 'settings' );
		$validator = new SchemaValidator();
		$errors    = $validator->validate( $schema );
		if ( null !== $settings ) {
			$errors = array_merge( $errors, $validator->validateSettings( $settings, $schema ) );
		}
		$publish     = $errors ? array() : $validator->validatePublishable( $schema );
		$diagnostics = $errors ? array() : Diagnostics::diagnoseSchema( $schema );
		return array(
			'valid'         => ! $errors,
			'publishable'   => ! $errors && ! $publish && ! $diagnostics,
			'errors'        => $errors,
			'publishBlocks' => $publish,
			'logicWarnings' => $diagnostics,
		);
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>|\WP_Error
	 */
	public function createForm( array $args ): array|\WP_Error {
		$template = self::string( $args, 'template' );
		$title    = self::string( $args, 'title' );
		$schema   = self::object( $args, 'schema' );
		$settings = self::object( $args, 'settings' );
		if ( null !== $template ) {
			$definition = Templates::definition( $template );
			if ( is_wp_error( $definition ) ) {
				return $definition;
			}
			$form = $this->forms->create( $title ?? $definition['title'], $schema ?? $definition['schema'], $settings ?? $definition['settings'] );
		} elseif ( null !== $schema ) {
			if ( null === $title || '' === trim( $title ) ) {
				throw new \InvalidArgumentException( 'title is required without a template.' );
			}
			$form = $this->forms->create( $title, $schema, $settings ?? array() );
		} else {
			throw new \InvalidArgumentException( 'Pass a template or a schema.' );
		}
		return is_wp_error( $form ) ? $form : self::summary( $form );
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>|\WP_Error
	 */
	public function updateForm( array $args ): array|\WP_Error {
		$form = $this->draft( self::int( $args, 'id' ) );
		if ( is_wp_error( $form ) ) {
			return $form;
		}
		if ( ! array_key_exists( 'draftRevision', $args ) ) {
			throw new \InvalidArgumentException( 'draftRevision is required.' );
		}
		$lock = EditLock::acquire( $form->id() );
		if ( is_wp_error( $lock ) ) {
			return $lock;
		}
		$saved = $this->forms->saveDraft( $form->id(), self::object( $args, 'schema' ) ?? $form->schema(), self::object( $args, 'settings' ) ?? $form->settings(), self::int( $args, 'draftRevision' ), self::string( $args, 'title' ) );
		return is_wp_error( $saved ) ? $saved : self::summary( $saved );
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>|\WP_Error
	 */
	public function publishForm( array $args ): array|\WP_Error {
		$form = $this->draft( self::int( $args, 'id' ) );
		if ( is_wp_error( $form ) ) {
			return $form;
		}
		if ( ! array_key_exists( 'draftRevision', $args ) ) {
			throw new \InvalidArgumentException( 'draftRevision is required.' );
		}
		$lock = EditLock::acquire( $form->id() );
		if ( is_wp_error( $lock ) ) {
			return $lock;
		}
		$live = $this->forms->publish( $form->id(), self::int( $args, 'draftRevision' ) );
		return is_wp_error( $live ) ? $live : self::summary( $live );
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>
	 */
	public function listSubmissions( array $args ): array {
		$page     = max( 1, self::int( $args, 'page', 1 ) );
		$per_page = max( 1, self::int( $args, 'perPage', 20, 100 ) );
		$filters  = array();
		if ( isset( $args['formId'] ) ) {
			$filters['formId'] = self::int( $args, 'formId' );
		}
		foreach ( array( 'status', 'from', 'to', 'search' ) as $key ) {
			$value = self::string( $args, $key );
			if ( null !== $value && '' !== $value ) {
				$filters[ $key ] = $value;
			}
		}
		$data = ( new Repository( $this->forms ) )->find( $filters, $page, $per_page );
		return array(
			'items'   => array_map( static fn( $submission ) => $submission->admin(), $data['items'] ),
			'total'   => $data['total'],
			'page'    => $page,
			'perPage' => $per_page,
		);
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>|\WP_Error
	 */
	public function getSubmission( array $args ): array|\WP_Error {
		global $wpdb;
		$submission = ( new Repository( $this->forms ) )->get( self::int( $args, 'id' ) );
		if ( ! $submission ) {
			return Database::error( 'cff_not_found', 'Submission not found.', 404 );
		}
		$form          = $this->forms->getVersion( $submission->formId(), $submission->formVersion() );
		$data          = $submission->admin();
		$data['form']  = $form ? array(
			'id'      => $form->id(),
			'title'   => $form->title(),
			'version' => $form->version(),
			'steps'   => array_map(
				static fn( $step ) => array_intersect_key( (array) $step, array_flip( array( 'id', 'type', 'key', 'label' ) ) ),
				(array) ( $form->schema()['steps'] ?? array() )
			),
		) : null;
		$data['notes'] = array_map(
			static fn( $row ) => array(
				'kind'      => $row['type'],
				'message'   => $row['body'],
				'createdAt' => $row['created_at'],
			),
			(array) $wpdb->get_results( $wpdb->prepare( "SELECT type,body,created_at FROM {$wpdb->prefix}cff_submission_notes WHERE submission_id=%d ORDER BY id DESC LIMIT 100", $submission->id() ), ARRAY_A )
		);
		return $data;
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>
	 */
	public function analytics( array $args ): array {
		return ( new Report( $this->forms ) )->run( self::int( $args, 'formId' ), self::string( $args, 'from' ), self::string( $args, 'to' ) );
	}

	/**
	 * @param array<mixed> $args
	 * @return array<string,mixed>|\WP_Error
	 */
	public function themeFrontend( array $args ): array|\WP_Error {
		$form = null;
		if ( isset( $args['formId'] ) ) {
			$form = $this->draft( self::int( $args, 'formId' ) );
			if ( is_wp_error( $form ) ) {
				return $form;
			}
		}
		return array(
			'theme'       => get_stylesheet(),
			'parentTheme' => get_template() !== get_stylesheet() ? get_template() : null,
			'script'      => ThemeFrontend::asset( 'js', $form ),
			'style'       => ThemeFrontend::asset( 'css', $form ),
			'directory'   => 'wp-content/themes/' . get_stylesheet() . '/' . ThemeFrontend::DIRECTORY . '/',
			'files'       => array(
				'frontend.js'        => 'Replaces the chat UI for every form (an ES module calling window.ChatFlow.registerFrontend).',
				'frontend.css'       => 'Extra styles inside the chat\'s shadow root.',
				'frontend-{slug}.js' => 'Per form, by slug (or frontend-{id}.js); wins over frontend.js. Same for .css.',
			),
			'docs'        => 'chatflow://docs/custom-frontend',
		);
	}
}
