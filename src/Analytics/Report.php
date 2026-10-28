<?php
namespace ChatFlow\Analytics;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Submissions\Database;

/** Aggregate reporting only. Individual answers, IP addresses and tokens never leave this service. */
final class Report {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}

	/** @return array<string,mixed> */
	public function run( int $form_id = 0, ?string $from = null, ?string $to = null ): array {
		global $wpdb;
		if ( $form_id < 0 ) {
			throw new \InvalidArgumentException( 'Invalid form ID.' ); }
		// Calendar days are the site's days (Settings → General → Timezone), like the inbox
		// and the per-form report; stored timestamps are UTC.
		$from          ??= wp_date( 'Y-m-d', strtotime( '-29 days' ) );
		$to            ??= wp_date( 'Y-m-d' );
		$range           = DateRange::bounds( (string) $from, (string) $to, wp_timezone() );
		$since           = $range['start'];
		$until           = $range['end'];
		$period          = $wpdb->prepare( 'created_at >= %s AND created_at < %s', $since, $until );
		$sessions_period = $wpdb->prepare( 'started_at >= %s AND started_at < %s', $since, $until );
		if ( $form_id ) {
			$period          .= $wpdb->prepare( ' AND form_id = %d', $form_id );
			$sessions_period .= $wpdb->prepare( ' AND form_id = %d', $form_id );
		}
		$period .= " AND status IN ('completed','partial','abandoned')";

		$view_period = $wpdb->prepare( 'day >= %s AND day <= %s AND metric = %s', $from, $to, 'view' );
		if ( $form_id ) {
			$view_period .= $wpdb->prepare( ' AND form_id = %d', $form_id );
		}
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared date/metric/form filters; trusted table prefix.
		$views = (int) $wpdb->get_var( "SELECT COALESCE(SUM(value),0) FROM {$wpdb->prefix}cff_stats_daily WHERE {$view_period}" );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared dates/form ID; table name is trusted WP prefix.
		$starts = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_sessions WHERE {$sessions_period}" );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared dates/form ID and fixed status whitelist.
		$statuses = $wpdb->get_results( "SELECT status,COUNT(*) AS total FROM {$wpdb->prefix}cff_submissions WHERE {$period} GROUP BY status", ARRAY_A );
		$counts   = array(
			'views'     => $views,
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
			// The same question across published versions is one row.
			$slot = $id . ':' . $step;
			if ( isset( $steps[ $slot ] ) ) {
				$steps[ $slot ]['count'] += (int) $row['total'];
				continue;
			}
			$steps[ $slot ] = array(
				'formId' => $id,
				'stepId' => $step,
				'label'  => $label,
				'count'  => (int) $row['total'],
			);
		}
		$steps = array_values( $steps );
		usort( $steps, static fn( array $a, array $b ): int => $b['count'] <=> $a['count'] );
		$series        = static function ( array $rows ): array {
			$result = array();
			foreach ( $rows as $row ) {
				$result[] = array(
					'label' => (string) $row['label'],
					'count' => (int) $row['total'],
				);
			}
			return $result;
		};
		$distributions = $this->distributions( $form_id, $since, $until );
		return array(
			'from'           => $from,
			'to'             => $to,
			'formId'         => $form_id,
			'timezone'       => wp_timezone_string(),
			'counts'         => $counts,
			'completionRate' => $starts ? round( 100 * $counts['completed'] / $starts, 1 ) : 0,
			'viewStartRate'  => $views >= $starts && $views > 0 ? round( 100 * $starts / $views, 1 ) : null,
			'avgDurationMs'  => null === $duration ? null : (int) round( (float) $duration ),
			'sources'        => $series( $sources ),
			'devices'        => $series( $devices ),
			'dropoffs'       => $steps,
			'answers'        => $distributions,
			'methodology'    => 'Views are anonymous form impressions recorded when inline forms initialize or launchers/popups open, not unique visitors. Draft previews and Do Not Track requests are excluded. Views are available only after tracking is deployed, not backfilled. View-to-start rate is omitted when historical starts exceed tracked views. Starts count sessions; completions and drop-offs count stored non-spam submissions. Configured choice and numeric score distributions use the current published form version and omit free-text answers.',
		);
	}

	/** Aggregate only configured choice values and bounded score options; never include free-text or Other responses.
	 * @return list<array<string,mixed>>
	 */
	private function distributions( int $form_id, string $since, string $until ): array {
		global $wpdb;
		$form = $form_id ? $this->forms->getPublished( $form_id ) : null;
		if ( ! $form ) {
			return array();
		}
		$results = array();
		foreach ( $form->schema()['steps'] as $step ) {
			if ( ! in_array( $step['type'], array( 'single_choice', 'rating', 'scale', 'nps' ), true ) || count( $results ) >= 10 ) {
				continue;
			}
			$allowed = array();
			if ( 'single_choice' === $step['type'] ) {
				foreach ( $step['options'] ?? array() as $option ) {
					if ( empty( $option['isOther'] ) ) {
						$allowed[ $option['value'] ] = $option['label'];
					}
				}
			} else {
				$minimum = 'nps' === $step['type'] ? 0 : 1;
				$maximum = 'rating' === $step['type'] ? 5 : 10;
				for ( $score = $minimum; $score <= $maximum; ++$score ) {
					$allowed[ (string) $score ] = (string) $score;
				}
			}
			if ( ! $allowed ) {
				continue;
			}
			$placeholders = implode( ',', array_fill( 0, count( $allowed ), '%s' ) );
			$params       = array_merge( array( $form_id, $form->version(), $since, $until, $step['key'] ), array_keys( $allowed ) );
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber -- Generated option placeholders and all values are prepared.
			$rows    = $wpdb->get_results( $wpdb->prepare( "SELECT v.value_text AS value,COUNT(*) AS total FROM {$wpdb->prefix}cff_submission_values v JOIN {$wpdb->prefix}cff_submissions s ON s.id=v.submission_id WHERE s.form_id=%d AND s.form_version=%d AND s.created_at >= %s AND s.created_at < %s AND s.status='completed' AND v.field_key=%s AND v.value_text IN ({$placeholders}) GROUP BY v.value_text", $params ), ARRAY_A );
			$choices = array();
			foreach ( $rows as $row ) {
				$choices[] = array(
					'label' => (string) $allowed[ $row['value'] ],
					'count' => (int) $row['total'],
				);
			}
			$results[] = array(
				'fieldKey' => $step['key'],
				'label'    => $step['label'],
				'options'  => $choices,
			);
		}
		return $results;
	}

	/** Per-form step funnel, experiment variants and distributions from anonymous events. */
	/** @return array<string,mixed>|\WP_Error */
	public function get( int $form_id, string $from, string $to ): array|\WP_Error {
		global $wpdb;
		$form = $this->forms->getDraft( $form_id );
		if ( ! $form ) {
			return Database::error( 'cff_not_found', 'Form not found.', 404 );
		}
		$range     = DateRange::bounds( $from, $to, wp_timezone() );
		$views     = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_events WHERE form_id=%d AND ts>=%s AND ts<%s AND event='view' AND step_id=''", $form_id, $range['start'], $range['end'] ) );
		$starts    = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_sessions WHERE form_id=%d AND started_at>=%s AND started_at<%s", $form_id, $range['start'], $range['end'] ) );
		$completed = $wpdb->get_row( $wpdb->prepare( "SELECT COUNT(*) AS total,COALESCE(AVG(duration_ms),0) AS duration FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND completed_at>=%s AND completed_at<%s AND status='completed'", $form_id, $range['start'], $range['end'] ), ARRAY_A );
		$events    = $wpdb->get_results( $wpdb->prepare( "SELECT step_id,event,COUNT(DISTINCT session_id) AS total FROM {$wpdb->prefix}cff_events WHERE form_id=%d AND ts>=%s AND ts<%s AND step_id<>'' GROUP BY step_id,event", $form_id, $range['start'], $range['end'] ), ARRAY_A );
		$counts    = array();
		foreach ( $events as $event ) {
			$counts[ $event['step_id'] ][ $event['event'] ] = (int) $event['total'];
		}
		$steps   = array();
		$choices = array();
		foreach ( $form->schema()['steps'] as $step ) {
			$c        = $counts[ $step['id'] ] ?? array();
			$viewed   = $c['view'] ?? 0;
			$answered = $c['answer'] ?? 0;
			// Hidden and calculated fields are never shown to visitors, so they have no funnel.
			$visible = ! in_array( $step['type'], array( 'hidden', 'calculated' ), true );
			$steps[] = ! $visible ? null : array(
				'id'      => $step['id'],
				'label'   => $step['label'],
				'views'   => $viewed,
				'answers' => $answered,
				'dropOff' => max( 0, $viewed - $answered ),
				'back'    => $c['back'] ?? 0,
				'abandon' => $c['abandon'] ?? 0,
			);
			if ( in_array( $step['type'], array( 'single_choice', 'multi_choice', 'yes_no' ), true ) ) {
				$options                 = 'yes_no' === $step['type'] ? array(
					array(
						'value' => 'true',
						'label' => __( 'Yes', 'chatflow-forms' ),
					),
					array(
						'value' => 'false',
						'label' => __( 'No', 'chatflow-forms' ),
					),
				) : ( $step['options'] ?? array() );
				$choices[ $step['key'] ] = array(
					'key'          => $step['key'],
					'label'        => $step['label'],
					'options'      => array_map(
						static fn( $option ) => array(
							'value' => $option['value'],
							'label' => $option['label'],
							'count' => 0,
						),
						$options
					),
					'unknownCount' => 0,
				);
			}
		}
		$cursor  = 0;
		$ceiling = (int) $wpdb->get_var( "SELECT COALESCE(MAX(id),0) FROM {$wpdb->prefix}cff_submissions" );
		do {
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id,answers FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND completed_at>=%s AND completed_at<%s AND status='completed' AND id>%d AND id<=%d ORDER BY id LIMIT 1000", $form_id, $range['start'], $range['end'], $cursor, $ceiling ), ARRAY_A );
			foreach ( $rows as $row ) {
				$answers = Database::decode( $row['answers'] );
				foreach ( $choices as $key => &$distribution ) {
					if ( array_key_exists( $key, $answers ) ) {
						$values = self::choiceValues( $answers[ $key ] );
						foreach ( $values as $value ) {
							$known = false;
							foreach ( $distribution['options'] as &$option ) {
								if ( $option['value'] === $value ) {
									++$option['count'];
									$known = true; }
							}
							unset( $option );
							if ( ! $known ) {
								++$distribution['unknownCount']; }
						}
					}
				}
				unset( $distribution );
				$cursor = (int) $row['id'];
			}
		} while ( 1000 === count( $rows ) && $choices );
		$sources       = $wpdb->get_results( $wpdb->prepare( "SELECT utm_source,referrer,COUNT(*) AS total FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND created_at>=%s AND created_at<%s AND status NOT IN ('spam','trash') GROUP BY utm_source,referrer", $form_id, $range['start'], $range['end'] ), ARRAY_A );
		$source_counts = array();
		foreach ( $sources as $source ) {
			$name                   = self::sourceLabel( $source['utm_source'], $source['referrer'] );
			$source_counts[ $name ] = ( $source_counts[ $name ] ?? 0 ) + (int) $source['total'];
		}
		arsort( $source_counts );
		$devices  = $wpdb->get_results( $wpdb->prepare( "SELECT device_type AS label,COUNT(*) AS count FROM {$wpdb->prefix}cff_submissions WHERE form_id=%d AND created_at>=%s AND created_at<%s AND status NOT IN ('spam','trash') GROUP BY device_type ORDER BY count DESC", $form_id, $range['start'], $range['end'] ), ARRAY_A );
		$variants = $wpdb->get_results( $wpdb->prepare( "SELECT s.variant_id AS id,COUNT(DISTINCT s.id) AS starts,COUNT(DISTINCT IF(t.status='completed' AND t.completed_at>=%s AND t.completed_at<%s,t.id,NULL)) AS completions FROM {$wpdb->prefix}cff_sessions s LEFT JOIN {$wpdb->prefix}cff_submissions t ON t.id=s.submission_id WHERE s.form_id=%d AND s.started_at>=%s AND s.started_at<%s GROUP BY s.variant_id ORDER BY starts DESC LIMIT 100", $range['start'], $range['end'], $form_id, $range['start'], $range['end'] ), ARRAY_A );
		return array(
			'formId'            => $form_id,
			'from'              => $from,
			'to'                => $to,
			'timezone'          => wp_timezone_string(),
			'views'             => $views,
			'starts'            => $starts,
			'completions'       => (int) $completed['total'],
			'completionRate'    => $starts ? round( 100 * (int) $completed['total'] / $starts, 2 ) : null,
			'averageDurationMs' => (int) round( (float) $completed['duration'] ),
			'steps'             => array_values( array_filter( $steps ) ),
			'distributions'     => array_values( $choices ),
			'sources'           => array_map(
				static fn( $name ) => array(
					'label' => $name,
					'count' => $source_counts[ $name ],
				),
				array_slice( array_keys( $source_counts ), 0, 100 )
			),
			'devices'           => array_map(
				static fn( $row ) => array(
					'label' => $row['label'] ? $row['label'] : __( 'Unknown', 'chatflow-forms' ),
					'count' => (int) $row['count'],
				),
				$devices
			),
			'variants'          => array_map(
				static fn( $row ) => array(
					'id'          => $row['id'],
					'starts'      => (int) $row['starts'],
					'completions' => (int) $row['completions'],
				),
				$variants
			),
		);
	}

	public static function sourceLabel( ?string $source, ?string $referrer ): string {
		$source = trim( $source ?? '' );
		if ( preg_match( '/^[\p{L}\p{N}][\p{L}\p{N}_. -]{0,99}$/uD', $source ) ) {
			return $source; }
		$host = wp_parse_url( $referrer ?? '', PHP_URL_HOST );
		return is_string( $host ) && preg_match( '/^[a-z0-9._\-\[\]:]{1,253}$/iD', $host ) ? strtolower( $host ) : __( 'Direct / unknown', 'chatflow-forms' );
	}

	/** @return list<string> */
	public static function choiceValues( mixed $answer ): array {
		if ( is_array( $answer ) && isset( $answer['value'] ) ) {
			$answer = $answer['value']; }
		$values = is_array( $answer ) ? $answer : array( $answer );
		return array_values( array_unique( array_map( static fn( $v ) => is_bool( $v ) ? ( $v ? 'true' : 'false' ) : (string) $v, array_filter( $values, 'is_scalar' ) ) ) );
	}
}
