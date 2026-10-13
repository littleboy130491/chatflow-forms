<?php
/** Run using wp eval-file with the extracted release active, without dev autoload. */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	exit( 1 );
}
$check = static function ( bool $ok, string $message ): void {
	if ( ! $ok ) {
		throw new RuntimeException( $message );
	}
};
$check( class_exists( '\ChatFlow\Vendor\OpenSpout\Writer\XLSX\Writer' ), 'Scoped XLSX library missing.' );
$check( ! class_exists( '\OpenSpout\Writer\XLSX\Writer', false ), 'Unscoped XLSX loaded.' );
$check( \ChatFlow\Submissions\Xlsx::available(), 'ZIP/XML runtime unavailable.' );
$check( ! is_file( CFF_PATH . 'vendor/autoload.php' ), 'Release contains dev Composer autoload.' );
foreach ( array( 'build/admin/builder.js', 'build/admin/submissions.js', 'build/runtime/runtime.js' ) as $file ) {
	$check( is_file( CFF_PATH . $file ), 'Release asset missing: ' . $file );
}
wp_set_current_user( 1 );
$r = new \ChatFlow\Forms\FormRepository();
$schema = array( 'schemaVersion' => 1, 'bot' => array( 'name' => 'Release' ), 'steps' => array( array( 'id' => 'score', 'key' => 'score', 'label' => 'Score', 'type' => 'rating', 'messages' => array() ) ), 'endings' => array( array( 'id' => 'done', 'type' => 'message', 'messages' => array( 'Done' ) ) ) );
$f = $r->create( 'Isolated release smoke', $schema );
$check( $f instanceof \ChatFlow\Forms\Form, 'Release draft creation failed.' );
try {
	$server = rest_get_server();
	$draft = $server->dispatch( new WP_REST_Request( 'GET', '/cff/v1/forms/' . $f->id() . '/engagement' ) );
	$check( 404 === $draft->get_status(), 'Draft leaked engagement config.' );
	$f = $r->publish( $f->id(), $f->draftRevision() );
	$check( $f instanceof \ChatFlow\Forms\Form, 'Release publication failed.' );
	$config = $server->dispatch( new WP_REST_Request( 'GET', '/cff/v1/forms/' . $f->id() . '/engagement' ) );
	$check( 200 === $config->get_status(), 'Release engagement route missing.' );
	update_option( 'cff_db_version', 0 );
	\ChatFlow\Install\Installer::maybeUpgrade();
	$check( \ChatFlow\Install\Installer::DB_VERSION === (int) get_option( 'cff_db_version' ), 'Release upgrade failed.' );
	$check( null !== $r->getPublished( $f->id() ), 'Upgrade lost published form.' );
	WP_CLI::success( 'Extracted release activation, scoped dependencies/assets, draft/published REST and upgrade passed.' );
} finally {
	global $wpdb;
	$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $f->id() ) );
	wp_delete_post( $f->id(), true );
}
