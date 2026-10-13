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
	public function deleteSubmission( int $id ): void {
		global $wpdb;
		$keys = $wpdb->get_col( $wpdb->prepare( "SELECT storage_key FROM {$wpdb->prefix}cff_uploads WHERE submission_id=%d", $id ) );
		foreach ( $keys as $key ) {
			$this->remove( $key ); }
		// A generated export may contain this respondent: invalidate all owned site exports.
		$exports = $wpdb->get_results( "SELECT id,storage_key FROM {$wpdb->prefix}cff_exports WHERE status<>'expired'", ARRAY_A );
		foreach ( $exports as $export ) {
			$this->remove( $export['storage_key'] );
			\ChatFlow\Submissions\Database::check(
				$wpdb->update(
					$wpdb->prefix . 'cff_exports',
					array(
						'status'        => 'expired',
						'storage_key'   => '',
						'download_hash' => '',
					),
					array( 'id' => $export['id'] )
				)
			);
		}
	}
	public function cleanupSite(): void {
		global $wpdb;
		foreach ( array( 'uploads', 'exports' ) as $table ) {
			$offset = 0;
			do {
				$keys = $wpdb->get_col( $wpdb->prepare( "SELECT storage_key FROM {$wpdb->prefix}cff_{$table} ORDER BY id LIMIT 500 OFFSET %d", $offset ) );
				foreach ( $keys as $key ) {
					$this->remove( $key ); }
				$offset += 500;
			} while ( 500 === count( $keys ) );
		}
	}
}
