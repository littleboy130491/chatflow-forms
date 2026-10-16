<?php
namespace ChatFlow\Forms;

final class Statistics {
	/** @return array{completed:int,started:int,completionRate:float|int,lastSubmissionAt:?string} */
	public static function get( int $id ): array {
		global $wpdb;
		$summary   = $wpdb->get_row( $wpdb->prepare( "SELECT COUNT(*) AS completed,MAX(completed_at) AS latest FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND status='completed'", $id ), ARRAY_A );
		$started   = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_sessions WHERE form_id=%d", $id ) );
		$completed = (int) ( $summary['completed'] ?? 0 );
		$started   = max( $completed, $started );
		return array(
			'completed'        => $completed,
			'started'          => $started,
			'completionRate'   => $started ? round( 100 * $completed / $started, 1 ) : 0,
			'lastSubmissionAt' => $summary['latest'] ?? null,
		);
	}
}
