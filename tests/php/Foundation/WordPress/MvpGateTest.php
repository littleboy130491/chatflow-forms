<?php
namespace ChatFlow\Tests\Foundation\WordPress;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Install\Installer;
use ChatFlow\Integrations\Outbox;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Templates\Imajiner;

final class MvpGateTest extends \WP_UnitTestCase {
	public function set_up(): void {
		parent::set_up();
		remove_filter( 'query', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );
		Installer::activate();
		global $wpdb;
		foreach ( Installer::TABLES as $table ) {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM %i', $wpdb->prefix . 'cff_' . $table ) );
		}
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	private function request( string $method, string $path, array $body = array(), array $headers = array() ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/cff/v1/' . $path );
		$request->set_header( 'Content-Type', 'application/json' );
		if ( 'GET' !== $method ) {
			$request->set_body( Database::json( (object) $body ) );
		}
		foreach ( $headers as $key => $value ) {
			$request->set_header( $key, $value );
		}
		$response = rest_do_request( $request );
		$response->set_data( json_decode( Database::json( $response->get_data() ), true, 512, JSON_THROW_ON_ERROR ) );
		return apply_filters( 'rest_post_dispatch', $response, rest_get_server(), $request );
	}

	public function testSurveyRestResumeSummaryEndingAndAllProductionDeliveryHooks(): void {
		global $wpdb;
		$forms                                        = new FormRepository();
		$definition                                   = Imajiner::definition();
		$definition['settings']['spam']['minSeconds'] = 0;
		$definition['settings']['integrations']['webhooks'] = array(
			array(
				'id'      => 'gate_webhook',
				'enabled' => true,
				'url'     => 'https://example.com/cff-hook',
				'secret'  => 'gate-only-signing-fixture',
				'events'  => array( 'completed' ),
			),
		);
		$form = $forms->create( 'Integrated survey', $definition['schema'], $definition['settings'] );
		$this->assertNotWPError( $form );
		wp_set_current_user( 0 );
		$this->assertSame( 404, $this->request( 'GET', 'forms/' . $form->id() )->get_status() );
		wp_set_current_user( 1 );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$this->assertNotWPError( $form );
		wp_set_current_user( 0 );
		$public = $this->request( 'GET', 'forms/' . $form->id() );
		$this->assertSame( 200, $public->get_status() );
		$this->assertStringNotContainsString( 'gate-only-signing-fixture', Database::json( $public->get_data() ) );
		$start = $this->request( 'POST', 'forms/' . $form->id() . '/start-token', array( 'version' => $form->version() ) );
		$this->assertSame( 200, $start->get_status(), Database::json( $start->get_data() ) );
		$this->assertStringContainsString( 'no-store', $start->get_headers()['Cache-Control'] );
		$session = $this->request(
			'POST',
			'sessions',
			array(
				'formId'  => $form->id(),
				'version' => 1,
				'meta'    => array( 'pageUrl' => home_url( '/?utm_source=gate' ) ),
			),
			array(
				'X-CFF-Start-Token' => $start->get_data()['startToken'],
				'Idempotency-Key'   => wp_generate_uuid4(),
			)
		);
		$this->assertSame( 201, $session->get_status() );
		$s               = $session->get_data();
		$partial_count   = 0;
		$completed_count = 0;
		$async_count     = 0;
		$mail_count      = 0;
		$http_count      = 0;
		$on_partial      = static function () use ( &$partial_count ) {
			++$partial_count;
		};
		$on_complete     = static function () use ( &$completed_count ) {
			++$completed_count;
		};
		$on_async        = static function () use ( &$async_count ) {
			++$async_count;
		};
		$mail            = static function ( $result, $attributes ) use ( &$mail_count ) {
			++$mail_count;
			self::assertStringContainsString( 'Ayu', $attributes['message'] );
			return true;
		};
		$http            = static function ( $result, $args, $url ) use ( &$http_count ) {
			++$http_count;
			self::assertSame( 'https://example.com/cff-hook', $url );
			self::assertSame( 'sha256=' . hash_hmac( 'sha256', $args['body'], 'gate-only-signing-fixture' ), $args['headers']['X-CFF-Signature'] );
			$handle = curl_init();
			do_action( 'http_api_curl', $handle, $args, $url );
			curl_close( $handle );
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'body'     => '',
				'headers'  => array(),
			);
		};
		add_action( 'cff_submission_partial_saved', $on_partial );
		add_action( 'cff_submission_completed', $on_complete );
		add_action( 'cff_submission_completed_async', $on_async );
		add_filter( 'pre_wp_mail', $mail, 10, 2 );
		add_filter( 'pre_http_request', $http, 10, 3 );
		try {
			$partial = $this->request(
				'PATCH',
				'sessions/' . $s['sessionId'],
				array(
					'version'  => 1,
					'revision' => 0,
					'answers'  => array( 'punya_website' => 'Belum pernah' ),
				),
				array(
					'X-CFF-Request-Token' => $s['requestToken'],
					'Idempotency-Key'     => wp_generate_uuid4(),
				)
			);
			$this->assertSame( 200, $partial->get_status() );
			$this->assertSame( 1, $partial_count );
			$resume = $this->request( 'POST', 'sessions/resume', array( 'formId' => $form->id() ), array( 'X-CFF-Resume-Token' => $s['resumeToken'] ) )->get_data();
			$this->assertSame( 'Belum pernah', $resume['answers']['punya_website'] );
			$this->assertNotContains( 'step_alamat_website', $resume['visited'] );
			$answers   = array(
				'punya_website'   => 'Belum pernah',
				'layanan'         => array(
					'value' => 'Lainnya',
					'other' => 'Aksesibilitas & konten',
				),
				'jenis_website'   => '🏢 Company / Business Profile',
				'deskripsi'       => null,
				'budget'          => 'Rp5–10 jt',
				'nama'            => 'Ayu & Putri',
				'whatsapp'        => '08123456789',
				'email'           => 'ayu@example.org',
				'boleh_ditelepon' => false,
				'catatan'         => null,
			);
			$body      = array(
				'version'  => 1,
				'revision' => $resume['revision'],
				'answers'  => $answers,
				'honeypot' => '',
			);
			$key       = wp_generate_uuid4();
			$headers   = array(
				'X-CFF-Request-Token' => $resume['requestToken'],
				'Idempotency-Key'     => $key,
			);
			$submitted = $this->request( 'POST', 'sessions/' . $s['sessionId'] . '/submit', $body, $headers );
			$this->assertSame( 200, $submitted->get_status(), Database::json( $submitted->get_data() ) );
			$this->assertSame( 1, $completed_count );
			$retry = $this->request( 'POST', 'sessions/' . $s['sessionId'] . '/submit', $body, $headers );
			$this->assertSame( $submitted->get_data(), $retry->get_data() );
			$this->assertSame( 1, $completed_count );
			$url = $submitted->get_data()['ending']['buttons'][0]['url'];
			$this->assertStringStartsWith( 'https://wa.me/6285219798588?', $url );
			parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $query );
			$this->assertStringContainsString( 'Ayu & Putri', $query['text'] );
			$this->assertStringContainsString( 'Lainnya: Aksesibilitas & konten', $query['text'] );
			$this->assertStringContainsString( '+628123456789', $submitted->get_data()['ending']['messages'][0] );
			$row    = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
			$stored = ( new Repository( $forms ) )->get( (int) $row['submission_id'] );
			$this->assertSame( 'completed', $stored->status() );
			$this->assertContains( 'step_summary', Database::decode( $stored->storage()['visited'] ) );
			$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d", $stored->id() ) );
			$this->assertCount( 3, $ids );
			foreach ( $ids as $id ) {
				do_action( 'cff_dispatch_delivery', (int) $id );
				$this->assertSame( 'sent', ( new Outbox() )->get( (int) $id )['status'] );
			}
			$this->assertSame( 1, $async_count );
			$this->assertSame( 1, $mail_count );
			$this->assertSame( 1, $http_count );
		} finally {
			remove_action( 'cff_submission_partial_saved', $on_partial );
			remove_action( 'cff_submission_completed', $on_complete );
			remove_action( 'cff_submission_completed_async', $on_async );
			remove_filter( 'pre_wp_mail', $mail );
			remove_filter( 'pre_http_request', $http );
		}
	}

	public function testProductionCompositionAssetsTranslationsAndUpgrade(): void {
		$this->assertNotFalse( has_action( 'cff_dispatch_delivery' ) );
		$this->assertNotFalse( has_action( 'cff_export_batch' ) );
		$this->assertNotFalse( has_action( 'cff_purge_batch' ) );
		$this->assertNotFalse( has_filter( 'wp_privacy_personal_data_exporters' ) );
		$this->assertNotFalse( has_filter( 'wp_privacy_personal_data_erasers' ) );
		$this->assertNotNull( \WP_Block_Type_Registry::get_instance()->get_registered( 'chatflow/form' ) );
		$this->assertTrue( function_exists( 'as_schedule_single_action' ) );
		foreach ( array( 'admin/builder.js', 'admin/blocks.js', 'admin/submissions.js', 'runtime/runtime.js', 'runtime/tracking.js' ) as $file ) {
			$this->assertFileExists( CFF_PATH . 'build/' . $file );
		}
		$this->assertFileExists( CFF_PATH . 'src/Admin/languages/chatflow-forms-id_ID.mo' );
		$forms = new FormRepository();
		$d     = Imajiner::definition();
		$form  = $forms->create( 'Preserved on upgrade', $d['schema'], $d['settings'] );
		$this->assertNotWPError( $form );
		update_option( 'cff_db_version', 0 );
		Installer::maybeUpgrade();
		$this->assertSame( Installer::DB_VERSION, (int) get_option( 'cff_db_version' ) );
		$this->assertSame( $form->title(), $forms->getDraft( $form->id() )->title() );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$html = ( new \ChatFlow\Frontend\Renderer() )->render(
			$form->id(),
			array(
				'mode'  => 'fullpage',
				'theme' => 'dark',
			)
		);
		$this->assertStringContainsString( 'data-mode="fullpage"', $html );
		$this->assertStringContainsString( 'data-cff-loading', $html );
		$this->assertStringContainsString( '"theme":"dark"', $html );
		$this->assertStringNotContainsString( 'startToken', $html );
		$launcher = ( new \ChatFlow\Frontend\Renderer() )->render(
			$form->id(),
			array(
				'mode'     => 'launcher',
				'position' => 'left',
			)
		);
		$this->assertStringContainsString( 'data-mode="launcher"', $launcher );
		$this->assertStringContainsString( 'data-position="left"', $launcher );
		$this->assertStringNotContainsString( 'min-height:', $launcher );
		$this->assertStringNotContainsString( 'startToken', $launcher );
		$popup = ( new \ChatFlow\Frontend\Renderer() )->render(
			$form->id(),
			array(
				'mode'           => 'popup',
				'auto_open'      => 7,
				'scroll_percent' => 60,
			)
		);
		$this->assertStringContainsString( 'data-mode="popup"', $popup );
		$this->assertStringContainsString( 'data-auto-open="7"', $popup );
		$this->assertStringContainsString( 'data-scroll-percent="60"', $popup );
	}

	public function testAggregateAnalyticsOnlyExposesAuthorizedCounts(): void {
		global $wpdb;
		$definition = Imajiner::definition();
		$definition['schema']['steps'][] = array(
			'id'       => 'step_satisfaction',
			'key'      => 'satisfaction',
			'type'     => 'rating',
			'label'    => 'Satisfaction',
			'messages' => array( 'Please rate this experience.' ),
		);
		$forms      = new FormRepository();
		$form       = $forms->create( 'Analytics acceptance', $definition['schema'], $definition['settings'] );
		$this->assertNotWPError( $form );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$this->assertNotWPError( $form );
		$now    = gmdate( 'Y-m-d H:i:s' );
		$day    = gmdate( 'Y-m-d' );
		$repo   = new Repository( $forms );
		$record = $repo->savePartial(
			array(
				'form_id'         => $form->id(),
				'form_version'    => $form->version(),
				'current_step_id' => 'step_punya_website',
				'utm_source'      => 'test-campaign',
				'device_type'     => 'desktop',
				'answers'         => array(
					'punya_website' => 'Belum pernah',
					'satisfaction'  => 4,
				),
			)
		);
		$repo->complete(
			$record->id(),
			array(
				'status'       => 'completed',
				'duration_ms'  => 120000,
				'completed_at' => $now,
			)
		);
		$repo->savePartial(
			array(
				'form_id'         => $form->id(),
				'form_version'    => $form->version(),
				'current_step_id' => 'step_punya_website',
				'utm_source'      => 'test-campaign',
				'device_type'     => 'mobile',
			)
		);
		for ( $i = 0; $i < 2; ++$i ) {
			$this->assertNotFalse(
				$wpdb->insert(
					$wpdb->prefix . 'cff_sessions',
					array(
						'public_id'    => wp_generate_uuid4(),
						'resume_hash'  => hash( 'sha256', wp_generate_uuid4() ),
						'form_id'      => $form->id(),
						'form_version' => $form->version(),
						'context'      => '{}',
						'started_at'   => $now,
						'last_seen_at' => $now,
						'expires_at'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
					)
				)
			);
		}
		$report = ( new \ChatFlow\Analytics\Report( $forms ) )->run( $form->id(), $day, $day );
		$this->assertSame( array( 'views' => 0, 'starts' => 2, 'completed' => 1, 'partial' => 1, 'abandoned' => 0 ), $report['counts'] );
		$this->assertNull( $report['viewStartRate'] );
		$this->assertSame( 50.0, $report['completionRate'] );
		$this->assertSame( 120000, $report['avgDurationMs'] );
		$this->assertSame( 'test-campaign', $report['sources'][0]['label'] );
		$this->assertSame( 'step_punya_website', $report['dropoffs'][0]['stepId'] );
		$this->assertSame( 'Belum pernah', $report['answers'][0]['options'][0]['label'] );
		$this->assertSame( 1, $report['answers'][0]['options'][0]['count'] );
		$this->assertArrayNotHasKey( 'value_text', $report['answers'][0]['options'][0] );
		$scores = array_values( array_filter( $report['answers'], static fn( $row ) => 'satisfaction' === $row['fieldKey'] ) );
		$this->assertCount( 1, $scores );
		$this->assertSame( 'Satisfaction', $scores[0]['label'] );
		$this->assertSame( '4', $scores[0]['options'][0]['label'] );
		$this->assertSame( 1, $scores[0]['options'][0]['count'] );
		$path = 'admin/analytics';
		wp_set_current_user( 0 );
		$this->assertSame( 403, $this->request( 'GET', $path )->get_status() );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->assertSame( 403, $this->request( 'GET', $path )->get_status() );
		$response = $this->request( 'GET', $path, array(), array( 'X-WP-Nonce' => wp_create_nonce( 'wp_rest' ) ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 2, $response->get_data()['counts']['starts'] );
		$this->expectException( \InvalidArgumentException::class );
		( new \ChatFlow\Analytics\Report() )->run( 0, '2026-02-30', '2026-03-02' );
	}

	public function testPublicImpressionsAreAggregatePrivateAndRateLimited(): void {
		global $wpdb;
		$forms      = new FormRepository();
		$definition = Imajiner::definition();
		$form       = $forms->create( 'Impression test', $definition['schema'], $definition['settings'] );
		$this->assertNotWPError( $form );
		$path = 'forms/' . $form->id() . '/view';
		wp_set_current_user( 0 );
		$this->assertSame( 404, $this->request( 'POST', $path, array( 'version' => 1 ) )->get_status() );
		wp_set_current_user( 1 );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$this->assertNotWPError( $form );
		wp_set_current_user( 0 );
		$this->assertSame( 422, $this->request( 'POST', $path, array( 'version' => '1' ) )->get_status() );
		$this->assertSame( 409, $this->request( 'POST', $path, array( 'version' => 2 ) )->get_status() );
		$this->assertSame( array( 'recorded' => false ), $this->request( 'POST', $path, array( 'version' => 1 ), array( 'DNT' => '1' ) )->get_data() );
		$this->assertSame( array( 'recorded' => false ), $this->request( 'POST', $path, array( 'version' => 1 ), array( 'Sec-GPC' => '1' ) )->get_data() );
		for ( $i = 0; $i < 2; ++$i ) {
			$response = $this->request( 'POST', $path, array( 'version' => 1 ) );
			$this->assertSame( 200, $response->get_status() );
			$this->assertSame( array( 'recorded' => true ), $response->get_data() );
			$this->assertStringContainsString( 'no-store', $response->get_headers()['Cache-Control'] );
		}
		$day    = gmdate( 'Y-m-d' );
		$report = ( new \ChatFlow\Analytics\Report( $forms ) )->run( $form->id(), $day, $day );
		$this->assertSame( 2, $report['counts']['views'] );
		$this->assertSame( 0.0, $report['viewStartRate'] );
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT metric,dimension,value FROM {$wpdb->prefix}cff_stats_daily WHERE form_id=%d", $form->id() ), ARRAY_A );
		$this->assertCount( 1, $rows );
		$this->assertSame( 'view', $rows[0]['metric'] );
		$this->assertSame( '{}', $rows[0]['dimension'] );
		$this->assertSame( 2.0, (float) $rows[0]['value'] );
		$ip = ( new \ChatFlow\Tracking\IpResolver() )->resolve( $_SERVER, \ChatFlow\Rest\Settings::get()['proxy'] );
		$limiter = new \ChatFlow\Spam\RateLimiter();
		for ( $i = 0; $i < 118; ++$i ) {
			$this->assertTrue( $limiter->consume( 'form-view:' . $form->id() . ':' . $ip, 120, 600 ) );
		}
		$this->assertSame( 429, $this->request( 'POST', $path, array( 'version' => 1 ) )->get_status() );
		$this->assertSame( 2, ( new \ChatFlow\Analytics\Report( $forms ) )->run( $form->id(), $day, $day )['counts']['views'] );
	}
	public function testTemplateGalleryCreatesOnlyUnpublishedValidatedForms(): void {
		$service = new \ChatFlow\Templates\Templates();
		$catalog = \ChatFlow\Templates\Templates::catalog();
		$this->assertSame( array( 'imajiner-survey', 'contact-request', 'customer-feedback', 'lead-capture', 'health-intake', 'product-recommender', 'feedback-nps', 'appointment-request' ), array_column( $catalog, 'id' ) );
		$admin = get_current_user_id();
		wp_set_current_user( 0 );
		$this->assertSame( 403, $this->request( 'GET', 'admin/templates' )->get_status() );
		$this->assertSame( 403, $this->request( 'POST', 'admin/templates/contact-request' )->get_status() );
		wp_set_current_user( $admin );
		$nonce = array( 'X-WP-Nonce' => wp_create_nonce( 'wp_rest' ) );
		$list = $this->request( 'GET', 'admin/templates', array(), $nonce );
		$this->assertSame( 200, $list->get_status() );
		$this->assertCount( 8, $list->get_data()['items'] );
		foreach ( $catalog as $item ) {
			$path = 'admin/templates/' . $item['id'];
			$definition = $this->request( 'GET', $path, array(), $nonce );
			$this->assertSame( 200, $definition->get_status() );
			$this->assertSame( $item['title'], $definition->get_data()['title'] );
			$this->assertSame( array(), $definition->get_data()['settings']['notifications']['admin'] ?? array() );
			$response = $this->request( 'POST', $path, array(), $nonce );
			$this->assertSame( 201, $response->get_status(), Database::json( $response->get_data() ) );
			$data = $response->get_data();
			$this->assertSame( 'draft', $data['status'] );
			$this->assertSame( 0, $data['version'] );
			$this->assertNotEmpty( $data['id'] );
			$this->assertNull( ( new FormRepository() )->getPublished( (int) $data['id'] ) );
			$draft = ( new FormRepository() )->getDraft( (int) $data['id'] );
			$this->assertNotNull( $draft );
			$published = ( new FormRepository() )->publish( $draft->id(), $draft->draftRevision() );
			$this->assertNotWPError( $published );
			$this->assertSame( 1, $published->version() );
			if ( 'contact-request' === $item['id'] ) {
				$this->assertContains( 'consent', array_column( $published->schema()['steps'], 'type' ) );
			}
			if ( 'customer-feedback' === $item['id'] ) {
				$this->assertNotContains( 'email', array_column( $published->schema()['steps'], 'type' ) );
			}
		}
		$this->assertSame( 404, $this->request( 'GET', 'admin/templates/unknown', array(), $nonce )->get_status() );
		$this->assertSame( 404, $this->request( 'POST', 'admin/templates/unknown', array(), $nonce )->get_status() );
		$this->assertWPError( $service->create( 'unknown' ) );
	}

	public function testTestNotificationPayloadsAreCleanedWithoutDeletingRealDeliveries(): void {
		global $wpdb;
		$outbox = new Outbox();
		$test   = $outbox->insert( 0, 1, 'notification.test', 'admin_mail', 'sample', array( 'recipient' => 'fixture@example.org' ), 'test-old' );
		$real   = $outbox->insert( 20, 1, 'submission.completed', 'async', 'completed', array(), 'real-old' );
		$recent = $outbox->insert( 0, 1, 'notification.test', 'admin_mail', 'sample', array(), 'test-recent' );
		foreach ( array( $test, $real ) as $id ) {
			$wpdb->update( $wpdb->prefix . 'cff_deliveries', array( 'created_at' => gmdate( 'Y-m-d H:i:s', time() - 2 * DAY_IN_SECONDS ) ), array( 'id' => $id ) );
		}
		$outbox->recover();
		$this->assertNull( $outbox->get( $test ) );
		$this->assertNotNull( $outbox->get( $real ) );
		$this->assertNotNull( $outbox->get( $recent ) );
	}
}
