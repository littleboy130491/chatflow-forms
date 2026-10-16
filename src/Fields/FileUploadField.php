<?php
namespace ChatFlow\Fields;

use ChatFlow\Logic\Values;

final class FileUploadField extends AbstractField {
	public function type(): string {
		return 'file_upload';
	}

	public function validate( mixed $value, array $step, array $context = array() ): array {
		$key   = $step['key'];
		$issue = static fn( $code ) => array( Values::issue( '/answers/' . Values::pointer( $key ), $code, 'Select an owned upload.', $key ) );
		if ( null === $value ) {
			return ( $step['required'] ?? false ) ? $issue( 'required' ) : array();
		}
		// This is only structural validation; the upload service must verify database ownership.
		return is_string( $value ) && preg_match( '/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/D', $value ) ? array() : $issue( 'type_mismatch' );
	}
}
