<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Frontend\Renderer;
use ChatFlow\Frontend\ThemeFrontend;
use ChatFlow\Rest\TemplatesController;
use PHPUnit\Framework\TestCase;

final class ThemeFrontendTest extends TestCase {
	private string $child;
	private string $parent;
	/** @var callable */
	private $dirs;

	protected function setUp(): void {
		$base         = sys_get_temp_dir() . '/cff-theme-' . wp_generate_uuid4();
		$this->child  = $base . '/child';
		$this->parent = $base . '/parent';
		foreach ( array( $this->child, $this->parent ) as $dir ) {
			wp_mkdir_p( $dir . '/chatflow' );
		}
		$this->dirs = fn() => array(
			$this->child  => 'https://example.test/themes/child',
			$this->parent => 'https://example.test/themes/parent',
		);
		add_filter( 'cff_theme_frontend_directories', $this->dirs );
	}

	protected function tearDown(): void {
		remove_filter( 'cff_theme_frontend_directories', $this->dirs );
		foreach ( array( $this->child, $this->parent ) as $dir ) {
			foreach ( (array) glob( $dir . '/chatflow/*' ) as $file ) {
				unlink( $file );
			}
			rmdir( $dir . '/chatflow' );
			rmdir( $dir );
		}
		rmdir( dirname( $this->child ) );
	}

	public function testChildBeatsParentAndPerFormFilesBeatTheGeneralOne(): void {
		wp_set_current_user( 1 );
		$forms    = new FormRepository();
		$template = TemplatesController::definition( 'contact' );
		$form     = $forms->create( 'Theme frontend fixture', $template['schema'], $template['settings'] );
		self::assertInstanceOf( Form::class, $form );
		try {
			self::assertNull( ThemeFrontend::asset( 'js', $form ) );
			file_put_contents( $this->parent . '/chatflow/frontend.js', '' );
			self::assertStringStartsWith( 'https://example.test/themes/parent/chatflow/frontend.js?ver=', (string) ThemeFrontend::asset( 'js', $form ) );
			file_put_contents( $this->child . '/chatflow/frontend.js', '' );
			self::assertStringStartsWith( 'https://example.test/themes/child/chatflow/frontend.js?ver=', (string) ThemeFrontend::asset( 'js', $form ) );
			file_put_contents( $this->child . '/chatflow/frontend-' . $form->id() . '.js', '' );
			self::assertStringStartsWith( 'https://example.test/themes/child/chatflow/frontend-' . $form->id() . '.js', (string) ThemeFrontend::asset( 'js', $form ) );
			self::assertNull( ThemeFrontend::asset( 'css', $form ) );
			self::assertNull( ThemeFrontend::asset( 'php', $form ) );

			$off = static fn() => null;
			add_filter( 'cff_theme_frontend_asset', $off );
			self::assertNull( ThemeFrontend::asset( 'js', $form ) );
			remove_filter( 'cff_theme_frontend_asset', $off );

			$published = $forms->publish( $form->id(), $form->draftRevision() );
			self::assertInstanceOf( Form::class, $published );
			// Published forms have a slug; a slug file beats the id file.
			self::assertNotSame( '', $published->slug() );
			file_put_contents( $this->child . '/chatflow/frontend-' . $published->slug() . '.js', '' );
			self::assertStringStartsWith( 'https://example.test/themes/child/chatflow/frontend-' . $published->slug() . '.js', (string) ThemeFrontend::asset( 'js', $published ) );
			file_put_contents( $this->child . '/chatflow/frontend.css', '' );
			$markup = ( new Renderer( $forms ) )->render( $form->id() );
			self::assertStringContainsString( 'data-frontend="theme"', $markup );
			self::assertStringContainsString( 'data-theme-style="https://example.test/themes/child/chatflow/frontend.css?ver=', $markup );
			self::assertTrue( wp_script_is( ThemeFrontend::handle( (string) ThemeFrontend::asset( 'js', $published ) ), 'enqueued' ) );
		} finally {
			global $wpdb;
			$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form->id() ) );
			wp_delete_post( $form->id(), true );
		}
	}
}
