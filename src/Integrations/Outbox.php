<?php
namespace ChatFlow\Integrations;

use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Submission;
use ChatFlow\Notifications\Planner;

final class Outbox {
	public function __construct( private Scheduler $scheduler = new Scheduler() ) {}

	/**
	 * Caller owns transaction.
	 * @return list<int>
	 */
	public function enqueue( Submission $submission, Form $form, string $event, int $revision = 0 ): array {
		if ( 'submission.partial' === $event && $revision < 1 ) {
			throw new \InvalidArgumentException( 'Partial delivery requires a revision.' );
		}
		$payload = Payload::build( $submission, $form, $event );
		$plans   = ( new Planner() )->plan( $submission, $form, $event );
		if ( 'submission.completed' === $event ) {
			$plans[] = array(
				'channel' => 'async',
				'id'      => 'completed',
				'delay'   => 0,
			);
		}
		foreach ( $form->settings()['integrations']['webhooks'] ?? array() as $webhook ) {
			if ( ! empty( $webhook['enabled'] ) && in_array( substr( $event, 11 ), $webhook['events'], true ) ) {
				$plans[] = array(
					'channel' => 'webhook',
					'id'      => $webhook['id'],
					'delay'   => 0,
				);
			}
		}
		$ids = array();
		foreach ( $plans as $plan ) {
			$ids[] = $this->insert( $submission->id(), $form->version(), $event, $plan['channel'], $plan['id'], $payload, $revision, $plan['delay'] );
		}
		return $ids;
	}

	/** @param array<string,mixed> $payload */
	public function insert( int $submission_id, int $version, string $event, string $channel, string $destination, array $payload, int|string $identity, int $delay = 0 ): int {
		global $wpdb;
		$hash   = hash( 'sha256', implode( '|', array( get_current_blog_id(), $submission_id, $version, $event, $channel, $destination, $identity ) ) );
		$now    = gmdate( 'Y-m-d H:i:s' );
		$result = $wpdb->query(
			$wpdb->prepare(
				"INSERT INTO {$wpdb->prefix}cff_deliveries (submission_id,form_version,event,channel,destination_id,dedupe_hash,payload,next_attempt_at,created_at,updated_at) VALUES (%d,%d,%s,%s,%s,%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
				$submission_id,
				$version,
				$event,
				$channel,
				$destination,
				$hash,
				Payload::bytes( $payload ),
				gmdate( 'Y-m-d H:i:s', time() + max( 0, $delay ) ),
				$now,
				$now
			)
		);
		if ( false === $result || ! $wpdb->insert_id ) {
			throw new \RuntimeException( 'Unable to persist delivery.' );
		}
		return (int) $wpdb->insert_id;
	}

	/** @param list<int> $ids */
	public function schedule( array $ids ): void {
		global $wpdb;
		foreach ( $ids as $id ) {
			$row = $this->get( (int) $id );
			if ( ! $row || 'pending' !== $row['status'] ) {
				continue;
			}
			try {
				$action_id = $this->scheduler->schedule( (int) $id, strtotime( $row['next_attempt_at'] . ' UTC' ) );
				if ( $action_id ) {
					$wpdb->update( $wpdb->prefix . 'cff_deliveries', array( 'action_id' => $action_id ), array( 'id' => $id ), array( '%d' ), array( '%d' ) );
				}
			} catch ( \Throwable $error ) {
				Activity::record( (int) $row['submission_id'], 'schedule_failed', (int) $id );
			}
		}
	}

	/** @return array<string,mixed>|null */
	public function get( int $id ): ?array {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_deliveries WHERE id=%d", $id ), ARRAY_A );
		return is_array( $row ) ? $row : null;
	}

	/** @return array<string,mixed>|null */
	public function claim( int $id ): ?array {
		global $wpdb;
		$now   = gmdate( 'Y-m-d H:i:s' );
		$count = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->prefix}cff_deliveries SET status='processing',attempts=attempts+1,updated_at=%s,next_attempt_at=%s WHERE id=%d AND status='pending' AND attempts<3 AND next_attempt_at<=%s",
				$now,
				gmdate( 'Y-m-d H:i:s', time() + 900 ),
				$id,
				$now
			)
		);
		return 1 === $count ? $this->get( $id ) : null;
	}

	/** @param array<string,mixed> $row */
	public function finish( array $row, string $outcome ): void {
		global $wpdb;
		$attempt = (int) $row['attempts'];
		$status  = 'sent' === $outcome || 'cancelled' === $outcome ? $outcome : ( $attempt < 3 ? 'pending' : 'failed' );
		$next    = gmdate( 'Y-m-d H:i:s', time() + ( 1 === $attempt ? 60 : 300 ) );
		$count   = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->prefix}cff_deliveries SET status=%s,last_error=%s,next_attempt_at=%s,updated_at=%s,action_id=NULL WHERE id=%d AND status='processing' AND attempts=%d",
				$status,
				'sent' === $outcome ? '' : sanitize_key( $outcome ),
				$next,
				gmdate( 'Y-m-d H:i:s' ),
				$row['id'],
				$attempt
			)
		);
		if ( 1 === $count ) {
			Activity::record( (int) $row['submission_id'], $row['channel'] . '_' . $outcome, (int) $row['id'], $attempt );
		}
		if ( 1 === $count && 'pending' === $status ) {
			$this->schedule( array( (int) $row['id'] ) );
		}
	}

	public function recover(): void {
		global $wpdb;
		$expired_tests = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=0 AND event='notification.test' AND created_at<%s ORDER BY id LIMIT 100", gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ) ) );
		foreach ( $expired_tests as $id ) {
			$this->scheduler->cancel( (int) $id );
			$wpdb->delete(
				$wpdb->prefix . 'cff_deliveries',
				array(
					'id'            => (int) $id,
					'submission_id' => 0,
				)
			);
		}
		$now   = gmdate( 'Y-m-d H:i:s' );
		$stale = $wpdb->get_results( $wpdb->prepare( "SELECT id,submission_id,attempts FROM {$wpdb->prefix}cff_deliveries WHERE status='processing' AND next_attempt_at<=%s ORDER BY id LIMIT 100", $now ), ARRAY_A );
		foreach ( $stale as $row ) {
			$count = $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}cff_deliveries SET status=%s,last_error='worker_interrupted',action_id=NULL,updated_at=%s WHERE id=%d AND status='processing' AND next_attempt_at<=%s", (int) $row['attempts'] < 3 ? 'pending' : 'failed', $now, $row['id'], $now ) );
			if ( 1 === $count ) {
				Activity::record( (int) $row['submission_id'], 'worker_interrupted', (int) $row['id'], (int) $row['attempts'] );
			}
		}
		$ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_deliveries WHERE status='pending' AND attempts<3 AND next_attempt_at<=%s ORDER BY next_attempt_at,id LIMIT 100", gmdate( 'Y-m-d H:i:s', time() + 300 ) ) );
		$this->schedule( array_map( 'intval', $ids ) );
	}

	public function retry( int $id, int $submission_id ): bool {
		global $wpdb;
		$count = $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}cff_deliveries SET status='pending',attempts=0,last_error='',action_id=NULL,next_attempt_at=%s,updated_at=%s WHERE id=%d AND submission_id=%d AND status IN ('sent','failed')", gmdate( 'Y-m-d H:i:s' ), gmdate( 'Y-m-d H:i:s' ), $id, $submission_id ) );
		if ( 1 !== $count ) {
			return false;
		}
		Activity::record( $submission_id, 'manual_retry', $id );
		$this->schedule( array( $id ) );
		return true;
	}
}
