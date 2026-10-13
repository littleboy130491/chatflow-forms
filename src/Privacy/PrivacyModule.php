<?php
namespace ChatFlow\Privacy;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Integrations\HookDispatcher;
use ChatFlow\Integrations\Outbox;
use ChatFlow\Rest\Settings;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;

final class PrivacyModule implements Module {
	private Repository $submissions;
	public function __construct( private FormRepository $forms ) {
		$this->submissions = new Repository( $forms ); }
	public function register(): void {
		add_filter( 'wp_privacy_personal_data_exporters', array( $this, 'exporters' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( $this, 'erasers' ) );
		add_action( 'cff_purge_batch', array( new Purge( $this->submissions ), 'run' ) );
		add_action( 'cff_export_batch', array( new Export( $this->forms, $this->submissions ), 'run' ) );
		add_action( 'admin_post_cff_download', array( new Export( $this->forms, $this->submissions ), 'download' ) );
		add_action( 'cff_retention', array( $this, 'retention' ) );
		add_action( 'cff_abandon_sessions', array( $this, 'abandon' ) );
		add_action( 'cff_cleanup_private_files', array( new PrivateFiles(), 'cleanupSite' ) );
		add_action( 'init', array( $this, 'schedule' ) );
	}
	public function schedule(): void {
		foreach ( array( 'cff_retention', 'cff_abandon_sessions' ) as $hook ) {
			if ( ! wp_next_scheduled( $hook ) ) {
				wp_schedule_event( time() + 300, 'daily', $hook ); }
		}
		global $wpdb;
		foreach ( array( 'purge', 'export' ) as $kind ) {
			if ( 'export' === $kind ) {
				$ids = $wpdb->get_col( "SELECT id FROM {$wpdb->prefix}cff_exports WHERE status IN ('queued','running') ORDER BY id LIMIT 20" ); } else {
				$names = $wpdb->get_col( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE 'cff_purge_%' LIMIT 20" );
				$ids   = array();
				foreach ( $names as $name ) {
					$job = get_option( $name );
					if ( is_array( $job ) && in_array( $job['status'], array( 'queued', 'running' ), true ) ) {
						$ids[] = $job['id']; }
				}
				}
				foreach ( $ids as $id ) {
					Scheduler::enqueue( 'cff_' . $kind . '_batch', array( 'export' === $kind ? (int) $id : $id ), 5 ); }
		}
	}
	public function exporters( array $items ): array {
		$items['chatflow'] = array(
			'exporter_friendly_name' => __( 'ChatFlow Forms', 'chatflow-forms' ),
			'callback'               => array( $this, 'exportPersonal' ),
		);
		return $items; }
	public function erasers( array $items ): array {
		$items['chatflow'] = array(
			'eraser_friendly_name' => __( 'ChatFlow Forms', 'chatflow-forms' ),
			'callback'             => array( $this, 'erasePersonal' ),
		);
		return $items; }
	public function exportPersonal( string $email, int $page = 1 ): array {
		$ids  = $this->emailIds( $email, max( 1, $page ) );
		$data = array();
		foreach ( $ids as $id ) {
			$submission = $this->submissions->get( $id );
			if ( ! $submission || ! $this->matchesEmailField( $submission, $email ) ) {
				continue; }
			$form   = $this->forms->getVersion( $submission->formId(), $submission->formVersion() );
			$values = array(
				array(
					'name'  => __( 'Submitted', 'chatflow-forms' ),
					'value' => $submission->createdAt(),
				),
			);
			foreach ( $form->schema()['steps'] as $step ) {
				if ( array_key_exists( $step['key'], $submission->answers() ) ) {
					$value    = $submission->answers()[ $step['key'] ];
					$values[] = array(
						'name'  => $step['label'],
						'value' => is_scalar( $value ) ? (string) $value : Database::json( $value ),
					); }
			}
			$meta = $submission->meta();
			unset( $meta['context'] );
			foreach ( $meta as $key => $value ) {
				$values[] = array(
					'name'  => $key,
					'value' => is_scalar( $value ) ? (string) $value : Database::json( $value ),
				); }
			$data[] = array(
				'group_id'    => 'chatflow-forms',
				'group_label' => __( 'ChatFlow submissions', 'chatflow-forms' ),
				'item_id'     => 'cff-' . $submission->uuid(),
				'data'        => $values,
			);
		}
		return array(
			'data' => $data,
			'done' => count( $ids ) < 100,
		);
	}
	public function erasePersonal( string $email, int $page = 1 ): array {
		// Always consume the first surviving batch: deletion must not shift an offset.
		$ids      = $this->emailIds( $email, 1 );
		$removed  = false;
		$retained = false;
		$messages = array();
		foreach ( $ids as $id ) {
			$submission = $this->submissions->get( $id );
			if ( ! $submission || ! $this->matchesEmailField( $submission, $email ) ) {
				continue;
			} try {
				$removed = $this->submissions->delete( $id ) || $removed;
			} catch ( \Throwable $error ) {
				$retained = true; }
		}
		if ( $retained ) {
			$messages[] = __( 'Some submissions could not be erased because private storage is unavailable. Restore storage access and retry.', 'chatflow-forms' ); }
		return array(
			'items_removed'  => $removed,
			'items_retained' => $retained,
			'messages'       => $messages,
			'done'           => $retained || count( $ids ) < 100,
		);
	}
	private function emailIds( string $email, int $page ): array {
		global $wpdb;
		if ( ! is_email( $email ) ) {
			return array(); }
		return array_map( 'intval', $wpdb->get_col( $wpdb->prepare( "SELECT DISTINCT s.id FROM {$wpdb->prefix}cff_submissions s JOIN {$wpdb->prefix}cff_submission_values v ON v.submission_id=s.id WHERE v.value_text=%s ORDER BY s.id LIMIT 100 OFFSET %d", strtolower( $email ), ( $page - 1 ) * 100 ) ) );
	}
	private function matchesEmailField( \ChatFlow\Submissions\Submission $submission, string $email ): bool {
		$form = $this->forms->getVersion( $submission->formId(), $submission->formVersion() );
		if ( ! $form ) {
			return false; }
		foreach ( $form->schema()['steps'] as $step ) {
			if ( 'email' === $step['type'] && strtolower( (string) ( $submission->answers()[ $step['key'] ] ?? '' ) ) === strtolower( $email ) ) {
				return true; }
		}
		return false;
	}
	public function retention(): void {
		global $wpdb;
		try {
			( new Export( $this->forms, $this->submissions ) )->expire(); } catch ( \Throwable $error ) {
			}
			$global = Settings::get();
			$ids    = $wpdb->get_col( "SELECT DISTINCT form_id FROM {$wpdb->prefix}cff_submissions" );
			foreach ( $ids as $id ) {
				$form = $this->forms->getDraft( (int) $id );
				if ( ! $form ) {
						continue; }
				$privacy = $form->settings()['privacy'] ?? array();
				if ( ! ( $privacy['retentionEnabled'] ?? $global['retention']['enabled'] ) ) {
					continue; }
				$days     = $privacy['retentionDays'] ?? $global['retention']['days'];
				$criteria = array(
					'formId'        => (int) $id,
					'olderThanDays' => $days,
					'status'        => array( 'completed', 'partial', 'abandoned', 'spam', 'trash' ),
				);
				$purge    = new Purge( $this->submissions );
				$purge->queue( $purge->bounds( $criteria ), $criteria, 0 );
				$partial = $privacy['partialRetentionDays'] ?? $global['retention']['partialDays'] ?? null;
				if ( is_int( $partial ) && $partial < $days ) {
					$criteria['olderThanDays'] = $partial;
					$criteria['status']        = array( 'partial', 'abandoned' );
					$purge->queue( $purge->bounds( $criteria ), $criteria, 0 ); }
			}
			Database::check( $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}cff_rate_limits WHERE expires_at<%s LIMIT 1000", Database::now() ) ) );
			// Keep completed receipt rows until their submission/session is explicitly removed.
			Database::check( $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}cff_requests WHERE expires_at<%s LIMIT 1000", Database::now() ) ) );
	}
	public function abandon(): void {
		global $wpdb;
		$cursor = (int) get_option( 'cff_abandon_cursor', 0 );
		$rows   = $wpdb->get_results( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_sessions WHERE id>%d AND status='active' AND last_seen_at<=%s ORDER BY id LIMIT 100", $cursor, gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ) ), ARRAY_A );
		foreach ( $rows as $item ) {
			$result = Database::transaction(
				function () use ( $wpdb, $item ) {
					$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE id=%d FOR UPDATE", $item['id'] ), ARRAY_A );
					if ( ! $row || 'active' !== $row['status'] ) {
						return null; }
					$form = $this->forms->getVersion( (int) $row['form_id'], (int) $row['form_version'] );
					if ( ! $form ) {
						return null; }
					$days = $form->settings()['sessions']['abandonDays'] ?? 30;
					if ( strtotime( $row['last_seen_at'] . ' UTC' ) > time() - $days * DAY_IN_SECONDS && strtotime( $row['expires_at'] . ' UTC' ) > time() ) {
						return null; }
					Database::check(
						$wpdb->update(
							$wpdb->prefix . 'cff_sessions',
							array(
								'status'    => 'expired',
								'closed_at' => Database::now(),
							),
							array( 'id' => $row['id'] )
						)
					);
					$submission = $row['submission_id'] ? $this->submissions->get( (int) $row['submission_id'] ) : null;
					if ( ! $submission || 'partial' !== $submission->status() ) {
						return null; }
					$submission = $this->submissions->complete(
						$submission->id(),
						array(
							'status'       => 'abandoned',
							'abandoned_at' => Database::now(),
						)
					);
					$deliveries = ( new Outbox() )->enqueue( $submission, $form, 'submission.abandoned' );
					return array( $submission, $form, $deliveries );
				}
			);
			if ( is_array( $result ) ) {
				HookDispatcher::action( 'cff_submission_abandoned', array( $result[0], $result[1] ), $result[0]->id() );
				if ( $result[2] ) {
					HookDispatcher::action( 'cff_outbox_ready', array( $result[2] ) ); }
			}
			$cursor = (int) $item['id'];
		}
		update_option( 'cff_abandon_cursor', count( $rows ) < 100 ? 0 : $cursor, false );
		if ( count( $rows ) === 100 ) {
			Scheduler::enqueue( 'cff_abandon_sessions', array(), 60 ); }
	}
}
