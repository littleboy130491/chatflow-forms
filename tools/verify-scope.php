<?php
define( 'ABSPATH', dirname( __DIR__ ) . '/' );
require dirname( __DIR__ ) . '/autoload.php';

$classes = array(
	'Opis\\JsonSchema\\Validator',
	'OpenSpout\\Writer\\XLSX\\Writer',
	'Opis\\Uri\\Uri',
	'Opis\\String\\UnicodeString',
	'DeviceDetector\\DeviceDetector',
	'YahnisElsts\\PluginUpdateChecker\\v5\\PucFactory',
	'YahnisElsts\\PluginUpdateChecker\\v5p6\\Vcs\\GitHubApi',
	'YahnisElsts\\PluginUpdateChecker\\v5p6\\Parsedown',
	'YahnisElsts\\PluginUpdateChecker\\v5p6\\PucReadmeParser',
);
foreach ( $classes as $class ) {
	if ( ! class_exists( 'ChatFlow\\Vendor\\' . $class ) || class_exists( $class ) ) {
		throw new RuntimeException( 'Invalid isolated vendor class: ' . $class );
	}
}
if ( class_exists( 'Parsedown', false ) || class_exists( 'PucReadmeParser', false ) || class_exists( 'Spyc', false ) ) {
	throw new RuntimeException( 'Vendor leaked a global parser.' );
}
$markdown = \ChatFlow\Vendor\YahnisElsts\PluginUpdateChecker\v5p6\Parsedown::instance()->text( '**Scoped**' );
if ( ! str_contains( $markdown, '<strong>Scoped</strong>' ) ) {
	throw new RuntimeException( 'Scoped update changelog parser failed.' );
}
echo "Scoped dependency autoload verified without unscoped runtime classes.\n";
