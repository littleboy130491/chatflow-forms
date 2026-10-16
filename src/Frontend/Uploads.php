<?php
namespace ChatFlow\Frontend;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Privacy\PrivateFiles;
use ChatFlow\Rest\UploadSession;
use ChatFlow\Spam\RateLimiter;
use ChatFlow\Submissions\Database;
use ChatFlow\Submissions\Idempotency;

final class Uploads {
	public const SAFE_MIMES = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain' );
	public function __construct( private PrivateFiles $files = new PrivateFiles() ) {}
	/** @param array<string,mixed> $step
	 * @return array{mime:string,bytes:int,name:string}|\WP_Error */
	public function inspect( string $path, string $name, array $step ): array|\WP_Error {
		if ( is_link( $path ) || ! is_file( $path ) ) {
			return Database::error( 'cff_upload_invalid', 'Invalid file.', 422 ); }
		$bytes = filesize( $path );
		$limit = min( 52428800, (int) ( $step['validation']['maxBytes'] ?? 10485760 ) );
		if ( false === $bytes || $bytes < 1 || $bytes > $limit ) {
			return Database::error( 'cff_upload_size', 'File exceeds the allowed size.', 422 ); }
		$mime    = ( new \finfo( FILEINFO_MIME_TYPE ) )->file( $path );
		$allowed = array_intersect( self::SAFE_MIMES, $step['validation']['mimeTypes'] ?? self::SAFE_MIMES );
		if ( ! is_string( $mime ) || ! in_array( $mime, $allowed, true ) ) {
			return Database::error( 'cff_upload_mime', 'File type is not permitted.', 422 ); }
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$types   = array(
			'jpg|jpeg|jpe' => 'image/jpeg',
			'png'          => 'image/png',
			'gif'          => 'image/gif',
			'webp'         => 'image/webp',
			'pdf'          => 'application/pdf',
			'txt'          => 'text/plain',
		);
		$checked = wp_check_filetype_and_ext( $path, $name, $types );
		if ( ! $checked['ext'] || $checked['type'] !== $mime ) {
			return Database::error( 'cff_upload_mime', 'File contents and extension must match.', 422 ); }
		return array(
			'mime'  => $mime,
			'bytes' => $bytes,
			'name'  => mb_substr( sanitize_file_name( $name ), 0, 200, 'UTF-8' ),
		);
	}
	/** @param array<string,mixed> $file
	 * @return array<string,mixed>|\WP_Error */
	public function receive( string $id, string $token, string $field_id, array $file, string $key ): array|\WP_Error {
		if ( ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) !== UPLOAD_ERR_OK || ! is_string( $file['tmp_name'] ?? null ) || ! is_uploaded_file( $file['tmp_name'] ) || ! is_string( $file['name'] ?? null ) ) {
			return Database::error( 'cff_upload_invalid', 'Select a valid uploaded file.', 422 ); }
		$owned_key = '';
		$result    = Database::transaction(
			function () use ( $id, $token, $field_id, $file, $key, &$owned_key ) {
				global $wpdb;
				$row = UploadSession::lock( $id, $token );
				if ( is_wp_error( $row ) ) {
					return $row; }
				$form = ( new FormRepository() )->getPublished( (int) $row['form_id'], (int) $row['form_version'] );
				$step = $this->field( $form, $field_id );
				if ( ! $step ) {
					return Database::error( 'cff_upload_field', 'Select a configured upload field.', 422 ); }
				$verified = $this->inspect( $file['tmp_name'], $file['name'], $step );
				if ( is_wp_error( $verified ) ) {
					return $verified; }
				$requests = new Idempotency();
				$guard    = $requests->begin(
					'session:' . $id . ':upload',
					$key,
					array(
						'fieldId' => $field_id,
						'hash'    => hash_file( 'sha256', $file['tmp_name'] ),
						'name'    => $verified['name'],
					)
				);
				if ( is_wp_error( $guard ) ) {
					return $guard; }
				if ( null !== $guard['response'] ) {
					return $guard['response']; }
				$ip = ( new \ChatFlow\Tracking\IpResolver() )->resolve( $_SERVER, \ChatFlow\Rest\Settings::get()['proxy'] );
				if ( ! ( new RateLimiter() )->consume( 'upload:' . $id, 20, 600 ) || ! ( new RateLimiter() )->consume( 'upload-ip:' . $ip, 30, 3600 ) ) {
					return Database::error( 'cff_rate_limit', 'Please wait before uploading again.', 429 ); }
				// Unattached uploads per form are budgeted per day so anonymous sessions cannot fill private storage.
				$pending = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COALESCE(SUM(u.bytes),0) FROM {$wpdb->prefix}cff_uploads u INNER JOIN {$wpdb->prefix}cff_sessions s ON s.id=u.session_id WHERE s.form_id=%d AND u.submission_id IS NULL AND u.created_at>%s", $row['form_id'], gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ) ) );
				if ( $pending + $verified['bytes'] > (int) apply_filters( 'cff_upload_daily_pending_bytes', 1073741824, (int) $row['form_id'] ) ) {
					return Database::error( 'cff_upload_limit', 'Uploads are temporarily unavailable for this form. Try again later.', 429 ); }
				$usage = $wpdb->get_row( $wpdb->prepare( "SELECT COUNT(*) AS files,COALESCE(SUM(bytes),0) AS bytes FROM {$wpdb->prefix}cff_uploads WHERE session_id=%d", $row['id'] ), ARRAY_A );
				if ( (int) $usage['files'] >= 10 || (int) $usage['bytes'] + $verified['bytes'] > 104857600 ) {
					return Database::error( 'cff_upload_limit', 'Session upload limit reached.', 429 ); }
				$candidate = 'upload-' . bin2hex( random_bytes( 32 ) ) . '.bin';
				$path      = $this->files->path( $candidate );
				$handle    = fopen( $path, 'x+b' );
				if ( false === $handle ) {
					throw new \RuntimeException( 'Private file creation failed.' ); }
				$owned_key = $candidate;
				try {
					if ( ! chmod( $path, 0600 ) ) {
						throw new \RuntimeException( 'Private file protection failed.' ); }
					$source = fopen( $file['tmp_name'], 'rb' );
					if ( false === $source ) {
						throw new \RuntimeException( 'Upload read failed.' ); }
					try {
						if ( stream_copy_to_stream( $source, $handle ) !== $verified['bytes'] ) {
							throw new \RuntimeException( 'Upload write failed.' );
						}
					} finally {
						fclose( $source ); }
				} finally {
					fclose( $handle ); }
				$uuid = wp_generate_uuid4();
				Database::check(
					$wpdb->insert(
						$wpdb->prefix . 'cff_uploads',
						array(
							'uuid'          => $uuid,
							'session_id'    => (int) $row['id'],
							'submission_id' => null,
							'field_id'      => $field_id,
							'storage_key'   => $owned_key,
							'original_name' => $verified['name'],
							'mime'          => $verified['mime'],
							'bytes'         => $verified['bytes'],
							'created_at'    => Database::now(),
							// Removed after a day unless a saved partial or submission claims it.
							'expires_at'    => min( $row['expires_at'], gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ) ),
						)
					)
				);
				$response = array(
					'uploadId' => $uuid,
					'name'     => $verified['name'],
					'mime'     => $verified['mime'],
					'bytes'    => $verified['bytes'],
				);
				$requests->finish( $guard['id'], $response );
				return $response;
			}
		);
		if ( is_wp_error( $result ) && $owned_key ) {
			try {
				$this->files->remove( $owned_key ); } catch ( \Throwable $error ) {
				/* Bounded cleanup retries orphan files during operator maintenance. */ }
		}
		return $result;
	}
	/** Must run under the session row lock for PATCH and submit, after canonical replay.
	 * @param array<string,mixed> $answers */
	public function validateAnswers( Form $form, int $session_id, array $answers ): ?\WP_Error {
		global $wpdb;
		foreach ( $form->schema()['steps'] as $step ) {
			$id = $answers[ $step['key'] ] ?? null;
			if ( 'file_upload' !== $step['type'] || null === $id ) {
				continue; }
			if ( ! is_string( $id ) ) {
				return Database::error( 'cff_upload_owner', 'Select an owned upload.', 422 ); }
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_uploads WHERE uuid=%s AND session_id=%d AND field_id=%s", $id, $session_id, $step['id'] ), ARRAY_A );
			if ( ! $row || $row['expires_at'] && strtotime( $row['expires_at'] . ' UTC' ) <= time() ) {
				return Database::error( 'cff_upload_owner', 'Select an owned upload.', 422 ); }
			$checked = $this->inspect( $this->files->path( $row['storage_key'] ), $row['original_name'], $step );
			if ( is_wp_error( $checked ) || $checked['bytes'] !== (int) $row['bytes'] || $checked['mime'] !== $row['mime'] ) {
				return Database::error( 'cff_upload_invalid', 'The selected upload is no longer valid.', 422 ); }
		}
		return null;
	}
	public function bindSubmission( int $session_id, int $submission_id ): void {
		global $wpdb;
		$session    = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_sessions WHERE id=%d", $session_id ), ARRAY_A );
		$submission = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}cff_submissions WHERE id=%d", $submission_id ), ARRAY_A );
		if ( ! $session || ! $submission || (int) $submission['form_id'] !== (int) $session['form_id'] || (int) $submission['form_version'] !== (int) $session['form_version'] || (int) $session['submission_id'] !== $submission_id ) {
			throw new \RuntimeException( 'Upload submission ownership mismatch.' ); }
		$form    = ( new FormRepository() )->getPublished( (int) $session['form_id'], (int) $session['form_version'] );
		$answers = Database::decode( $submission['answers'] );
		$rows    = $wpdb->get_results( $wpdb->prepare( "SELECT id,uuid,field_id FROM {$wpdb->prefix}cff_uploads WHERE session_id=%d", $session_id ), ARRAY_A );
		foreach ( $rows as $row ) {
			$field    = $this->field( $form, $row['field_id'] );
			$selected = $field && ( $answers[ $field['key'] ] ?? null ) === $row['uuid'];
			Database::check(
				$wpdb->update(
					$wpdb->prefix . 'cff_uploads',
					array(
						'submission_id' => $selected ? $submission_id : null,
						'expires_at'    => $selected ? null : $session['expires_at'],
					),
					array( 'id' => $row['id'] )
				)
			);
		}
	}
	/** @return array<string,mixed>|\WP_Error */
	public function download( string $uuid ): array|\WP_Error {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT u.* FROM {$wpdb->prefix}cff_uploads u INNER JOIN {$wpdb->prefix}cff_submissions s ON u.submission_id=s.id WHERE u.uuid=%s AND s.status<>'trash'", $uuid ), ARRAY_A );
		if ( ! $row ) {
			return Database::error( 'cff_upload_not_found', 'Upload not found.', 404 ); }
		$path = $this->files->path( $row['storage_key'] );
		if ( ! is_file( $path ) || filesize( $path ) !== (int) $row['bytes'] ) {
			return Database::error( 'cff_upload_not_found', 'Upload not found.', 404 ); }
		return array(
			'path'  => $path,
			'name'  => $row['original_name'],
			'bytes' => (int) $row['bytes'],
		);
	}
	public function cleanup(): void {
		global $wpdb;
		for ( $batch = 0; $batch < 100; $batch++ ) {
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id,storage_key FROM {$wpdb->prefix}cff_uploads WHERE submission_id IS NULL AND expires_at < %s ORDER BY id LIMIT 100", Database::now() ), ARRAY_A );
			foreach ( $rows as $row ) {
				$this->files->remove( $row['storage_key'] );
				Database::check( $wpdb->delete( $wpdb->prefix . 'cff_uploads', array( 'id' => $row['id'] ) ) ); }
			if ( count( $rows ) < 100 ) {
				break; }
		}
	}
	/** @return array<string,mixed>|null */
	private function field( ?Form $form, string $id ): ?array {
		foreach ( $form?->schema()['steps'] ?? array() as $step ) {
			if ( $step['id'] === $id && 'file_upload' === $step['type'] ) {
				return $step; }
		}
		return null;
	}
}
