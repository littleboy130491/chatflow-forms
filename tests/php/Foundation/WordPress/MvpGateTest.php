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
