<?php
namespace ChatFlow\Tests\Backend;

use PHPUnit\Framework\TestCase;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Fields\Registry;
use ChatFlow\Logic\Engine;
use ChatFlow\Rest\RestModule;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\SessionService;
use ChatFlow\Templates\Imajiner;

final class SessionProtocolTest extends TestCase {
	private FormRepository $forms;
	private \ChatFlow\Forms\Form $form;
	private SessionService $sessions;
	private array $locators = array();
	protected function setUp(): void {
		$this->forms                         = new FormRepository();
		$d                                   = Imajiner::definition();
		$d['settings']['spam']['minSeconds'] = 0;
		$this->form                          = $this->forms->create( 'Session Test ' . wp_generate_uuid4(), $d['schema'], $d['settings'] );
		$this->form                          = $this->forms->publish( $this->form->id(), $this->form->draftRevision() );
		$this->sessions                      = new SessionService( $this->forms, new Engine(), new Registry() );
		wp_set_current_user( 1 );
	}
	protected function tearDown(): void {
		global $wpdb;
		$repository = new Repository( $this->forms );
		foreach ( $repository->find( array( 'formId' => $this->form->id() ) )['items'] as $s ) {
			$repository->delete( $s->id() );
		} foreach ( $this->locators as $id ) {
			$wpdb->delete( $wpdb->prefix . 'cff_sessions', array( 'public_id' => $id ) );
		} $wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $this->form->id() ) );
		wp_delete_post( $this->form->id(), true ); }
	private function token(): string {
		return ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue(
			'start',
			array(
				'formId'  => $this->form->id(),
				'version' => $this->form->version(),
			),
			time()
		); }
	public function testSessionStartAndResumePreservePresentationTranslationOnly(): void {
		$translate = static fn( $value, $context, $name ) => 'bot.name' === $name || str_ends_with( $name, '.label' ) ? 'Translated ' . $value : $value;
		add_filter( 'wpml_translate_single_string', $translate, 10, 3 );
		try {
			$session = $this->start();
			self::assertSame( 'Translated ' . $this->form->schema()['bot']['name'], $session['schema']['bot']['name'] );
			self::assertSame( array_column( $this->form->schema()['steps'], 'id' ), array_column( $session['schema']['steps'], 'id' ) );
			self::assertSame( array_column( $this->form->schema()['steps'], 'key' ), array_column( $session['schema']['steps'], 'key' ) );
			foreach ( $this->form->schema()['steps'] as $i => $step ) {
				self::assertSame( array_column( $step['options'] ?? array(), 'value' ), array_column( $session['schema']['steps'][ $i ]['options'] ?? array(), 'value' ) );
				self::assertSame( $step['logic'] ?? array(), $session['schema']['steps'][ $i ]['logic'] ?? array() );
			}
			$resume = $this->sessions->resume( $this->form->id(), $session['resumeToken'] );
			self::assertIsArray( $resume );
			self::assertSame( $session['schema'], $resume['schema'] );
		} finally {
			remove_filter( 'wpml_translate_single_string', $translate, 10 );
		}
	}
	public function testSessionRestRoutesKeepTranslatedSchemaAndNoPrivateSettings(): void {
		$translate = static fn( $value, $context, $name ) => 'bot.name' === $name ? 'Terjemahan' : $value;
		add_filter( 'wpml_translate_single_string', $translate, 10, 3 );
		try {
			$request = new \WP_REST_Request( 'POST', '/cff/v1/sessions' );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_header( 'X-CFF-Start-Token', $this->token() );
			$request->set_header( 'Idempotency-Key', wp_generate_uuid4() );
			$request->set_body( wp_json_encode( array( 'formId' => $this->form->id(), 'version' => $this->form->version() ) ) );
			$started = rest_do_request( $request );
			self::assertSame( 201, $started->get_status(), wp_json_encode( $started->get_data() ) );
			$session = $started->get_data(); self::assertSame( 'Terjemahan', $session['schema']['bot']['name'] );
			self::assertArrayNotHasKey( 'notifications', $session ); self::assertArrayNotHasKey( 'settings', $session );
			$resume = new \WP_REST_Request( 'POST', '/cff/v1/sessions/resume' );
			$resume->set_header( 'Content-Type', 'application/json' );
			$resume->set_header( 'X-CFF-Resume-Token', $session['resumeToken'] );
			$resume->set_body( wp_json_encode( array( 'formId' => $this->form->id() ) ) );
			$response = rest_do_request( $resume ); self::assertSame( 200, $response->get_status(), wp_json_encode( $response->get_data() ) ); self::assertSame( $session['schema'], $response->get_data()['schema'] );
		} finally {
			remove_filter( 'wpml_translate_single_string', $translate, 10 );
		}
	}
	private function start( array $prefill = array() ): array {
		$s = $this->sessions->start(
			array(
				'formId'  => $this->form->id(),
				'version' => $this->form->version(),
				'meta'    => array(
					'pageUrl' => home_url( '/?utm_source=url-campaign' ),
					'utm'     => array( 'source' => 'first-touch' ),
				),
				'prefill' => $prefill,
			),
			$this->token(),
			wp_generate_uuid4()
		);
		self::assertIsArray( $s );
		$this->locators[] = $s['sessionId'];
		return $s; }
	private function body( array $s, array $answers ): array {
		return array(
			'version'  => $s['version'],
			'revision' => $s['revision'],
			'answers'  => $answers,
		); }
	private function answers(): array {
		return array(
			'punya_website'   => 'Belum pernah',
			'layanan'         => 'Membuat website baru',
			'jenis_website'   => '🏢 Company / Business Profile',
			'deskripsi'       => null,
			'budget'          => 'Rp5–10 jt',
			'nama'            => 'Ayu',
			'whatsapp'        => '08123456789',
			'email'           => 'ayu@example.test',
			'boleh_ditelepon' => false,
			'catatan'         => null,
		); }
	public function testHandshakeDurableResumeAndFrozenContext(): void {
		global $wpdb;
		$s = $this->start();
		self::assertNotSame( $s['requestToken'], $s['resumeToken'] );
		self::assertStringStartsWith( 'r1.', $s['resumeToken'] );
		self::assertSame( 'step_punya_website', $s['currentStepId'] );
		self::assertGreaterThan( 28 * DAY_IN_SECONDS, strtotime( $s['resumeExpiresAt'] ) - time() );
		$r = $this->sessions->resume( $this->form->id(), $s['resumeToken'] );
		self::assertIsArray( $r );
		self::assertSame( Database::json( $s['context'] ), Database::json( $r['context'] ) );
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
		self::assertSame( hash( 'sha256', $s['resumeToken'] ), $row['resume_hash'] );
		self::assertStringNotContainsString( $s['resumeToken'], $row['context'] );
		$receipt = $wpdb->get_var( $wpdb->prepare( "SELECT response FROM {$wpdb->prefix}cff_requests WHERE scope_hash=%s", Database::decode( $row['context'] )['_startScope'] ) );
		self::assertStringStartsWith( 'e1.', $receipt );
		self::assertStringNotContainsString( $s['resumeToken'], $receipt );
		self::assertStringNotContainsString( $s['requestToken'], $receipt );
		self::assertArrayNotHasKey( '_meta', $s['context'] ); }
	public function testHandshakeCannotCreateUnlimitedSessionsWithNewIdempotencyKeys(): void {
		$ip = ( new \ChatFlow\Tracking\IpResolver() )->resolve( $_SERVER, \ChatFlow\Rest\Settings::get()['proxy'] );
		$limiter = new \ChatFlow\Spam\RateLimiter();
		for ( $i = 0; $i < 29; ++$i ) {
			self::assertTrue( $limiter->consume( 'session-start:' . $this->form->id() . ':' . $ip, 30, 600 ) );
		}
		$token = $this->token();
		$body = array( 'formId' => $this->form->id(), 'version' => $this->form->version(), 'meta' => array(), 'prefill' => array() );
		$key = wp_generate_uuid4();
		$first = $this->sessions->start( $body, $token, $key );
		self::assertIsArray( $first );
		$this->locators[] = $first['sessionId'];
		$retry = $this->sessions->start( $body, $token, $key );
		self::assertIsArray( $retry );
		self::assertSame( $first['sessionId'], $retry['sessionId'] );
		self::assertSame( $first['resumeToken'], $retry['resumeToken'] );
		$limited = $this->sessions->start( $body, $token, wp_generate_uuid4() );
		self::assertInstanceOf( \WP_Error::class, $limited );
		self::assertSame( 'cff_rate_limit', $limited->get_error_code() );
	}
	public function testBadPurposeAndLocatorNeverGrantSubmitAuthority(): void {
		$s = $this->start();
		$r = $this->sessions->mutate( 'patch', $s['sessionId'], $this->body( $s, array() ), $s['resumeToken'], wp_generate_uuid4() );
		self::assertSame( 'cff_invalid_credential', $r->get_error_code() );
		$r = $this->sessions->get( $s['sessionId'], $s['sessionId'] );
		self::assertInstanceOf( \WP_Error::class, $r ); }
	public function testPatchRevisionConflictsAndIdempotentRetry(): void {
		$s    = $this->start();
		$key  = wp_generate_uuid4();
		$body = $this->body( $s, array( 'punya_website' => 'Belum pernah' ) );
		$r    = $this->sessions->mutate( 'patch', $s['sessionId'], $body, $s['requestToken'], $key );
		self::assertIsArray( $r );
		self::assertSame( 1, $r['revision'] );
		self::assertSame( 'step_layanan', $r['currentStepId'] );
		self::assertSame( Database::json( $r ), Database::json( $this->sessions->mutate( 'patch', $s['sessionId'], $body, $s['requestToken'], $key ) ) );
		$conflict = $this->sessions->mutate( 'patch', $s['sessionId'], $body, $s['requestToken'], wp_generate_uuid4() );
		self::assertSame( 'cff_revision_conflict', $conflict->get_error_code() );
		$body['answers']['punya_website'] = 'Pernah, buat sendiri';
		$conflict                         = $this->sessions->mutate( 'patch', $s['sessionId'], $body, $s['requestToken'], $key );
		self::assertSame( 'cff_idempotency_conflict', $conflict->get_error_code() ); }
	public function testUnvisitedAndHiddenOverrideTamperingRollBack(): void {
		$s = $this->start();
		foreach ( array( array( 'alamat_website' => 'https://evil.test' ), array( 'utm_source' => 'forged' ), array( 'unknown' => 'forged' ) ) as $answers ) {
			$r = $this->sessions->mutate( 'patch', $s['sessionId'], $this->body( $s, $answers ), $s['requestToken'], wp_generate_uuid4() );
			self::assertInstanceOf( \WP_Error::class, $r );
			self::assertSame( 422, $r->get_error_data()['status'] );
		} self::assertSame( 0, $this->sessions->get( $s['sessionId'], $s['requestToken'] )['revision'] ); }
	public function testAtomicSubmitOutboxAndClosedRetryEvenExpiredRequestToken(): void {
		global $wpdb;
		$s                = $this->start();
		$body             = $this->body( $s, $this->answers() );
		$body['honeypot'] = '';
		$key              = wp_generate_uuid4();
		$result           = $this->sessions->mutate( 'submit', $s['sessionId'], $body, $s['requestToken'], $key );
		self::assertIsArray( $result );
		self::assertSame( 'completed', $result['submission']['status'] );
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
		self::assertSame( 'completed', $row['status'] );
		$submission = ( new Repository( $this->forms ) )->get( (int) $row['submission_id'] );
		self::assertSame( '+628123456789', $submission->answers()['whatsapp'] );
		self::assertArrayNotHasKey( 'alamat_website', $submission->answers() );
		self::assertArrayHasKey( 'context', $submission->meta() );
		$count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d", $submission->id() ) );
		self::assertSame( 2, $count );
		$expired = ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue(
			'request',
			array(
				'sessionId' => $s['sessionId'],
				'formId'    => $s['formId'],
				'version'   => 1,
			),
			time() - 10,
			1
		);
		self::assertSame( Database::json( $result ), Database::json( $this->sessions->mutate( 'submit', $s['sessionId'], $body, $expired, $key ) ) );
		self::assertSame( $count, (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d", $submission->id() ) ) ); }
	public function testPinnedVersionAfterRepublishAndUnpublishedCannotResume(): void {
		$s     = $this->start();
		$draft = $this->forms->getDraft( $this->form->id() );
		$this->forms->publish( $draft->id(), $draft->draftRevision() );
		self::assertSame( 1, $this->sessions->resume( $this->form->id(), $s['resumeToken'] )['version'] );
		wp_update_post(
			array(
				'ID'          => $this->form->id(),
				'post_status' => 'draft',
			)
		);
		$result = $this->sessions->resume( $this->form->id(), $s['resumeToken'] );
		self::assertSame( 'cff_form_not_found', $result->get_error_code() ); }
	public function testTamperedCredentialsAndExpiredSessionRejectWritesAndKeepPartial(): void {
		global $wpdb;
		$s     = $this->start();
		$patch = $this->sessions->mutate( 'patch', $s['sessionId'], $this->body( $s, array( 'punya_website' => 'Belum pernah' ) ), $s['requestToken'], wp_generate_uuid4() );
		self::assertIsArray( $patch );
		self::assertInstanceOf( \WP_Error::class, $this->sessions->get( $s['sessionId'], $s['requestToken'] . 'x' ) );
		self::assertInstanceOf( \WP_Error::class, $this->sessions->resume( $this->form->id(), $s['resumeToken'] . 'x' ) );
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
		$wpdb->update( $wpdb->prefix . 'cff_sessions', array( 'expires_at' => gmdate( 'Y-m-d H:i:s', time() - 60 ) ), array( 'id' => $row['id'] ) );
		self::assertInstanceOf( \WP_Error::class, $this->sessions->resume( $this->form->id(), $s['resumeToken'] ) );
		self::assertInstanceOf( \WP_Error::class, $this->sessions->mutate( 'submit', $s['sessionId'], $this->body( $patch, $this->answers() ), $s['requestToken'], wp_generate_uuid4() ) );
		$partial = ( new Repository( $this->forms ) )->get( (int) $row['submission_id'] );
		self::assertSame( 'partial', $partial->status() );
		self::assertSame( 'Belum pernah', $partial->answers()['punya_website'] );
		$wpdb->update( $wpdb->prefix . 'cff_sessions', array( 'last_seen_at' => gmdate( 'Y-m-d H:i:s', time() - 2 * DAY_IN_SECONDS ) ), array( 'id' => $row['id'] ) );
		do_action( 'cff_abandon_sessions' );
		self::assertSame( 'abandoned', ( new Repository( $this->forms ) )->get( $partial->id() )->status() );
	}
	public function testStartAndSubmitReceiptsRemovedWithPrivateSubmission(): void {
		global $wpdb;
		$s       = $this->start();
		$repo    = new Repository( $this->forms );
		$row     = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ), ARRAY_A );
		$context = Database::decode( $row['context'] );
		self::assertSame( '1', $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_requests WHERE scope_hash=%s", $context['_startScope'] ) ) );
		$repo->delete( (int) $row['submission_id'] );
		self::assertSame( '0', $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_requests WHERE scope_hash=%s", $context['_startScope'] ) ) );
		self::assertNull( $wpdb->get_var( $wpdb->prepare( "SELECT public_id FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $s['sessionId'] ) ) ); }
}
