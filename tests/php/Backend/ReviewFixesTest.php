<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Rest\Settings;
use ChatFlow\Rest\TemplatesController;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Ending;
use ChatFlow\Submissions\Repository;
use PHPUnit\Framework\TestCase;

final class ReviewFixesTest extends TestCase {
	/** @param array<string,mixed> $body */
	private function request( string $method, string $path, array $body = array() ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/cff/v1/' . $path );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		if ( $body ) {
			$request->set_body( Database::json( (object) $body ) );
		}
		return rest_do_request( $request );
	}

	public function testSecretsAreMaskedAndAMaskedSaveKeepsTheStoredValue(): void {
		wp_set_current_user( 1 );
		$before = get_option( 'cff_settings', null );
		$key    = 'sk-ant-api03-' . str_repeat( 'y', 40 );
		try {
			self::assertIsArray( Settings::save( array( 'ai' => array( 'apiKey' => $key ) ) ) );
			$read = $this->request( 'GET', 'admin/settings' );
			self::assertSame( 200, $read->get_status() );
			self::assertSame( Settings::MASK, $read->get_data()['settings']['ai']['apiKey'] );
			self::assertStringNotContainsString( $key, Database::json( $read->get_data() ) );
			$saved = $this->request( 'PUT', 'admin/settings', array( 'settings' => $read->get_data()['settings'] ) );
			self::assertSame( 200, $saved->get_status(), Database::json( $saved->get_data() ) );
			self::assertSame( $key, Settings::get()['ai']['apiKey'] );
		} finally {
			delete_option( 'cff_settings' );
			if ( null !== $before ) {
				update_option( 'cff_settings', $before, false );
			}
		}
	}

	public function testRestoreReturnsToTheLifecycleStatusAndTrashNeedsDeleteCapability(): void {
		global $wpdb;
		wp_set_current_user( 1 );
		$forms    = new FormRepository();
		$template = TemplatesController::definition( 'contact' );
		$form     = $forms->create( 'Restore fixture', $template['schema'], $template['settings'] );
		self::assertInstanceOf( Form::class, $form );
		$repository = new Repository( $forms );
		$submission = $repository->savePartial(
			array(
				'form_id'      => $form->id(),
				'form_version' => 0,
				'answers'      => array( 'name' => 'Fixture' ),
			)
		);
		self::assertNotNull( $submission );
		$editor = 0;
		try {
			$repository->update( $submission->id(), array( 'status' => 'trash' ) );
			self::assertSame( 200, $this->request( 'PATCH', 'admin/submissions/' . $submission->id(), array( 'status' => 'restore' ) )->get_status() );
			self::assertSame( 'partial', $repository->get( $submission->id() )?->admin()['status'] );

			$wpdb->update(
				$wpdb->prefix . 'cff_submissions',
				array(
					'completed_at' => '2026-10-01 00:00:00',
					'status'       => 'spam',
				),
				array( 'id' => $submission->id() )
			);
			self::assertSame(
				200,
				$this->request(
					'POST',
					'admin/submissions/bulk',
					array(
						'ids'     => array( $submission->id() ),
						'changes' => array( 'status' => 'restore' ),
					)
				)->get_status()
			);
			self::assertSame( 'completed', $repository->get( $submission->id() )?->admin()['status'] );

			$editor = wp_insert_user(
				array(
					'user_login' => 'cff-editor-' . wp_generate_uuid4(),
					'user_pass'  => wp_generate_password(),
					'role'       => 'editor',
				)
			);
			self::assertIsInt( $editor );
			$user = new \WP_User( $editor );
			$user->add_cap( 'cff_view_submissions' );
			$user->add_cap( 'cff_edit_submissions' );
			wp_set_current_user( $editor );
			self::assertSame( 403, $this->request( 'PATCH', 'admin/submissions/' . $submission->id(), array( 'status' => 'trash' ) )->get_status() );
			self::assertSame( 'completed', $repository->get( $submission->id() )?->admin()['status'] );
		} finally {
			wp_set_current_user( 1 );
			if ( $editor ) {
				wp_delete_user( $editor );
			}
			$repository->delete( $submission->id() );
			wp_delete_post( $form->id(), true );
		}
	}

	public function testEndingEscapesMarkdownInVisitorAnswers(): void {
		self::assertSame( '\\[click\\]\\(https://evil.test\\) \\*\\*bold\\*\\* a\\\\b', Ending::escapeMarkdown( '[click](https://evil.test) **bold** a\\b' ) );
		self::assertSame(
			array(
				'x' => '\\*',
				'n' => 3,
			),
			Ending::escapeMarkdown(
				array(
					'x' => '*',
					'n' => 3,
				)
			)
		);
	}
}
