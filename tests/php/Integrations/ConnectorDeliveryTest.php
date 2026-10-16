<?php
namespace ChatFlow\Tests\Integrations;

use ChatFlow\Forms\FormPostType;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Install\Installer;
use ChatFlow\Integrations\IntegrationsModule;
use ChatFlow\Integrations\Outbox;
use ChatFlow\Rest\Settings;

final class ConnectorDeliveryTest extends \WP_UnitTestCase {
	public function set_up(): void {
		parent::set_up();
		remove_filter( 'query', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );
		delete_option( 'cff_db_version' );
		Installer::activate();
		global $wpdb;
		foreach ( Installer::TABLES as $table ) {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM %i', $wpdb->prefix . 'cff_' . $table ) );
		}
		( new FormPostType() )->register();
		delete_option( 'cff_settings' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	public function tear_down(): void {
		delete_option( 'cff_settings' );
		parent::tear_down();
	}

	/** @return array<string,mixed> */
	private function schema(): array {
		$schema            = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/schema.json' ), true, 512, JSON_THROW_ON_ERROR )[0]['schema'];
		$schema['steps'][] = array(
			'id'       => 'email_step',
			'key'      => 'email',
			'type'     => 'email',
			'label'    => 'Email',
			'messages' => array( 'Email?' ),
			'required' => true,
		);
		return $schema;
	}

	public function testCredentialsMustBeBlankOrComplete(): void {
		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'connectors' => array( 'ga4' => array( 'measurementId' => 'G-ABC1234' ) ) ) ) );
		$this->assertInstanceOf( \WP_Error::class, Settings::save( array( 'connectors' => array( 'slack' => array( 'webhookUrl' => 'https://example.org/services/abc' ) ) ) ) );
		$saved = Settings::save( array( 'connectors' => array( 'hubspot' => array( 'accessToken' => 'pat-na1-0000000000' ) ) ) );
		$this->assertIsArray( $saved );
		$this->assertSame( '', $saved['connectors']['slack']['webhookUrl'] );
	}

	public function testPublishBlocksBrokenConnectorsAndWorkerDeliversFrozenPayload(): void {
		global $wpdb;
		$forms    = new FormRepository();
		$settings = array(
			'integrations' => array(
				'connectors' => array(
					array(
						'id'         => 'crm',
						'type'       => 'hubspot',
						'enabled'    => true,
						'events'     => array( 'completed' ),
						'emailField' => 'email',
						'fields'     => array( 'firstname' => 'nama' ),
					),
					array(
						'id'      => 'ads',
						'type'    => 'meta_capi',
						'enabled' => true,
						'events'  => array( 'completed' ),
					),
				),
			),
		);
		$draft    = $forms->create( 'Connector delivery test', $this->schema(), $settings );
		$this->assertNotWPError( $draft );
		$refused = $forms->publish( $draft->id(), 1 );
		$this->assertInstanceOf( \WP_Error::class, $refused );
		$this->assertStringContainsString( 'meta_capi requires consentField.', wp_json_encode( $refused->get_error_data() ) );

		$settings['integrations']['connectors'][1]['enabled'] = false;
		$saved = $forms->saveDraft( $draft->id(), $draft->schema(), $settings, 1 );
		$this->assertNotWPError( $saved );
		$form = $forms->publish( $draft->id(), 2 );
		$this->assertNotWPError( $form );
		$this->assertIsArray( Settings::save( array( 'connectors' => array( 'hubspot' => array( 'accessToken' => 'pat-na1-0000000000' ) ) ) ) );

		$repository = new \ChatFlow\Submissions\Repository( $forms );
		$partial    = $repository->savePartial(
			array(
				'form_id'      => $form->id(),
				'form_version' => $form->version(),
			)
		);
		$submission = $repository->complete(
			$partial->id(),
			array(
				'status'  => 'completed',
				'answers' => array(
					'nama'  => 'Budi',
					'email' => 'Respondent@Example.org',
				),
			)
		);
		( new Outbox() )->enqueue( $submission, $form, 'submission.completed' );
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id,destination_id FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d AND channel='connector'", $submission->id() ), ARRAY_A );
		$this->assertSame( array( 'crm' ), array_column( $rows, 'destination_id' ), 'Disabled connectors are never queued.' );

		$seen = array();
		add_filter(
			'pre_http_request',
			static function ( $pre, $args, $url ) use ( &$seen ) {
				$seen[] = array( $url, $args );
				return array(
					'headers'  => array(),
					'body'     => '{}',
					'response' => array( 'code' => 200 ),
					'cookies'  => array(),
				);
			},
			10,
			3
		);
		( new IntegrationsModule( $forms ) )->dispatch( (int) $rows[0]['id'] );
		$this->assertSame( 'sent', ( new Outbox() )->get( (int) $rows[0]['id'] )['status'] );
		$this->assertCount( 1, $seen );
		$this->assertSame( 'https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', $seen[0][0] );
		$this->assertSame( 'Bearer pat-na1-0000000000', $seen[0][1]['headers']['Authorization'] );
		$this->assertSame( 0, $seen[0][1]['redirection'] );
		$body = json_decode( $seen[0][1]['body'], true );
		$this->assertSame(
			array(
				'firstname' => 'Budi',
				'email'     => 'respondent@example.org',
			),
			$body['inputs'][0]['properties']
		);
	}

	public function testProviderErrorsRetryWithGenericOutcome(): void {
		global $wpdb;
		$forms = new FormRepository();
		$draft = $forms->create(
			'Connector retry test',
			$this->schema(),
			array(
				'integrations' => array(
					'connectors' => array(
						array(
							'id'      => 'chat',
							'type'    => 'slack',
							'enabled' => true,
							'events'  => array( 'completed' ),
						),
					),
				),
			)
		);
		$form  = $forms->publish( $draft->id(), 1 );
		$this->assertNotWPError( $form );
		$repository = new \ChatFlow\Submissions\Repository( $forms );
		$partial    = $repository->savePartial(
			array(
				'form_id'      => $form->id(),
				'form_version' => 1,
			)
		);
		$submission = $repository->complete(
			$partial->id(),
			array(
				'status'  => 'completed',
				'answers' => array(
					'nama'  => 'Budi',
					'email' => 'a@example.org',
				),
			)
		);
		( new Outbox() )->enqueue( $submission, $form, 'submission.completed' );
		$id     = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d AND channel='connector'", $submission->id() ) );
		$worker = new IntegrationsModule( $forms );
		$worker->dispatch( $id );
		$row = ( new Outbox() )->get( $id );
		$this->assertSame( 'pending', $row['status'], 'Missing credentials are retried, not dropped.' );
		$this->assertSame( 'connector_not_configured', $row['last_error'] );

		$this->assertIsArray( Settings::save( array( 'connectors' => array( 'slack' => array( 'webhookUrl' => 'https://hooks.slack.com/services/T000/B000/XXXXXXXX' ) ) ) ) );
		add_filter(
			'pre_http_request',
			static fn() => array(
				'headers'  => array(),
				'body'     => 'internal provider detail',
				'response' => array( 'code' => 500 ),
				'cookies'  => array(),
			)
		);
		$wpdb->update( $wpdb->prefix . 'cff_deliveries', array( 'next_attempt_at' => gmdate( 'Y-m-d H:i:s', time() - 1 ) ), array( 'id' => $id ) );
		$worker->dispatch( $id );
		$row = ( new Outbox() )->get( $id );
		$this->assertSame( 'connector_http_500', $row['last_error'] );
		$this->assertStringNotContainsString( 'internal provider detail', wp_json_encode( $row ) );
	}
}
