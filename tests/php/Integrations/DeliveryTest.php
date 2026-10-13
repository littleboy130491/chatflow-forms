<?php
namespace ChatFlow\Tests\Integrations;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\FormPostType;
use ChatFlow\Integrations\HookDispatcher;
use ChatFlow\Integrations\Payload;
use ChatFlow\Integrations\Outbox;
use ChatFlow\Integrations\Scheduler;
use ChatFlow\Integrations\Webhook;
use ChatFlow\Install\Installer;
use ChatFlow\Submissions\Submission;
use ChatFlow\Notifications\Renderer;
use ChatFlow\Notifications\Mailer;
use ChatFlow\Notifications\Planner;
use ChatFlow\Notifications\NotificationsModule;
use ChatFlow\Integrations\IntegrationsModule;

final class DeliveryTest extends \WP_UnitTestCase {
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
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	private function form( array $settings = array() ): Form {
		$schema            = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/schema.json' ), true, 512, JSON_THROW_ON_ERROR )[0]['schema'];
		$schema['steps'][] = array(
			'id'       => 'email_step',
			'key'      => 'email',
			'type'     => 'email',
			'label'    => 'Email',
			'messages' => array( 'Email?' ),
			'required' => true,
		);
		return new Form( 42, 'Survey & details', 'survey', $schema, $settings, 1, 2, 'publish' );
	}

	private function submission( Form $form, array $changes = array() ): Submission {
		if ( ! class_exists( Submission::class ) ) {
			$this->markTestSkipped( 'Requires the actual backend lane Submission DTO.' );
		}
		return new Submission(
			array_merge(
				array(
					'id'           => 101,
					'uuid'         => '8f7e02cc-8b85-4e89-a46c-fb9831fd74ab',
					'form_id'      => $form->id(),
					'form_version' => $form->version(),
					'status'       => 'completed',
					'answers'      => array(
						'nama'  => 'A <img src=x onerror=alert(1)> & B',
						'email' => 'respondent@example.org',
					),
					'meta'         => array(
						'ip'          => '203.0.113.55',
						'pageUrl'     => 'https://example.org/form?token=secret#hash',
						'duration_ms' => 12,
					),
					'ending_id'    => '',
					'created_at'   => '2026-10-13 01:02:03',
					'duration_ms'  => 12,
				),
				$changes
			),
			$form
		);
	}

	public function testHookAndFilterExceptionsAreIsolatedAndRedacted(): void {
		$values = array();
		add_action(
			'cff_test_safe',
			static function (): void {
				throw new \RuntimeException( 'SECRET' );
			},
			5
		);
		add_action(
			'cff_test_safe',
			static function () use ( &$values ): void {
				$values[] = current_filter();
			},
			10
		);
		$this->assertFalse( HookDispatcher::action( 'cff_test_safe', array(), 101 ) );
		$this->assertSame( array( 'cff_test_safe' ), $values );
		add_filter( 'cff_test_filter', static fn( $value ) => $value + 1, 5 );
		add_filter(
			'cff_test_filter',
			static function (): void {
				throw new \RuntimeException( 'SECRET' );
			},
			10
		);
		add_filter( 'cff_test_filter', static fn( $value ) => $value * 2, 15 );
		$this->assertSame( 4, HookDispatcher::filter( 'cff_test_filter', 1, array(), 101 ) );
		global $wpdb;
		$log = implode( '', $wpdb->get_col( "SELECT body FROM {$wpdb->prefix}cff_submission_notes" ) );
		$this->assertStringNotContainsString( 'SECRET', $log );
		$this->assertStringContainsString( 'hook_exception', $log );
		$this->assertStringContainsString( 'filter_exception', $log );
		$this->assertFalse( current_filter() );
	}

