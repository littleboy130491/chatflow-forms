<?php
namespace ChatFlow\Tests\Backend;

use ChatFlow\Fields\Registry;
use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Logic\Engine;
use ChatFlow\Logic\Experiments;
use ChatFlow\Security\TokenSigner;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\SessionService;
use ChatFlow\Templates\Imajiner;
use PHPUnit\Framework\TestCase;

final class PhaseThreeExperimentTest extends TestCase {
	public function testBuilderDependenciesExistOnSupportedWordPress(): void {
		$asset = require CFF_PATH . 'build/admin/builder.asset.php';
		foreach ( $asset['dependencies'] as $dependency ) {
			self::assertArrayHasKey( $dependency, wp_scripts()->registered );
		}
	}
	public function testServerAssignmentPersistsItsSnapshotAcrossPublishAndResume(): void {
		global $wpdb;
		$fixture = json_decode( file_get_contents( dirname( __DIR__, 2 ) . '/fixtures/logic/power-variant-order.json' ), true, 512, JSON_THROW_ON_ERROR );
		$settings = Imajiner::definition()['settings'];
		$settings['completion']['defaultEndingId'] = 'done';
		$settings['sessions']['savePartial'] = true;
		$settings['sessions']['resumeEnabled'] = true;
		$repo = new FormRepository();
		$draft = $repo->create( 'Experiment ' . wp_generate_uuid4(), $fixture['schema'], $settings );
		self::assertInstanceOf( Form::class, $draft );
		$form_id = $draft->id();
		try {
			$published = $repo->publish( $draft->id(), $draft->draftRevision() );
			self::assertInstanceOf( Form::class, $published );
			$service = new SessionService( $repo, new Engine(), new Registry() );
			$token = ( new TokenSigner( wp_salt( 'auth' ), get_current_blog_id() ) )->issue( 'start', array( 'formId' => $draft->id(), 'version' => $published->version() ), time() );
			$body = array( 'formId' => $draft->id(), 'version' => $published->version(), 'prefill' => $fixture['answers'], 'variantId' => 'forged', 'context' => array( '_variantSchema' => array( 'steps' => array() ) ) );
			$key = wp_generate_uuid4();
			$session = $service->start( $body, $token, $key );
			self::assertIsArray( $session );
			$repeated = $service->start( $body, $token, $key );
			self::assertIsArray( $repeated );
			self::assertSame( $session['variantId'], $repeated['variantId'] );
			self::assertSame( wp_json_encode( $session['schema'] ), wp_json_encode( $repeated['schema'] ) );
			$variant_id = explode( ':', $session['variantId'] );
			self::assertSame( 'copy_order', $variant_id[0] );
			$variant = current( array_filter( $fixture['schema']['experiments'][0]['variants'], static fn( $v ) => $v['id'] === $variant_id[1] ) );
			self::assertIsArray( $variant );
			$expected = Experiments::applyVariant( $fixture['schema'], $variant );
			self::assertSame( array_column( $expected['steps'], 'id' ), array_column( $session['schema']['steps'], 'id' ) );
			self::assertSame( $expected['steps'][0]['messages'], $session['schema']['steps'][0]['messages'] );
			self::assertSame( 13, $session['answers']->bonus );
			self::assertSame( $session['variantId'], $wpdb->get_var( $wpdb->prepare( "SELECT variant_id FROM {$wpdb->prefix}cff_sessions WHERE public_id=%s", $session['sessionId'] ) ) );
			$updated = $fixture['schema'];
			$updated['steps'][1]['messages'] = array( 'New publish' );
			$draft = $repo->saveDraft( $form_id, $updated, $settings, $repo->getDraft( $form_id )->draftRevision() );
			self::assertInstanceOf( Form::class, $draft, is_wp_error( $draft ) ? wp_json_encode( $draft->get_error_data() ) : '' );
			self::assertInstanceOf( Form::class, $repo->publish( $draft->id(), $draft->draftRevision() ) );
			$resumed = $service->resume( $draft->id(), $session['resumeToken'] );
			self::assertIsArray( $resumed );
			self::assertSame( $session['schema'], $resumed['schema'] );
			self::assertSame( $session['variantId'], $resumed['variantId'] );
			self::assertSame( 13, $resumed['answers']->bonus );
		} finally {
			$submissions = new Repository( $repo );
			foreach ( $submissions->find( array( 'formId' => $form_id ) )['items'] as $submission ) {
				$submissions->delete( $submission->id() ); }
			$wpdb->delete( $wpdb->prefix . 'cff_sessions', array( 'form_id' => $form_id ) );
			$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $form_id ) );
			wp_delete_post( $form_id, true );
		}
	}
}
