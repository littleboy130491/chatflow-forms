<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Admin\FormsTable;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\PublicProjection;
use ChatFlow\Rest\TemplatesController;
use PHPUnit\Framework\TestCase;

final class NativeFormsTest extends TestCase {
	public function testNativeTableRendersPlannedColumnsActionsSearchStatusAndNoGetMutations(): void {
		$before = $_GET;
		wp_set_current_user( 1 ); set_current_screen( 'cff-forms' );
		$forms = new FormRepository(); $template = TemplatesController::definition( 'contact' );
		$a = $forms->create( 'Native list fixture A', $template['schema'], $template['settings'] );
		$b = $forms->create( 'Native list fixture B', $template['schema'], $template['settings'] );
		$forms->publish( $b->id(), $b->draftRevision() );
		global $wpdb;
		$submission = ( new \ChatFlow\Submissions\Repository( $forms ) )->savePartial( array( 'form_id' => $b->id(), 'form_version' => 1, 'answers' => array( 'name' => 'Fixture' ) ) );
		$wpdb->update( $wpdb->prefix . 'cff_submissions', array( 'status' => 'completed', 'completed_at' => '2026-10-13 00:00:00' ), array( 'id' => $submission->id() ) );
		try {
			$_GET = array( 's' => 'Native list fixture', 'orderby' => 'title', 'order' => 'asc', 'action' => 'trash', 'id' => $a->id() );
			$table = new FormsTable( $forms ); self::assertInstanceOf( \WP_List_Table::class, $table ); $table->prepare_items();
			self::assertSame( array( $a->id(), $b->id() ), array_column( $table->items, 'id' ) );
			self::assertSame( 'draft', get_post_status( $a->id() ) );
			self::assertSame( 1, $table->items[1]['completed'] ); self::assertEquals( 100, $table->items[1]['completionRate'] ); self::assertSame( '2026-10-13 00:00:00', $table->items[1]['lastSubmissionAt'] );
			ob_start(); $table->display(); $html = ob_get_clean();
			foreach ( array( 'wp-list-table', 'cff-builder', 'preview=1', 'data-cff-action="duplicate"', 'data-cff-action="export"', 'data-cff-action="trash"', 'data-cff-action="copy"', 'Completion rate', 'Shortcode', 'Live', 'Draft' ) as $expected ) self::assertStringContainsString( $expected, $html );
			self::assertStringNotContainsString( 'cff-admin-root', $html );
			self::assertStringNotContainsString( '<script>', $table->column_name( array( 'id' => $a->id(), 'name' => '<script>unsafe</script>' ) ) );
			$_GET['status'] = 'publish'; $table->prepare_items(); self::assertSame( array( $b->id() ), array_column( $table->items, 'id' ) );
			$_GET = array( 's' => 'Native list fixture', 'status' => 'draft' ); $table->prepare_items(); self::assertSame( array( $a->id() ), array_column( $table->items, 'id' ) );
			$_GET = array( 's' => 'nonexistent-query-for-native-test' ); $table->prepare_items(); self::assertSame( array(), $table->items );
			wp_set_current_user( 0 ); $table->prepare_items(); self::assertSame( array(), $table->items );
		} finally {
			$_GET = $before; wp_set_current_user( 1 ); ( new \ChatFlow\Submissions\Repository( $forms ) )->delete( $submission->id() );
			foreach ( array( $a, $b ) as $form ) { $wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) ); wp_delete_post( $form->id(), true ); }
		}
	}

	public function testNativePageUsesTableAndDedicatedReactBuilderWithSafeConfig(): void {
		wp_set_current_user( 1 );
		$admin = new \ChatFlow\Admin\AdminModule( new FormRepository() ); $admin->menus();
		set_current_screen( 'toplevel_page_cff-forms' ); ob_start(); $admin->render(); $html = ob_get_clean();
		self::assertStringContainsString( 'wp-list-table', $html ); self::assertStringContainsString( 'page=cff-builder', $html ); self::assertStringContainsString( 'New form', $html ); self::assertStringNotContainsString( 'cff-admin-root', $html );
		set_current_screen( 'chatflow_page_cff-builder' );
		$builder_hook = get_plugin_page_hookname( 'cff-builder', 'cff-forms' ); set_current_screen( $builder_hook );
		ob_start(); $admin->render(); $builder = ob_get_clean(); self::assertStringContainsString( 'cff-admin-root', $builder );
	}

	public function testOptInFontProjectsPubliclyWithoutPrivateSettingsAndRejectsUnsafeFilteredOverrides(): void {
		wp_set_current_user( 1 ); $forms = new FormRepository(); $template = TemplatesController::definition( 'contact' );
		$template['settings']['appearance'] = array( 'googleFont' => 'Inter' );
		$form = $forms->create( 'Font fixture', $template['schema'], $template['settings'] );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$unsafe = static function ( $value ) { $value['form']['appearance']->googleFont = 'https://evil.test'; return $value; };
		try {
			$public = PublicProjection::build( $form ); self::assertSame( 'Inter', $public['form']['appearance']->googleFont ); self::assertArrayNotHasKey( 'settings', $public['form'] ); self::assertArrayNotHasKey( 'notifications', $public['form'] );
			add_filter( 'cff_public_schema', $unsafe ); $filtered = PublicProjection::build( $form ); self::assertSame( 'Inter', $filtered['form']['appearance']->googleFont );
		} finally {
			remove_filter( 'cff_public_schema', $unsafe ); global $wpdb; $wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) ); wp_delete_post( $form->id(), true );
		}
	}
}