	public function testPayloadWhitelistsAnswersAndPrivacyAndUsesCanonicalBytes(): void {
		$form       = $this->form();
		$submission = $this->submission( $form );
		add_filter(
			'cff_submission_payload',
			static function ( array $payload ): array {
				$payload['answers']['foreign']    = 'must disappear';
				$payload['meta']['resumeToken']   = 'SECRET';
				$payload['meta']['custom_safe']   = 'allowed';
				$payload['meta']['custom_secret'] = 'SECRET';
				$payload['privateSettings']       = array( 'secret' => 'SECRET' );
				return $payload;
			}
		);
		$payload = Payload::build( $submission, $form );
		$this->assertSame( 'submission.completed', $payload['event'] );
		$this->assertSame( '2026-10-13T01:02:03+00:00', $payload['submission']['created_at'] );
		$this->assertSame( 12, $payload['submission']['duration_ms'] );
		$this->assertSame( 'https://example.org/form', $payload['meta']['page_url'] );
		$this->assertSame( '203.0.113.0', $payload['meta']['ip'] );
		$this->assertArrayNotHasKey( 'foreign', $payload['answers'] );
		$this->assertStringNotContainsString( 'SECRET', Payload::bytes( $payload ) );
		$this->assertStringNotContainsString( 'onerror', Payload::bytes( $payload ) );
		$this->assertSame( Payload::bytes( $payload ), Payload::bytes( array_reverse( $payload, true ) ) );
		$this->assertStringContainsString(
			'"answers":{}',
			Payload::bytes(
				array(
					'answers' => array(),
					'meta'    => array(),
				)
			)
		);
		$this->assertSame( array(), Payload::meta( $submission->meta(), $this->form( array( 'privacy' => array( 'storeMeta' => false ) ) ) ) );
	}

	public function testOutboxDedupeRollbackClaimAndThreeAttempts(): void {
		global $wpdb;
		$outbox  = new Outbox();
		$payload = array(
			'event'   => 'submission.completed',
			'answers' => array(),
			'meta'    => array(),
		);
		$wpdb->query( 'START TRANSACTION' );
		$id = $outbox->insert( 101, 1, 'submission.completed', 'async', 'completed', $payload, 0 );
		$this->assertSame( $id, $outbox->insert( 101, 1, 'submission.completed', 'async', 'completed', $payload, 0 ) );
		$wpdb->query( 'ROLLBACK' );
		$this->assertNull( $outbox->get( $id ) );
		$id = $outbox->insert( 101, 1, 'submission.completed', 'async', 'completed', $payload, 0 );
		for ( $attempt = 1; $attempt <= 3; ++$attempt ) {
			$row = $outbox->claim( $id );
			$this->assertSame( $attempt, (int) $row['attempts'] );
			$this->assertNull( $outbox->claim( $id ) );
			$before = time();
			$outbox->finish( $row, 'hook_exception' );
			$result = $outbox->get( $id );
			$this->assertSame( $attempt < 3 ? 'pending' : 'failed', $result['status'] );
			if ( $attempt < 3 ) {
				$this->assertEqualsWithDelta( $before + ( 1 === $attempt ? 60 : 300 ), strtotime( $result['next_attempt_at'] . ' UTC' ), 2 );
				$wpdb->update( $wpdb->prefix . 'cff_deliveries', array( 'next_attempt_at' => gmdate( 'Y-m-d H:i:s', time() - 1 ) ), array( 'id' => $id ) );
			}
		}
		$this->assertNull( $outbox->claim( $id ) );
		$this->assertFalse( $outbox->retry( $id, 999 ) );
		$this->assertTrue( $outbox->retry( $id, 101 ) );
		$this->assertSame( 0, (int) $outbox->get( $id )['attempts'] );
	}

