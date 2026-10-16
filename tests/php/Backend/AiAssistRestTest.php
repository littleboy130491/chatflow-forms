<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Install\Installer;
use ChatFlow\Rest\Settings;
use ChatFlow\Submissions\Database;

final class AiAssistRestTest extends \WP_UnitTestCase {
	/** @var list<array{0:string,1:array<string,mixed>}> */
	private array $calls = array();
	/** @var array<string,mixed> */
	private array $reply = array();
	private int $status  = 200;

	public function set_up(): void {
		parent::set_up();
		remove_filter( 'query', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );
		Installer::activate();
		delete_option( 'cff_settings' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		add_filter( 'pre_http_request', array( $this, 'mock' ), 10, 3 );
	}

	public function tear_down(): void {
		remove_filter( 'pre_http_request', array( $this, 'mock' ), 10 );
		delete_option( 'cff_settings' );
		parent::tear_down();
	}

	/** @param array<string,mixed> $args */
	public function mock( mixed $pre, array $args, string $url ): array {
		$this->calls[] = array( $url, $args );
		return array(
			'headers'  => array(),
			'body'     => Database::json( $this->reply ),
			'response' => array( 'code' => $this->status ),
			'cookies'  => array(),
		);
	}

	/** @param array<string,mixed> $data */
	private function text( array $data ): void {
		$this->reply = array(
			'stop_reason' => 'end_turn',
			'content'     => array(
				array(
					'type'     => 'thinking',
					'thinking' => '',
				),
				array(
					'type' => 'text',
					'text' => Database::json( $data ),
				),
			),
		);
	}

	/** @param array<string,mixed> $body */
	private function post( string $path, array $body ): \WP_REST_Response {
		$request = new \WP_REST_Request( 'POST', '/cff/v1/' . $path );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$request->set_body( Database::json( (object) $body ) );
		return rest_do_request( $request );
	}

	private function configure(): void {
		$this->assertIsArray( Settings::save( array( 'ai' => array( 'apiKey' => 'sk-ant-api03-' . str_repeat( 'x', 40 ) ) ) ) );
	}

	public function testRequiresCapabilityKeyAndValidSettings(): void {
		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'ai' => array( 'apiKey' => 'not-a-claude-key' ) ) ) );
		$this->assertSame( 400, $this->post( 'admin/ai/generate', array( 'prompt' => 'A contact form' ) )->get_status(), 'No key configured.' );
		$this->assertSame( array(), $this->calls );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->assertSame( 403, $this->post( 'admin/ai/generate', array( 'prompt' => 'A contact form' ) )->get_status() );
	}

	public function testGenerateCreatesAnUnpublishedValidatedDraft(): void {
		$this->configure();
		$this->text(
			array(
				'title'   => 'Website enquiry',
				'botName' => 'Ima',
				'ending'  => 'Thanks!',
				'steps'   => array(
					array(
						'type'     => 'short_text',
						'label'    => 'Name',
						'message'  => 'What should we call you?',
						'required' => true,
						'options'  => array(),
					),
					array(
						'type'     => 'single_choice',
						'label'    => 'Service',
						'message'  => 'What do you need?',
						'required' => true,
						'options'  => array( 'New website', 'Redesign' ),
					),
				),
			)
		);
		$response = $this->post(
			'admin/ai/generate',
			array(
				'prompt' => 'Lead form for a web agency',
				'locale' => 'id_ID',
			)
		);
		$this->assertSame( 201, $response->get_status(), Database::json( $response->get_data() ) );
		$data = $response->get_data();
		$this->assertSame( 'draft', $data['status'] );
		$this->assertSame( 0, $data['version'] );
		$this->assertNull( ( new FormRepository() )->getPublished( (int) $data['id'] ) );

		$this->assertCount( 1, $this->calls );
		[ $url, $args ] = $this->calls[0];
		$this->assertSame( 'https://api.anthropic.com/v1/messages', $url );
		$this->assertSame( '2023-06-01', $args['headers']['anthropic-version'] );
		$this->assertSame( 'server-side-fallback-2026-07-01', $args['headers']['anthropic-beta'] );
		$this->assertSame( 0, $args['redirection'] );
		$sent = json_decode( $args['body'], true );
		$this->assertSame( 'claude-opus-5-5', $sent['model'] );
		$this->assertSame( 'default', $sent['fallbacks'] );
		$this->assertStringContainsString( 'Indonesian', $sent['system'] );
		$this->assertStringContainsString( 'Lead form for a web agency', $sent['messages'][0]['content'] );
	}

	public function testRefusalsAndProviderErrorsAreGeneric(): void {
		$this->configure();
		$this->reply = array(
			'stop_reason' => 'refusal',
			'content'     => array(),
		);
		$refused     = $this->post( 'admin/ai/generate', array( 'prompt' => 'Anything' ) );
		$this->assertSame( 422, $refused->get_status() );
		$this->assertSame( 'cff_ai_refused', $refused->get_data()['code'] );

		$this->status = 401;
		$this->reply  = array( 'error' => array( 'message' => 'provider-secret-detail' ) );
		$auth         = $this->post( 'admin/ai/generate', array( 'prompt' => 'Anything' ) );
		$this->assertSame( 'cff_ai_auth', $auth->get_data()['code'] );
		$this->assertStringNotContainsString( 'provider-secret-detail', Database::json( $auth->get_data() ) );
	}

	public function testRephraseReturnsOnlyAcceptedRewrites(): void {
		$this->configure();
		$this->text(
			array(
				'items' => array(
					array(
						'id'   => 'step:a:message:0',
						'text' => 'Hey {{name}}, what is your email?',
					),
					array(
						'id'   => 'step:a:label',
						'text' => 'Email {{dropped}}',
					),
				),
			)
		);
		$response = $this->post(
			'admin/ai/rephrase',
			array(
				'tone'  => 'friendly',
				'items' => array(
					array(
						'id'   => 'step:a:message:0',
						'text' => 'Hello {{name}}. Please provide your email.',
					),
					array(
						'id'   => 'step:a:label',
						'text' => 'Email',
					),
				),
			)
		);
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				array(
					'id'   => 'step:a:message:0',
					'text' => 'Hey {{name}}, what is your email?',
				),
			),
			$response->get_data()['items']
		);
		$this->assertSame(
			422,
			$this->post(
				'admin/ai/rephrase',
				array(
					'tone'  => 'sarcastic',
					'items' => array(
						array(
							'id'   => 'a',
							'text' => 'b',
						),
					),
				)
			)->get_status()
		);
	}

	/** @param array<string,mixed> $data */
	private function chat( array $data ): void {
		$this->reply = array(
			'choices' => array(
				array(
					'finish_reason' => 'stop',
					'message'       => array( 'content' => Database::json( $data ) ),
				),
			),
		);
	}

	public function testOpenRouterAndCompatibleEndpointsUseChatCompletionsWithMaskedKeys(): void {
		$items = array(
			'tone'  => 'friendly',
			'items' => array(
				array(
					'id'   => 'a',
					'text' => 'Hello',
				),
			),
		);
		$this->chat(
			array(
				'items' => array(
					array(
						'id'   => 'a',
						'text' => 'Hi there',
					),
				),
			)
		);
		$openrouter = 'sk-or-v1-' . str_repeat( 'a', 64 );
		$this->assertIsArray(
			Settings::save(
				array(
					'ai' => array(
						'provider'      => 'openrouter',
						'openrouterKey' => $openrouter,
					),
				)
			)
		);
		$this->assertSame( Settings::MASK, Settings::masked( Settings::get() )['ai']['openrouterKey'] );
		$response = $this->post( 'admin/ai/rephrase', $items );
		$this->assertSame( 200, $response->get_status(), Database::json( $response->get_data() ) );
		$this->assertSame( 'Hi there', $response->get_data()['items'][0]['text'] );
		[ $url, $args ] = $this->calls[0];
		$this->assertSame( 'https://openrouter.ai/api/v1/chat/completions', $url );
		$this->assertSame( 'Bearer ' . $openrouter, $args['headers']['Authorization'] );
		$this->assertSame( 0, $args['redirection'] );
		$sent = json_decode( $args['body'], true );
		$this->assertSame( 'openrouter/auto', $sent['model'] );
		$this->assertSame( 'json_schema', $sent['response_format']['type'] );

		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'ai' => array( 'baseUrl' => 'http://127.0.0.1:11434/v1' ) ) ), 'Plain http is refused.' );
		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'ai' => array( 'baseUrl' => 'https://user:pass@api.example.test/v1' ) ) ) );
		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'ai' => array( 'provider' => 'other' ) ) ) );
		$this->assertIsArray(
			Settings::save(
				array(
					'ai' => array(
						'provider'    => 'openai',
						'baseUrl'     => 'https://api.example.test/v1',
						'compatKey'   => 'sk-compatible-' . str_repeat( 'b', 20 ),
						'compatModel' => 'gpt-4o-mini',
					),
				)
			)
		);
		$this->calls  = array();
		$this->status = 400;
		$this->post( 'admin/ai/rephrase', $items );
		$this->assertCount( 2, $this->calls, 'A 400 on JSON Schema retries once in plain JSON mode.' );
		$this->assertSame( 'https://api.example.test/v1/chat/completions', $this->calls[0][0] );
		$this->assertSame( 'json_object', json_decode( $this->calls[1][1]['body'], true )['response_format']['type'] );
	}
}
