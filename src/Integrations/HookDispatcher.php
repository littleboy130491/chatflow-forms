<?php
namespace ChatFlow\Integrations;

final class HookDispatcher {
	/** @param list<mixed> $args */
	public static function action( string $hook, array $args, int $submission_id = 0 ): bool {
		global $wp_filter, $wp_actions, $wp_current_filter;
		$wp_actions[ $hook ] = ( $wp_actions[ $hook ] ?? 0 ) + 1;
		$wp_current_filter[] = $hook;
		$ok                  = true;
		try {
			$callbacks = isset( $wp_filter[ $hook ] ) ? $wp_filter[ $hook ]->callbacks : array();
			ksort( $callbacks );
			foreach ( $callbacks as $priority ) {
				foreach ( $priority as $callback ) {
					try {
						call_user_func_array( $callback['function'], array_slice( $args, 0, $callback['accepted_args'] ) );
					} catch ( \Throwable $error ) {
						$ok = false;
						Activity::record( $submission_id, 'hook_exception' );
					}
				}
			}
		} finally {
			array_pop( $wp_current_filter );
		}
		return $ok;
	}

	/** @param list<mixed> $args */
	public static function filter( string $hook, mixed $value, array $args = array(), int $submission_id = 0 ): mixed {
		global $wp_filter, $wp_current_filter;
		$wp_current_filter[] = $hook;
		try {
			$callbacks = isset( $wp_filter[ $hook ] ) ? $wp_filter[ $hook ]->callbacks : array();
			ksort( $callbacks );
			foreach ( $callbacks as $priority ) {
				foreach ( $priority as $callback ) {
					try {
						$value = call_user_func_array( $callback['function'], array_slice( array_merge( array( $value ), $args ), 0, $callback['accepted_args'] ) );
					} catch ( \Throwable $error ) {
						Activity::record( $submission_id, 'filter_exception' );
					}
				}
			}
		} finally {
			array_pop( $wp_current_filter );
		}
		return $value;
	}
}
