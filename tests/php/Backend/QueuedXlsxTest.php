<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Privacy\Export;
use ChatFlow\Privacy\PrivateFiles;
use ChatFlow\Rest\TemplatesController;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\Xlsx;
use PHPUnit\Framework\TestCase;

final class QueuedXlsxTest extends TestCase {
	public function testQueuedXlsxFormatOwnerBindingAndExpiryCleanOnlyOwnedArtifacts(): void {
		if ( ! Xlsx::available() ) {
			$this->markTestSkipped( 'Requires actual scoped OpenSpout.' ); }
		global $wpdb;
		wp_set_current_user( 1 );
		$forms = new FormRepository();
		$d     = TemplatesController::definition( 'contact' );
		$form  = $forms->create( 'XLSX fixture', $d['schema'], $d['settings'] );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		$repository = new Repository( $forms );
		$submission = $repository->savePartial(
			array(
				'form_id'      => $form->id(),
				'form_version' => 0,
				'answers'      => array( 'name' => '=1+1' ),
			)
		);
		$export     = new Export( $forms, $repository );
		$result     = null;
		$key        = '';
		try {
			$result = $export->create(
				array(
					'formId'  => $form->id(),
					'ids'     => array( $submission->id() ),
					'columns' => array( 'uuid', 'name' ),
					'format'  => 'xlsx',
				)
			);
			self::assertIsArray( $result );
			self::assertSame( 'queued', $result['status'] );
			$export->run( $result['exportId'], false );
			$ready = $export->progress( $result['exportId'] );
			self::assertSame( 'ready', $ready['status'] );
			self::assertSame( 1, $ready['rowCount'] );
			self::assertStringContainsString( 'admin-post.php', $ready['downloadUrl'] );
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_exports WHERE id=%d", $result['exportId'] ), ARRAY_A );
			$key = $row['storage_key'];
			self::assertSame( 'xlsx', $row['format'] );
			self::assertMatchesRegularExpression( '/^export-[a-f0-9]{64}\.bin$/D', $key );
			$zip = new \ZipArchive();
			self::assertTrue( $zip->open( ( new PrivateFiles() )->path( $key ) ) );
			$zip->close();
			wp_set_current_user( 0 );
			self::assertInstanceOf( \WP_Error::class, $export->progress( $result['exportId'] ) );
			wp_set_current_user( 1 );
			$wpdb->update( $wpdb->prefix . 'cff_exports', array( 'expires_at' => '2000-01-01 00:00:00' ), array( 'id' => $result['exportId'] ) );
			self::assertSame( 'expired', $export->progress( $result['exportId'] )['status'] );
			file_put_contents( ( new PrivateFiles() )->path( Xlsx::temporaryKey( $key ) ), 'owned staging' );
			$export->expire( $result['exportId'] );
			self::assertFileDoesNotExist( ( new PrivateFiles() )->path( $key ) );
			self::assertFileDoesNotExist( ( new PrivateFiles() )->path( Xlsx::temporaryKey( $key ) ) );
		} finally {
			if ( $key ) {
				( new PrivateFiles() )->remove( $key );
				( new PrivateFiles() )->remove( Xlsx::temporaryKey( $key ) ); }
			if ( is_array( $result ) ) {
				$wpdb->delete( $wpdb->prefix . 'cff_exports', array( 'id' => $result['exportId'] ) ); }
			$repository->delete( $submission->id() );
			wp_delete_post( $form->id(), true );
			wp_set_current_user( 1 );
		}
	}
}
