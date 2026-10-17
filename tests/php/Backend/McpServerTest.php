<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Install\Installer;
use ChatFlow\Mcp\McpModule;
use ChatFlow\Rest\Settings;
use ChatFlow\Submissions\Database;

final class McpServerTest extends \WP_UnitTestCase {
	private int $id = 0;

	public function set_up(): void {
		parent::set_up();
		remove_filter( 'query', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );
		Installer::activate();
		delete_option( 'cff_settings' );
		$this->assertIsArray( Settings::save( array( 'mcp' => array( 'enabled' => true ) ) ) );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	public function tear_down(): void {
		delete_option( 'cff_settings' );
		parent::tear_down();
	}

	/** @param array<mixed>|string $body */
	private function send( array|string $body, string $method = 'POST' ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/cff/v1/mcp' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( is_string( $body ) ? $body : Database::json( $body ) );
		return rest_do_request( $request );
	}

	/**
	 * @param array<string,mixed> $params
	 * @return array<string,mixed>
	 */
	private function rpc( string $method, array $params = array() ): array {
		$response = $this->send(
			array(
				'jsonrpc' => '2.0',
				'id'      => ++$this->id,
				'method'  => $method,
				'params'  => (object) $params,
			)
		);
		$this->assertSame( 200, $response->get_status() );
		return json_decode( Database::json( $response->get_data() ), true );
	}

	/**
	 * @param array<string,mixed> $args
	 * @return array<string,mixed>
	 */
	private function tool( string $name, array $args = array() ): array {
		$reply = $this->rpc(
			'tools/call',
			array(
				'name'      => $name,
				'arguments' => (object) $args,
			)
		);
		$this->assertArrayHasKey( 'result', $reply, Database::json( $reply ) );
		return $reply['result'];
	}

	public function testIsOffByDefaultAndNeedsAUserWithChatflowCapabilities(): void {
		delete_option( 'cff_settings' );
		$this->assertFalse( Settings::get()['mcp']['enabled'] );
		$this->assertSame(
			403,
			$this->send(
				array(
					'jsonrpc' => '2.0',
					'id'      => 1,
					'method'  => 'ping',
				)
			)->get_status()
		);
		$this->assertIsArray( Settings::save( array( 'mcp' => array( 'enabled' => true ) ) ) );
		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'mcp' => array( 'enabled' => 'yes' ) ) ) );
		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'mcp' => array( 'other' => true ) ) ) );
		wp_set_current_user( 0 );
		$this->assertSame(
			401,
			$this->send(
				array(
					'jsonrpc' => '2.0',
					'id'      => 1,
					'method'  => 'ping',
				)
			)->get_status()
		);
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->assertSame(
			403,
			$this->send(
				array(
					'jsonrpc' => '2.0',
					'id'      => 1,
					'method'  => 'ping',
				)
			)->get_status()
		);
	}

	public function testSpeaksStreamableHttpJsonRpc(): void {
		$init = $this->rpc( 'initialize', array( 'protocolVersion' => '2025-03-26' ) )['result'];
		$this->assertSame( '2025-03-26', $init['protocolVersion'] );
		$this->assertSame( 'chatflow-forms', $init['serverInfo']['name'] );
		$this->assertArrayHasKey( 'tools', $init['capabilities'] );
		$this->assertSame( '2025-06-18', $this->rpc( 'initialize', array( 'protocolVersion' => '1999-01-01' ) )['result']['protocolVersion'] );
		$notification = $this->send(
			array(
				'jsonrpc' => '2.0',
				'method'  => 'notifications/initialized',
			)
		);
		$this->assertSame( 202, $notification->get_status() );
		$this->assertNull( $notification->get_data() );
		$this->assertSame( -32601, $this->rpc( 'nope' )['error']['code'] );
		$this->assertSame( -32602, $this->rpc( 'tools/call', array( 'name' => 'nope' ) )['error']['code'] );
		$this->assertSame( 405, $this->send( '', 'GET' )->get_status() );
		$names = array_column( $this->rpc( 'tools/list' )['result']['tools'], 'name' );
		$this->assertContains( 'create_form', $names );
		$this->assertContains( 'list_submissions', $names );
		$resource = $this->rpc( 'resources/read', array( 'uri' => 'chatflow://docs/custom-frontend' ) )['result']['contents'][0];
		$this->assertStringContainsString( 'registerFrontend', $resource['text'] );
		$this->assertSame( -32602, $this->rpc( 'resources/read', array( 'uri' => 'chatflow://../../wp-config.php' ) )['error']['code'] );
	}

	public function testBuildsAndPublishesAFormThroughTools(): void {
		$created = $this->tool(
			'create_form',
			array(
				'template' => 'contact-request',
				'title'    => 'Agent form',
			)
		)['structuredContent'];
		$this->assertSame( 'draft', $created['status'] );
		$form = $this->tool( 'get_form', array( 'id' => $created['id'] ) )['structuredContent'];
		$this->assertSame( 'Agent form', $form['title'] );
		$check = $this->tool( 'validate_form', array( 'schema' => $form['schema'] ) )['structuredContent'];
		$this->assertTrue( $check['valid'] );
		$this->assertFalse( $this->tool( 'validate_form', array( 'schema' => array( 'steps' => array() ) ) )['structuredContent']['valid'] );

		$schema                = $form['schema'];
		$schema['bot']['name'] = 'Agent';
		$saved                 = $this->tool(
			'update_form',
			array(
				'id'            => $created['id'],
				'draftRevision' => $form['draftRevision'],
				'schema'        => $schema,
			)
		)['structuredContent'];
		$stale                 = $this->tool(
			'update_form',
			array(
				'id'            => $created['id'],
				'draftRevision' => $form['draftRevision'],
				'title'         => 'Lost update',
			)
		);
		$this->assertTrue( $stale['isError'] );
		$this->assertStringContainsString( 'cff_revision_conflict', $stale['content'][0]['text'] );

		$live = $this->tool(
			'publish_form',
			array(
				'id'            => $created['id'],
				'draftRevision' => $saved['draftRevision'],
			)
		)['structuredContent'];
		$this->assertSame( 'publish', $live['status'] );
		$this->assertSame( 1, $live['version'] );
		$this->assertSame(
			'Agent',
			$this->tool(
				'get_form',
				array(
					'id'      => $created['id'],
					'version' => 'published',
				)
			)['structuredContent']['schema']['bot']['name']
		);
		$this->assertContains( $created['id'], array_column( $this->tool( 'list_forms' )['structuredContent']['items'], 'id' ) );
		$this->assertTrue( $this->tool( 'get_form', array( 'id' => 'abc' ) )['isError'] );
	}

	public function testOffersOnlyToolsTheUserMayUse(): void {
		$user = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		( new \WP_User( $user ) )->add_cap( 'cff_view_submissions' );
		wp_set_current_user( $user );
		$names = array_column( $this->rpc( 'tools/list' )['result']['tools'], 'name' );
		$this->assertContains( 'list_submissions', $names );
		$this->assertContains( 'list_forms', $names );
		$this->assertNotContains( 'create_form', $names );
		$this->assertSame( array(), $this->rpc( 'resources/list' )['result']['resources'] );
		$denied = $this->tool( 'create_form', array( 'template' => 'contact-request' ) );
		$this->assertTrue( $denied['isError'] );
		$this->assertFalse( $this->tool( 'list_submissions' )['isError'] );
	}

	public function testRegistersAbilitiesWhereTheAbilitiesApiExists(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! class_exists( '\WP_Abilities_Registry' ) ) {
			$this->markTestSkipped( 'The Abilities API needs WordPress 6.9.' );
		}
		// The registries may already exist (built while MCP was off): register only ChatFlow's
		// entries into them. Hooks are restored after each test.
		$module = new McpModule( new FormRepository() );
		foreach ( array(
			'wp_abilities_api_categories_init' => 'abilityCategory',
			'wp_abilities_api_init'            => 'abilities',
		) as $hook => $method ) {
			remove_all_actions( $hook );
			add_action( $hook, array( $module, $method ) );
		}
		$categories = \WP_Ability_Categories_Registry::get_instance();
		if ( ! wp_has_ability_category( 'chatflow-forms' ) ) {
			do_action( 'wp_abilities_api_categories_init', $categories );
		}
		$abilities = \WP_Abilities_Registry::get_instance();
		if ( ! wp_has_ability( 'chatflow-forms/list-forms' ) ) {
			do_action( 'wp_abilities_api_init', $abilities );
		}
		$ability = wp_get_ability( 'chatflow-forms/get-form' );
		$this->assertNotNull( $ability );
		$this->assertTrue( $ability->get_meta()['annotations']['readonly'] );
		$created = wp_get_ability( 'chatflow-forms/create-form' )->execute( array( 'template' => 'contact-request' ) );
		$this->assertIsArray( $created );
		$this->assertSame( $created['id'], $ability->execute( array( 'id' => $created['id'] ) )['id'] );
		$this->assertIsArray( wp_get_ability( 'chatflow-forms/list-templates' )->execute() );
		wp_set_current_user( 0 );
		$this->assertInstanceOf( \WP_Error::class, $ability->execute( array( 'id' => $created['id'] ) ) );
	}
}
