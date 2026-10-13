<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Fields\Registry;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Logic\Engine;
use ChatFlow\Privacy\PrivateFiles;
use ChatFlow\Rest\Settings;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\SessionService;
use ChatFlow\Templates\Imajiner;
use PHPUnit\Framework\TestCase;

final class PhaseTwoGateTest extends TestCase {
	private array $forms = array();
	private mixed $settings;
	private mixed $network_mimes;
	protected function setUp(): void {
		$this->network_mimes = get_site_option( 'upload_filetypes' );
		if ( is_multisite() ) {
			update_site_option( 'upload_filetypes', trim( (string) $this->network_mimes . ' txt' ) );
		}
		$this->settings = get_option( 'cff_settings' );
		update_option( 'cff_settings', Settings::defaults() );
		wp_set_current_user( 1 );
	}
	protected function tearDown(): void {
		global $wpdb;
		$repo = new Repository( new FormRepository() );
		foreach ( $this->forms as $id ) {
			foreach ( $repo->find( array( 'formId' => $id ) )['items'] as $submission ) {
				$repo->delete( $submission->id() );
			}
			$wpdb->delete( $wpdb->prefix . 'cff_sessions', array( 'form_id' => $id ) );
			$wpdb->delete( $wpdb->prefix . 'cff_events', array( 'form_id' => $id ) );
			$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $id ) );
			wp_delete_post( $id, true );
		}
		update_option( 'cff_settings', $this->settings );
		if ( is_multisite() ) {
			update_site_option( 'upload_filetypes', $this->network_mimes );
		}
		remove_all_filters( 'pre_http_request' );
	}
	private function form( string $type = 'rating', array $settings = array(), bool $publish = true ): Form {
		$d = Imajiner::definition();
		$d['schema']['steps'] = array( array( 'id' => 'answer', 'key' => 'answer', 'type' => $type, 'label' => 'Answer', 'messages' => array(), 'required' => true ) );
		$d['schema']['endings'] = array( array( 'id' => 'done', 'type' => 'message', 'messages' => array( 'Done' ) ) );
		$d['settings'] = array_replace_recursive( array( 'spam' => array( 'minSeconds' => 0 ) ), $settings );
		$r = new FormRepository();
		$form = $r->create( 'Phase 2 integrated fixture', $d['schema'], $d['settings'] );
		self::assertInstanceOf( Form::class, $form );
		$this->forms[] = $form->id();
		if ( $publish ) {
			$form = $r->publish( $form->id(), $form->draftRevision() );
			self::assertInstanceOf( Form::class, $form );
		}
		return $form;
	}
	private function sessions(): SessionService {
		return new SessionService( new FormRepository(), new Engine(), new Registry() );
	}
	private function start( Form $form ): array {
		$token = ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue( 'start', array( 'formId' => $form->id(), 'version' => $form->version() ), time() );
		$s = $this->sessions()->start( array( 'formId' => $form->id(), 'version' => $form->version() ), $token, wp_generate_uuid4() );
		self::assertIsArray( $s );
		return $s;
	}
	private function request( string $method, string $path, array $body = array(), array $headers = array() ): \WP_REST_Response {
		$r = new \WP_REST_Request( $method, '/cff/v1/' . $path );
		$r->set_header( 'Content-Type', 'application/json' );
		foreach ( $headers as $key => $value ) {
			$r->set_header( $key, $value );
		}
		if ( 'GET' !== $method ) {
			$r->set_body( Database::json( $body ) );
		}
		$server = rest_get_server();
		return apply_filters( 'rest_post_dispatch', $server->dispatch( $r ), $server, $r );
	}
	public function testPublishedPinnedEngagementAndPublicSchemaNeverExposeCredentials(): void {
		self::assertIsArray( Settings::save( array( 'spam' => array( 'captcha' => 'turnstile', 'siteKey' => 'fixture-public-key', 'secretKey' => 'fixture-private-secret' ) ) ) );
		$draft = $this->form( 'rating', array(), false );
		wp_set_current_user( 0 );
		self::assertSame( 404, $this->request( 'GET', 'forms/' . $draft->id() . '/engagement' )->get_status() );
		wp_set_current_user( 1 );
		$form = $this->form( 'rating', array( 'display' => array( 'mode' => 'popup' ), 'spam' => array( 'captcha' => 'turnstile' ) ) );
		$s = $this->start( $form );
		wp_set_current_user( 0 );
		$r = $this->request( 'GET', 'forms/' . $form->id() . '/engagement' );
		self::assertSame( 200, $r->get_status() );
		self::assertSame( 'private,no-store', $r->get_headers()['Cache-Control'] );
		self::assertSame( array( 'provider' => 'turnstile', 'siteKey' => 'fixture-public-key' ), $r->get_data()['captcha'] );
		$public = $this->request( 'GET', 'forms/' . $form->id() );
		self::assertTrue( $public->get_data()['features']['engagement'] );
		self::assertTrue( $public->get_data()['features']['uploads'] );
		self::assertStringNotContainsString( 'fixture-private-secret', Database::json( array( $public->get_data(), $r->get_data() ) ) );
		self::assertStringNotContainsString( 'requestToken', Database::json( $public->get_data() ) );
		$missing = new \WP_REST_Request( 'GET', '/cff/v1/forms/' . $form->id() . '/engagement' );
		$missing->set_param( 'version', 999 );
		self::assertSame( 404, rest_get_server()->dispatch( $missing )->get_status() );
		self::assertSame( 401, $this->request( 'POST', 'sessions/' . $s['sessionId'] . '/events', array( 'events' => array( array( 'event' => 'view' ) ) ) )->get_status() );
		$event = $this->request( 'POST', 'sessions/' . $s['sessionId'] . '/events', array( 'events' => array( array( 'event' => 'view' ) ), 'consentGranted' => true ), array( 'X-CFF-Request-Token' => $s['requestToken'] ) );
		self::assertSame( 200, $event->get_status() );
		wp_set_current_user( 1 );
		$r = new FormRepository();
		$settings = $form->settings();
		$settings['spam']['captcha'] = 'none';
		$edited = $r->saveDraft( $form->id(), $form->schema(), $settings, $form->draftRevision() );
		self::assertInstanceOf( Form::class, $edited );
		self::assertInstanceOf( Form::class, $r->publish( $form->id(), $edited->draftRevision() ) );
		$pinned = new \WP_REST_Request( 'GET', '/cff/v1/forms/' . $form->id() . '/engagement' );
		$pinned->set_param( 'version', 1 );
		self::assertSame( 'turnstile', rest_get_server()->dispatch( $pinned )->get_data()['captcha']['provider'] );
		self::assertSame( 'none', $this->request( 'GET', 'forms/' . $form->id() . '/engagement' )->get_data()['captcha']['provider'] );
	}
	public function testCaptchaFailureRollsBackBeforeCompletionAndSameKeyCanRetry(): void {
		global $wpdb;
		Settings::save( array( 'spam' => array( 'captcha' => 'turnstile', 'siteKey' => 'fixture-public-key', 'secretKey' => 'fixture-private-secret' ) ) );
		$form = $this->form();
		$s = $this->start( $form );
		$body = array( 'version' => $s['version'], 'revision' => $s['revision'], 'answers' => array( 'answer' => 4 ), 'captchaToken' => 'fixture-token' );
		$key = wp_generate_uuid4();
		$response = array( 'headers' => array(), 'response' => array( 'code' => 200 ), 'body' => Database::json( array( 'success' => false ) ) );
		add_filter( 'pre_http_request', static function () use ( &$response ) { return $response; } );
		$failed = $this->sessions()->mutate( 'submit', $s['sessionId'], $body, $s['requestToken'], $key );
		self::assertInstanceOf( \WP_Error::class, $failed );
		self::assertSame( 'cff_spam_verification', $failed->get_error_code() );
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT status,revision FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
		self::assertSame( 'active', $row['status'] );
		self::assertSame( $s['revision'], (int) $row['revision'] );
		self::assertSame( '0', $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND status='completed'", $form->id() ) ) );
		$response['body'] = Database::json( array( 'success' => true, 'hostname' => wp_parse_url( home_url(), PHP_URL_HOST ), 'challenge_ts' => gmdate( 'c' ), 'action' => 'cff_submit' ) );
		$completed = $this->sessions()->mutate( 'submit', $s['sessionId'], $body, $s['requestToken'], $key );
		self::assertIsArray( $completed );
		self::assertSame( 'completed', $wpdb->get_var( $wpdb->prepare( "SELECT status FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ) ) );
	}
	public function testCrossSessionUploadsRejectBeforePatchOrSubmitAndOwnerBinds(): void {
		global $wpdb;
		$form = $this->form( 'file_upload' );
		$owner = $this->start( $form );
		$other = $this->start( $form );
		$session = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $owner['sessionId'] ), ARRAY_A );
		$files = new PrivateFiles();
		$key = 'upload-' . bin2hex( random_bytes( 32 ) ) . '.bin';
		$uuid = wp_generate_uuid4();
		$path = $files->path( $key );
		file_put_contents( $path, 'Private upload.' );
		chmod( $path, 0600 );
		Database::check( $wpdb->insert( $wpdb->prefix . 'cff_uploads', array( 'uuid' => $uuid, 'session_id' => $session['id'], 'field_id' => 'answer', 'storage_key' => $key, 'original_name' => 'fixture.txt', 'mime' => 'text/plain', 'bytes' => filesize( $path ), 'created_at' => Database::now(), 'expires_at' => $session['expires_at'] ) ) );
		try {
			foreach ( array( 'patch', 'submit' ) as $operation ) {
				$result = $this->sessions()->mutate( $operation, $other['sessionId'], array( 'version' => $other['version'], 'revision' => $other['revision'], 'answers' => array( 'answer' => $uuid ) ), $other['requestToken'], wp_generate_uuid4() );
				self::assertInstanceOf( \WP_Error::class, $result );
				self::assertSame( 'cff_upload_owner', $result->get_error_code() );
			}
			$patched = $this->sessions()->mutate( 'patch', $owner['sessionId'], array( 'version' => $owner['version'], 'revision' => $owner['revision'], 'answers' => array( 'answer' => $uuid ) ), $owner['requestToken'], wp_generate_uuid4() );
			self::assertIsArray( $patched );
			self::assertSame( $session['submission_id'], $wpdb->get_var( $wpdb->prepare( "SELECT submission_id FROM {$wpdb->prefix}cff_uploads WHERE uuid=%s", $uuid ) ) );
			wp_set_current_user( 0 );
			self::assertSame( 403, $this->request( 'GET', 'admin/uploads/' . $uuid )->get_status() );
			wp_set_current_user( 1 );
			self::assertSame( 403, $this->request( 'GET', 'admin/uploads/' . $uuid )->get_status() );
			self::assertSame( 200, $this->request( 'GET', 'admin/uploads/' . $uuid, array(), array( 'X-WP-Nonce' => wp_create_nonce( 'wp_rest' ) ) )->get_status() );
			$repo = new Repository( new FormRepository() );
			$repo->delete( (int) $session['submission_id'] );
			self::assertFileDoesNotExist( $path );
			self::assertSame( 404, $this->request( 'GET', 'admin/uploads/' . $uuid, array(), array( 'X-WP-Nonce' => wp_create_nonce( 'wp_rest' ) ) )->get_status() );
		} finally {
			$files->remove( $key );
			$wpdb->delete( $wpdb->prefix . 'cff_uploads', array( 'uuid' => $uuid ) );
		}
	}
	public function testXlsxPrivateCleanupRemovesCompanionAndWorkspaceBeforeRevocation(): void {
		$files = new PrivateFiles();
		$key = 'export-' . bin2hex( random_bytes( 32 ) ) . '.bin';
		$path = $files->path( $key );
		file_put_contents( $path, 'private export' );
		file_put_contents( $files->path( substr( $key, 0, -4 ) . '.csv' ), 'private csv companion' );
		mkdir( $path . '.work', 0700 );
		file_put_contents( $path . '.work/owned.tmp', 'temporary private data' );
		$files->remove( $key );
		self::assertFileDoesNotExist( $path );
		self::assertFileDoesNotExist( $files->path( substr( $key, 0, -4 ) . '.csv' ) );
		self::assertDirectoryDoesNotExist( $path . '.work' );
	}
	public function testAddressRuntimeJsonIsSanitizedStoredAndResumedWithoutLosingMembers(): void {
		$form = $this->form( 'address' );
		$s = $this->start( $form );
		$answers = array( 'answer' => (object) array( 'street' => '<b>Jalan</b> 123', 'city' => 'Jakarta', 'postcode' => '10110', 'country' => 'Indonesia' ) );
		wp_set_current_user( 0 );
		$headers = array( 'X-CFF-Request-Token' => $s['requestToken'], 'Idempotency-Key' => wp_generate_uuid4() );
		$response = $this->request( 'PATCH', 'sessions/' . $s['sessionId'], array( 'version' => $s['version'], 'revision' => $s['revision'], 'answers' => $answers ), $headers );
		self::assertSame( 200, $response->get_status(), Database::json( $response->get_data() ) );
		$data = json_decode( Database::json( $response->get_data() ), true );
		self::assertSame( 'Jalan 123', $data['answers']['answer']['street'] );
		$resumed = $this->sessions()->resume( $form->id(), $s['resumeToken'] );
		self::assertIsArray( $resumed );
		$resumed = json_decode( Database::json( $resumed ), true );
		self::assertSame( $data['answers'], $resumed['answers'] );
		$completed = $this->request( 'POST', 'sessions/' . $s['sessionId'] . '/submit', array( 'version' => $s['version'], 'revision' => $response->get_data()['revision'], 'answers' => $answers ), array( 'X-CFF-Request-Token' => $s['requestToken'], 'Idempotency-Key' => wp_generate_uuid4() ) );
		self::assertSame( 200, $completed->get_status(), Database::json( $completed->get_data() ) );
		$items = ( new Repository( new FormRepository() ) )->find( array( 'formId' => $form->id(), 'status' => 'completed' ) )['items'];
		self::assertCount( 1, $items );
		self::assertSame( array( 'street' => 'Jalan 123', 'city' => 'Jakarta', 'postcode' => '10110', 'country' => 'Indonesia' ), $items[0]->answers()['answer'] );
	}
	public function testMediaVideoAttachmentProjectsItsUrlWithoutStoringAnAnswer(): void {
		$id = wp_insert_attachment( array( 'post_title' => 'Fixture video', 'post_mime_type' => 'video/mp4', 'guid' => 'https://example.test/fixture.mp4' ) );
		try {
			$r = new FormRepository();
			$form = $this->form( 'media' );
			$schema = $form->schema();
			$schema['steps'][0]['settings'] = array( 'media' => array( 'attachmentId' => $id, 'type' => 'video', 'alt' => 'Fixture video' ) );
			$edited = $r->saveDraft( $form->id(), $schema, $form->settings(), $form->draftRevision() );
			self::assertInstanceOf( Form::class, $edited );
			$form = $r->publish( $form->id(), $edited->draftRevision() );
			self::assertInstanceOf( Form::class, $form );
			$public = \ChatFlow\Forms\PublicProjection::build( $form );
			self::assertSame( 'https://example.test/fixture.mp4', ( (array) $public['form']['media'] )[ $id ]['url'] );
			$s = $this->start( $form );
			$result = $this->sessions()->mutate( 'submit', $s['sessionId'], array( 'version' => $s['version'], 'revision' => $s['revision'], 'answers' => array() ), $s['requestToken'], wp_generate_uuid4() );
			self::assertIsArray( $result );
			$items = ( new Repository( $r ) )->find( array( 'formId' => $form->id(), 'status' => 'completed' ) )['items'];
			self::assertCount( 1, $items );
			self::assertSame( array(), $items[0]->answers() );
		} finally {
			wp_delete_attachment( $id, true );
		}
	}
	public function testRendererProjectionAdvertisesOnlyTheActiveRegistry(): void {
		$filter = static fn( $fields ) => array_values( array_filter( $fields, static fn( $field ) => 'file_upload' !== $field->type() ) );
		add_filter( 'cff_field_types', $filter );
		try {
			$public = \ChatFlow\Forms\PublicProjection::build( $this->form() );
			self::assertCount( 19, $public['features']['fieldTypes'] );
			self::assertNotContains( 'file_upload', $public['features']['fieldTypes'] );
			self::assertFalse( $public['features']['uploads'] );
		} finally {
			remove_filter( 'cff_field_types', $filter );
		}
	}
}
