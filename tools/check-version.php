<?php
$root = dirname( __DIR__ );
$plugin = file_get_contents( $root . '/chatflow-forms.php' );
preg_match( '/^ \* Version:\s+(\S+)/m', $plugin, $header );
preg_match( "/define\( 'CFF_VERSION', '([^']+)' \)/", $plugin, $constant );
$package = json_decode( file_get_contents( $root . '/package.json' ), true, 512, JSON_THROW_ON_ERROR );
$tag = getenv( 'GITHUB_REF_NAME' );
if ( ! isset( $header[1], $constant[1] ) || $header[1] !== $constant[1] || $header[1] !== $package['version'] || 'v' . $header[1] !== $tag ) {
	throw new RuntimeException( 'Tag, plugin header, CFF_VERSION and package version must match.' );
}
echo "Release version matches tag.\n";
