<?php
namespace ChatFlow\Submissions;

use ChatFlow\Privacy\PrivateFiles;
use ChatFlow\Vendor\OpenSpout\Common\Entity\Row;
use ChatFlow\Vendor\OpenSpout\Writer\XLSX\Options;
use ChatFlow\Vendor\OpenSpout\Writer\XLSX\Writer;

final class Xlsx {
	public static function available(): bool {
		return class_exists( Writer::class ) && class_exists( \ZipArchive::class ) && class_exists( \XMLReader::class );
	}

	public static function temporaryKey( string $key ): string {
		return substr( $key, 0, -4 ) . '.csv';
	}

	private static function workspace( string $key ): string {
		if ( ! preg_match( '/^export-[a-f0-9]{64}\.bin$/D', $key ) ) {
			throw new \RuntimeException( 'Invalid XLSX storage key.' ); }
		$path = ( new PrivateFiles() )->path( $key ) . '.work';
		if ( is_link( $path ) ) {
			throw new \RuntimeException( 'Symlink workspace rejected.' ); }
		return $path;
	}
	public static function cleanupWorkspace( string $key ): void {
		$path = self::workspace( $key );
		if ( ! is_dir( $path ) ) {
			return; }
		$iterator = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $path, \FilesystemIterator::SKIP_DOTS ), \RecursiveIteratorIterator::CHILD_FIRST );
		foreach ( $iterator as $file ) {
			$removed = $file->isDir() && ! $file->isLink() ? rmdir( $file->getPathname() ) : unlink( $file->getPathname() );
			if ( ! $removed ) {
				throw new \RuntimeException( 'Unable to clean XLSX workspace.' ); }
		}
		if ( ! rmdir( $path ) ) {
			throw new \RuntimeException( 'Unable to clean XLSX workspace.' ); }
	}

	public static function convert( string $key, string $delimiter ): void {
		if ( ! self::available() ) {
			throw new \RuntimeException( 'XLSX dependencies unavailable.' );
		}
		$files     = new PrivateFiles();
		$path      = $files->path( $key );
		$temp      = $files->path( self::temporaryKey( $key ) );
		$workspace = self::workspace( $key );
		$input     = fopen( $path, 'rb' );
		if ( ! $input ) {
			throw new \RuntimeException( 'Export unavailable.' ); }
		$writer = null;
		$mask   = umask( 0077 );
		try {
			self::cleanupWorkspace( $key );
			if ( ! mkdir( $workspace, 0700 ) ) {
				throw new \RuntimeException( 'XLSX workspace unavailable.' ); }
			$options = new Options();
			$options->setTempFolder( $workspace );
			$writer = new Writer( $options );
			$writer->openToFile( $temp );
			chmod( $temp, 0600 );
			fseek( $input, 3 );
			$values = fgetcsv( $input, 0, $delimiter, '"', '' );
			while ( false !== $values ) {
				$writer->addRow( Row::fromValues( array_map( static fn( $value ) => (string) $value, $values ) ) );
				$values = fgetcsv( $input, 0, $delimiter, '"', '' );
			}
			fclose( $input );
			$writer->close();
			if ( ! rename( $temp, $path ) ) {
				throw new \RuntimeException( 'Export conversion failed.' ); }
		} finally {
			if ( is_resource( $input ) ) {
				fclose( $input ); }
			try {
				if ( $writer ) {
					$writer->close(); }
			} finally {
				umask( $mask );
				$files->remove( self::temporaryKey( $key ) );
				self::cleanupWorkspace( $key ); }
		}
	}
}
