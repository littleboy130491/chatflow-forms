<?php
namespace ChatFlow\Support;

final class Assets {
	/** Content version for trusted, internal packaged asset paths only. */
	public static function version( string $file ): string {
		if ( ! is_file( $file ) || ! is_readable( $file ) ) {
			return CFF_VERSION;
		}
		// A deployment can replace a file between the checks and the read.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Missing assets fall back without exposing filesystem paths.
		$hash = @hash_file( 'sha256', $file );
		return false === $hash ? CFF_VERSION : substr( $hash, 0, 16 );
	}
}
