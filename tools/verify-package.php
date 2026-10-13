<?php
$zip = new PharData( dirname( __DIR__ ) . '/build/chatflow-forms.zip' );
$required = array( 'chatflow-forms.php', 'autoload.php', 'uninstall.php', 'src/Forms/FormRepository.php', 'schema/form.schema.json', 'build/admin/builder.asset.php', 'build/runtime/runtime.js', 'vendor-prefixed/autoload.php', 'vendor/woocommerce/action-scheduler/action-scheduler.php', 'LICENSE' );
foreach ( $required as $file ) {
	if ( ! isset( $zip['chatflow-forms/' . $file] ) ) {
		throw new RuntimeException( 'Missing release file: ' . $file );
	}
}
foreach ( new RecursiveIteratorIterator( $zip ) as $file ) {
	$name = substr( $file->getPathname(), strpos( $file->getPathname(), '.zip/' ) + 5 );
	if ( ! str_starts_with( $name, 'chatflow-forms/' ) || preg_match( '~/(?:node_modules|tests|\.git|\.github|tools|assets/src)/|^chatflow-forms/vendor/(?!woocommerce/action-scheduler/)|\.(?:log|map)$|/\.env~', $name ) ) {
		throw new RuntimeException( 'Unsafe release member: ' . $name );
	}
}
echo "Release root, runtime contents and dev exclusions verified.\n";
