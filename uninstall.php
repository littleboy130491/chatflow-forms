<?php
/** Keep all data unless each site explicitly opted in. */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;
require_once __DIR__ . '/autoload.php';
\ChatFlow\Install\Installer::uninstall();
