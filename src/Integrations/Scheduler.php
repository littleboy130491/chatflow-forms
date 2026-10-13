<?php
namespace ChatFlow\Integrations;

final class Scheduler {
	public function available(): bool {
		return function_exists( 'as_schedule_single_action' ) && did_action( 'action_scheduler_init' ) > 0;
	}
	public function schedule( int $id, int $timestamp ): int {
		$args = array( $id );
		if ( $this->available() ) {
			$existing = as_get_scheduled_actions(
				array(
					'hook'     => 'cff_dispatch_delivery',
					'args'     => $args,
					'group'    => 'cff',
					'status'   => 'pending',
					'per_page' => 1,
				),
				'ids'
			);
			if ( $existing ) {
				return 0;
			}
			// Pending-only dedupe allows retry while the previous action is executing.
			return as_schedule_single_action( max( time(), $timestamp ), 'cff_dispatch_delivery', $args, 'cff' );
		}
		if ( ! wp_next_scheduled( 'cff_dispatch_delivery', $args ) ) {
			wp_schedule_single_event( max( time(), $timestamp ), 'cff_dispatch_delivery', $args );
		}
		return 0;
	}
	public function recovery(): void {
		if ( $this->available() ) {
			if ( ! as_has_scheduled_action( 'cff_recover_deliveries', array(), 'cff' ) ) {
				as_schedule_recurring_action( time() + 60, 300, 'cff_recover_deliveries', array(), 'cff', true );
			}
		} elseif ( ! wp_next_scheduled( 'cff_recover_deliveries' ) ) {
			wp_schedule_event( time() + 60, 'cff_five_minutes', 'cff_recover_deliveries' );
		}
	}
	public function cancel( int $id ): void {
		if ( $this->available() ) {
			as_unschedule_all_actions( 'cff_dispatch_delivery', array( $id ), 'cff' );
		}
		wp_clear_scheduled_hook( 'cff_dispatch_delivery', array( $id ) );
	}
}
