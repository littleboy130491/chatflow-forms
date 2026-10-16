<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Fields\Registry;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Frontend\Engagement;
use ChatFlow\Frontend\EventCollector;
use ChatFlow\Frontend\FrontendModule;
use ChatFlow\Frontend\Uploads;
use ChatFlow\Logic\Engine;
use ChatFlow\Privacy\PrivateFiles;
use ChatFlow\Rest\UploadController;
use ChatFlow\Rest\UploadSession;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Spam\Akismet;
use ChatFlow\Spam\Captcha;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\SessionService;
use ChatFlow\Templates\Imajiner;
use PHPUnit\Framework\TestCase;

final class EngagementTest extends TestCase {
	private Form $form;
	private FormRepository $forms;
	private SessionService $sessions;
	private array $ids = array();
	private mixed $settings;
	private array $files = array();
	private mixed $network_mimes;
	protected function setUp(): void {
		$this->network_mimes = get_site_option( 'upload_filetypes' );
		if ( is_multisite() ) {
			update_site_option( 'upload_filetypes', trim( (string) $this->network_mimes . ' txt' ) );
		}
		$this->settings                      = get_option( 'cff_settings', array() );
		$d                                   = Imajiner::definition();
		$d['settings']['spam']['minSeconds'] = 0;
		$this->forms                         = new FormRepository();
		$draft                               = $this->forms->create( 'Engagement test', $d['schema'], $d['settings'] );
		self::assertInstanceOf( Form::class, $draft );
		$this->form     = $this->forms->publish( $draft->id(), $draft->draftRevision() );
		$this->sessions = new SessionService( $this->forms, new Engine(), new Registry() );
		update_option(
			'cff_settings',
			array(
				'tracking' => array(
					'enabled'         => true,
					'consentRequired' => true,
				),
			)
		);
		wp_set_current_user( 1 );
	}
	protected function tearDown(): void {
		global $wpdb;
		foreach ( $this->ids as $id ) {
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $id ), ARRAY_A );
			if ( $row ) {
				foreach ( $wpdb->get_results( $wpdb->prepare( "SELECT storage_key FROM {$wpdb->prefix}cff_uploads WHERE session_id=%d", $row['id'] ), ARRAY_A ) as $upload ) {
					$this->files[] = ( new PrivateFiles() )->path( $upload['storage_key'] ); }
				$wpdb->delete( $wpdb->prefix . 'cff_events', array( 'session_id' => $row['id'] ) );
				$wpdb->delete( $wpdb->prefix . 'cff_uploads', array( 'session_id' => $row['id'] ) ); }
			$wpdb->delete( $wpdb->prefix . 'cff_sessions', array( 'public_id' => $id ) );
		}
		foreach ( $this->files as $path ) {
			if ( file_exists( $path ) || is_link( $path ) ) {
				unlink( $path ); }
		}
		$repo = new Repository( $this->forms );
		foreach ( $repo->find( array( 'formId' => $this->form->id() ) )['items'] as $sub ) {
			$repo->delete( $sub->id() ); }
		$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $this->form->id() ) );
		wp_delete_post( $this->form->id(), true );
		update_option( 'cff_settings', $this->settings );
		if ( is_multisite() ) {
			update_site_option( 'upload_filetypes', $this->network_mimes );
		}
		remove_all_filters( 'pre_http_request' );
	}
	private function start(): array {
		$token = ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue(
			'start',
			array(
				'formId'  => $this->form->id(),
				'version' => $this->form->version(),
			),
			time()
		);
		$s     = $this->sessions->start(
			array(
				'formId'  => $this->form->id(),
				'version' => $this->form->version(),
			),
			$token,
			wp_generate_uuid4()
		);
		self::assertIsArray( $s );
		$this->ids[] = $s['sessionId'];
		return $s;
	}
	private function response( string $body, int $code = 200 ): array {
		return array(
			'headers'  => array(),
			'response' => array( 'code' => $code ),
			'body'     => $body,
		); }
	public function testCaptchaHostActionScoreAgeAndFailClosedTransport(): void {
		$settings = array(
			'captcha'   => 'recaptcha',
			'siteKey'   => 'test-site-key',
			'secretKey' => 'test-only-placeholder',
			'minScore'  => 0.5,
		);
		$data     = array(
			'success'      => true,
			'hostname'     => wp_parse_url( home_url(), PHP_URL_HOST ),
			'challenge_ts' => gmdate( 'c' ),
			'action'       => 'cff_submit',
			'score'        => 0.8,
		);
		$captured = array();
		$response = $this->response( Database::json( $data ) );
		add_filter(
			'pre_http_request',
			function ( $pre, $args, $url ) use ( &$response, &$captured ) {
				$captured = array( $url, $args );
				return $response;
			},
			10,
			3
		);
		$captcha = new Captcha();
		self::assertTrue( $captcha->verify( 'recaptcha', 'test-token', $settings ) );
		self::assertSame( 0, $captured[1]['redirection'] );
		self::assertTrue( $captured[1]['sslverify'] );
		self::assertSame( 'https://www.google.com/recaptcha/api/siteverify', $captured[0] );
		foreach ( array( array( 'hostname' => 'attacker.test' ), array( 'action' => 'other' ), array( 'score' => 0.1 ), array( 'challenge_ts' => gmdate( 'c', time() - 200 ) ), array( 'success' => false ) ) as $override ) {
			$response = $this->response( Database::json( array_merge( $data, $override ) ) );
			self::assertFalse( $captcha->verify( 'recaptcha', 'test-token', $settings ) ); }
		$response = new \WP_Error( 'timeout', 'No network.' );
		self::assertFalse( $captcha->verify( 'recaptcha', 'test-token', $settings ) );
		self::assertFalse( $captcha->verify( 'recaptcha', str_repeat( 'a', 2049 ), $settings ) );
		self::assertFalse( $captcha->verify( 'turnstile', 'test-token', $settings ) );
		foreach ( array( 'turnstile', 'hcaptcha' ) as $provider ) {
			$settings['captcha'] = $provider;
			$response            = $this->response( Database::json( $data ) );
			self::assertTrue( $captcha->verify( $provider, 'test-token', $settings ) );
			if ( 'hcaptcha' === $provider ) {
				self::assertSame( 'test-site-key', $captured[1]['body']['sitekey'] ); }
		}
	}
	public function testAkismetSafeEndpointMinimalFieldsAndQuarantineErrors(): void {
		$response = $this->response( 'false' );
		$captured = array();
		add_filter(
			'pre_http_request',
			function ( $pre, $args, $url ) use ( &$response, &$captured ) {
				$captured = array( $url, $args );
				return $response;
			},
			10,
			3
		);
		$global  = array(
			'spam'  => array( 'akismetKey' => 'test-only-placeholder' ),
			'proxy' => array( 'mode' => 'direct' ),
		);
		$akismet = new Akismet();
		$answers = array(
			'email'   => 'test@example.test',
			'catatan' => str_repeat( 'a', 12000 ),
			'hidden'  => 'do-not-send',
		);
		$server  = array(
			'REMOTE_ADDR' => '192.0.2.1',
			'HTTP_COOKIE' => 'must-not-send',
		);
		self::assertFalse( $akismet->check( $this->form, $answers, $global, $server ) );
		self::assertSame( 'https://rest.akismet.com/1.1/comment-check', $captured[0] );
		self::assertLessThanOrEqual( 10000, mb_strlen( $captured[1]['body']['comment_content'] ) );
		self::assertStringNotContainsString( 'must-not-send', Database::json( $captured ) );
		$response = $this->response( 'true' );
		self::assertTrue( $akismet->check( $this->form, $answers, $global, $server ) );
		$response = $this->response( 'invalid' );
		self::assertNull( $akismet->check( $this->form, $answers, $global, $server ) );
	}
	public function testSafeConfigNeverProjectsSecretsAndSiteRulesExcludeFirst(): void {
		update_option(
			'cff_settings',
			array(
				'spam' => array(
					'captcha'    => 'turnstile',
					'siteKey'    => 'test-public-key',
					'secretKey'  => 'must-not-project',
					'akismetKey' => 'also-private',
				),
			)
		);
		$settings                    = $this->form->settings();
		$settings['spam']['captcha'] = 'turnstile';
		$form                        = new Form( $this->form->id(), 'Title', 'slug', $this->form->schema(), $settings, 1, 1, 'publish' );
		$config                      = Engagement::config( $form );
		self::assertSame( 'test-public-key', $config['captcha']['siteKey'] );
		self::assertStringNotContainsString( 'must-not-project', Database::json( $config ) );
		self::assertStringNotContainsString( 'also-private', Database::json( $config ) );
		self::assertFalse(
			FrontendModule::eligible(
				array(
					'enabled'        => true,
					'includePageIds' => array( 3 ),
					'excludePageIds' => array( 3 ),
				),
				3
			)
		);
		self::assertTrue( FrontendModule::eligible( array( 'enabled' => true ), 8 ) );
		self::assertFalse( FrontendModule::eligible( array(), 8 ) );
	}
	public function testAnonymousEventOwnershipAllowlistPathPrivacyAndCap(): void {
		global $wpdb;
		$s         = $this->start();
		$collector = new EventCollector();
		$body      = array(
			'events'         => array(
				array( 'event' => 'view' ),
				array(
					'event'  => 'view',
					'stepId' => $s['currentStepId'],
				),
			),
			'consentGranted' => true,
		);
		self::assertWPError( $collector->collect( $s['sessionId'], 'wrong-token', $body, array() ) );
		foreach ( array( array( 'HTTP_DNT' => '1' ), array( 'HTTP_SEC_GPC' => '1' ) ) as $server ) {
			self::assertSame( array( 'stored' => 0 ), $collector->collect( $s['sessionId'], $s['requestToken'], $body, $server ) ); }
		self::assertSame( array( 'stored' => 0 ), $collector->collect( $s['sessionId'], $s['requestToken'], array_merge( $body, array( 'optOut' => true ) ), array() ) );
		self::assertSame( array( 'stored' => 0 ), $collector->collect( $s['sessionId'], $s['requestToken'], array_merge( $body, array( 'consentGranted' => false ) ), array() ) );
		self::assertSame( array( 'stored' => 2 ), $collector->collect( $s['sessionId'], $s['requestToken'], $body, array() ) );
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_events WHERE form_id=%d", $this->form->id() ), ARRAY_A );
		self::assertCount( 2, $rows );
		self::assertNull( $rows[0]['payload'] );
		self::assertSame( '', $rows[0]['step_id'] );
		self::assertNotSame( $s['sessionId'], $rows[0]['session_id'] );
		foreach ( array(
			array( 'event' => 'complete' ),
			array(
				'event'  => 'view',
				'stepId' => 'forged',
			),
			array(
				'event'  => 'answer',
				'stepId' => $s['currentStepId'],
			),
			array(
				'event' => 'view',
				'token' => 'private',
			),
		) as $event ) {
			self::assertWPError(
				$collector->collect(
					$s['sessionId'],
					$s['requestToken'],
					array(
						'events'         => array( $event ),
						'consentGranted' => true,
					),
					array()
				)
			); }
		$batch = array(
			'events'         => array_fill( 0, 10, array( 'event' => 'view' ) ),
			'consentGranted' => true,
		); for ( $i = 0; $i < 20; $i++ ) {
			self::assertIsArray( $collector->collect( $s['sessionId'], $s['requestToken'], $batch, array() ) );
		} self::assertSame( array( 'stored' => 0 ), $collector->collect( $s['sessionId'], $s['requestToken'], $batch, array() ) );
		self::assertSame( '200', $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_events WHERE form_id=%d", $this->form->id() ) ) );
	}
	public function testActualMimeSizeSymlinksAndAuthenticatedDownloadAndOwnership(): void {
		global $wpdb;
		$s             = $this->start();
		$other         = $this->start();
		$uploads       = new Uploads();
		$private       = new PrivateFiles();
		$key           = 'upload-' . bin2hex( random_bytes( 32 ) ) . '.bin';
		$path          = $private->path( $key );
		$this->files[] = $path;
		file_put_contents( $path, 'Plain text fixture.' );
		chmod( $path, 0600 );
		$step    = array(
			'id'         => 'file',
			'key'        => 'file',
			'type'       => 'file_upload',
			'label'      => 'File',
			'messages'   => array(),
			'validation' => array(
				'maxBytes'  => 1000,
				'mimeTypes' => array( 'text/plain' ),
			),
		);
		$checked = $uploads->inspect( $path, 'test.txt', $step );
		self::assertIsArray( $checked );
		self::assertSame( 'text/plain', $checked['mime'] );
		self::assertWPError( $uploads->inspect( $path, 'test.php', $step ) );
		self::assertWPError( $uploads->inspect( $path, 'test.txt', array_merge( $step, array( 'validation' => array( 'maxBytes' => 1 ) ) ) ) );
		$link = $private->path( 'upload-' . bin2hex( random_bytes( 32 ) ) . '.bin' );
		symlink( $path, $link );
		$this->files[] = $link;
		self::assertWPError( $uploads->inspect( $link, 'test.txt', $step ) );
		$row      = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
		$other_id = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $other['sessionId'] ) );
		$uuid     = wp_generate_uuid4();
		$wpdb->insert(
			$wpdb->prefix . 'cff_uploads',
			array(
				'uuid'          => $uuid,
				'session_id'    => $row['id'],
				'submission_id' => $row['submission_id'],
				'field_id'      => 'file',
				'storage_key'   => $key,
				'original_name' => 'test.txt',
				'mime'          => 'text/plain',
				'bytes'         => filesize( $path ),
				'created_at'    => Database::now(),
				'expires_at'    => $row['expires_at'],
			)
		);
		$schema            = $this->form->schema();
		$schema['steps'][] = $step;
		$file_form         = new Form( $this->form->id(), 'Test', 'test', $schema, $this->form->settings(), 1, 1, 'publish' );
		self::assertNull( $uploads->validateAnswers( $file_form, (int) $row['id'], array( 'file' => $uuid ) ) );
		self::assertWPError( $uploads->validateAnswers( $file_form, $other_id, array( 'file' => $uuid ) ) );
		$controller = new UploadController();
		$request    = new \WP_REST_Request( 'GET', '/cff/v1/admin/uploads/' . $uuid );
		$request->set_param( 'id', $uuid );
		wp_set_current_user( 0 );
		self::assertWPError( $controller->download( $request ) );
		wp_set_current_user( 1 );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$response = $controller->download( $request );
		self::assertInstanceOf( \WP_REST_Response::class, $response );
		self::assertArrayNotHasKey( 'path', $response->get_data() );
		self::assertSame( 'private, no-store', $response->get_headers()['Cache-Control'] );
		$request->set_query_params( array( 'token' => 'leaked' ) );
		self::assertWPError( $controller->authorize( $request ) );
		$request->set_query_params( array() );
		$request->set_header( 'Origin', 'https://attacker.test' );
		self::assertWPError( UploadSession::guard( $request ) );
		self::assertWPError(
			$uploads->receive(
				$s['sessionId'],
				$s['requestToken'],
				'file',
				array(
					'error'    => UPLOAD_ERR_OK,
					'tmp_name' => $path,
					'name'     => 'test.txt',
				),
				wp_generate_uuid4()
			)
		);
	}
	public function testRealMultipartUploadIdempotencyAndSelectedBinding(): void {
		global $wpdb;
		$schema = $this->form->schema();
		$schema['steps'] = array( array(
			'id'         => 'file',
			'key'        => 'file',
			'type'       => 'file_upload',
			'label'      => 'File',
			'messages'   => array(),
			'validation' => array(
				'maxBytes'  => 1000,
				'mimeTypes' => array( 'text/plain' ),
			),
		) );
		$draft = $this->forms->saveDraft( $this->form->id(), $schema, $this->form->settings(), $this->form->draftRevision() );
		self::assertInstanceOf( Form::class, $draft );
		$this->form = $this->forms->publish( $draft->id(), $draft->draftRevision() );
		self::assertInstanceOf( Form::class, $this->form );
		$s = $this->start();
		$socket = stream_socket_server( 'tcp://127.0.0.1:0', $code, $message );
		self::assertIsResource( $socket );
		$address = stream_socket_get_name( $socket, false );
		fclose( $socket );
		$log     = tempnam( sys_get_temp_dir(), 'cff-http-' );
		$environment = array_merge( getenv(), array(
			'CFF_UPLOAD_TEST_PREFIX' => $wpdb->prefix,
			'CFF_UPLOAD_TEST_PRIVATE' => CFF_PRIVATE_DIR,
			'CFF_UPLOAD_TEST_MULTISITE' => is_multisite() ? '1' : '',
		) );
		$process = proc_open(
			array( PHP_BINARY, '-d', 'upload_max_filesize=2M', '-d', 'post_max_size=3M', '-S', $address, __DIR__ . '/upload-router.php' ),
			array(
				0 => array( 'pipe', 'r' ),
				1 => array( 'file', $log, 'a' ),
				2 => array( 'file', $log, 'a' ),
			),
			$pipes,
			null,
			$environment
		);
		self::assertIsResource( $process );
		fclose( $pipes[0] );
		try {
			$ready = false;
			for ( $i = 0; $i < 100; $i++ ) {
				if ( 'ready' === @file_get_contents( 'http://' . $address . '/ready' ) ) {
					$ready = true;
					break;
				} usleep( 50000 ); }
			self::assertTrue( $ready, 'Loopback multipart fixture did not start: ' . file_get_contents( $log ) );
			$send  = static function ( string $field, string $content, string $name, string $key, string $token ) use ( $s, $address ): array {
				$boundary = 'cff-' . bin2hex( random_bytes( 12 ) );
				$body     = '--' . $boundary . "\r\nContent-Disposition: form-data; name=\"fieldId\"\r\n\r\n" . $field . "\r\n--" . $boundary . "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" . $name . "\"\r\nContent-Type: text/plain\r\n\r\n" . $content . "\r\n--" . $boundary . "--\r\n";
				$context  = stream_context_create(
					array(
						'http' => array(
							'method'        => 'POST',
							'header'        => "Content-Type: multipart/form-data; boundary=$boundary\r\nX-CFF-Request-Token: $token\r\nIdempotency-Key: $key\r\nOrigin: " . home_url() . "\r\n",
							'content'       => $body,
							'ignore_errors' => true,
							'timeout'       => 10,
						),
					)
				);
				$response = file_get_contents( 'http://' . $address . '/cff/v1/sessions/' . $s['sessionId'] . '/uploads', false, $context );
				return json_decode( $response, true, 512, JSON_THROW_ON_ERROR );
			};
			$key   = wp_generate_uuid4();
			$first = $send( 'file', 'Genuine multipart content.', 'test.txt', $key, $s['requestToken'] );
			self::assertArrayHasKey( 'uploadId', $first, json_encode( $first ) );
			self::assertSame( 'text/plain', $first['mime'] );
			$duplicate = $send( 'file', 'Genuine multipart content.', 'test.txt', $key, $s['requestToken'] );
			self::assertSame( $first, $duplicate );
			$changed = $send( 'file', 'Changed content.', 'test.txt', $key, $s['requestToken'] );
			self::assertSame( 'cff_idempotency_conflict', $changed['code'] );
			foreach ( array( array( 'wrong-field', 'Plain text', 'test.txt', $s['requestToken'] ), array( 'file', '<html><script>alert(1)</script></html>', 'test.txt', $s['requestToken'] ), array( 'file', str_repeat( 'a', 1001 ), 'test.txt', $s['requestToken'] ), array( 'file', 'Plain text', 'test.txt', 'wrong-token' ) ) as $invalid ) {
				$result = $send( $invalid[0], $invalid[1], $invalid[2], wp_generate_uuid4(), $invalid[3] );
				self::assertArrayHasKey( 'code', $result );
				self::assertArrayNotHasKey( 'uploadId', $result ); }
			$second = $send( 'file', 'Second genuine multipart.', 'second.txt', wp_generate_uuid4(), $s['requestToken'] );
			self::assertArrayHasKey( 'uploadId', $second );
			$session = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
			$rows    = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_uploads WHERE session_id=%d", $session['id'] ), ARRAY_A );
			self::assertCount( 2, $rows );
			foreach ( $rows as $row ) {
				$path          = ( new PrivateFiles() )->path( $row['storage_key'] );
				$this->files[] = $path;
				self::assertSame( 0600, fileperms( $path ) & 0777 );
				self::assertStringNotContainsString( 'wp-content', $path );
				self::assertNull( $row['submission_id'] ); }
			$patched = $this->sessions->mutate( 'patch', $s['sessionId'], array( 'version' => $s['version'], 'revision' => $s['revision'], 'answers' => array( 'file' => $first['uploadId'] ) ), $s['requestToken'], wp_generate_uuid4() );
			self::assertIsArray( $patched );
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_uploads WHERE session_id=%d ORDER BY id", $session['id'] ), ARRAY_A );
			self::assertSame( $session['submission_id'], $rows[0]['submission_id'] );
			self::assertNull( $rows[0]['expires_at'] );
			self::assertNull( $rows[1]['submission_id'] );
			self::assertNotNull( $rows[1]['expires_at'] );
		} finally {
			proc_terminate( $process );
			proc_close( $process );
			unlink( $log ); }
	}
	private static function assertWPError( mixed $value ): void {
		self::assertInstanceOf( \WP_Error::class, $value ); }
}
