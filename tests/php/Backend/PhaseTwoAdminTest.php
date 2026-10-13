<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Analytics\Report;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Rest\AnalyticsController;
use ChatFlow\Rest\Settings;
use ChatFlow\Rest\TemplatesController;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use PHPUnit\Framework\TestCase;

final class PhaseTwoAdminTest extends TestCase {
	public function testAnalyticsSourcesNeverEchoUrlsQueryStringsOrEmailAttribution(): void {
		self::assertSame( 'Google Ads', \ChatFlow\Analytics\Report::sourceLabel( 'Google Ads', 'https://example.test/?secret=private' ) );
		self::assertSame( 'referrer.test', \ChatFlow\Analytics\Report::sourceLabel( 'https://example.test/?secret=private', 'https://user:password@referrer.test/path?email=private' ) );
		self::assertSame( 'referrer.test', \ChatFlow\Analytics\Report::sourceLabel( 'private@example.test', 'https://referrer.test/path?token=private' ) );
	}
	public function testStoredAnalyticsNeverTrustsBrowserCompletionsOrReturnsAnswerText(): void {
		global $wpdb;
		wp_set_current_user( 1 );
		$forms = new FormRepository();
		$d     = TemplatesController::definition( 'feedback' );
		$form  = $forms->create( 'Analytics fixture', $d['schema'], $d['settings'] );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		$repository = new Repository( $forms );
		$submission = null;
		try {
			$submission = $repository->savePartial(
				array(
					'form_id'      => $form->id(),
					'form_version' => 0,
					'answers'      => array(
						'satisfaction' => 'great',
						'comment'      => 'private-answer-text',
					),
					'utm_source'   => 'newsletter',
					'device_type'  => 'mobile',
				)
			);
			$wpdb->update(
				$wpdb->prefix . 'cff_submissions',
				array(
					'status'       => 'completed',
					'completed_at' => '2026-01-15 12:00:00',
					'created_at'   => '2026-01-15 11:00:00',
					'duration_ms'  => 2000,
				),
				array( 'id' => $submission->id() )
			);
			foreach ( array( array( '', 'view', 100 ), array( 'step_satisfaction', 'view', 100 ), array( 'step_satisfaction', 'view', 100 ), array( 'step_satisfaction', 'view', 101 ), array( 'step_satisfaction', 'answer', 100 ), array( '', 'submit', 100 ), array( '', 'submit', 101 ) ) as [$step, $event, $session] ) {
				$wpdb->insert(
					$wpdb->prefix . 'cff_events',
					array(
						'form_id'      => $form->id(),
						'form_version' => 0,
						'session_id'   => $session,
						'step_id'      => $step,
						'event'        => $event,
						'payload'      => null,
						'ts'           => '2026-01-15 12:00:00',
					)
				);
			}
			$report = ( new Report( $forms ) )->get( $form->id(), '2026-01-15', '2026-01-15' );
			self::assertSame( 1, $report['completions'] );
			self::assertSame( 0, $report['starts'] );
			self::assertNull( $report['completionRate'] );
			self::assertSame( 2, $report['steps'][0]['views'] );
			self::assertSame( 1, $report['steps'][0]['dropOff'] );
			self::assertSame( 1, $report['distributions'][0]['options'][0]['count'] );
			self::assertSame( 'newsletter', $report['sources'][0]['label'] );
			self::assertSame( 'mobile', $report['devices'][0]['label'] );
			self::assertStringNotContainsString( 'private-answer-text', Database::json( $report ) );
			$empty = ( new Report( $forms ) )->get( $form->id(), '2026-01-16', '2026-01-16' );
			self::assertSame( 0, $empty['completions'] );
		} finally {
			$wpdb->delete( $wpdb->prefix . 'cff_events', array( 'form_id' => $form->id() ) );
			if ( $submission ) {
				$repository->delete( $submission->id() ); }
			wp_delete_post( $form->id(), true );
		}
	}
	public function testTemplateAndAnalyticsRoutesRequireCapabilityAndNonce(): void {
		$forms = new FormRepository();
		( new AnalyticsController( $forms ) )->register();
		( new TemplatesController( $forms ) )->register();
		wp_set_current_user( 0 );
		self::assertSame( 403, rest_get_server()->dispatch( new \WP_REST_Request( 'GET', '/cff/v1/admin/templates/gallery' ) )->get_status() );
		wp_set_current_user( 1 );
		self::assertSame( 403, rest_get_server()->dispatch( new \WP_REST_Request( 'GET', '/cff/v1/admin/analytics/forms' ) )->get_status() );
		$request = new \WP_REST_Request( 'GET', '/cff/v1/admin/templates/gallery' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		$gallery = rest_get_server()->dispatch( $request );
		self::assertSame( 200, $gallery->get_status() );
		self::assertCount( 9, $gallery->get_data()['items'] );
		foreach ( array( 'contact', 'feedback' ) as $slug ) {
			$request = new \WP_REST_Request( 'POST', '/cff/v1/admin/templates/gallery/' . $slug );
			$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
			$response = rest_get_server()->dispatch( $request );
			self::assertSame( 201, $response->get_status(), Database::json( $response->get_data() ) );
			wp_delete_post( $response->get_data()['id'], true );
		}
	}
	public function testProviderSettingsStrictKeysAndFailClosedCredentials(): void {
		$original = get_option( 'cff_settings' );
		try {
			update_option( 'cff_settings', Settings::defaults() );
			self::assertInstanceOf( \WP_Error::class, Settings::save( array( 'spam' => array( 'captcha' => 'turnstile' ) ) ) );
			self::assertInstanceOf( \WP_Error::class, Settings::save( array( 'spam' => array( 'minScore' => '0.5' ) ) ) );
			self::assertInstanceOf( \WP_Error::class, Settings::save( array( 'spam' => array( 'akismetEnabled' => true ) ) ) );
			$saved = Settings::save(
				array(
					'spam' => array(
						'captcha'   => 'turnstile',
						'siteKey'   => 'fixture-site',
						'secretKey' => 'fixture-secret',
						'minScore'  => 0.5,
					),
				)
			);
			self::assertIsArray( $saved );
			self::assertSame( 'turnstile', $saved['spam']['captcha'] );
		} finally {
			update_option( 'cff_settings', $original ); }
	}
}
