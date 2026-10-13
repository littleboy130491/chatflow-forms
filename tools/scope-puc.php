<?php
// Strauss discovers PUC's minor namespace but not its manually loaded major alias.
$root = dirname( __DIR__ ) . '/vendor-prefixed/yahnis-elsts/plugin-update-checker';
foreach ( array( '/load-v5p6.php', '/Puc/v5/PucFactory.php' ) as $file ) {
	$path = $root . $file;
	$source = file_get_contents( $path );
	$source = str_replace( array( 'use YahnisElsts\\PluginUpdateChecker\\v5\\', 'namespace YahnisElsts\\PluginUpdateChecker\\v5;' ), array( 'use ChatFlow\\Vendor\\YahnisElsts\\PluginUpdateChecker\\v5\\', 'namespace ChatFlow\\Vendor\\YahnisElsts\\PluginUpdateChecker\\v5;' ), $source );
	file_put_contents( $path, $source );
}
$namespace = 'ChatFlow\\Vendor\\YahnisElsts\\PluginUpdateChecker\\v5p6';
foreach ( array( 'Parsedown.php', 'ParsedownModern.php', 'PucReadmeParser.php' ) as $file ) {
	$path = $root . '/vendor/' . $file;
	$source = file_get_contents( $path );
	$source = preg_replace( '/^<\?php\s*/', "<?php\nnamespace " . $namespace . ";\n\n", $source );
	$source = str_replace( array( "class_exists('Parsedown'", "class_exists('PucReadmeParser'" ), array( "class_exists(__NAMESPACE__ . '\\\\Parsedown'", "class_exists(__NAMESPACE__ . '\\\\PucReadmeParser'" ), $source );
	file_put_contents( $path, $source );
}
foreach ( array( '/Puc/v5p6/Vcs/Api.php', '/Puc/v5p6/Vcs/GitHubApi.php' ) as $file ) {
	$path = $root . $file;
	$source = file_get_contents( $path );
	$source = str_replace( array( 'use Parsedown;', 'use PucReadmeParser;' ), array( 'use ' . $namespace . '\\Parsedown;', 'use ' . $namespace . '\\PucReadmeParser;' ), $source );
	file_put_contents( $path, $source );
}
