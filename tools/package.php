<?php
$root = dirname( __DIR__ );
foreach ( array( 'vendor-prefixed/autoload.php', 'vendor/woocommerce/action-scheduler/action-scheduler.php', 'build/admin/builder.js', 'build/admin/builder.asset.php', 'build/admin/submissions.js', 'build/admin/submissions.asset.php', 'build/admin/blocks.js', 'build/admin/blocks.asset.php', 'build/runtime/runtime.js', 'build/runtime/tracking.js' ) as $required ) {
	if ( ! is_file( $root . '/' . $required ) ) {
		throw new RuntimeException( 'Build release prerequisite missing: ' . $required );
	}
}
$build = $root . '/build';
if ( ! is_dir( $build ) && ! mkdir( $build, 0755 ) ) {
	throw new RuntimeException( 'Cannot create release directory.' );
}
$path = $build . '/chatflow-forms.zip';
if ( file_exists( $path ) ) {
	unlink( $path );
}
$archive = new PharData( $path, 0, null, Phar::ZIP );
$files   = array( 'chatflow-forms.php', 'autoload.php', 'uninstall.php', 'README.md', 'LICENSE', 'composer.json' );
foreach ( array( 'src', 'schema', 'build/admin', 'build/runtime', 'vendor-prefixed', 'vendor/woocommerce/action-scheduler' ) as $directory ) {
	$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root . '/' . $directory, FilesystemIterator::SKIP_DOTS ) );
	foreach ( $iterator as $file ) {
		if ( $file->isLink() ) {
			throw new RuntimeException( 'Release must not contain symlinks.' );
		}
		if ( $file->isFile() ) {
			$relative = substr( $file->getPathname(), strlen( $root ) + 1 );
			if ( preg_match( '~/(?:tests?|\.git|\.github|examples?|docs)/|/(?:phpunit|phpcs|phpstan)[^/]*$|/\.[^/]+$~', $relative ) ) {
				continue;
			}
			$files[] = $relative;
		}
	}
}
sort( $files, SORT_STRING );
foreach ( $files as $file ) {
	$archive->addFile( $root . '/' . $file, 'chatflow-forms/' . $file );
}
$archive->compressFiles( Phar::GZ );
unset( $archive );
echo "Release created: build/chatflow-forms.zip\n";
