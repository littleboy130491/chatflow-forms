<?php
namespace ChatFlow\Support;

final class Assets {
	/** @var array<string, string> Per-request memo; packaged files do not change within one request. */
	private static array $versions = array();

	/** Content version for trusted, internal packaged asset paths only. */
	public static function version( string $file ): string {
		if ( isset( self::$versions[ $file ] ) ) {
			return self::$versions[ $file ];
		}
		if ( ! is_file( $file ) || ! is_readable( $file ) ) {
			return CFF_VERSION;
		}
		// A deployment can replace a file between the checks and the read.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Missing assets fall back without exposing filesystem paths.
		$hash = @hash_file( 'sha256', $file );
		if ( false === $hash ) {
			return CFF_VERSION;
		}
		self::$versions[ $file ] = substr( $hash, 0, 16 );
		return self::$versions[ $file ];
	}

	/** Forget memoised versions, e.g. after files were replaced in a long-running process. */
	public static function reset(): void {
		self::$versions = array();
	}
}
