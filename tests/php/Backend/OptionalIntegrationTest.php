<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Admin\Translations;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Integrations\Elementor\ElementorModule;
use ChatFlow\Integrations\Elementor\FormWidget;
use ChatFlow\Rest\TemplatesController;
use PHPUnit\Framework\TestCase;

final class OptionalIntegrationTest extends TestCase {
	public function testNoElementorModuleGracefullyDoesNothing(): void {
		if ( class_exists( '\Elementor\Widget_Base' ) ) {
			$this->markTestSkipped( 'Run without Elementor for absence behavior.' ); }
		$manager = new class() { public int $count = 0;
			public function register( object $widget ): void {
				++$this->count;
			} };
		( new ElementorModule() )->widgets( $manager );
		self::assertSame( 0, $manager->count );
	}
	public function testRealElementorWidgetRegistersAndRendersOnlyPublishedForm(): void {
		if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
			$this->markTestSkipped( 'Requires actual Elementor installation.' ); }
		wp_set_current_user( 1 );
		$manager = new class() { public array $widgets = array();
			public function register( object $widget ): void {
				$this->widgets[] = $widget;
			} };
		( new ElementorModule() )->widgets( $manager );
		self::assertCount( 1, $manager->widgets );
		self::assertSame( 'chatflow-form', $manager->widgets[0]->get_name() );
		$forms = new FormRepository();
		( new \ChatFlow\Frontend\FrontendModule( $forms ) )->register();
		$d    = TemplatesController::definition( 'contact' );
		$form = $forms->create( 'Elementor fixture', $d['schema'], $d['settings'] );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		try {
			$widget = new FormWidget(
				array(
					'id'         => 'cff-fixture',
					'elType'     => 'widget',
					'widgetType' => 'chatflow-form',
					'settings'   => array(
						'form_id' => $form->id(),
						'mode'    => 'inline',
						'height'  => 600,
					),
				),
				array()
			);
			$render = new \ReflectionMethod( FormWidget::class, 'render' );
			ob_start();
			$render->invoke( $widget );
			$draft = ob_get_clean();
			self::assertStringNotContainsString( 'data-cff', $draft );
			$published = $forms->publish( $form->id(), $form->draftRevision() );
			self::assertNotInstanceOf( \WP_Error::class, $published );
			ob_start();
			$render->invoke( $widget );
			$output = ob_get_clean();
			self::assertStringContainsString( 'data-form-id="' . $form->id() . '"', $output );
			self::assertStringNotContainsString( 'secretKey', $output );
		} finally {
			wp_delete_post( $form->id(), true ); }
	}
	public function testWpmlDisplayHookTranslatesOnlyPresentationAndRestDoesNotShareEtag(): void {
		$module     = new Translations();
		$translator = static fn( $value, $context, $name ) => 'bot.name' === $name ? 'Translated assistant' : $value;
		add_filter( 'wpml_translate_single_string', $translator, 10, 3 );
		$definition = TemplatesController::definition( 'contact' );
		$display    = array(
			'form' => array(
				'id'      => 123,
				'schema'  => $definition['schema'],
				'phrases' => array(),
			),
		);
		try {
			$data = $module->display( $display );
			self::assertSame( 'Translated assistant', $data['form']['schema']['bot']['name'] );
			self::assertSame( $display['form']['schema']['steps'], $data['form']['schema']['steps'] );
			$request = new \WP_REST_Request( 'GET', '/cff/v1/forms/123' );
			$request->set_header( 'If-None-Match', 'old-language-etag' );
			$module->uncached( null, rest_get_server(), $request );
			self::assertSame( '', $request->get_header( 'If-None-Match' ) );
			$response = $module->response( new \WP_REST_Response( $display ), rest_get_server(), $request );
			self::assertSame( 'private,no-store', $response->get_headers()['Cache-Control'] );
			self::assertSame( 'Translated assistant', $response->get_data()['form']['schema']['bot']['name'] );
			$admin = $module->response( new \WP_REST_Response( $display ), rest_get_server(), new \WP_REST_Request( 'GET', '/cff/v1/admin/forms/123' ) );
			self::assertSame( $display, $admin->get_data() );
		} finally {
			remove_filter( 'wpml_translate_single_string', $translator, 10 ); }
	}
}