	public function testRecoveryAndSchedulingOnlyCarryDeliveryIds(): void {
		global $wpdb;
		$outbox = new Outbox();
		$id     = $outbox->insert(
			101,
			1,
			'submission.partial',
			'webhook',
			'crm',
			array(
				'answers' => array(),
				'meta'    => array(),
			),
			4
		);
		$this->assertNotSame(
			$id,
			$outbox->insert(
				101,
				1,
				'submission.partial',
				'webhook',
				'crm',
				array(
					'answers' => array(),
					'meta'    => array(),
				),
				5
			)
		);
		$outbox->claim( $id );
		$wpdb->update( $wpdb->prefix . 'cff_deliveries', array( 'next_attempt_at' => gmdate( 'Y-m-d H:i:s', time() - 2 ) ), array( 'id' => $id ) );
		$outbox->recover();
		$this->assertSame( 'pending', $outbox->get( $id )['status'] );
		$this->assertNotFalse( as_next_scheduled_action( 'cff_dispatch_delivery', array( $id ), 'cff' ) );
		$this->assertStringNotContainsString(
			'answers',
			wp_json_encode(
				as_get_scheduled_actions(
					array(
						'hook'  => 'cff_dispatch_delivery',
						'args'  => array( $id ),
						'group' => 'cff',
					)
				)
			)
		);
		( new Scheduler() )->cancel( $id );
		$this->assertFalse( as_next_scheduled_action( 'cff_dispatch_delivery', array( $id ), 'cff' ) );
	}

