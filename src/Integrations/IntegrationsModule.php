<?php
namespace ChatFlow\Integrations;

use ChatFlow\Contracts\Module;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\Submission;
use ChatFlow\Notifications\Mailer;

final class IntegrationsModule implements Module {
	private Outbox $outbox;
	private Scheduler $scheduler;
	public function __construct( private FormRepository $forms ) {
		$this->scheduler = new Scheduler();
		$this->outbox    = new Outbox( $this->scheduler );
	}

	public function register(): void {
		add_action( 'cff_outbox_ready', array( $this->outbox, 'schedule' ) );
		add_action( 'cff_dispatch_delivery', array( $this, 'dispatch' ) );
		add_action( 'cff_recover_deliveries', array( $this->outbox, 'recover' ) );
		add_action( 'init', array( $this->scheduler, 'recovery' ), 20 );
		add_filter( 'cron_schedules', array( $this, 'cronSchedules' ) );
		add_action( 'cff_submission_deleted', array( $this, 'cancel' ), 1, 2 );
		add_action( 'cff_submissions_purged', array( $this, 'cancelIds' ), 1 );
	}

	/**
	 * @param array<string,array<string,mixed>> $schedules
	 * @return array<string,array<string,mixed>>
	 */
	public function cronSchedules( array $schedules ): array {
		$schedules['cff_five_minutes'] = array(
			'interval' => 300,
			'display'  => __( 'Every five minutes (ChatFlow)', 'chatflow-forms' ),
		);
		return $schedules;
	}

	public function cancel( Submission $submission, Form $form ): void {
		$this->cancelIds( array( $submission->id() ) );
	}

	/** @param list<int> $ids */
	public function cancelIds( array $ids ): void {
		global $wpdb;
		foreach ( $ids as $id ) {
			$delivery_ids = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_deliveries WHERE submission_id=%d", $id ) );
			$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}cff_deliveries SET status='cancelled',updated_at=%s WHERE submission_id=%d AND status IN ('pending','processing')", gmdate( 'Y-m-d H:i:s' ), $id ) );
			foreach ( $delivery_ids as $delivery_id ) {
				$this->scheduler->cancel( (int) $delivery_id );
			}
		}
	}

	public function dispatch( int $id ): void {
		$row = $this->outbox->claim( $id );
		if ( ! $row ) {
			return;
		}
		try {
			$outcome = $this->deliver( $row );
		} catch ( \Throwable $error ) {
			$outcome = 'worker_exception';
		}
		$this->outbox->finish( $row, $outcome );
	}

	/** @param array<string,mixed> $row */
	private function deliver( array $row ): string {
		$payload = json_decode( $row['payload'], true, 16, JSON_THROW_ON_ERROR );
		if ( ! is_array( $payload ) || ! isset( $payload['form']['id'] ) ) {
			return 'invalid_payload';
		}
		$form = $this->forms->getVersion( (int) $payload['form']['id'], (int) $row['form_version'] );
		if ( ! $form ) {
			return 'cancelled';
		}
		if ( \ChatFlow\Security\CookieSources::deniedKeys( $form->schema() ) ) {
			return 'cancelled';
		}
		$is_test = 'notification.test' === $row['event'] && 0 === (int) $row['submission_id'];
		$stored  = $is_test ? null : ( new Repository() )->get( (int) $row['submission_id'] );
		if ( ! $is_test && ( ! $stored || in_array( $stored->status(), array( 'trash', 'spam' ), true ) ) ) {
			return 'cancelled';
		}
		$data       = $stored ? $stored->storage() : array();
		$sample     = $is_test ? $payload['sample'] : $payload;
		$data       = array_merge(
			$data,
			array(
				'_cff_payload_frozen' => true,
				'id'                  => (int) $row['submission_id'],
				'uuid'                => $sample['submission']['uuid'],
				'form_id'             => $form->id(),
				'form_version'        => $form->version(),
				'status'              => $sample['submission']['status'],
				'answers'             => $sample['answers'],
				'meta'                => $sample['meta'],
				'ending_id'           => $sample['submission']['ending'] ?? '',
				'created_at'          => ( new \DateTimeImmutable( $sample['submission']['created_at'] ) )->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' ),
				'duration_ms'         => $sample['submission']['duration_ms'],
			)
		);
		$submission = new Submission( $data, $form );
		if ( 'async' === $row['channel'] && ! $is_test ) {
			return HookDispatcher::action( 'cff_submission_completed_async', array( $submission, $form ), $submission->id() ) ? 'sent' : 'hook_exception';
		}
		if ( 'connector' === $row['channel'] ) {
			foreach ( $form->settings()['integrations']['connectors'] ?? array() as $connector ) {
				if ( $connector['id'] === $row['destination_id'] ) {
					return $is_test ? 'cancelled' : Connectors\Connectors::deliver( $connector, $payload );
				}
			}
			return 'destination_missing';
		}
		$group = 'webhook' === $row['channel'] ? ( $form->settings()['integrations']['webhooks'] ?? array() ) : ( $form->settings()['notifications'][ 'admin_mail' === $row['channel'] ? 'admin' : 'autoresponders' ] ?? array() );
		foreach ( $group as $destination ) {
			if ( $destination['id'] !== $row['destination_id'] ) {
				continue;
			}
			if ( 'webhook' === $row['channel'] && ! $is_test ) {
				return ( new Webhook() )->send( $destination, $row['payload'], $row['event'], (int) $row['id'] );
			}
			if ( in_array( $row['channel'], array( 'admin_mail', 'autoresponder' ), true ) ) {
				return ( new Mailer() )->send( $destination, $submission, $form, 'admin_mail' === $row['channel'], $is_test ? $payload['recipient'] : null );
			}
		}
		return 'destination_missing';
	}
}
