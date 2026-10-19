<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Privacy\PrivacyModule;
use ChatFlow\Privacy\Purge;
use ChatFlow\Rest\Settings;
use ChatFlow\Rest\TemplatesController;
use ChatFlow\Submissions\Repository;

final class FeatureInventoryTest extends \PHPUnit\Framework\TestCase {
	private function request( string $method, string $path, array $body = array() ): \WP_REST_Response {
		$request = new \WP_REST_Request( $method, '/cff/v1/' . $path );
		$request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
		if ( $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body ) );
		}
		return rest_do_request( $request );
	}

	public function testFormJsonRoundTripAndDuplicateCreateIndependentUnpublishedDrafts(): void {
		wp_set_current_user( 1 );
		$template = TemplatesController::definition( 'contact' );
		$ids      = array();
		try {
			$first = $this->request( 'POST', 'admin/forms', array_merge( $template, array( 'title' => 'Original JSON fixture' ) ) );
			self::assertSame( 201, $first->get_status() );
			$original = $first->get_data();
			$ids[]    = $original['id'];
			$export   = json_decode( wp_json_encode( $original ), true, 512, JSON_THROW_ON_ERROR );
			$copy     = $this->request(
				'POST',
				'admin/forms',
				array(
					'title'    => 'Duplicate JSON fixture',
					'schema'   => $export['schema'],
					'settings' => $export['settings'],
				)
			);
			self::assertSame( 201, $copy->get_status() );
			$duplicate = $copy->get_data();
			$ids[]     = $duplicate['id'];
			self::assertNotSame( $original['id'], $duplicate['id'] );
			self::assertSame( $original['schema'], $duplicate['schema'] );
			self::assertSame( $original['settings'], $duplicate['settings'] );
			self::assertSame( 'draft', $duplicate['status'] );
			self::assertSame( 0, $duplicate['version'] );
			self::assertNull( ( new FormRepository() )->getPublished( $duplicate['id'] ) );
		} finally {
			foreach ( $ids as $id ) {
				wp_delete_post( $id, true ); }
		}
	}

	public function testHistoricalAnswerFiltersAndBulkReadStarNotesPreservePinnedSchema(): void {
		global $wpdb;
		wp_set_current_user( 1 );
		$forms    = new FormRepository();
		$template = TemplatesController::definition( 'contact' );
		$form     = $forms->create( 'Historical fixture', $template['schema'], $template['settings'] );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		$form       = $forms->publish( $form->id(), $form->draftRevision() );
		$repository = new Repository( $forms );
		$step       = $form->schema()['steps'][0];
		$submission = $repository->savePartial(
			array(
				'form_id'      => $form->id(),
				'form_version' => 1,
				'answers'      => array( $step['key'] => 'Historical Needle' ),
			)
		);
		try {
			$schema                      = $form->schema();
			$schema['steps'][0]['label'] = 'Changed current label';
			$draft                       = $forms->saveDraft( $form->id(), $schema, $form->settings(), $form->draftRevision() );
			self::assertNotInstanceOf( \WP_Error::class, $draft );
			self::assertNotInstanceOf( \WP_Error::class, $forms->publish( $form->id(), $draft->draftRevision() ) );
			$bulk = $this->request(
				'POST',
				'admin/submissions/bulk',
				array(
					'ids'     => array( $submission->id() ),
					'changes' => array(
						'isRead'    => true,
						'isStarred' => true,
					),
				)
			);
			self::assertSame( 200, $bulk->get_status() );
			self::assertSame( 200, $this->request( 'PATCH', 'admin/submissions/' . $submission->id(), array( 'note' => '<b>Private note</b>' ) )->get_status() );
			$found = $repository->find(
				array(
					'formId'    => $form->id(),
					'isRead'    => true,
					'isStarred' => true,
					'search'    => 'Needle',
					'fieldKey'  => $step['key'],
					'operator'  => 'eq',
					'value'     => 'Historical Needle',
				)
			);
			self::assertSame( 1, $found['total'] );
			self::assertSame( $submission->id(), $found['items'][0]->id() );
			self::assertSame( 1, $found['items'][0]->formVersion() );
			self::assertSame( $step['label'], $forms->getVersion( $form->id(), 1 )->schema()['steps'][0]['label'] );
			// The inbox list carries each row's frozen form title and labels, so it needs no per-row detail requests.
			$list_request = new \WP_REST_Request( 'GET', '/cff/v1/admin/submissions' );
			$list_request->set_query_params( array( 'formId' => $form->id() ) );
			$list_request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
			$list = rest_do_request( $list_request );
			self::assertSame( 200, $list->get_status() );
			$frozen = json_decode( wp_json_encode( $list->get_data()['forms'] ), true );
			self::assertSame( array( $form->id() . ':1' ), array_keys( $frozen ) );
			self::assertSame( 'Historical fixture', $frozen[ $form->id() . ':1' ]['title'] );
			self::assertSame( $step['label'], $frozen[ $form->id() . ':1' ]['labels'][ $step['key'] ] );
			self::assertSame( 'Private note', $wpdb->get_var( $wpdb->prepare( "SELECT body FROM {$wpdb->prefix}cff_submission_notes WHERE submission_id=%d AND type='note'", $submission->id() ) ) );
		} finally {
			$repository->delete( $submission->id() );
			$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) );
			wp_delete_post( $form->id(), true );
		}
	}

	public function testDisabledRetentionKeepsOldRowsAndEnabledPolicyDeletesOnlyOldRows(): void {
		global $wpdb;
		wp_set_current_user( 1 );
		$before   = get_option( 'cff_settings' );
		$forms    = new FormRepository();
		$template = TemplatesController::definition( 'contact' );
		$form     = $forms->create( 'Retention fixture', $template['schema'], array() );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		$repository = new Repository( $forms );
		$old        = $repository->savePartial(
			array(
				'form_id'      => $form->id(),
				'form_version' => 0,
				'created_at'   => gmdate( 'Y-m-d H:i:s', time() - 60 * DAY_IN_SECONDS ),
			)
		);
		$new        = $repository->savePartial(
			array(
				'form_id'      => $form->id(),
				'form_version' => 0,
			)
		);
		$jobs       = array();
		try {
			update_option( 'cff_settings', Settings::defaults() );
			$privacy = new PrivacyModule( $forms );
			$privacy->retention();
			self::assertNotNull( $repository->get( $old->id() ) );
			self::assertIsArray(
				Settings::save(
					array(
						'retention' => array(
							'enabled' => true,
							'days'    => 30,
						),
					)
				)
			);
			$privacy->retention();
			foreach ( $wpdb->get_col( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE 'cff_purge_%'" ) as $name ) {
				$job = get_option( $name );
				if ( ! is_array( $job ) || ( $job['criteria']['formId'] ?? null ) !== $form->id() ) {
					continue; }
				$jobs[] = $name;
				( new Purge( $repository ) )->run( $job['id'] );
				self::assertSame( 'completed', get_option( $name )['status'] );
			}
			self::assertNotEmpty( $jobs );
			self::assertNull( $repository->get( $old->id() ) );
			self::assertNotNull( $repository->get( $new->id() ) );
		} finally {
			if ( false === $before ) {
				delete_option( 'cff_settings' );
			} else {
				update_option( 'cff_settings', $before ); }
			foreach ( $jobs as $name ) {
				delete_option( $name ); }
			$repository->delete( $old->id() );
			$repository->delete( $new->id() );
			wp_delete_post( $form->id(), true );
		}
	}
}
