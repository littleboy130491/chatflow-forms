<?php
namespace ChatFlow\Analytics;

use ChatFlow\Forms\FormRepository;

/** Aggregate reporting only. Individual answers, IP addresses and tokens never leave this service. */
final class Report {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}

	/** @return array<string,mixed> */
	public function run( int $form_id = 0, ?string $from = null, ?string $to = null ): array {
		global $wpdb;
		if ( $form_id < 0 ) {
			throw new \InvalidArgumentException( 'Invalid form ID.' ); }
		$from ??= gmdate( 'Y-m-d', strtotime( '-29 days' ) );
		$to   ??= gmdate( 'Y-m-d' );
		$start = \DateTimeImmutable::createFromFormat( '!Y-m-d', $from, new \DateTimeZone( 'UTC' ) );
		$end   = \DateTimeImmutable::createFromFormat( '!Y-m-d', $to, new \DateTimeZone( 'UTC' ) );
		if ( ! $start || ! $end || $start->format( 'Y-m-d' ) !== $from || $end->format( 'Y-m-d' ) !== $to || $end < $start || $start->diff( $end )->days > 366 ) {
			throw new \InvalidArgumentException( 'Use a valid UTC date range of at most 366 days.' );
		}
		$until          = $end->modify( '+1 day' )->format( 'Y-m-d H:i:s' );
		$since          = $start->format( 'Y-m-d H:i:s' );
		$period         = $wpdb->prepare( 'created_at >= %s AND created_at < %s', $since, $until );
		$sessions_period = $wpdb->prepare( 'started_at >= %s AND started_at < %s', $since, $until );
		if ( $form_id ) {
			$period          .= $wpdb->prepare( ' AND form_id = %d', $form_id );
			$sessions_period .= $wpdb->prepare( ' AND form_id = %d', $form_id );
		}
		$period .= " AND status IN ('completed','partial','abandoned')";
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared dates/form ID; table name is trusted WP prefix.
		$starts = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_sessions WHERE {$sessions_period}" );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared dates/form ID and fixed status whitelist.
		$statuses = $wpdb->get_results( "SELECT status,COUNT(*) AS total FROM {$wpdb->prefix}cff_submissions WHERE {$period} GROUP BY status", ARRAY_A );
		$counts   = array(
			'starts'    => $starts,
			'completed' => 0,
			'partial'   => 0,
			'abandoned' => 0,
		);
		foreach ( $statuses as $row ) {
			$counts[ $row['status'] ] = (int) $row['total'];
		}
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared dates/form ID and fixed statuses.
		$duration = $wpdb->get_var( "SELECT AVG(duration_ms) FROM {$wpdb->prefix}cff_submissions WHERE {$period} AND status='completed'" );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- SQL expressions and filters are fixed and prepared.
		$sources = $wpdb->get_results( "SELECT COALESCE(NULLIF(utm_source,''),'Direct / unknown') AS label,COUNT(*) AS total FROM {$wpdb->prefix}cff_submissions WHERE {$period} GROUP BY label ORDER BY total DESC LIMIT 20", ARRAY_A );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- SQL expressions and filters are fixed and prepared.
		$devices = $wpdb->get_results( "SELECT COALESCE(NULLIF(device_type,''),'Unknown') AS label,COUNT(*) AS total FROM {$wpdb->prefix}cff_submissions WHERE {$period} GROUP BY label ORDER BY total DESC LIMIT 20", ARRAY_A );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared dates/form ID; fixed status whitelist.
		$dropoffs = $wpdb->get_results( "SELECT form_id,form_version,current_step_id,COUNT(*) AS total FROM {$wpdb->prefix}cff_submissions WHERE {$period} AND status IN ('partial','abandoned') AND current_step_id<>'' GROUP BY form_id,form_version,current_step_id ORDER BY total DESC LIMIT 30", ARRAY_A );
		$steps    = array();
		foreach ( $dropoffs as $row ) {
			$id    = (int) $row['form_id'];
			$step  = (string) $row['current_step_id'];
			$form  = $this->forms->getVersion( $id, (int) $row['form_version'] );
			$label = $step;
			foreach ( $form?->schema()['steps'] ?? array() as $candidate ) {
				if ( $candidate['id'] === $step ) {
					$label = (string) $candidate['label'];
					break;
				}
			}
			$steps[] = array(
				'formId' => $id,
				'stepId' => $step,
				'label'  => $label,
				'count'  => (int) $row['total'],
			);
		}
		$series = static function ( array $rows ): array {
			$result = array();
			foreach ( $rows as $row ) {
				$result[] = array(
					'label' => (string) $row['label'],
					'count' => (int) $row['total'],
				);
			}
			return $result;
		};
		return array(
			'from'           => $from,
			'to'             => $to,
			'formId'         => $form_id,
			'counts'         => $counts,
			'completionRate' => $starts ? round( 100 * $counts['completed'] / $starts, 1 ) : 0,
			'avgDurationMs'  => null === $duration ? null : (int) round( (float) $duration ),
			'sources'        => $series( $sources ),
			'devices'        => $series( $devices ),
			'dropoffs'       => $steps,
			'methodology'    => 'Starts count sessions; completions and drop-offs count stored non-spam submissions. Form views and answer distributions are not yet tracked.',
		);
	}
}
