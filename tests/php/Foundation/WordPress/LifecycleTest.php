<?php
namespace ChatFlow\Tests\Foundation\WordPress;

use ChatFlow\Forms\FormPostType;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Install\Installer;

final class LifecycleTest extends \WP_UnitTestCase {
	public function set_up(): void {
		parent::set_up();
		// Lifecycle tests need real DDL; core normally rewrites DDL as temporary tables.
		remove_filter( 'query', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );
		delete_option( 'cff_db_version' );
		Installer::activate();
		global $wpdb;
		foreach ( Installer::TABLES as $table ) {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM %i', $wpdb->prefix . 'cff_' . $table ) );
		}
		( new FormPostType() )->register();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	private function schema(): array {
		return json_decode( file_get_contents( dirname( __DIR__, 3 ) . '/fixtures/schema.json' ), true, 512, JSON_THROW_ON_ERROR )[0]['schema'];
	}

	public function testAllTablesAndCapabilitiesAreInstalledIdempotently(): void {
		global $wpdb;
		Installer::migrate();
		foreach ( Installer::TABLES as $table ) {
			$this->assertSame( $wpdb->prefix . 'cff_' . $table, $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $wpdb->prefix . 'cff_' . $table ) ) ) );
		}
		$this->assertSame( Installer::DB_VERSION, (int) get_option( 'cff_db_version' ) );
		$this->assertTrue( current_user_can( 'cff_manage_forms' ) );
		$this->assertFalse( get_role( 'subscriber' )->has_cap( 'cff_manage_forms' ) );
		$this->assertFalse( get_post_type_object( 'cff_form' )->show_in_rest );
		$this->assertSame( 'do_not_allow', get_post_type_object( 'cff_form' )->cap->publish_posts );
		$index = $wpdb->get_row( $wpdb->prepare( "SHOW INDEX FROM {$wpdb->prefix}cff_form_versions WHERE Key_name = %s", 'form_version' ), ARRAY_A );
		$this->assertSame( '0', $index['Non_unique'] );
	}

	public function testDraftSnapshotConflictAndImmutableIds(): void {
		$r = new FormRepository();
		$draft = $r->create( 'Survey', $this->schema() );
		$this->assertNotWPError( $draft );
		$published = $r->publish( $draft->id(), 1 );
		$this->assertNotWPError( $published );
		$this->assertSame( 1, $published->version() );
		$this->assertNotEmpty( $published->slug() );
		$this->assertSame( 2, $published->draftRevision() );
		$schema = $this->schema();
		$schema['steps'][0]['label'] = 'Updated';
		$saved = $r->saveDraft( $draft->id(), $schema, array(), 2 );
		$this->assertNotWPError( $saved );
		$this->assertSame( 'Nama', $r->getVersion( $draft->id(), 1 )->schema()['steps'][0]['label'] );
		$this->assertSame( 'cff_revision_conflict', $r->publish( $draft->id(), 2 )->get_error_code() );
		$this->assertSame( 'cff_revision_conflict', $r->saveDraft( $draft->id(), $schema, array(), 2 )->get_error_code() );
		$schema['steps'][0]['id'] = 'stp_reassigned';
		$this->assertSame( 'cff_immutable_id', $r->saveDraft( $draft->id(), $schema, array(), 3 )->get_error_code() );
		$live = $r->publish( $draft->id(), 3 );
		$this->assertNotWPError( $live );
		$this->assertSame( 2, $live->version() );
		wp_update_post( array( 'ID' => $draft->id(), 'post_title' => 'New title', 'post_status' => 'draft' ) );
		$this->assertNull( $r->getPublished( $draft->id() ) );
		$this->assertSame( 'Survey', $r->getVersion( $draft->id(), 1 )->title() );
	}

	public function testUninstallPreservesDataByDefaultAndDeletesOnlyWhenOptedIn(): void {
		global $wpdb;
		add_role( 'cff_fixture', 'CFF fixture', array( 'read' => true, 'cff_view_submissions' => true ) );
		$mapping = static function ( $roles ) {
			$roles['cff_fixture'] = Installer::CAPABILITIES;
			return $roles;
		};
		add_filter( 'cff_capability_roles', $mapping );
		Installer::activate();
		remove_filter( 'cff_capability_roles', $mapping );
		$r = new FormRepository();
		$form = $r->create( 'Preserve me', $this->schema() );
		$this->assertNotWPError( $form );
		Installer::uninstall();
		$this->assertNotNull( get_post( $form->id() ) );
		update_option( 'cff_settings', array( 'delete_data_on_uninstall' => true ) );
		update_option( 'cff_purge_gate_fixture', 'owned' );
		update_option( 'cffXpurgeXforeign', 'preserve' );
		Installer::uninstall();
		$this->assertFalse( get_option( 'cff_purge_gate_fixture' ) );
		$this->assertSame( 'preserve', get_option( 'cffXpurgeXforeign' ) );
		delete_option( 'cffXpurgeXforeign' );
		$this->assertNull( get_post( $form->id() ) );
		$this->assertNull( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $wpdb->prefix . 'cff_sessions' ) ) ) );
		$this->assertFalse( get_role( 'cff_fixture' )->has_cap( 'cff_manage_forms' ) );
		$this->assertTrue( get_role( 'cff_fixture' )->has_cap( 'cff_view_submissions' ) );
		remove_role( 'cff_fixture' );
		Installer::migrate();
	}

	public function testRemovedIdsCannotBeRepurposedAndUnknownTypesCannotPublish(): void {
		$r = new FormRepository();
		$draft = $r->create( 'Identity test', $this->schema() );
		$this->assertNotWPError( $draft );
		$schema = $this->schema();
		array_shift( $schema['steps'] );
		$this->assertNotWPError( $r->saveDraft( $draft->id(), $schema, array(), 1 ) );
		$schema = $this->schema();
		$schema['steps'][0]['key'] = 'another_field';
		$this->assertSame( 'cff_immutable_id', $r->saveDraft( $draft->id(), $schema, array(), 2 )->get_error_code() );
		$schema['steps'][0]['id'] = 'stp_file_upload';
		$schema['steps'][0]['type'] = 'file_upload';
		$this->assertNotWPError( $r->saveDraft( $draft->id(), $schema, array(), 2 ) );
		$this->assertSame( 'cff_invalid_schema', $r->publish( $draft->id(), 3 )->get_error_code() );
	}

	public function testMultisiteInitializationAndNetworkLifecycle(): void {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Requires the multisite test matrix.' );
		}
		update_site_option( 'active_sitewide_plugins', array( plugin_basename( CFF_FILE ) => time() ) );
		$id = self::factory()->blog->create();
		switch_to_blog( $id );
		$this->assertSame( Installer::DB_VERSION, (int) get_option( 'cff_db_version' ) );
		restore_current_blog();
		Installer::deactivate( true );
		Installer::activate( true );
		switch_to_blog( $id );
		$this->assertTrue( get_role( 'administrator' )->has_cap( 'cff_manage_forms' ) );
		restore_current_blog();
	}
}
