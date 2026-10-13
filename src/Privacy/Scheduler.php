<?php
namespace ChatFlow\Privacy;

final class Scheduler {
	public static function enqueue( string $hook, array $args = array(), int $delay = 0 ): void {
		if ( function_exists( 'as_schedule_single_action' ) ) {
			as_schedule_single_action( time() + $delay, $hook, $args, 'cff', true );
		} elseif ( ! wp_next_scheduled( $hook, $args ) ) {
			wp_schedule_single_event( time() + max( 1, $delay ), $hook, $args ); }
	}
}
