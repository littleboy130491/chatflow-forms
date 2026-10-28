<?php
namespace ChatFlow\Submissions;

use ChatFlow\Forms\FormRepository;

final class Repository {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}

	public function get( int $id ): ?Submission {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_submissions WHERE id=%d", $id ), ARRAY_A );
		return $row ? new Submission( $row, $this->forms->getVersion( (int) $row['form_id'], (int) $row['form_version'] ) ) : null;
	}

	/**
	 * @param array<string,mixed> $filters
	 * @return array{items:list<Submission>,total:int} */
	public function find( array $filters, int $page = 1, int $per_page = 20 ): array {
		global $wpdb;
		$where    = $this->where( $filters );
		$per_page = max( 1, min( 1000, $per_page ) );
		$sorts    = array(
			'id'        => 's.id',
			'createdAt' => 's.created_at',
			'status'    => 's.status',
		);
		$sort     = is_string( $filters['sort'] ?? null ) ? ( $sorts[ $filters['sort'] ] ?? 's.created_at' ) : 's.created_at';
		$order    = 'asc' === strtolower( is_string( $filters['order'] ?? null ) ? $filters['order'] : 'desc' ) ? 'ASC' : 'DESC';
		$limit    = (int) $per_page;
		$offset   = ( max( 1, $page ) - 1 ) * $limit;
		// The WHERE clause already contains prepared values (and LIKE wildcards). Re-running
		// the whole statement through prepare() would treat those wildcards as placeholders
		// and can return an empty query. The only remaining variables are bounded integers.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $where is prepared by where(); $sort/$order are fixed whitelist values; $limit/$offset are integers.
		$rows = $wpdb->get_results( "SELECT s.* FROM {$wpdb->prefix}cff_submissions s WHERE {$where} ORDER BY {$sort} {$order},s.id {$order} LIMIT {$limit} OFFSET {$offset}", ARRAY_A );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
		$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_submissions s WHERE {$where}" );
		return array(
			'items' => array_map( fn( $row ) => new Submission( $row, $this->forms->getVersion( (int) $row['form_id'], (int) $row['form_version'] ) ), is_array( $rows ) ? $rows : array() ),
			'total' => $total,
		);
	}

	/**
	 * @param array<string,mixed> $filters */
	public function where( array $filters ): string {
		global $wpdb;
		$allowed = array( 'formId', 'status', 'from', 'to', 'search', 'isRead', 'isStarred', 'utmSource', 'utmCampaign', 'device', 'fieldKey', 'operator', 'value', 'sort', 'order', 'ids', 'afterId', 'beforeId', 'before', 'maxId', 'olderThanDays' );
		if ( array_diff( array_keys( $filters ), $allowed ) ) {
			throw new \InvalidArgumentException( 'Unknown filter.' ); }
		$where = array( '1=1' );
		if ( isset( $filters['maxId'] ) ) {
			$where[] = $wpdb->prepare( 's.id<=%d', $filters['maxId'] ); }
		if ( isset( $filters['before'] ) ) {
			$where[] = $wpdb->prepare( 's.created_at<%s', $filters['before'] ); }
		foreach ( array(
			'formId'   => 'form_id',
			'afterId'  => 'id',
			'beforeId' => 'id',
		) as $key => $column ) {
			if ( isset( $filters[ $key ] ) ) {
				if ( ! is_numeric( $filters[ $key ] ) || (int) $filters[ $key ] < 0 ) {
					throw new \InvalidArgumentException( 'Invalid identifier.' ); }
				$op = 'afterId' === $key ? '>' : ( 'beforeId' === $key ? '<=' : '=' );
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
				$where[] = $wpdb->prepare( "s.{$column}{$op}%d", $filters[ $key ] );
			}
		}
		$statuses = $filters['status'] ?? array( 'partial', 'completed', 'abandoned', 'spam' );
		$statuses = is_array( $statuses ) ? $statuses : array( $statuses );
		if ( ! $statuses || array_diff( $statuses, array( 'partial', 'completed', 'abandoned', 'spam', 'trash' ) ) ) {
			throw new \InvalidArgumentException( 'Invalid status.' ); }
		$where[] = 's.status IN (' . implode( ',', array_map( fn( $s ) => $wpdb->prepare( '%s', $s ), $statuses ) ) . ')';
		foreach ( array(
			'from' => '>=',
			'to'   => '<=',
		) as $key => $op ) {
			if ( isset( $filters[ $key ] ) ) {
				$value = $filters[ $key ];
				if ( ! is_string( $value ) || ! preg_match( '/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)?$/D', $value ) || false === strtotime( $value . ( 10 === strlen( $value ) ? ' UTC' : '' ) ) ) {
					throw new \InvalidArgumentException( 'Invalid date.' ); }
				// strtotime normalizes impossible dates and 24:00 into a different day.
				$parsed = date_parse( $value );
				if ( $parsed['warning_count'] || $parsed['error_count'] ) {
					throw new \InvalidArgumentException( 'Invalid date.' ); }
				if ( 10 === strlen( $value ) ) {
					// A calendar day means the site's day (Settings → General → Timezone), the same
					// days the admin sees in the inbox; stored timestamps are UTC.
					$local = new \DateTimeImmutable( $value . ( 'to' === $key ? ' 23:59:59' : ' 00:00:00' ), wp_timezone() );
					$date  = $local->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
				} else {
					$date = gmdate( 'Y-m-d H:i:s', strtotime( $value ) );
				}
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
				$where[] = $wpdb->prepare( "s.created_at{$op}%s", $date );
			}
		}
		foreach ( array(
			'isRead'    => 'is_read',
			'isStarred' => 'is_starred',
		) as $key => $column ) {
			if ( isset( $filters[ $key ] ) ) {
				$value = filter_var( $filters[ $key ], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
				if ( null === $value ) {
					throw new \InvalidArgumentException( 'Invalid boolean.' ); }
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
				$where[] = $wpdb->prepare( "s.{$column}=%d", $value ? 1 : 0 );
			}
		}
		foreach ( array(
			'utmSource'   => 'utm_source',
			'utmCampaign' => 'utm_campaign',
			'device'      => 'device_type',
		) as $key => $column ) {
			if ( isset( $filters[ $key ] ) ) {
				if ( ! is_string( $filters[ $key ] ) || strlen( $filters[ $key ] ) > 255 ) {
					throw new \InvalidArgumentException( 'Invalid metadata filter.' ); }
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
				$where[] = $wpdb->prepare( "s.{$column}=%s", $filters[ $key ] );
			}
		}
		if ( isset( $filters['search'] ) && '' !== $filters['search'] ) {
			if ( ! is_string( $filters['search'] ) || strlen( $filters['search'] ) > 255 ) {
				throw new \InvalidArgumentException( 'Invalid search.' ); }
			$like    = '%' . $wpdb->esc_like( $filters['search'] ) . '%';
			$where[] = $wpdb->prepare( "(EXISTS (SELECT 1 FROM {$wpdb->prefix}cff_submission_values v WHERE v.submission_id=s.id AND v.value_text LIKE %s) OR INET6_NTOA(s.ip) LIKE %s)", $like, $like );
		}
		if ( isset( $filters['ids'] ) ) {
			if ( ! is_array( $filters['ids'] ) || ! $filters['ids'] || count( $filters['ids'] ) > 5000 || array_filter( $filters['ids'], fn( $id ) => ! is_int( $id ) || $id < 1 ) ) {
				throw new \InvalidArgumentException( 'Invalid selection.' ); }
			$where[] = 's.id IN (' . implode( ',', array_map( 'intval', $filters['ids'] ) ) . ')';
		}
		if ( isset( $filters['fieldKey'] ) ) {
			if ( ! is_string( $filters['fieldKey'] ) || ! preg_match( '/^[a-z][a-z0-9_]{0,63}$/D', $filters['fieldKey'] ) ) {
				throw new \InvalidArgumentException( 'Invalid field.' ); }
			$op    = $filters['operator'] ?? 'eq';
			$value = $filters['value'] ?? '';
			if ( ! is_scalar( $value ) || strlen( (string) $value ) > 10000 ) {
				throw new \InvalidArgumentException( 'Invalid answer filter.' ); }
			$condition = match ( $op ) {
				'eq' => $wpdb->prepare( 'v.value_text=%s', $value ),
				'neq' => $wpdb->prepare( 'v.value_text<>%s', $value ),
				'contains' => $wpdb->prepare( 'v.value_text LIKE %s', '%' . $wpdb->esc_like( (string) $value ) . '%' ),
				'not_contains' => $wpdb->prepare( 'v.value_text NOT LIKE %s', '%' . $wpdb->esc_like( (string) $value ) . '%' ),
				'starts_with' => $wpdb->prepare( 'v.value_text LIKE %s', $wpdb->esc_like( (string) $value ) . '%' ),
				'is_empty' => "(v.value_text='' OR v.value_text IS NULL)",
				'is_not_empty' => "(v.value_text<>'' AND v.value_text IS NOT NULL)",
				'gt', 'gte', 'lt', 'lte' => $this->numericFilter( $op, $value ),
				default => throw new \InvalidArgumentException( 'Unsupported filter operator.' ),
			};
			$exists  = $wpdb->prepare( "SELECT 1 FROM {$wpdb->prefix}cff_submission_values v WHERE v.submission_id=s.id AND v.field_key=%s", $filters['fieldKey'] );
			$where[] = 'is_empty' === $op ? "(NOT EXISTS ({$exists}) OR EXISTS ({$exists} AND {$condition}))" : "EXISTS ({$exists} AND {$condition})";
		}
		return implode( ' AND ', $where );
	}

	private function numericFilter( string $op, mixed $value ): string {
		global $wpdb;
		if ( ! is_numeric( $value ) ) {
			throw new \InvalidArgumentException( 'Numeric value required.' ); }
		$symbol = array(
			'gt'  => '>',
			'gte' => '>=',
			'lt'  => '<',
			'lte' => '<=',
		)[ $op ];
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
		return $wpdb->prepare( "v.value_num{$symbol}%f", (float) $value );
	}

	/** Internal transactional write; caller supplies replay-normalized data.
	 * @param array<string,mixed> $data */
	public function savePartial( array $data ): Submission {
		global $wpdb;
		$now  = Database::now();
		$data = array_merge(
			array(
				'uuid'       => wp_generate_uuid4(),
				'status'     => 'partial',
				'answers'    => array(),
				'variables'  => array(),
				'visited'    => array(),
				'consent'    => array(),
				'meta'       => array(),
				'started_at' => $now,
				'created_at' => $now,
				'updated_at' => $now,
			),
			$data
		);
		$id   = $this->write( null, $data );
		return $this->get( $id ) ?? throw new \RuntimeException( 'Submission missing.' );
	}

	/**
	 * @param array<string,mixed> $data */
	public function complete( int $id, array $data ): Submission {
		$this->write( $id, array_merge( $data, array( 'updated_at' => Database::now() ) ) );
		return $this->get( $id ) ?? throw new \RuntimeException( 'Submission missing.' );
	}

	/**
	 * @param array<string,mixed> $data */
	private function write( ?int $id, array $data ): int {
		global $wpdb;
		$form    = $this->forms->getVersion( (int) ( $data['form_id'] ?? $this->get( (int) $id )?->formId() ), (int) ( $data['form_version'] ?? $this->get( (int) $id )?->formVersion() ) );
		$answers = $data['answers'] ?? null;
		foreach ( array( 'answers', 'variables', 'visited', 'consent', 'meta', 'click_ids', 'step_timings', 'spam_reasons' ) as $key ) {
			if ( isset( $data[ $key ] ) && ! is_string( $data[ $key ] ) ) {
				$data[ $key ] = Database::json( $data[ $key ] ); }
		}
		Database::check( null === $id ? $wpdb->insert( $wpdb->prefix . 'cff_submissions', $data ) : $wpdb->update( $wpdb->prefix . 'cff_submissions', $data, array( 'id' => $id ) ) );
		$id ??= (int) $wpdb->insert_id;
		if ( null !== $answers && $form ) {
			Database::check( $wpdb->delete( $wpdb->prefix . 'cff_submission_values', array( 'submission_id' => $id ) ) );
			foreach ( $form->schema()['steps'] as $step ) {
				if ( ! array_key_exists( $step['key'], $answers ) ) {
					continue; }
				$value = $answers[ $step['key'] ];
				Database::check(
					$wpdb->insert(
						$wpdb->prefix . 'cff_submission_values',
						array(
							'submission_id' => $id,
							'field_id'      => $step['id'],
							'field_key'     => $step['key'],
							'value_text'    => is_scalar( $value ) ? ( is_bool( $value ) ? ( $value ? 'true' : 'false' ) : (string) $value ) : ( null === $value ? '' : Database::json( $value ) ),
							'value_num'     => is_int( $value ) || is_float( $value ) ? $value : null,
						)
					)
				);
			}
		}
		return $id;
	}

	/**
	 * @param array<string,mixed> $changes */
	public function update( int $id, array $changes ): ?Submission {
		global $wpdb;
		$result = Database::transaction(
			function () use ( $wpdb, $id, $changes ) {
				$wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_submissions WHERE id=%d FOR UPDATE", $id ) );
				if ( ! $this->get( $id ) ) {
					return null; }
				$data = array( 'updated_at' => Database::now() );
				foreach ( array(
					'isRead'    => 'is_read',
					'isStarred' => 'is_starred',
				) as $key => $column ) {
					if ( isset( $changes[ $key ] ) ) {
										$data[ $column ] = $changes[ $key ] ? 1 : 0; }
				}
				if ( isset( $changes['status'] ) && 'restore' === $changes['status'] ) {
					// Restore from trash/spam to the status implied by the row's own lifecycle timestamps.
					$row            = $wpdb->get_row( $wpdb->prepare( "SELECT completed_at,abandoned_at FROM {$wpdb->prefix}cff_submissions WHERE id=%d", $id ), ARRAY_A );
					$data['status'] = ! empty( $row['completed_at'] ) ? 'completed' : ( ! empty( $row['abandoned_at'] ) ? 'abandoned' : 'partial' );
				} elseif ( isset( $changes['status'] ) ) {
					$data['status'] = $changes['status']; }
				Database::check( $wpdb->update( $wpdb->prefix . 'cff_submissions', $data, array( 'id' => $id ) ) );
				if ( isset( $changes['note'] ) ) {
					Database::check(
						$wpdb->insert(
							$wpdb->prefix . 'cff_submission_notes',
							array(
								'submission_id' => $id,
								'user_id'       => get_current_user_id(),
								'type'          => 'note',
								'body'          => sanitize_textarea_field( $changes['note'] ),
								'created_at'    => Database::now(),
							)
						)
					);
				}
				if ( isset( $changes['status'] ) && in_array( $changes['status'], array( 'trash', 'spam' ), true ) ) {
					Database::check(
						$wpdb->update(
							$wpdb->prefix . 'cff_sessions',
							array(
								'status'    => 'closed',
								'closed_at' => Database::now(),
							),
							array( 'submission_id' => $id )
						)
					); }
				return $this->get( $id );
			}
		);
		if ( is_wp_error( $result ) ) {
			throw new \RuntimeException( 'Submission update failed.' ); }
		return $result;
	}

	public function delete( int $id ): bool {
		return $this->deleteInternal( $id, false ); }
	public function removeForRestart( int $id ): bool {
		return $this->deleteInternal( $id, true ); }
	private function deleteInternal( int $id, bool $preserve_session ): bool {
		global $wpdb;
		$result = Database::transaction(
			function () use ( $wpdb, $id, $preserve_session ) {
				$wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}cff_submissions WHERE id=%d FOR UPDATE", $id ) );
				$submission = $this->get( $id );
				if ( ! $submission ) {
					return false; }
				$form = $this->forms->getVersion( $submission->formId(), $submission->formVersion() );
				if ( $form ) {
					\ChatFlow\Integrations\HookDispatcher::action( 'cff_submission_deleted', array( $submission, $form ), $id ); }
				$sessions = $wpdb->get_results( $wpdb->prepare( "SELECT id,public_id,context FROM {$wpdb->prefix}cff_sessions WHERE submission_id=%d", $id ), ARRAY_A );
				foreach ( $sessions as $session ) {
					$context = Database::decode( $session['context'] );
					if ( ! empty( $context['_startScope'] ) ) {
						Database::check( $wpdb->delete( $wpdb->prefix . 'cff_requests', array( 'scope_hash' => $context['_startScope'] ) ) ); }
					Database::check( $wpdb->delete( $wpdb->prefix . 'cff_events', array( 'session_id' => $session['id'] ) ) );
					Database::check( $wpdb->delete( $wpdb->prefix . 'cff_magic_links', array( 'session_id' => $session['id'] ) ) );
					foreach ( array( 'patch', 'delete', 'submit' ) as $op ) {
						if ( $preserve_session && 'delete' === $op ) {
							continue; }
						Database::check( $wpdb->delete( $wpdb->prefix . 'cff_requests', array( 'scope_hash' => hash( 'sha256', get_current_blog_id() . ':session:' . $session['public_id'] . ':' . $op ) ) ) ); }
				}
				$files = new \ChatFlow\Privacy\PrivateFiles();
				$job   = $files->queueSubmission( $id );
				if ( $job ) {
					Database::afterCommit( fn() => $files->runCleanup( $job ) ); }
				if ( $preserve_session ) {
					Database::check(
						$wpdb->update(
							$wpdb->prefix . 'cff_sessions',
							array(
								'submission_id' => null,
								'context'       => Database::json( array( 'now' => gmdate( 'c' ) ) ),
							),
							array( 'submission_id' => $id )
						)
					); }
				foreach ( $preserve_session ? array( 'submission_values', 'submission_notes', 'deliveries', 'uploads' ) : array( 'submission_values', 'submission_notes', 'deliveries', 'uploads', 'sessions' ) as $table ) {
					Database::check( $wpdb->delete( $wpdb->prefix . 'cff_' . $table, array( 'submission_id' => $id ) ) ); }
				Database::check( $wpdb->delete( $wpdb->prefix . 'cff_submissions', array( 'id' => $id ) ) );
				return true;
			}
		);
		if ( is_wp_error( $result ) ) {
			throw new \RuntimeException( 'Submission deletion failed.' ); }
		return $result;
	}
}
