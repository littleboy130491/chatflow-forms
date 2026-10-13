<?php
namespace ChatFlow\Analytics;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Submissions\Database;

final class Report {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}

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
			$steps[]  = array(
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
			'steps'             => $steps,
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