	public function testRejectsUnsafeWebhookDestinationsBeforeNetworkIo(): void {
		foreach ( array( '127.0.0.1', '10.0.0.1', '172.16.4.1', '192.168.1.4', '169.254.169.254', '100.64.2.1', '0.0.0.0', '224.0.0.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '64:ff9b::7f00:1', '2001:db8::1' ) as $ip ) {
			$this->assertFalse( Webhook::publicIp( $ip ), $ip );
		}
		$this->assertTrue( Webhook::publicIp( '8.8.8.8' ) );
		$this->assertTrue( Webhook::publicIp( '2606:4700:4700::1111' ) );
		foreach ( array( 'http://8.8.8.8/a', 'https://127.0.0.1/a', 'https://user:pass@8.8.8.8', 'https://8.8.8.8:8443', 'https://[::1]/a', 'file:///etc/passwd' ) as $url ) {
			$this->assertStringStartsWith(
				'webhook_unsafe_',
				( new Webhook() )->send(
					array(
						'url'    => $url,
						'secret' => str_repeat( 'a', 32 ),
					),
					'{}',
					'submission.completed',
					1
				)
			);
		}
	}

	public function testHtmlRenderingEscapesAnswersAndMailFilteringIsSafe(): void {
		if ( ! class_exists( \ChatFlow\Logic\Interpolator::class ) ) {
			$this->markTestSkipped( 'Requires the actual logic lane Interpolator.' );
		}
		$form         = $this->form();
		$submission   = $this->submission( $form );
		$notification = array(
			'to'      => array( 'admin@example.org' ),
			'cc'      => array( 'cc@example.org' ),
			'subject' => "Hi {{nama}}\r\nBcc: injected",
			'body'    => '<script>alert(1)</script><p>Hello {{nama}}</p>{{all_answers}} {{admin_link}} [cff_button url="https://example.org/demo?email={{email}}"]Go[/cff_button]',
		);
		$result       = ( new Renderer() )->render( $notification, $submission, $form, true );
		$this->assertStringNotContainsString( '<script', $result['html'] );
		$this->assertStringNotContainsString( '<img src=x', $result['html'] );
		$this->assertStringNotContainsString( "\n", $result['subject'] );
		$this->assertStringContainsString( 'respondent%40example.org', $result['html'] );
		$this->assertStringContainsString( '<table', $result['html'] );
		$seen = null;
		add_filter(
			'pre_wp_mail',
			static function ( $result, $args ) use ( &$seen ) {
				$seen = $args;
				return true;
			},
			10,
			2
		);
		$this->assertSame( 'sent', ( new Mailer() )->send( $notification, $submission, $form, true, 'test@example.org' ) );
		$this->assertSame( array( 'test@example.org' ), $seen['to'] );
		$this->assertStringNotContainsString( 'Cc:', implode( '', $seen['headers'] ) );
		add_filter(
			'cff_email_args',
			static function ( array $args ): array {
				$args['to'] = array( "bad@example.org\r\nBcc: secret@example.org" );
				return $args;
			}
		);
		$this->assertSame( 'mail_invalid_recipient', ( new Mailer() )->send( $notification, $submission, $form, true ) );
	}

	public function testConditionalPlannerFirstMatchAndMissingEmail(): void {
		if ( ! class_exists( \ChatFlow\Logic\Operators::class ) ) {
			$this->markTestSkipped( 'Requires actual logic lane Operators.' );
		}
		$responders = array(
			array(
				'id'           => 'first',
				'enabled'      => true,
				'emailField'   => 'email',
				'delaySeconds' => 60,
				'conditions'   => array(
					'field' => 'email',
					'op'    => 'eq',
					'value' => 'respondent@example.org',
				),
			),
			array(
				'id'         => 'second',
				'enabled'    => true,
				'emailField' => 'email',
			),
		);
		$form       = $this->form(
			array(
				'notifications' => array(
					'autoresponders' => $responders,
					'firstMatchOnly' => true,
				),
			)
		);
		$this->assertSame(
			array(
				array(
					'channel' => 'autoresponder',
					'id'      => 'first',
					'delay'   => 60,
				),
			),
			( new Planner() )->plan( $this->submission( $form ), $form, 'submission.completed' )
		);
		$this->assertSame( array(), ( new Planner() )->plan( $this->submission( $form, array( 'answers' => array() ) ), $form, 'submission.completed' ) );
	}

	public function testAdminRequiresNonceAndDistinctCapabilities(): void {
		$module  = new NotificationsModule( new FormRepository() );
		$request = new \WP_REST_Request( 'POST', '/cff/v1/admin/notifications/test' );
		$this->assertWPError( $module->authorize( $request, 'cff_manage_forms' ) );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$this->assertTrue( $module->authorize( $request, 'cff_manage_forms' ) );
		$user = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$this->assertWPError( $module->authorize( $request, 'cff_edit_submissions' ) );
	}

	public function testSignedWebhookExactBytesAndNoRedirectOrProxyForwarding(): void {
		$bytes  = Payload::bytes(
			array(
				'answers' => array( 'nama' => 'Budi & café' ),
				'meta'    => array(),
				'event'   => 'submission.completed',
			)
		);
		$secret = str_repeat( 's', 32 );
		$seen   = null;
		add_filter(
			'pre_http_request',
			static function ( $result, $args, $url ) use ( &$seen ) {
				$seen   = $args;
				$handle = curl_init();
				do_action( 'http_api_curl', $handle, $args, $url );
				curl_close( $handle );
				return array(
					'response' => array( 'code' => 204 ),
					'body'     => 'SECRET must not be logged',
				);
			},
			10,
			3
		);
		$sender = new Webhook();
		$this->assertSame(
			'sent',
			$sender->send(
				array(
					'url'    => 'https://8.8.8.8/delivery',
					'secret' => $secret,
				),
				$bytes,
				'submission.completed',
				37
			)
		);
		$this->assertSame( $bytes, $seen['body'] );
		$this->assertSame( 'sha256=' . hash_hmac( 'sha256', $bytes, $secret ), $seen['headers']['X-CFF-Signature'] );
		$this->assertSame( '37', $seen['headers']['X-CFF-Delivery'] );
		$this->assertSame( 'submission.completed', $seen['headers']['X-CFF-Event'] );
		$this->assertSame( 0, $seen['redirection'] );
		$this->assertTrue( $seen['sslverify'] );
		$this->assertTrue( $seen['reject_unsafe_urls'] );
		$this->assertSame(
			'webhook_unsafe_headers',
			$sender->send(
				array(
					'url'     => 'https://8.8.8.8',
					'secret'  => $secret,
					'headers' => array( 'Host' => 'localhost' ),
				),
				$bytes,
				'submission.completed',
				37
			)
		);
		$this->assertFalse( has_action( 'http_api_curl' ) );
	}

	public function testRealQueueWorkerUsesPinnedNotificationAndAsyncPayloadAndResend(): void {
		if ( ! class_exists( Submission::class ) || ! class_exists( \ChatFlow\Logic\Interpolator::class ) ) {
			$this->markTestSkipped( 'Requires actual backend and logic lanes.' );
		}
		global $wpdb;
		$forms    = new FormRepository();
		$settings = array(
			'notifications' => array(
				'admin' => array(
					array(
						'id'      => 'admin',
						'enabled' => true,
						'to'      => array( 'admin@example.org' ),
						'subject' => 'Frozen {{nama}}',
						'body'    => '{{all_answers}}',
					),
				),
			),
		);
		$draft    = $forms->create( 'Jobs integration test', $this->form()->schema(), $settings );
		$this->assertNotWPError( $draft );
		$form = $forms->publish( $draft->id(), 1 );
		$this->assertNotWPError( $form );
		$notifications = new NotificationsModule( $forms );
		$request       = new \WP_REST_Request( 'POST' );
		$request->set_body_params(
			array(
				'formId'         => $form->id(),
				'notificationId' => 'admin',
				'to'             => 'test@example.org',
				'answers'        => array( 'nama' => 'Sample one' ),
			)
		);
		$result = $notifications->test( $request );
		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertTrue( $result->get_data()['queued'] );
		$id   = $result->get_data()['deliveryId'];
		$seen = array();
		add_filter(
			'pre_wp_mail',
			static function ( $value, $args ) use ( &$seen ) {
				$seen[] = $args;
				return true;
			},
			10,
			2
		);
		$worker = new IntegrationsModule( $forms );
		$worker->dispatch( $id );
		$this->assertSame( 'sent', ( new Outbox() )->get( $id )['status'] );
		$this->assertSame( array( 'test@example.org' ), $seen[0]['to'] );
		$this->assertSame( 'Frozen Sample one', $seen[0]['subject'] );
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
					'nama'  => 'Frozen answers',
					'email' => 'respondent@example.org',
				),
			)
		);
		$ids        = ( new Outbox() )->enqueue( $submission, $form, 'submission.completed' );
		$this->assertCount( 2, $ids );
		$async_payload = null;
		add_action(
			'cff_submission_completed_async',
			static function ( Submission $dto, Form $snapshot ) use ( &$async_payload ) {
				$async_payload = $dto->toArray();
			},
			10,
			2
		);
		$changed = $settings;
		$changed['notifications']['admin'][0]['subject'] = 'Changed draft';
		$saved = $forms->saveDraft( $form->id(), $form->schema(), $changed, 2 );
		$this->assertNotWPError( $saved );
		$this->assertNotWPError( $forms->publish( $form->id(), 3 ) );
		$refiltered = 0;
		add_filter(
			'cff_submission_payload',
			static function ( array $payload ) use ( &$refiltered ): array {
				++$refiltered;
				$payload['answers']['nama'] = 'must not refilter frozen rows';
				return $payload;
			}
		);
		$expected_payload = json_decode( ( new Outbox() )->get( $ids[1] )['payload'], true );
		foreach ( $ids as $delivery_id ) {
			$worker->dispatch( $delivery_id );
			$this->assertSame( 'sent', ( new Outbox() )->get( $delivery_id )['status'] );
		}
		$this->assertSame( 'Frozen Frozen answers', $seen[1]['subject'] );
		$this->assertSame( Payload::bytes( $expected_payload ), Payload::bytes( $async_payload ) );
		$this->assertSame( 0, $refiltered );
		$mail_id = $ids[0];
		$request = new \WP_REST_Request( 'POST' );
		$request->set_body_params(
			array(
				'id'         => $submission->id(),
				'deliveryId' => $mail_id,
			)
		);
		$this->assertTrue( $notifications->retry( $request )->get_data()['queued'] );
		$worker->dispatch( $mail_id );
		$this->assertCount( 3, $seen );
		$this->assertSame( 'Frozen Frozen answers', $seen[2]['subject'] );
		$activity = $notifications->activity( $request )->get_data();
		$this->assertNotEmpty( $activity['items'] );
		$this->assertNotEmpty( $activity['deliveries'] );
		$this->assertStringNotContainsString( 'payload', wp_json_encode( $activity ) );
	}

	public function testFailedInsertionThrowsAndDoesNotClaimSuccess(): void {
		global $wpdb;
		$filter = static function ( string $sql ): string {
			return str_starts_with( $sql, 'INSERT INTO ' . $GLOBALS['wpdb']->prefix . 'cff_deliveries' ) ? str_replace( 'cff_deliveries', 'cff_missing_deliveries_fixture', $sql ) : $sql;
		};
		$before = $wpdb->suppress_errors();
		add_filter( 'query', $filter );
		try {
			( new Outbox() )->insert( 101, 1, 'submission.completed', 'async', 'completed', array(), 0 );
			$this->fail( 'A failed DB insert must throw.' );
		} catch ( \RuntimeException $error ) {
			$this->assertSame( 'Unable to persist delivery.', $error->getMessage() );
		} finally {
			remove_filter( 'query', $filter );
			$wpdb->suppress_errors( $before );
		}
	}

	public function testDispatchCancelsMissingSubmissionAndFutureDelaysStayUnclaimed(): void {
		$outbox = new Outbox();
		$id     = $outbox->insert( 999, 1, 'submission.completed', 'async', 'completed', array( 'form' => array( 'id' => 42 ) ), 0, 1800 );
		$this->assertNull( $outbox->claim( $id ) );
		$id = $outbox->insert( 999, 1, 'submission.completed', 'async', 'completed', array( 'form' => array( 'id' => 42 ) ), 1 );
		( new IntegrationsModule( new FormRepository() ) )->dispatch( $id );
		$this->assertSame( 'cancelled', $outbox->get( $id )['status'] );
		$this->assertNull( $outbox->claim( $id ) );
	}

	public function testHttpAndMailErrorsAreGenericAndNeverExposeResponseBody(): void {
		$sender = new Webhook();
		$filter = static function ( $result, $args, $url ) {
			$handle = curl_init();
			do_action( 'http_api_curl', $handle, $args, $url );
			curl_close( $handle );
			return array(
				'response' => array( 'code' => 302 ),
				'headers'  => array( 'Location' => 'http://127.0.0.1/?secret=LEAK' ),
				'body'     => 'LEAK',
			);
		};
		add_filter( 'pre_http_request', $filter, 10, 3 );
		$this->assertSame(
			'webhook_http_302',
			$sender->send(
				array(
					'url'    => 'https://8.8.8.8/a',
					'secret' => str_repeat( 's', 32 ),
				),
				'{}',
				'submission.completed',
				1
			)
		);
		remove_filter( 'pre_http_request', $filter );
		add_filter( 'pre_http_request', static fn() => new \WP_Error( 'transport', 'Secret URL LEAK' ) );
		$this->assertSame(
			'webhook_transport_error',
			$sender->send(
				array(
					'url'    => 'https://8.8.8.8/a',
					'secret' => str_repeat( 's', 32 ),
				),
				'{}',
				'submission.completed',
				1
			)
		);
		if ( ! class_exists( \ChatFlow\Logic\Interpolator::class ) ) {
			return;
		}
		add_filter( 'pre_wp_mail', static fn() => false );
		$this->assertSame(
			'mail_failed',
			( new Mailer() )->send(
				array(
					'to'      => array( 'admin@example.org' ),
					'subject' => 'Test',
					'body'    => '{{all_answers}}',
				),
				$this->submission( $this->form() ),
				$this->form(),
				true
			)
		);
	}

	public function testStandaloneFallbackSchedulesIdOnly(): void {
		global $wp_actions;
		$count                               = $wp_actions['action_scheduler_init'] ?? 0;
		$wp_actions['action_scheduler_init'] = 0;
		try {
			$scheduler = new Scheduler();
			$this->assertFalse( $scheduler->available() );
			$scheduler->schedule( 8888, time() + 120 );
			$this->assertNotFalse( wp_next_scheduled( 'cff_dispatch_delivery', array( 8888 ) ) );
			$scheduler->cancel( 8888 );
			$this->assertFalse( wp_next_scheduled( 'cff_dispatch_delivery', array( 8888 ) ) );
		} finally {
			$wp_actions['action_scheduler_init'] = $count;
		}
	}
}
