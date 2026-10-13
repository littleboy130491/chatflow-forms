<?php
namespace ChatFlow\Privacy;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Repository;
use ChatFlow\Submissions\Submission;

final class Export {
	public function __construct( private FormRepository $forms = new FormRepository(), private Repository $submissions = new Repository() ) {}
	/**
	 * @param array<string,mixed> $options
	 * @return array<string,mixed>|\WP_Error
	 */
	public function create( array $options ): array|\WP_Error {
		global $wpdb;
		if ( array_diff( array_keys( $options ), array( 'formId', 'filters', 'ids', 'columns', 'headerStyle', 'delimiter', 'format' ) ) || ! is_int( $options['formId'] ?? null ) || 'csv' !== ( $options['format'] ?? 'csv' ) || ! in_array( $options['delimiter'] ?? ',', array( ',', ';' ), true ) || ! in_array( $options['headerStyle'] ?? 'labels', array( 'labels', 'keys' ), true ) || ! is_array( $options['filters'] ?? array() ) || ! is_array( $options['columns'] ?? array() ) ) {
			return Database::error( 'cff_export_invalid', 'Invalid CSV options.', 422 ); }
		$form = $this->forms->getDraft( $options['formId'] );
		if ( ! $form ) {
			return Database::error( 'cff_not_found', 'Form not found.', 404 ); }
		$filters           = $options['filters'] ?? array();
		$filters['formId'] = $form->id();
		if ( isset( $options['ids'] ) ) {
			$filters['ids'] = $options['ids']; }
		try {
			$this->submissions->where( $filters );
			$filters['beforeId'] = (int) $wpdb->get_var( "SELECT COALESCE(MAX(id),0) FROM {$wpdb->prefix}cff_submissions" );
			$count               = $this->submissions->find( $filters, 1, 1 )['total'];
			$columns             = array(
				'id'        => 'ID',
				'uuid'      => 'UUID',
				'createdAt' => 'Date',
				'status'    => 'Status',
				'ending'    => 'Ending',
			);
			foreach ( $form->schema()['steps'] as $step ) {
				if ( ! in_array( $step['type'], array( 'statement', 'summary', 'media' ), true ) ) {
					$columns[ $step['key'] ] = $step['label']; }
			}
			$where = $this->submissions->where( $filters );
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
			$historic = $wpdb->get_col( "SELECT DISTINCT v.field_key FROM {$wpdb->prefix}cff_submission_values v JOIN {$wpdb->prefix}cff_submissions s ON s.id=v.submission_id WHERE {$where} ORDER BY v.field_key" );
			foreach ( $historic as $key ) {
				$columns[ $key ] ??= $key; }
			foreach ( array( 'ip', 'browser', 'os', 'device_type', 'page_url', 'referrer', 'landing_page', 'landing_referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid', 'ttclid', 'locale', 'timezone', 'duration_ms' ) as $key ) {
				$columns[ 'meta.' . $key ] = 'Tracking: ' . $key; }
			$requested = $options['columns'] ?? array();
			if ( $requested ) {
				if ( count( $requested ) > 1000 || array_filter( $requested, fn( $key ) => ! is_string( $key ) || ! isset( $columns[ $key ] ) ) ) {
					return Database::error( 'cff_export_invalid', 'Unknown export column.', 422 ); }
				$columns = array_replace( array_flip( $requested ), array_intersect_key( $columns, array_flip( $requested ) ) );
			}
			$storage = 'export-' . bin2hex( random_bytes( 32 ) ) . '.csv';
			$path    = ( new PrivateFiles() )->path( $storage );
			$handle  = fopen( $path, 'x+b' );
			if ( false === $handle ) {
				throw new \RuntimeException( 'Private export creation failed.' ); }
			chmod( $path, 0600 );
			fwrite( $handle, "\xEF\xBB\xBF" );
			fputcsv( $handle, array_map( array( self::class, 'cell' ), ( $options['headerStyle'] ?? 'labels' ) === 'keys' ? array_keys( $columns ) : array_values( $columns ) ), $options['delimiter'] ?? ',', '"', '' );
			fclose( $handle );
			$criteria = array(
				'filters'   => $filters,
				'columns'   => $columns,
				'delimiter' => $options['delimiter'] ?? ',',
				'total'     => $count,
				'offset'    => filesize( $path ),
			);
			Database::check(
				$wpdb->insert(
					$wpdb->prefix . 'cff_exports',
					array(
						'uuid'        => wp_generate_uuid4(),
						'user_id'     => get_current_user_id(),
						'form_id'     => $form->id(),
						'status'      => 'queued',
						'criteria'    => Database::json( $criteria ),
						'storage_key' => $storage,
						'created_at'  => Database::now(),
						'expires_at'  => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
					)
				)
			);
			$id = (int) $wpdb->insert_id;
			if ( $count <= 5000 ) {
				do {
					$this->run( $id, false );
					$row = $this->row( $id );
				} while ( 'running' === $row['status'] ); } else {
				Scheduler::enqueue( 'cff_export_batch', array( $id ) ); }
				return $this->progress( $id );
		} catch ( \Throwable $error ) {
			if ( isset( $storage ) ) {
				try {
					( new PrivateFiles() )->remove( $storage );
				} catch ( \Throwable $ignored ) {
				}
			} return Database::error( 'cff_export_storage', 'Export unavailable. Configure writable CFF_PRIVATE_DIR outside the web root.', 503 ); }
	}
	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public function progress( int $id ): array|\WP_Error {
		$row = $this->row( $id );
		if ( ! $row || (int) $row['user_id'] !== get_current_user_id() ) {
			return Database::error( 'cff_not_found', 'Owned export not found.', 404 ); }
		if ( strtotime( $row['expires_at'] . ' UTC' ) <= time() ) {
			$row['status'] = 'expired'; }
		$result = array(
			'exportId'  => $id,
			'status'    => $row['status'],
			'rowCount'  => (int) $row['row_count'],
			'expiresAt' => gmdate( 'c', strtotime( $row['expires_at'] . ' UTC' ) ),
		);
		if ( 'ready' === $row['status'] ) {
			$result['downloadUrl'] = $this->downloadUrl( $row ); }
		return $result;
	}
	public function run( int $id, bool $schedule = true ): void {
		global $wpdb;
		$lock = 'cff_export_' . substr( hash( 'sha256', $wpdb->prefix . $id ), 0, 40 );
		if ( '1' !== (string) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s,0)', $lock ) ) ) {
			Scheduler::enqueue( 'cff_export_batch', array( $id ), 30 );
			return; }
		try {
			$row = $this->row( $id );
			if ( ! $row || ! in_array( $row['status'], array( 'queued', 'running' ), true ) ) {
				return; }
			if ( strtotime( $row['expires_at'] . ' UTC' ) <= time() ) {
				throw new \RuntimeException( 'Expired export.' ); }
			$criteria           = Database::decode( $row['criteria'] );
			$filters            = $criteria['filters'];
			$filters['afterId'] = (int) $row['cursor_id'];
			$filters['sort']    = 'id';
			$filters['order']   = 'asc';
			$items              = $this->submissions->find( $filters, 1, 1000 )['items'];
			$handle             = fopen( ( new PrivateFiles() )->path( $row['storage_key'] ), 'r+b' );
			if ( false === $handle ) {
				throw new \RuntimeException( 'Export file unavailable.' ); }
			// Truncate uncommitted trailing bytes after an interrupted worker.
			ftruncate( $handle, $criteria['offset'] );
			fseek( $handle, $criteria['offset'] );
			foreach ( $items as $submission ) {
				$values = array_map( fn( $key ) => self::cell( $this->value( $submission, $key ) ), array_keys( $criteria['columns'] ) );
				if ( false === fputcsv( $handle, $values, $criteria['delimiter'], '"', '' ) ) {
					throw new \RuntimeException( 'Export write failed.' ); }
				$row['cursor_id'] = $submission->id();
			}
			$criteria['offset'] = ftell( $handle );
			fflush( $handle );
			fclose( $handle );
			$status = count( $items ) === 1000 ? 'running' : 'ready';
			Database::check(
				$wpdb->update(
					$wpdb->prefix . 'cff_exports',
					array(
						'cursor_id'     => $row['cursor_id'],
						'row_count'     => (int) $row['row_count'] + count( $items ),
						'criteria'      => Database::json( $criteria ),
						'status'        => $status,
						'download_hash' => hash( 'sha256', $this->ticket( $row ) ),
					),
					array( 'id' => $id )
				)
			);
			if ( $schedule && 'running' === $status ) {
				Scheduler::enqueue( 'cff_export_batch', array( $id ), 1 ); }
			if ( $schedule && 'ready' === $status ) {
				$user = get_userdata( (int) $row['user_id'] );
				if ( $user && user_can( $user, 'cff_export_submissions' ) ) {
					wp_mail( $user->user_email, __( 'ChatFlow CSV export ready', 'chatflow-forms' ), __( 'Your private export is ready. Open ChatFlow Submissions to download it within 24 hours.', 'chatflow-forms' ) ); }
			}
		} catch ( \Throwable $error ) {
			$wpdb->update( $wpdb->prefix . 'cff_exports', array( 'status' => 'failed' ), array( 'id' => $id ) ); } finally {
			$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock ) ); }
	}
	public function download(): void {
		$id     = absint( $_GET['exportId'] ?? 0 );
		$ticket = isset( $_GET['ticket'] ) && is_string( $_GET['ticket'] ) ? wp_unslash( $_GET['ticket'] ) : '';
		$nonce  = isset( $_GET['_wpnonce'] ) && is_string( $_GET['_wpnonce'] ) ? wp_unslash( $_GET['_wpnonce'] ) : '';
		if ( ! is_user_logged_in() || ! current_user_can( 'cff_export_submissions' ) || ! wp_verify_nonce( $nonce, 'cff_export_' . $id ) ) {
			wp_die( esc_html__( 'Forbidden export download.', 'chatflow-forms' ), '', array( 'response' => 403 ) ); }
		$row = $this->row( $id );
		if ( ! $row || (int) $row['user_id'] !== get_current_user_id() || 'ready' !== $row['status'] || strtotime( $row['expires_at'] . ' UTC' ) <= time() || ! hash_equals( $row['download_hash'], hash( 'sha256', $ticket ) ) ) {
			wp_die( esc_html__( 'Export unavailable or expired.', 'chatflow-forms' ), '', array( 'response' => 404 ) ); }
		try {
			$path = ( new PrivateFiles() )->path( $row['storage_key'] );
			if ( ! is_file( $path ) ) {
				throw new \RuntimeException();
			}
		} catch ( \Throwable $error ) {
			wp_die( esc_html__( 'Private storage unavailable.', 'chatflow-forms' ), '', array( 'response' => 503 ) ); }
		nocache_headers();
		header( 'Cache-Control: private,no-store' );
		header( 'Content-Type: text/csv; charset=UTF-8' );
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Content-Disposition: attachment; filename="chatflow-' . $id . '.csv"' );
		header( 'Content-Length: ' . filesize( $path ) );
		readfile( $path );
		exit;
	}
	public function expire(): void {
		global $wpdb;
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id,storage_key FROM {$wpdb->prefix}cff_exports WHERE expires_at<=%s AND status<>'expired' LIMIT 100", Database::now() ), ARRAY_A );
		foreach ( $rows as $row ) {
			( new PrivateFiles() )->remove( $row['storage_key'] );
			Database::check(
				$wpdb->update(
					$wpdb->prefix . 'cff_exports',
					array(
						'status'        => 'expired',
						'storage_key'   => '',
						'download_hash' => '',
					),
					array( 'id' => $row['id'] )
				)
			); }
	}
	/**
	 * @return array<string,mixed>|null
	 */
	private function row( int $id ): ?array {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_exports WHERE id=%d", $id ), ARRAY_A ); }
	/**
	 * @param array<string,mixed> $row
	 */
	private function ticket( array $row ): string {
		return hash_hmac( 'sha256', 'cff-export:' . get_current_blog_id() . ':' . $row['id'] . ':' . $row['user_id'] . ':' . $row['expires_at'], wp_salt( 'auth' ) ); }
	/**
	 * @param array<string,mixed> $row
	 */
	private function downloadUrl( array $row ): string {
		return add_query_arg(
			array(
				'action'   => 'cff_download',
				'exportId' => $row['id'],
				'ticket'   => $this->ticket( $row ),
				'_wpnonce' => wp_create_nonce( 'cff_export_' . $row['id'] ),
			),
			admin_url( 'admin-post.php' )
		); }
	private function value( Submission $submission, string $key ): mixed {
		if ( str_starts_with( $key, 'meta.' ) ) {
			$meta = $submission->meta();
			$key  = substr( $key, 5 );
			if ( str_starts_with( $key, 'utm_' ) ) {
				return $meta['utm'][ substr( $key, 4 ) ] ?? '';
			} return $meta[ $key ] ?? $meta['click_ids'][ $key ] ?? ''; }
		return match ( $key ) {
			'id' => $submission->id(), 'uuid' => $submission->uuid(), 'createdAt' => $submission->createdAt(), 'status' => $submission->status(), 'ending' => $submission->endingId(), default => $submission->answers()[ $key ] ?? '' };
	}
	public static function cell( mixed $value ): string {
		$value = is_array( $value ) || is_object( $value ) ? Database::json( $value ) : ( is_bool( $value ) ? ( $value ? 'true' : 'false' ) : (string) $value );
		return preg_match( '/^[\x00-\x20]*[=+@-]/', $value ) ? "'" . $value : $value;
	}
}
