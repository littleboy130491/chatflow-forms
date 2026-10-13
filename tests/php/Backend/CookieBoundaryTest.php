<?php
namespace ChatFlow\Tests\Backend;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Security\CookieSources;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\SessionService;
use PHPUnit\Framework\TestCase;
final class CookieBoundaryTest extends TestCase {
	private function schema( string $name ): array {
		return array( 'schemaVersion' => 1, 'bot' => array( 'name' => 'Test' ), 'steps' => array(
			array( 'id' => 'private', 'key' => 'private', 'label' => 'Private', 'type' => 'hidden', 'messages' => array(), 'settings' => array( 'source' => 'cookie', 'sourceKey' => $name ) ),
			array( 'id' => 'note', 'key' => 'note', 'label' => 'Note', 'type' => 'short_text', 'messages' => array() ),
		), 'endings' => array( array( 'id' => 'done', 'type' => 'message', 'messages' => array( 'Done' ) ) ) );
	}
	public function testHistoricalSchemasCannotFreezeCredentialCookiesButAllowedAttributionWorks(): void {
		$cases = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/cookie-sources.json' ), true );
		foreach ( array( AUTH_COOKIE, SECURE_AUTH_COOKIE, LOGGED_IN_COOKIE ) as $name ) $cases[] = array( 'name' => $name, 'allowed' => false );
		try {
			foreach ( $cases as $case ) {
				$_COOKIE = array( $case['name'] => 'synthetic-cookie-fixture' );
				$form = new Form( 100, 'Cookie fixture', 'fixture', $this->schema( $case['name'] ), array(), 1, 1, 'publish' );
				$context = ( new \ChatFlow\Tracking\Metadata() )->context( $form, array() );
				self::assertSame( $case['allowed'] ? 'synthetic-cookie-fixture' : null, $context['hidden']['private'] );
			}
		} finally { $_COOKIE = array(); }
	}
	public function testSyntheticOldSessionContextIsSanitizedOnResumePatchAndCachedResponses(): void {
		global $wpdb;
		wp_set_current_user( 1 ); $forms = new FormRepository();
		$form = $forms->create( 'Legacy cookie fixture', $this->schema( 'tracking' ), array( 'spam' => array( 'minSeconds' => 0 ) ) );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$legacy = $this->schema( AUTH_COOKIE ); $wpdb->update( $wpdb->prefix . 'cff_form_versions', array( 'schema' => wp_json_encode( $legacy ) ), array( 'form_id' => $form->id(), 'version' => 1 ) );
		$service = new SessionService( $forms, new \ChatFlow\Logic\Engine(), new \ChatFlow\Fields\Registry() );
		$token = ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue( 'start', array( 'formId' => $form->id(), 'version' => 1 ), time() );
		$marker = 'synthetic-legacy-cookie-marker'; $_COOKIE = array( AUTH_COOKIE => $marker ); $session = null;
		try {
			$session = $service->start( array( 'formId' => $form->id(), 'version' => 1, 'prefill' => array( 'note' => 'Safe note' ) ), $token, wp_generate_uuid4() ); self::assertIsArray( $session );
			self::assertStringNotContainsString( $marker, wp_json_encode( $session ) );
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $session['sessionId'] ), ARRAY_A );
			$context = Database::decode( $row['context'] ); $context['hidden']['private'] = $marker; $context['_answers']['private'] = $marker; $context['_meta']['context']['hidden']['private'] = $marker;
			$wpdb->update( $wpdb->prefix . 'cff_sessions', array( 'context' => wp_json_encode( $context ) ), array( 'id' => $row['id'] ) );
			$wpdb->update( $wpdb->prefix . 'cff_submissions', array( 'answers' => wp_json_encode( array( 'private' => $marker, 'note' => 'Safe note' ) ) ), array( 'id' => $row['submission_id'] ) );
			$resume = $service->resume( $form->id(), $session['resumeToken'] ); self::assertIsArray( $resume ); self::assertStringNotContainsString( $marker, wp_json_encode( $resume ) );
			$patch = $service->mutate( 'patch', $session['sessionId'], array( 'version' => 1, 'revision' => $resume['revision'], 'answers' => array( 'note' => 'Updated', 'private' => $marker ) ), $resume['requestToken'], wp_generate_uuid4() ); self::assertIsArray( $patch ); self::assertStringNotContainsString( $marker, wp_json_encode( $patch ) );
			self::assertStringNotContainsString( $marker, $wpdb->get_var( $wpdb->prepare( "SELECT context FROM {$wpdb->prefix}cff_sessions WHERE id=%d", $row['id'] ) ) );
			self::assertStringNotContainsString( $marker, $wpdb->get_var( $wpdb->prepare( "SELECT answers FROM {$wpdb->prefix}cff_submissions WHERE id=%d", $row['submission_id'] ) ) );
			$cached = new \ReflectionMethod( $service, 'cachedResponse' ); $cached->setAccessible( true );
			$cached_response = $cached->invoke( $service, array( 'formId' => $form->id(), 'version' => 1, 'schema' => (object) $legacy, 'answers' => array( 'private' => $marker ) ) );
			self::assertInstanceOf( \WP_Error::class, $cached_response );
			self::assertSame( 'cff_restricted_cookie', $cached_response->get_error_code() );
			$payloads = $wpdb->get_col( $wpdb->prepare( "SELECT payload FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d", $row['submission_id'] ) ); self::assertStringNotContainsString( $marker, wp_json_encode( $payloads ) );
		} finally {
			$_COOKIE = array();
			if ( is_array( $session ) ) {
				$repository = new \ChatFlow\Submissions\Repository( $forms ); foreach ( $repository->find( array( 'formId' => $form->id() ) )['items'] as $submission ) $repository->delete( $submission->id() );
				$wpdb->delete( $wpdb->prefix . 'cff_sessions', array( 'public_id' => $session['sessionId'] ) );
			}
			$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) ); wp_delete_post( $form->id(), true );
		}
	}
}
