<?php
namespace ChatFlow\Privacy;

final class PrivateFiles {
	public function root(): string {
		if ( ! defined( 'CFF_PRIVATE_DIR' ) || ! is_string( CFF_PRIVATE_DIR ) || ! str_starts_with( CFF_PRIVATE_DIR, '/' ) ) {
			throw new \RuntimeException( 'Configure CFF_PRIVATE_DIR outside the web root.' ); }
		$root = realpath( CFF_PRIVATE_DIR );
		if ( false === $root || ! is_dir( $root ) || is_link( CFF_PRIVATE_DIR ) || ! is_writable( $root ) ) {
			throw new \RuntimeException( 'Private storage unavailable.' ); }
		foreach ( array( ABSPATH, $_SERVER['DOCUMENT_ROOT'] ?? ABSPATH ) as $public ) {
			$public = realpath( $public );
			if ( $public && ( $root === $public || str_starts_with( $root . '/', rtrim( $public, '/' ) . '/' ) ) ) {
				throw new \RuntimeException( 'Private storage must be outside public roots.' ); }
		}
		return $root;
	}
	public function path( string $key ): string {
		if ( ! preg_match( '/^(?:export|upload)-[a-f0-9]{64}\.(?:csv|bin)$/D', $key ) ) {
			throw new \RuntimeException( 'Invalid owned storage key.' ); }
		$path = $this->root() . '/' . $key;
		if ( is_link( $path ) ) {
			throw new \RuntimeException( 'Symlink storage rejected.' ); }
		return $path;
	}
	public function remove( string $key ): void {
		if ( '' === $key ) {
			return; }
		$path = $this->path( $key );
		if ( file_exists( $path ) && ! unlink( $path ) ) {
			throw new \RuntimeException( 'Unable to remove private file.' ); }
	}
	public function queueSubmission( int $id ): string {
		global $wpdb;
		$keys = $wpdb->get_col( $wpdb->prepare( "SELECT storage_key FROM {$wpdb->prefix}cff_uploads WHERE submission_id=%d", $id ) );
		// Revoke every potentially containing export atomically, without file IO in the transaction.
		\ChatFlow\Submissions\Database::check( $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}cff_exports SET status='expired',download_hash='',expires_at=%s WHERE status<>'expired'", \ChatFlow\Submissions\Database::now() ) ) );
		$exports = $wpdb->get_results( "SELECT id,storage_key FROM {$wpdb->prefix}cff_exports WHERE status='expired' AND storage_key<>'' ORDER BY id LIMIT 500", ARRAY_A );
		foreach ( $exports as $export ) {
			$keys[] = $export['storage_key']; }
		if ( ! $keys ) {
			return ''; }
		$job = wp_generate_uuid4();
		\ChatFlow\Submissions\Database::check(
			$wpdb->insert(
				$wpdb->options,
				array(
					'option_name'  => 'cff_cleanup_' . $job,
					'option_value' => maybe_serialize(
						array(
							'submissionId' => $id,
							'keys'         => array_values( array_unique( $keys ) ),
							'exportIds'    => array_map( 'intval', array_column( $exports, 'id' ) ),
						)
					),
					'autoload'     => 'no',
				)
			)
		);
		return $job;
	}
	public function runCleanup( string $id ): void {
		global $wpdb;
		$job = get_option( 'cff_cleanup_' . $id );
		if ( ! is_array( $job ) ) {
			return; }
		try {
			foreach ( array_slice( $job['keys'], 0, 500 ) as $key ) {
				$this->remove( $key ); }
			$job['keys'] = array_slice( $job['keys'], 500 );
			if ( $job['keys'] ) {
				update_option( 'cff_cleanup_' . $id, $job, false );
				Scheduler::enqueue( 'cff_private_cleanup', array( $id ), 1 );
				return; }
			foreach ( $job['exportIds'] as $export ) {
				\ChatFlow\Submissions\Database::check(
					$wpdb->update(
						$wpdb->prefix . 'cff_exports',
						array( 'storage_key' => '' ),
						array(
							'id'     => $export,
							'status' => 'expired',
						)
					)
				); }
			delete_option( 'cff_cleanup_' . $id );
		} catch ( \Throwable $error ) {
			Scheduler::enqueue( 'cff_private_cleanup', array( $id ), 60 );
			throw $error; }
	}
	public function cleanupSite(): void {
		global $wpdb;
		$names = $wpdb->get_col( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE 'cff_cleanup_%'" );
		foreach ( $names as $name ) {
			$this->runCleanup( substr( $name, 12 ) ); }
		foreach ( array( 'uploads', 'exports' ) as $table ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
			$offset = 0;
			do {
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Values prepared by where()/prepare(); identifiers and operators use fixed local whitelists.
				$keys = $wpdb->get_col( $wpdb->prepare( "SELECT storage_key FROM {$wpdb->prefix}cff_{$table} ORDER BY id LIMIT 500 OFFSET %d", $offset ) );
				foreach ( $keys as $key ) {
					$this->remove( $key ); }
				$offset += 500;
			} while ( 500 === count( $keys ) );
		}
	}
}
