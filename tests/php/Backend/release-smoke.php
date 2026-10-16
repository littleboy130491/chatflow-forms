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
$schema = array( 'schemaVersion' => 1, 'bot' => array( 'name' => 'Release' ), 'steps' => array( array( 'id' => 'score', 'key' => 'score', 'label' => 'Score', 'type' => 'rating', 'messages' => array() ), array( 'id' => 'email', 'key' => 'email', 'label' => 'Email', 'type' => 'email', 'messages' => array() ) ), 'endings' => array( array( 'id' => 'done', 'type' => 'message', 'messages' => array( 'Done' ) ) ) );
$f = $r->create( 'Isolated release smoke', $schema, array( 'appearance' => array( 'googleFont' => 'Inter' ) ) );
$check( $f instanceof \ChatFlow\Forms\Form, 'Release draft creation failed.' );
try {
	global $wpdb;
	$server = rest_get_server();
	$draft = $server->dispatch( new WP_REST_Request( 'GET', '/cff/v1/forms/' . $f->id() . '/engagement' ) );
	$check( 404 === $draft->get_status(), 'Draft leaked engagement config.' );
	$f = $r->publish( $f->id(), $f->draftRevision() );
	$check( $f instanceof \ChatFlow\Forms\Form, 'Release publication failed.' );
	$config = $server->dispatch( new WP_REST_Request( 'GET', '/cff/v1/forms/' . $f->id() . '/engagement' ) );
	$check( 200 === $config->get_status(), 'Release engagement route missing.' );
	$public = $server->dispatch( new WP_REST_Request( 'GET', '/cff/v1/forms/' . $f->id() ) );
	$check( 200 === $public->get_status() && ! isset( $public->get_data()['form']['settings'] ), 'Release public schema missing or private settings leaked.' );
	$check( 'Inter' === ( $public->get_data()['form']['appearance']->googleFont ?? null ), 'Release opt-in font not projected.' );
	$check( class_exists( \ChatFlow\Admin\FormsTable::class ) && class_exists( \ChatFlow\Forms\Statistics::class ), 'Native Forms table/statistics missing from release.' );
	$gallery = new WP_REST_Request( 'GET', '/cff/v1/admin/templates/gallery' );
	$check( 403 === $server->dispatch( $gallery )->get_status(), 'Release admin route failed nonce boundary.' );
	$gallery->set_header( 'X-WP-Nonce', wp_create_nonce( 'wp_rest' ) );
	$check( 9 === count( $server->dispatch( $gallery )->get_data()['items'] ), 'Release template gallery incomplete.' );
	do_action( 'wp_enqueue_scripts' );
	$html = do_shortcode( '[chatflow id="' . $f->id() . '"]' );
	$check( str_contains( $html, 'data-form-id' ) && wp_script_is( 'cff-runtime', 'registered' ), 'Release shortcode/runtime registration missing.' );
	$private_dir = sys_get_temp_dir() . '/cff-pkg-private-' . bin2hex( random_bytes( 16 ) );
	mkdir( $private_dir, 0700 );
	define( 'CFF_PRIVATE_DIR', $private_dir );
	register_shutdown_function( static function () use ( $private_dir ) {
		foreach ( glob( $private_dir . '/*' ) ?: array() as $item ) {
			if ( is_file( $item ) && ! is_link( $item ) ) unlink( $item );
		}
		rmdir( $private_dir );
	} );
	$submissions = new \ChatFlow\Submissions\Repository( $r );
	$submission = $submissions->savePartial( array( 'form_id' => $f->id(), 'form_version' => $f->version(), 'status' => 'completed', 'answers' => array( 'score' => 3, 'email' => 'release-smoke@example.test' ) ) );
	$export = new \ChatFlow\Privacy\Export();
	add_filter( 'pre_wp_mail', '__return_true' );
	try {
		foreach ( array( 'csv', 'xlsx' ) as $format ) {
			$job = $export->create( array( 'formId' => $f->id(), 'format' => $format, 'columns' => array( 'id', 'email' ) ) );
			$check( is_array( $job ) && isset( $job['exportId'] ), 'Isolated private export creation failed.' );
			$jobs[] = $job['exportId'];
			if ( 'xlsx' === $format && 'ready' !== $job['status'] ) {
				$export->run( $job['exportId'], false );
				$job = $export->progress( $job['exportId'] );
			}
			$check( is_array( $job ) && 'ready' === $job['status'] && 1 === $job['rowCount'], 'Isolated private export failed.' );
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT storage_key FROM {$wpdb->prefix}cff_exports WHERE id=%d", $job['exportId'] ), ARRAY_A );
			$check( is_array( $row ) && is_file( ( new \ChatFlow\Privacy\PrivateFiles() )->path( $row['storage_key'] ) ), 'Private export file is missing.' );
			if ( 'xlsx' === $format ) {
				$archive = new \ZipArchive();
				$check( true === $archive->open( ( new \ChatFlow\Privacy\PrivateFiles() )->path( $row['storage_key'] ) ), 'Private XLSX is not a ZIP archive.' );
				try {
					$check( false !== $archive->locateName( 'xl/workbook.xml' ), 'Private XLSX workbook is missing.' );
				} finally {
					$archive->close();
				}
			}
			wp_set_current_user( 0 );
			$check( is_wp_error( $export->progress( $job['exportId'] ) ), 'Export owner boundary failed.' );
			wp_set_current_user( 1 );
		}
	} finally {
		remove_filter( 'pre_wp_mail', '__return_true' );
		wp_set_current_user( 1 );
		foreach ( $jobs ?? array() as $job_id ) {
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT storage_key FROM {$wpdb->prefix}cff_exports WHERE id=%d", $job_id ), ARRAY_A );
			if ( ! empty( $row['storage_key'] ) ) ( new \ChatFlow\Privacy\PrivateFiles() )->remove( $row['storage_key'] );
			$wpdb->delete( $wpdb->prefix . 'cff_exports', array( 'id' => $job_id ) );
		}
	}
	$erased = ( new \ChatFlow\Privacy\PrivacyModule( $r ) )->erasePersonal( 'release-smoke@example.test' );
	$check( true === $erased['items_removed'] && false === $erased['items_retained'] && null === $submissions->get( $submission->id() ), 'Extracted release privacy erasure failed.' );
	update_option( 'cff_db_version', 0 );
	\ChatFlow\Install\Installer::maybeUpgrade();
	$check( \ChatFlow\Install\Installer::DB_VERSION === (int) get_option( 'cff_db_version' ), 'Release upgrade failed.' );
	$check( null !== $r->getPublished( $f->id() ), 'Upgrade lost published form.' );
	WP_CLI::success( 'Extracted release activation, scoped dependencies/assets, private CSV/XLSX, erasure, draft/published REST and upgrade passed.' );
} finally {
	global $wpdb;
	if ( isset( $submissions, $submission ) && $submissions->get( $submission->id() ) ) $submissions->delete( $submission->id() );
	$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $f->id() ) );
	wp_delete_post( $f->id(), true );
}
