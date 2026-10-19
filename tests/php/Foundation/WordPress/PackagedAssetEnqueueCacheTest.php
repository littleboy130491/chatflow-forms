<?php
namespace ChatFlow\Tests\Foundation\WordPress;

use ChatFlow\Admin\AdminModule;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Frontend\Renderer;
use ChatFlow\Install\Installer;
use ChatFlow\Templates\Imajiner;

final class PackagedAssetEnqueueCacheTest extends \WP_UnitTestCase {
	public function testBuilderPreviewReceivesTheVersionedRuntimeUrl(): void {
		$config = ( new AdminModule( new FormRepository() ) )->config( 'builder' );
		$expected = add_query_arg( 'ver', $this->contentVersion( 'build/runtime/runtime.js' ), plugins_url( 'build/runtime/runtime.js', CFF_FILE ) );
		self::assertSame( $expected, $config['runtimeUrl'] ?? null );
	}

	public function testPublicRuntimeUsesItsPackagedContentHash(): void {
		Installer::activate();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$forms = new FormRepository();
		$definition = Imajiner::definition();
		$form = $forms->create( 'Asset cache regression', $definition['schema'], $definition['settings'] );
		$this->assertNotWPError( $form );
		// The disposable WP harness resets posts between runs, but retains custom tables.
		global $wpdb;
		$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ), array( '%d' ) );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$this->assertNotWPError( $form );
		wp_deregister_script( 'cff-runtime' );
		wp_set_current_user( 0 );
		self::assertStringContainsString( '<cff-chat', ( new Renderer( $forms ) )->render( $form->id() ) );
		$runtime = wp_scripts()->registered['cff-runtime'];
		self::assertStringContainsString( 'build/runtime/runtime.js', $runtime->src );
		self::assertSame( $this->contentVersion( 'build/runtime/runtime.js' ), $runtime->ver );
	}

	public function testAdminStylesUseTheirOwnHashesAndPreserveScriptMetadata(): void {
		global $wp_locale;
		$direction = $wp_locale->text_direction;
		$asset = new \ReflectionMethod( AdminModule::class, 'asset' );
		$asset->setAccessible( true );
		try {
			foreach ( array( 'ltr', 'rtl' ) as $dir ) {
				$wp_locale->text_direction = $dir;
				$suffix = 'rtl' === $dir ? '-rtl' : '';
				foreach ( array( 'builder', 'submissions' ) as $entry ) {
					wp_deregister_script( 'cff-' . $entry );
					wp_deregister_style( 'cff-' . $entry );
					wp_deregister_style( 'cff-admin-base' );
					self::assertTrue( $asset->invoke( new AdminModule( new FormRepository() ), $entry ) );
					$metadata = require CFF_PATH . 'build/admin/' . $entry . '.asset.php';
					$script = wp_scripts()->registered[ 'cff-' . $entry ];
					self::assertSame( $metadata['version'], $script->ver );
					self::assertSame( $metadata['dependencies'], $script->deps );
					$css = 'build/admin/style-' . $entry . $suffix . '.css';
					self::assertStringContainsString( $css, wp_styles()->registered[ 'cff-' . $entry ]->src );
					self::assertSame( $this->contentVersion( $css ), wp_styles()->registered[ 'cff-' . $entry ]->ver );
					if ( 'submissions' === $entry ) {
						self::assertSame( $this->contentVersion( 'build/admin/style-builder' . $suffix . '.css' ), wp_styles()->registered['cff-admin-base']->ver );
					}
				}
			}
		} finally {
			$wp_locale->text_direction = $direction;
		}
	}

	public function testFullpageRegistrationKeepsTheRuntimeHashBeforeRendering(): void {
		$form = $this->publishedFixture();
		set_query_var( 'cff_form_slug', $form->slug() );
		wp_deregister_script( 'cff-runtime' );
		$module = new \ChatFlow\Frontend\FrontendModule( new FormRepository() );
		self::assertSame( CFF_PATH . 'templates/fullpage.php', $module->template( 'fallback.php' ) );
		self::assertSame( $this->contentVersion( 'build/runtime/runtime.js' ), wp_scripts()->registered['cff-runtime']->ver );
		( new Renderer() )->render( $form->id() );
		self::assertSame( $this->contentVersion( 'build/runtime/runtime.js' ), wp_scripts()->registered['cff-runtime']->ver );
		set_query_var( 'cff_form_slug', '' );
	}

	public function testSitewideRegistrationKeepsTheRuntimeHashBeforeRendering(): void {
		$page = self::factory()->post->create( array( 'post_type' => 'page', 'post_status' => 'publish' ) );
		$form = $this->publishedFixture( array( 'mode' => 'launcher', 'launcher' => array( 'enabled' => true, 'includePageIds' => array( $page ) ) ) );
		$this->go_to( get_permalink( $page ) );
		set_query_var( 'cff_form_slug', '' );
		wp_deregister_script( 'cff-runtime' );
		( new \ChatFlow\Frontend\FrontendModule( new FormRepository() ) )->enqueueSiteWide();
		self::assertArrayHasKey( 'cff-runtime', wp_scripts()->registered );
		self::assertSame( $this->contentVersion( 'build/runtime/runtime.js' ), wp_scripts()->registered['cff-runtime']->ver );
		( new Renderer() )->render( $form->id() );
		self::assertSame( $this->contentVersion( 'build/runtime/runtime.js' ), wp_scripts()->registered['cff-runtime']->ver );
	}

	private function publishedFixture( array $display = array() ): \ChatFlow\Forms\Form {
		Installer::activate();
		$definition = Imajiner::definition();
		if ( $display ) {
			$definition['settings']['display'] = array_merge( $definition['settings']['display'] ?? array(), $display );
		}
		$forms = new FormRepository();
		$form = $forms->create( 'Asset pre-registration regression', $definition['schema'], $definition['settings'] );
		$this->assertNotWPError( $form );
		global $wpdb;
		$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ), array( '%d' ) );
		$form = $forms->publish( $form->id(), $form->draftRevision() );
		$this->assertNotWPError( $form );
		return $form;
	}

	private function contentVersion( string $relative ): string {
		self::assertFileExists( CFF_PATH . $relative );
		return substr( hash_file( 'sha256', CFF_PATH . $relative ), 0, 16 );
	}
}
