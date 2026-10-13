<?php
namespace ChatFlow\Updates;

use ChatFlow\Contracts\Module;
use ChatFlow\Vendor\YahnisElsts\PluginUpdateChecker\v5\PucFactory;
use ChatFlow\Vendor\YahnisElsts\PluginUpdateChecker\v5p6\Vcs\GitHubApi;
use ChatFlow\Vendor\YahnisElsts\PluginUpdateChecker\v5p6\Vcs\PluginUpdateChecker;

final class Updater implements Module {
	public function register(): void {
		// No anonymous private-repo requests; no database or environment token fallback.
		if ( ! defined( 'CFF_GITHUB_TOKEN' ) || ! is_string( CFF_GITHUB_TOKEN ) || '' === CFF_GITHUB_TOKEN ) {
			return;
		}
		$checker = PucFactory::buildUpdateChecker( 'https://github.com/littleboy130491/chatflow-forms/', CFF_FILE, 'chatflow-forms' );
		if ( ! $checker instanceof PluginUpdateChecker ) {
			return;
		}
		$checker->setAuthentication( CFF_GITHUB_TOKEN );
		$api = $checker->getVcsApi();
		if ( ! $api instanceof GitHubApi ) {
			return;
		}
		$api->enableReleaseAssets( '/^chatflow-forms\.zip$/' );
		$checker->addFilter( 'pre_inject_update', array( self::class, 'filterUpdate' ) );
	}

	public static function filterUpdate( ?object $update ): ?object {
		// Source archives omit scoped dependencies; only this repository's asset URLs are safe.
		if ( null !== $update && ! preg_match( '~^https://(?:api\.github\.com/repos/littleboy130491/chatflow-forms/releases/assets/\d+|github\.com/littleboy130491/chatflow-forms/releases/download/[^/?]+/chatflow-forms\.zip)$~D', (string) ( $update->download_url ?? '' ) ) ) {
			return null;
		}
		return $update;
	}
}
