<?php
namespace ChatFlow\Tests\Backend;

use PHPUnit\Framework\TestCase;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\PublicProjection;
use ChatFlow\Privacy\Confirmation;
use ChatFlow\Privacy\Export;
use ChatFlow\Privacy\PrivacyModule;
use ChatFlow\Privacy\PrivateFiles;
use ChatFlow\Privacy\Purge;
use ChatFlow\Rest\Settings;
use ChatFlow\Spam\RateLimiter;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Idempotency;
use ChatFlow\Submissions\Repository;
use ChatFlow\Templates\Imajiner;
use ChatFlow\Tracking\IpResolver;
use ChatFlow\Tracking\Metadata;

final class StorageSecurityTest extends TestCase {
	private FormRepository $forms;
	private Repository $submissions;
	private array $form_ids       = array();
	private array $submission_ids = array();
	protected function setUp(): void {
		$this->forms       = new FormRepository();
		$this->submissions = new Repository( $this->forms );
		wp_set_current_user( 1 );
		update_option( 'cff_settings', Settings::defaults() ); }
	protected function tearDown(): void {
		global $wpdb;
		foreach ( $this->submission_ids as $id ) {
			$this->submissions->delete( $id );
		} foreach ( $this->form_ids as $id ) {
			$wpdb->delete( $wpdb->prefix . 'cff_form_versions', array( 'form_id' => $id ) );
			wp_delete_post( $id, true ); } }
	private function form(): \ChatFlow\Forms\Form {
		$d    = Imajiner::definition();
		$form = $this->forms->create( 'Backend Test ' . wp_generate_uuid4(), $d['schema'], $d['settings'] );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		$this->form_ids[] = $form->id();
		$form             = $this->forms->publish( $form->id(), $form->draftRevision() );
		self::assertNotInstanceOf( \WP_Error::class, $form );
		return $form; }
	private function submission( \ChatFlow\Forms\Form $form, array $answers, array $extra = array() ): \ChatFlow\Submissions\Submission {
		$s                      = $this->submissions->savePartial(
			array_merge(
				array(
					'form_id'      => $form->id(),
					'form_version' => $form->version(),
					'answers'      => $answers,
				),
				$extra
			)
		);
		$this->submission_ids[] = $s->id();
		return $s; }

