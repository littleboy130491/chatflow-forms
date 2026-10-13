<?php
namespace ChatFlow\Tests\Foundation\WordPress;

use ChatFlow\Vendor\YahnisElsts\PluginUpdateChecker\v5\PucFactory;
use ChatFlow\Vendor\YahnisElsts\PluginUpdateChecker\v5p6\Vcs\GitHubApi;

final class UpdaterTest extends \WP_UnitTestCase {
	public function testScopedFactoryCreatesGithubCheckerWithPackagedReleaseFiltering(): void {
		$checker = PucFactory::buildUpdateChecker( 'https://github.com/littleboy130491/chatflow-forms/', CFF_FILE, 'chatflow-forms' );
		$api = $checker->getVcsApi();
		$this->assertInstanceOf( GitHubApi::class, $api );
		$api->enableReleaseAssets( '/^chatflow-forms\.zip$/' );
		$args = $api->setUpdateDownloadHeaders( array( 'headers' => array() ), 'https://api.github.com/repos/littleboy130491/chatflow-forms/releases/assets/123' );
		$this->assertSame( 'application/octet-stream', $args['headers']['Accept'] );
		$this->assertArrayNotHasKey( 'Authorization', $args['headers'] );
	}
}
