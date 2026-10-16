<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Fields\Registry;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Logic\Engine;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Submissions\MagicLinks;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\SessionService;
use ChatFlow\Templates\Imajiner;
use PHPUnit\Framework\TestCase;

final class PhaseThreeMagicLinkTest extends TestCase {
	private Form $form;
	private array $session;
	private string $email;
	private mixed $previous_ip;
	protected function setUp(): void {
		$this->previous_ip = $_SERVER['REMOTE_ADDR'] ?? null;
		$_SERVER['REMOTE_ADDR'] = '10.' . random_int( 1, 254 ) . '.' . random_int( 1, 254 ) . '.' . random_int( 1, 254 );
		$d                                   = Imajiner::definition();
		$d['schema']['steps']               = array( array( 'id' => 'email_step', 'key' => 'email', 'type' => 'email', 'label' => 'Email', 'messages' => array( 'Email?' ), 'required' => true ) );
		$d['settings']['sessions']['magicLinks'] = array( 'enabled' => true, 'whatsapp' => true, 'emailField' => 'email', 'ttlMinutes' => 30 );
		$d['settings']['sessions']['savePartial'] = true;
		$d['settings']['sessions']['resumeEnabled'] = true;
		$repo = new FormRepository();
		$form = $repo->create( 'Magic ' . wp_generate_uuid4(), $d['schema'], $d['settings'] );
		self::assertInstanceOf( Form::class, $form );
		$this->email = 'respondent+' . bin2hex( random_bytes( 8 ) ) . '@example.org';
		$this->form = $repo->publish( $form->id(), $form->draftRevision() );
		self::assertInstanceOf( Form::class, $this->form );
		$token = ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue( 'start', array( 'formId' => $this->form->id(), 'version' => $this->form->version() ), time() );
		$this->session = ( new SessionService( $repo, new Engine(), new Registry() ) )->start( array( 'formId' => $this->form->id(), 'version' => $this->form->version(), 'meta' => array(), 'prefill' => array( 'email' => $this->email ) ), $token, wp_generate_uuid4() );
		self::assertIsArray( $this->session );
	}
	protected function tearDown(): void {
		global $wpdb;
		$repo = new Repository( new FormRepository() );
		foreach ( $repo->find( array( 'formId' => $this->form->id() ) )['items'] as $submission ) {
			$repo->delete( $submission->id() ); }
		$wpdb->delete( $wpdb->prefix . 'cff_sessions', array( 'form_id' => $this->form->id() ) );
		$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $this->form->id() ) );
		wp_delete_post( $this->form->id(), true );
		if ( null === $this->previous_ip ) {
			unset( $_SERVER['REMOTE_ADDR'] );
		} else {
			$_SERVER['REMOTE_ADDR'] = $this->previous_ip;
		}
	}
	private function request( string $route, array $body ): \WP_REST_Request {
		$r = new \WP_REST_Request( 'POST', $route );
		$r->set_header( 'Content-Type', 'application/json' );
		$r->set_body( wp_json_encode( $body ) );
		return $r;
	}
	private function issuance( string $channel, bool $consent = true ): \WP_REST_Request {
		$issue = $this->request( '/cff/v1/sessions/' . $this->session['sessionId'] . '/magic-link', array( 'channel' => $channel, 'consent' => $consent ) );
		$issue->set_url_params( array( 'id' => $this->session['sessionId'] ) );
		$issue->set_header( 'X-CFF-Request-Token', $this->session['requestToken'] );
		return $issue;
	}
	public function testConsentGenericEmailDeliveryAndSingleUseCrossDeviceResume(): void {
		global $wpdb;
		$links = new MagicLinks();
		$generic = $links->issue( $this->issuance( 'email' ) );
		self::assertSame( array( 'accepted' => true ), $generic->get_data() );
		self::assertSame( 'no-store, private', $generic->get_headers()['Cache-Control'] );
		$record = $wpdb->get_row( "SELECT * FROM {$wpdb->prefix}cff_magic_links ORDER BY id DESC LIMIT 1", ARRAY_A );
		self::assertNotNull( $record );
		self::assertSame( 64, strlen( $record['token_hash'] ) );
		self::assertStringNotContainsString( $this->email, $record['payload'] );
		$link = '';
		$filter = static function ( $pre, $args ) use ( &$link ) { preg_match( '~https?://[^\\s]+~', $args['message'], $match ); $link = $match[0] ?? ''; return true; };
		add_filter( 'pre_wp_mail', $filter, 10, 2 );
		try { $links->deliver( (int) $record['id'] ); } finally { remove_filter( 'pre_wp_mail', $filter, 10 ); }
		self::assertMatchesRegularExpression( '/#cff-magic=[A-Za-z0-9_-]{43}$/', $link );
		self::assertNull( wp_parse_url( $link, PHP_URL_QUERY ) );
		self::assertStringNotContainsString( $this->email, $link );
		$token = explode( '#cff-magic=', $link )[1];
		self::assertSame( hash( 'sha256', $token ), $record['token_hash'] );
		$redeem = $this->request( '/cff/v1/sessions/magic-resume', array( 'formId' => $this->form->id() ) );
		$redeem->set_header( 'X-CFF-Magic-Token', $token );
		$envelope = $links->consume( $redeem );
		self::assertInstanceOf( \WP_REST_Response::class, $envelope );
		self::assertSame( $this->session['sessionId'], $envelope->get_data()['sessionId'] );
		self::assertNotSame( $this->session['resumeToken'], $envelope->get_data()['resumeToken'] );
		self::assertInstanceOf( \WP_Error::class, $links->consume( $redeem ) );
	}
	public function testConsentCredentialAndRateLimitsCannotBeProbed(): void {
		global $wpdb;
		$links = new MagicLinks();
		$missing_consent = $links->issue( $this->issuance( 'email', false ) );
		$wrong_session = $this->issuance( 'email' );
		$wrong_session->set_header( 'X-CFF-Request-Token', 'not-a-valid-credential' );
		self::assertSame( $missing_consent->get_data(), $links->issue( $wrong_session )->get_data() );
		self::assertSame( 0, (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_magic_links" ) );
		for ( $i = 0; $i < 4; ++$i ) {
			self::assertSame( array( 'accepted' => true ), $links->issue( $this->issuance( 'email' ) )->get_data() ); }
		self::assertSame( 3, (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_magic_links" ) );
	}
	public function testWhatsAppShareIsOneTimeAndRejectedAcrossFormsOrQueryStrings(): void {
		global $wpdb;
		$links = new MagicLinks();
		$result = $links->issue( $this->issuance( 'whatsapp' ) );
		self::assertSame( 'no-store, private', $result->get_headers()['Cache-Control'] );
		$link = $result->get_data()['link'];
		self::assertNull( wp_parse_url( $link, PHP_URL_QUERY ) );
		self::assertStringNotContainsString( $this->email, $link );
		$token = explode( '#cff-magic=', $link )[1];
		$redeem = $this->request( '/cff/v1/sessions/magic-resume', array( 'formId' => $this->form->id() + 1 ) );
		$redeem->set_header( 'X-CFF-Magic-Token', $token );
		self::assertInstanceOf( \WP_Error::class, $links->consume( $redeem ) );
		$redeem->set_body( wp_json_encode( array( 'formId' => $this->form->id() ) ) );
		$redeem->set_query_params( array( 'cff-magic' => $token ) );
		self::assertInstanceOf( \WP_Error::class, $links->consume( $redeem ) );
		$redeem->set_query_params( array() );
		self::assertSame( $this->session['sessionId'], $links->consume( $redeem )->get_data()['sessionId'] );
		self::assertInstanceOf( \WP_Error::class, $links->consume( $redeem ) );
	}
}
