<?php
namespace ChatFlow\Privacy;

use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Integrations\HookDispatcher;

final class Purge {
	public function __construct( private Repository $submissions = new Repository() ) {}
	/** @return array<string,mixed>|\WP_Error
	 * @param array<string,mixed> $input
	 */
	public function criteria( array $input ): array|\WP_Error {
		if ( array_diff( array_keys( $input ), array( 'formId', 'status', 'from', 'to', 'olderThanDays' ) ) ) {
			return Database::error( 'cff_purge_invalid', 'Invalid purge criteria.', 422 ); }
		$result           = array();
		$result['status'] = array( 'completed', 'partial', 'abandoned', 'spam', 'trash' );
		if ( isset( $input['formId'] ) ) {
			if ( ! is_int( $input['formId'] ) || $input['formId'] < 1 ) {
				return Database::error( 'cff_purge_invalid', 'Invalid form.', 422 );
			} $result['formId'] = $input['formId']; }
		if ( isset( $input['status'] ) ) {
			if ( ! in_array( $input['status'], array( 'completed', 'partial', 'abandoned', 'spam', 'trash' ), true ) ) {
				return Database::error( 'cff_purge_invalid', 'Invalid status.', 422 );
			} $result['status'] = $input['status']; }
		foreach ( array( 'from', 'to' ) as $key ) {
			if ( isset( $input[ $key ] ) ) {
				$date = \DateTimeImmutable::createFromFormat( '!Y-m-d', (string) $input[ $key ] );
				if ( ! $date || $date->format( 'Y-m-d' ) !== $input[ $key ] ) {
					return Database::error( 'cff_purge_invalid', 'Invalid date.', 422 );
				} $result[ $key ] = $input[ $key ]; }
		}
		// Dates and the age shorthand are alternative bounds. Applying both silently
		// intersected a recent date range with "older than 360 days" and deleted nothing.
		$has_dates = isset( $result['from'] ) || isset( $result['to'] );
		if ( ! $has_dates ) {
			$days = $input['olderThanDays'] ?? 360;
			if ( ! is_int( $days ) || $days < 1 || $days > 36500 ) {
				return Database::error( 'cff_purge_invalid', 'Invalid age.', 422 ); }
			$result['olderThanDays'] = $days;
		}
		if ( isset( $result['from'], $result['to'] ) && $result['from'] > $result['to'] ) {
			return Database::error( 'cff_purge_invalid', 'Invalid date range.', 422 ); }
		ksort( $result );
		return $result;
	}
	/** @param array<string,mixed> $input
	 * @return array<string,mixed>|\WP_Error */
	public function preview( array $input ): array|\WP_Error {
		global $wpdb;
		$criteria = $this->criteria( $input );
		if ( is_wp_error( $criteria ) ) {
			return $criteria; }
		$bounds = $this->bounds( $criteria );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
		$where = $this->submissions->where( $bounds );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
		$count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_submissions s WHERE {$where}" );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
		$files = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_uploads WHERE submission_id IN (SELECT s.id FROM {$wpdb->prefix}cff_submissions s WHERE {$where})" );
		return array(
			'count'             => $count,
			'fileCount'         => $files,
			'confirmationToken' => Confirmation::issue(
				array(
					'userId'       => get_current_user_id(),
					'criteriaHash' => hash( 'sha256', Database::json( $criteria ) ),
					'before'       => $bounds['before'],
					'maxId'        => $bounds['maxId'],
				)
			),
		);
	}
	/** @param array<string,mixed> $input
	 * @return array<string,mixed>|\WP_Error */
	public function start( array $input, string $token, string $confirmation ): array|\WP_Error {
		$criteria = $this->criteria( $input );
		if ( is_wp_error( $criteria ) ) {
			return $criteria; }
		$verified = Confirmation::verify(
			$token,
			array(
				'userId'       => get_current_user_id(),
				'criteriaHash' => hash( 'sha256', Database::json( $criteria ) ),
			)
		);
		if ( 'DELETE' !== $confirmation || null === $verified ) {
			return Database::error( 'cff_purge_confirmation', 'Fresh matching preview and DELETE confirmation required.', 422 ); }
		$bounds = array_merge(
			$criteria,
			array(
				'before' => $verified['before'],
				'maxId'  => $verified['maxId'],
			)
		);
		return $this->queue( $bounds, $criteria, get_current_user_id() );
	}
	/**
	 * @param array<string,mixed> $bounds
	 * @param array<string,mixed> $criteria
	 * @return array<string,mixed>
	 */
	public function queue( array $bounds, array $criteria, int $user ): array {
		$id = wp_generate_uuid4();
		add_option(
			'cff_purge_' . $id,
			array(
				'id'        => $id,
				'status'    => 'queued',
				'criteria'  => $criteria,
				'filters'   => $bounds,
				'userId'    => $user,
				'deleted'   => 0,
				'createdAt' => time(),
			),
			'',
			false
		);
		Scheduler::enqueue( 'cff_purge_batch', array( $id ) );
		return array(
			'jobId'  => $id,
			'status' => 'queued',
		);
	}
	/**
	 * @param array<string,mixed> $criteria
	 * @return array<string,mixed>
	 */
	public function bounds( array $criteria ): array {
		global $wpdb;
		$criteria['before'] = isset( $criteria['olderThanDays'] ) ? gmdate( 'Y-m-d H:i:s', time() - $criteria['olderThanDays'] * DAY_IN_SECONDS ) : Database::now();
		$criteria['maxId']  = (int) $wpdb->get_var( "SELECT COALESCE(MAX(id),0) FROM {$wpdb->prefix}cff_submissions" );
		return $criteria;
	}
	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public function progress( string $id ): array|\WP_Error {
		$job = get_option( 'cff_purge_' . $id );
		if ( ! is_array( $job ) ) {
			return Database::error( 'cff_not_found', 'Purge job not found.', 404 ); }
		return array_intersect_key( $job, array_flip( array( 'id', 'status', 'deleted', 'createdAt' ) ) );
	}
	public function run( string $id ): void {
		global $wpdb;
		$lock = 'cff_purge_' . substr( hash( 'sha256', $wpdb->prefix . $id ), 0, 40 );
		if ( '1' !== (string) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s,0)', $lock ) ) ) {
			Scheduler::enqueue( 'cff_purge_batch', array( $id ), 30 );
			return; }
		try {
			$job = get_option( 'cff_purge_' . $id );
			if ( ! is_array( $job ) || ! in_array( $job['status'], array( 'queued', 'running' ), true ) ) {
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
				return; }
			$where = $this->submissions->where( $job['filters'] );
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
			$ids     = array_map( 'intval', $wpdb->get_col( "SELECT s.id FROM {$wpdb->prefix}cff_submissions s WHERE {$where} ORDER BY s.id LIMIT 500" ) );
			$deleted = array();
			foreach ( $ids as $submission ) {
				if ( $this->submissions->delete( $submission ) ) {
					$deleted[] = $submission; }
			}
			$job['deleted'] += count( $deleted );
			$job['status']   = count( $ids ) === 500 ? 'running' : 'completed';
			update_option( 'cff_purge_' . $id, $job, false );
			HookDispatcher::action( 'cff_submissions_purged', array( $deleted, $job['criteria'] ) );
			Database::check(
				$wpdb->insert(
					$wpdb->prefix . 'cff_audit_log',
					array(
						'event'          => 'submissions.purged',
						'user_id'        => $job['userId'],
						'criteria'       => Database::json( $job['criteria'] ),
						'affected_count' => count( $deleted ),
						'created_at'     => Database::now(),
					)
				)
			);
			if ( 'running' === $job['status'] ) {
				Scheduler::enqueue( 'cff_purge_batch', array( $id ), 1 ); }
		} catch ( \Throwable $error ) {
			if ( isset( $job ) && is_array( $job ) ) {
				$job['status'] = 'failed';
				update_option( 'cff_purge_' . $id, $job, false ); }
		} finally {
			$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock ) ); }
	}
}
