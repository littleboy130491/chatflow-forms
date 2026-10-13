<?php
namespace ChatFlow\Tracking;

final class IpResolver {
	/** @param array<string,mixed> $server @param array<string,mixed> $settings */
	public function resolve( array $server, array $settings = array() ): string {
		$remote = is_string( $server['REMOTE_ADDR'] ?? null ) ? $server['REMOTE_ADDR'] : '';
		if ( ! filter_var( $remote, FILTER_VALIDATE_IP ) ) {
			return '';
		}
		$mode   = $settings['mode'] ?? 'automatic';
		$ranges = 'cloudflare' === $mode || 'automatic' === $mode ? self::cloudflareRanges() : ( $settings['trustedRanges'] ?? array() );
		if ( 'direct' === $mode || ! self::inRanges( $remote, $ranges ) ) {
			return $remote;
		}
		$header = 'custom' === $mode ? ( $settings['header'] ?? 'HTTP_X_FORWARDED_FOR' ) : 'HTTP_CF_CONNECTING_IP';
		$value  = $server[ $header ] ?? '';
		if ( ! is_string( $value ) || strlen( $value ) > 2048 ) {
			return $remote;
		}
		$chain = array_reverse( array_map( 'trim', explode( ',', $value ) ) );
		foreach ( $chain as $ip ) {
			if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
				return $remote;
			}
			if ( ! self::inRanges( $ip, $ranges ) ) {
				return $ip;
			}
		}
		return $remote;
	}

	/** @param list<string> $ranges */
	public static function inRanges( string $ip, array $ranges ): bool {
		$address = @inet_pton( $ip );
		if ( false === $address ) {
			return false;
		}
		foreach ( $ranges as $range ) {
			$parts   = explode( '/', $range );
			$network = @inet_pton( $parts[0] );
			$bits    = isset( $parts[1] ) ? (int) $parts[1] : strlen( $address ) * 8;
			if ( false === $network || strlen( $network ) !== strlen( $address ) || $bits < 0 || $bits > strlen( $address ) * 8 ) {
				continue;
			}
			$bytes = intdiv( $bits, 8 );
			if ( substr( $address, 0, $bytes ) === substr( $network, 0, $bytes ) && ( 0 === $bits % 8 || ( ord( $address[ $bytes ] ) & ( 255 << ( 8 - $bits % 8 ) ) ) === ( ord( $network[ $bytes ] ) & ( 255 << ( 8 - $bits % 8 ) ) ) ) ) {
				return true;
			}
		}
		return false;
	}

	public static function anonymize( string $ip ): string {
		$binary = @inet_pton( $ip );
		if ( false === $binary ) {
			return '';
		}
		$keep = 4 === strlen( $binary ) ? 3 : 6;
		return inet_ntop( substr( $binary, 0, $keep ) . str_repeat( "\0", strlen( $binary ) - $keep ) ) ?: '';
	}

	/** @return list<string> */
	public static function cloudflareRanges(): array {
		return array( '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22', '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32' );
	}
}
