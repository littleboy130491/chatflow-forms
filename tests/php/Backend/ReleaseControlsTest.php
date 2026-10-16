<?php
namespace ChatFlow\Tests\Backend;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Privacy\Export;
use ChatFlow\Submissions\Repository;
use PHPUnit\Framework\TestCase;
final class ReleaseControlsTest extends TestCase {
	public function testExportListDateObjectSemanticsBadgeAndOwnerRecoveryLink(): void {
		global $wpdb;
		wp_set_current_user( 1 ); $forms = new FormRepository();
		$schema = array( 'schemaVersion' => 1, 'bot' => array( 'name' => 'Test' ), 'steps' => array( array( 'id' => 'choices', 'key' => 'choices', 'label' => 'Choices', 'type' => 'multi_choice', 'messages' => array(), 'options' => array( array( 'id' => 'a', 'value' => 'a', 'label' => 'A' ), array( 'id' => 'b', 'value' => 'b', 'label' => 'B' ) ) ) ), 'endings' => array( array( 'id' => 'done', 'type' => 'message', 'messages' => array( 'Done' ) ) ) );
		$form = $forms->create( 'Export controls fixture', $schema ); $form = $forms->publish( $form->id(), $form->draftRevision() );
		$repository = new Repository( $forms ); $submission = $repository->savePartial( array( 'form_id' => $form->id(), 'form_version' => 1, 'answers' => array( 'choices' => array( 'a', 'b' ) ), 'created_at' => '2026-01-01 00:00:00' ) );
		$timezone = get_option( 'timezone_string' ); update_option( 'timezone_string', 'Asia/Jakarta' ); $jobs = array(); $mail = null;
		try {
			$export = new Export( $forms, $repository ); $value = new \ReflectionMethod( $export, 'value' ); $value->setAccessible( true );
			self::assertSame( 'a, b', $value->invoke( $export, $submission, 'choices' ) ); self::assertSame( '2026-01-01T07:00:00+07:00', $value->invoke( $export, $submission, 'createdAt' ) );
			$other = $repository->complete( $submission->id(), array( 'answers' => array( 'choices' => array( 'value' => 'other', 'other' => 'Free text' ) ) ) ); self::assertSame( array( 'value' => 'other', 'other' => 'Free text' ), $value->invoke( $export, $other, 'choices' ) ); self::assertStringContainsString( 'Free text', Export::cell( $value->invoke( $export, $other, 'choices' ) ) );
			$repository->complete( $submission->id(), array( 'answers' => array( 'choices' => array( '=CMD', 'b' ) ) ) ); self::assertSame( "'=CMD, b", Export::cell( $value->invoke( $export, $repository->get( $submission->id() ), 'choices' ) ) );
			self::assertStringContainsString( 'awaiting-mod', ( new \ChatFlow\Admin\AdminModule( $forms ) )->submissionsMenuTitle() );
			$collect = static function ( $return, $args ) use ( &$mail ) { $mail = $args['message']; return true; }; add_filter( 'pre_wp_mail', $collect, 10, 2 );
			try {
				$job = $export->create( array( 'formId' => $form->id(), 'format' => 'xlsx', 'columns' => array( 'choices', 'createdAt' ) ) ); self::assertIsArray( $job ); $jobs[] = $job['exportId']; $export->run( $job['exportId'] );
				self::assertIsString( $mail ); self::assertStringContainsString( 'page=cff-tools', $mail ); self::assertStringContainsString( 'exportId=' . $job['exportId'], $mail ); self::assertStringNotContainsString( 'ticket', $mail ); self::assertStringNotContainsString( '_wpnonce', $mail );
				wp_set_current_user( 0 ); self::assertInstanceOf( \WP_Error::class, $export->progress( $job['exportId'] ) ); wp_set_current_user( 1 ); self::assertSame( 'ready', $export->progress( $job['exportId'] )['status'] );
			} finally { remove_filter( 'pre_wp_mail', $collect ); }
			$request = new \WP_REST_Request( 'GET', '/cff/v1/admin/export-forms' ); self::assertSame( 403, rest_do_request( $request )->get_status() ); $request->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) ); $response = rest_do_request( $request ); self::assertSame( 200, $response->get_status() ); foreach ( $response->get_data()['items'] as $item ) self::assertSame( array( 'id', 'title' ), array_keys( $item ) );
			$request->set_param( 'id', $form->id() ); $selected = rest_do_request( $request ); self::assertSame( 200, $selected->get_status() ); self::assertSame( array( array( 'id' => $form->id(), 'title' => $form->title() ) ), $selected->get_data()['items'] );
		} finally {
			wp_set_current_user( 1 ); update_option( 'timezone_string', $timezone ); $repository->delete( $submission->id() );
			foreach ( $jobs as $id ) { $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_exports WHERE id=%d", $id ), ARRAY_A ); if ( $row ) ( new \ChatFlow\Privacy\PrivateFiles() )->remove( $row['storage_key'] ); $wpdb->delete( $wpdb->prefix . 'cff_exports', array( 'id' => $id ) ); }
			$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) ); wp_delete_post( $form->id(), true );
		}
	}
}
