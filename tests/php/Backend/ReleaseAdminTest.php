<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\SchemaValidator;
use ChatFlow\Notifications\ContentTemplates;
use ChatFlow\Notifications\NotificationsModule;
use ChatFlow\Rest\TemplatesController;
use ChatFlow\Submissions\Repository;
use PHPUnit\Framework\TestCase;

final class ReleaseAdminTest extends TestCase {
	public function testPublishedSnapshotForDiffIgnoresSavedDraftEditsAndRequiresNonce(): void {
		wp_set_current_user( 1 ); $forms = new FormRepository(); $template = TemplatesController::definition( 'contact' ); $draft = $forms->create( 'Diff fixture', $template['schema'], $template['settings'] ); self::assertInstanceOf( Form::class, $draft );
		$form = $forms->publish( $draft->id(), $draft->draftRevision() ); self::assertInstanceOf( Form::class, $form );
		try {
			$next = $form->schema(); $next['steps'][0]['label'] = 'Changed draft label'; $forms->saveDraft( $form->id(), $next, $form->settings(), $form->draftRevision() );
			$request = new \WP_REST_Request( 'GET', '/cff/v1/admin/forms/' . $form->id() . '/published' ); self::assertSame( 403, rest_do_request( $request )->get_status() );
			$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) ); $response = rest_do_request( $request ); self::assertSame( 200, $response->get_status() );
			self::assertSame( $form->schema(), $response->get_data()['schema'] ); self::assertSame( 'Changed draft label', $forms->getDraft( $form->id() )->schema()['steps'][0]['label'] );
		} finally {
			global $wpdb; $wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) ); wp_delete_post( $form->id(), true );
		}
	}
	public function testAllPlanStarterTemplatesHaveValidSchemaSettingsAndWorkingRecommendation(): void {
		$validator = new SchemaValidator();
		foreach ( \ChatFlow\Templates\Starter::gallery() as $item ) {
			$template = TemplatesController::definition( $item['slug'] );
			self::assertSame( array(), $validator->validate( $template['schema'] ), $item['slug'] );
			self::assertSame( array(), $validator->validateSettings( $template['settings'], $template['schema'] ), $item['slug'] );
		}
		$template = TemplatesController::definition( 'product-recommender' );
		self::assertSame( 'ending_work', ( new \ChatFlow\Logic\Engine() )->replay( $template['schema'], array( 'usage' => 'work' ), array(), 'complete' )['endingId'] );
	}
	public function testReusableEmailContentPersistenceSanitizationAndNonceCapabilities(): void {
		$before = get_option( 'cff_email_content_templates', null );
		delete_option( 'cff_email_content_templates' );
		wp_set_current_user( 1 );
		( new ContentTemplates() )->register();
		try {
			$request = new \WP_REST_Request( 'POST', '/cff/v1/admin/notifications/templates' );
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( array( 'title' => 'Thanks', 'subject' => 'Hello {{name}}', 'body' => '<p>Welcome {{name}}</p><script>alert(1)</script>' ) ) );
			self::assertSame( 403, rest_do_request( $request )->get_status() );
			$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
			$response = rest_do_request( $request );
			self::assertSame( 200, $response->get_status() );
			$template = $response->get_data()['items'][0];
			self::assertStringNotContainsString( '<script', $template['body'] );
			self::assertSame( 'Hello {{name}}', $template['subject'] );
			self::assertSame( $template, get_option( 'cff_email_content_templates' )[0] );
			$request->set_body( wp_json_encode( array( 'title' => 'Bad', 'subject' => "Hello\r\nBcc: stolen@example.test", 'body' => '' ) ) );
			self::assertSame( 422, rest_do_request( $request )->get_status() );
			$delete = new \WP_REST_Request( 'DELETE', '/cff/v1/admin/notifications/templates' );
			$delete->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) ); $delete->set_param( 'id', $template['id'] );
			self::assertSame( array(), rest_do_request( $delete )->get_data()['items'] );
		} finally {
			delete_option( 'cff_email_content_templates' );
			if ( null !== $before ) update_option( 'cff_email_content_templates', $before, false );
		}
	}
	public function testNotificationResendUsesFrozenVersionAndDeduplicatesWithoutWebhooks(): void {
		global $wpdb;
		wp_set_current_user( 1 );
		$forms = new FormRepository(); $template = TemplatesController::definition( 'contact' );
		$template['settings']['notifications']['admin'] = array( array( 'id' => 'notify', 'enabled' => true, 'to' => array( 'fixture@example.test' ), 'subject' => 'Fixture', 'body' => '{{all_answers}}' ) );
		$draft = $forms->create( 'Resend fixture', $template['schema'], $template['settings'] ); self::assertInstanceOf( Form::class, $draft );
		$form = $forms->publish( $draft->id(), $draft->draftRevision() ); self::assertInstanceOf( Form::class, $form );
		$repository = new Repository( $forms ); $submission = $repository->savePartial( array( 'form_id' => $form->id(), 'form_version' => $form->version(), 'answers' => array( 'name' => 'Fixture', 'email' => 'fixture@example.test', 'message' => 'Hello' ) ) );
		self::assertNotNull( $submission ); $repository->update( $submission->id(), array( 'status' => 'completed' ) );
		( new NotificationsModule( $forms ) )->routes();
		try {
			$request = new \WP_REST_Request( 'POST', '/cff/v1/admin/submissions/' . $submission->id() . '/resend' );
			$request->set_param( 'requestId', wp_generate_uuid4() );
			self::assertSame( 403, rest_do_request( $request )->get_status() );
			$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
			foreach ( array( 1, 2 ) as $repeat ) {
				$response = rest_do_request( $request ); self::assertSame( 202, $response->get_status(), wp_json_encode( $response->get_data() ) ); self::assertSame( 1, $response->get_data()['queued'] );
			}
			self::assertSame( 1, (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d AND event='notification.resend'", $submission->id() ) ) );
			$delivery_id = (int) $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d AND event='notification.resend'", $submission->id() ) );
			$sent = 0;
			$mail = static function () use ( &$sent ) { ++$sent; return true; };
			add_filter( 'pre_wp_mail', $mail );
			try {
				$worker = new \ChatFlow\Integrations\IntegrationsModule( $forms ); $worker->dispatch( $delivery_id ); $worker->dispatch( $delivery_id );
				self::assertSame( 1, $sent ); self::assertSame( 'sent', $wpdb->get_var( $wpdb->prepare( "SELECT status FROM {$wpdb->prefix}cff_deliveries WHERE id=%d", $delivery_id ) ) );
			} finally {
				remove_filter( 'pre_wp_mail', $mail );
			}
			$repository->update( $submission->id(), array( 'status' => 'trash' ) ); self::assertSame( 422, rest_do_request( $request )->get_status() );
		} finally {
			$repository->delete( $submission->id() ); $wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) ); wp_delete_post( $form->id(), true );
		}
	}
	public function testWordPressEditLockRejectsAnotherAdministrator(): void {
		wp_set_current_user( 1 ); $forms = new FormRepository(); $template = TemplatesController::definition( 'contact' ); $form = $forms->create( 'Lock fixture', $template['schema'], $template['settings'] ); self::assertInstanceOf( Form::class, $form );
		$user = wp_insert_user( array( 'user_login' => 'cff-lock-' . wp_generate_uuid4(), 'user_pass' => wp_generate_password(), 'role' => 'administrator' ) ); self::assertIsInt( $user );
		try {
			self::assertTrue( \ChatFlow\Forms\EditLock::acquire( $form->id() ) ); wp_set_current_user( $user ); self::assertInstanceOf( \WP_Error::class, \ChatFlow\Forms\EditLock::acquire( $form->id() ) );
			update_post_meta( $form->id(), '_edit_lock', ( time() - 600 ) . ':1' ); self::assertTrue( \ChatFlow\Forms\EditLock::acquire( $form->id() ) );
		} finally {
			wp_set_current_user( 1 ); wp_delete_post( $form->id(), true ); require_once ABSPATH . 'wp-admin/includes/user.php'; wp_delete_user( $user );
		}
	}
}