	public function testTemplateValidatesAndPreservesPhaseOneSummaryAndOptionalServiceHidingOff(): void {
		$form  = $this->form();
		$steps = array_column( $form->schema()['steps'], null, 'key' );
		self::assertSame( 'summary', $steps['summary']['type'] );
		self::assertFalse( $steps['email']['required'] );
		self::assertSame( 'ID', $steps['whatsapp']['settings']['country'] );
		self::assertArrayNotHasKey( 'logic', $steps['layanan'] );
		self::assertCount( 4, $steps['layanan']['options'] );
		self::assertSame( 'jump', $steps['punya_website']['logic'][0]['then']['action'] );
		self::assertSame( 'step_layanan', $steps['punya_website']['logic'][0]['then']['to'] );
		self::assertStringContainsString( '{{all_answers}}', $form->settings()['notifications']['autoresponders'][0]['body'] );
	}
	public function testNonemptyRepositoryInsertCapturesIdAndFilterParity(): void {
		$form  = $this->form();
		$first = $this->submission(
			$form,
			array(
				'nama'   => 'Ayu',
				'email'  => 'ayu@example.test',
				'budget' => 'Rp5–10 jt',
			),
			array(
				'utm_source'  => 'google',
				'device_type' => 'mobile',
			)
		);
		$other = $this->submission( $form, array( 'nama' => 'Budi' ) );
		self::assertNotSame( $first->id(), $other->id() );
		self::assertSame( 'Ayu', $this->submissions->get( $first->id() )->answers()['nama'] );
		$filters = array(
			'formId'    => $form->id(),
			'search'    => 'ayu@',
			'utmSource' => 'google',
			'device'    => 'mobile',
			'fieldKey'  => 'budget',
			'operator'  => 'eq',
			'value'     => 'Rp5–10 jt',
		);
		$found   = $this->submissions->find( $filters );
		self::assertSame( 1, $found['total'] );
		self::assertSame( $first->id(), $found['items'][0]->id() );
		$updated = $this->submissions->update(
			$first->id(),
			array(
				'isRead'    => true,
				'isStarred' => true,
				'note'      => '<script>bad</script>hello',
			)
		);
		self::assertTrue( $updated->admin()['isRead'] );
		self::assertTrue( $updated->admin()['isStarred'] );
	}
	public function testUnknownFiltersAndOperatorsFailClosed(): void {
		$this->expectException( \InvalidArgumentException::class );
		$this->submissions->find(
			array(
				'fieldKey' => 'nama',
				'operator' => ' OR 1=1 --',
			)
		); }
	public function testPublicProjectionNeverExposesSettingsSecretsOrFilterExpansion(): void {
		$form     = $this->form();
		$callback = static function ( $dto ) {
			$dto['privateSecret']                          = 'secret';
			$dto['form']['settings']                       = array( 'token' => 'secret' );
			$dto['form']['phrases']['unknown_secret_key!'] = 'secret';
			return $dto;
		};
		add_filter( 'cff_public_schema', $callback );
		$public = PublicProjection::build( $form );
		remove_filter( 'cff_public_schema', $callback );
		self::assertArrayNotHasKey( 'settings', $public['form'] );
		self::assertArrayNotHasKey( 'privateSecret', $public );
		self::assertTrue( $public['features']['uploads'] );
		self::assertArrayNotHasKey( 'unknown_secret_key!', (array) $public['form']['phrases'] );
	}
	public function testIdempotencyCanonicalRetryConflictsPendingAndRollback(): void {
		$guard = new Idempotency();
		$scope = 'test:' . wp_generate_uuid4();
		$key   = wp_generate_uuid4();
		$first = Database::transaction(
			function () use ( $guard, $scope, $key ) {
				$g = $guard->begin(
					$scope,
					$key,
					array(
						'b' => 2,
						'a' => array( 'x' => 1 ),
					)
				);
				$guard->finish( $g['id'], array( 'ok' => true ) );
				return $g;
			}
		);
		self::assertIsArray( $first );
		$retry = Database::transaction(
			fn() => $guard->begin(
				$scope,
				$key,
				array(
					'a' => array( 'x' => 1 ),
					'b' => 2,
				)
			)
		);
		self::assertSame( array( 'ok' => true ), $retry['response'] );
		$conflict = Database::transaction( fn() => $guard->begin( $scope, $key, array( 'b' => 3 ) ) );
		self::assertSame( 'cff_idempotency_conflict', $conflict->get_error_code() );
		$pending_key = wp_generate_uuid4();
		Database::transaction( fn() => $guard->begin( $scope, $pending_key, array() ) );
		$pending = Database::transaction( fn() => $guard->begin( $scope, $pending_key, array() ) );
		self::assertSame( 'cff_request_pending', $pending->get_error_code() );
	}
	public function testNestedTransactionsCannotCommitRejectedOuterMutation(): void {
		global $wpdb;
		$form   = $this->form();
		$id     = 0;
		$result = Database::transaction(
			function () use ( $form, &$id ) {
				$s  = $this->submissions->savePartial(
					array(
						'form_id'      => $form->id(),
						'form_version' => 1,
						'answers'      => array( 'nama' => 'Nested' ),
					)
				);
				$id = $s->id();
				Database::transaction( fn() => $this->submissions->complete( $id, array( 'status' => 'completed' ) ) );
				return Database::error( 'test_rollback', 'Test rollback', 422 );
			}
		);
		self::assertInstanceOf( \WP_Error::class, $result );
		self::assertNull( $this->submissions->get( $id ) );
	}
	public function testRateBucketAndTrustedProxySpoofResistance(): void {
		$rate     = new RateLimiter();
		$identity = 'test:' . wp_generate_uuid4();
		self::assertTrue( $rate->consume( $identity, 2, 60, 1700000000 ) );
		self::assertTrue( $rate->consume( $identity, 2, 60, 1700000000 ) );
		self::assertFalse( $rate->consume( $identity, 2, 60, 1700000000 ) );
		self::assertTrue( $rate->consume( $identity, 2, 60, 1700000060 ) );
		$ip = new IpResolver();
		self::assertSame(
			'203.0.113.8',
			$ip->resolve(
				array(
					'REMOTE_ADDR'           => '203.0.113.8',
					'HTTP_CF_CONNECTING_IP' => '1.1.1.1',
				)
			)
		);
		self::assertSame(
			'8.8.8.8',
			$ip->resolve(
				array(
					'REMOTE_ADDR'           => '173.245.48.8',
					'HTTP_CF_CONNECTING_IP' => '8.8.8.8',
				)
			)
		);
		self::assertSame(
			'9.9.9.9',
			$ip->resolve(
				array(
					'REMOTE_ADDR'          => '10.0.0.2',
					'HTTP_X_FORWARDED_FOR' => '1.1.1.1,9.9.9.9,10.0.0.1',
				),
				array(
					'mode'          => 'custom',
					'trustedRanges' => array( '10.0.0.0/8' ),
				)
			)
		);
		self::assertSame( '192.0.2.0', IpResolver::anonymize( '192.0.2.99' ) );
		self::assertSame( '2001:db8:abcd::', IpResolver::anonymize( '2001:db8:abcd:ef12:1234::1' ) );
	}
	public function testClientCannotInjectServerMetaAndDntSuppressesTracking(): void {
		$metadata = new Metadata();
		self::assertInstanceOf( \WP_Error::class, $metadata->validate( array( 'ip' => '8.8.8.8' ) ) );
		self::assertInstanceOf( \WP_Error::class, $metadata->validate( array( 'pageUrl' => 'javascript:alert(1)' ) ) );
		$form = $this->form();
		self::assertSame(
			array(),
			$metadata->collect(
				$form,
				array( 'utm' => array( 'source' => 'ads' ) ),
				array(
					'HTTP_DNT'    => '1',
					'REMOTE_ADDR' => '8.8.8.8',
				)
			)
		);
	}
	public function testFormulaSafeCsvFilteredExportsAndOwnerBoundProgress(): void {
		global $wpdb;
		$form = $this->form();
		$s    = $this->submission(
			$form,
			array(
				'nama'  => '=HYPERLINK("evil")',
				'email' => 'a@example.test',
			)
		);
		$this->submission( $form, array( 'nama' => 'Excluded' ) );
		$export = new Export( $this->forms, $this->submissions );
		$result = $export->create(
			array(
				'formId'      => $form->id(),
				'ids'         => array( $s->id() ),
				'columns'     => array( 'uuid', 'nama', 'email' ),
				'headerStyle' => 'keys',
				'delimiter'   => ';',
			)
		);
		self::assertIsArray( $result );
		self::assertSame( 'ready', $result['status'] );
		self::assertSame( 1, $result['rowCount'] );
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_exports WHERE id=%d", $result['exportId'] ), ARRAY_A );
		$csv = file_get_contents( ( new PrivateFiles() )->path( $row['storage_key'] ) );
		self::assertStringContainsString( "'=HYPERLINK", $csv );
		self::assertStringNotContainsString( 'Excluded', $csv );
		self::assertSame( "' \t+CMD", Export::cell( " \t+CMD" ) );
		self::assertSame( "'@SUM(1)", Export::cell( '@SUM(1)' ) );
		wp_set_current_user( 0 );
		self::assertInstanceOf( \WP_Error::class, $export->progress( $result['exportId'] ) );
		wp_set_current_user( 1 );
	}
	public function testPurgePreviewBindsCriteriaUserAndOldRowsOnly(): void {
		$form     = $this->form();
		$old      = $this->submission( $form, array( 'nama' => 'Old' ), array( 'created_at' => gmdate( 'Y-m-d H:i:s', time() - 400 * DAY_IN_SECONDS ) ) );
		$new      = $this->submission( $form, array( 'nama' => 'New' ) );
		$purge    = new Purge( $this->submissions );
		$criteria = array(
			'formId'        => $form->id(),
			'olderThanDays' => 360,
		);
		$preview  = $purge->preview( $criteria );
		self::assertSame( 1, $preview['count'] );
		self::assertInstanceOf(
			\WP_Error::class,
			$purge->start(
				array(
					'formId'        => $form->id(),
					'olderThanDays' => 1,
				),
				$preview['confirmationToken'],
				'DELETE'
			)
		);
		self::assertInstanceOf( \WP_Error::class, $purge->start( $criteria, $preview['confirmationToken'], 'delete' ) );
		$job = $purge->start( $criteria, $preview['confirmationToken'], 'DELETE' );
		self::assertIsArray( $job );
		$purge->run( $job['jobId'] );
		self::assertSame( 'completed', $purge->progress( $job['jobId'] )['status'] );
		self::assertNull( $this->submissions->get( $old->id() ) );
		self::assertNotNull( $this->submissions->get( $new->id() ) );
	}
	public function testPrivacyEmailExportAndEraseDeletesActualDependencies(): void {
		global $wpdb;
		$form  = $this->form();
		$s     = $this->submission(
			$form,
			array(
				'email' => 'privacy@example.test',
				'nama'  => 'Privacy',
			)
		);
		$other = $this->submission( $form, array( 'email' => 'other@example.test' ) );
		$this->submissions->update( $s->id(), array( 'note' => 'private note' ) );
		$privacy = new PrivacyModule( $this->forms );
		$export  = $privacy->exportPersonal( 'privacy@example.test' );
		self::assertCount( 1, $export['data'] );
		self::assertTrue( $export['done'] );
		$erased = $privacy->erasePersonal( 'privacy@example.test' );
		self::assertTrue( $erased['items_removed'] );
		self::assertNull( $this->submissions->get( $s->id() ) );
		self::assertSame( '0', $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_submission_values WHERE submission_id=%d", $s->id() ) ) );
		self::assertNotNull( $this->submissions->get( $other->id() ) );
	}
	public function testOwnedPathsRejectTraversalAndSymlinks(): void {
		$this->expectException( \RuntimeException::class );
		( new PrivateFiles() )->path( '../wp-config.php' ); }
	public function testGlobalSettingsRejectSecretsAndKeepRetentionOffByDefault(): void {
		self::assertFalse( Settings::get()['retention']['enabled'] );
		self::assertInstanceOf( \WP_Error::class, Settings::save( array( 'githubToken' => 'never-store' ) ) );
		self::assertInstanceOf( \WP_Error::class, Settings::save( array( 'proxy' => array( 'trustedRanges' => array( '0.0.0.0/invalid' ) ) ) ) );
		$saved = Settings::save(
			array(
				'retention' => array(
					'enabled' => true,
					'days'    => 120,
				),
			)
		);
		self::assertTrue( $saved['retention']['enabled'] ); }
}
