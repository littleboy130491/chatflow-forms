<?php
namespace ChatFlow\Tracking;

final class IpResolver {
	/**
	 * @param array<string,mixed> $server
	 * @param array<string,mixed> $settings */
	public function resolve( array $server, array $settings = array() ): string {
		$remote = is_string( $server['REMOTE_ADDR'] ?? null ) ? $server['REMOTE_ADDR'] : '';
		if ( ! filter_var( $remote, FILTER_VALIDATE_IP ) ) {
			return '';
		}
		$mode = $settings['mode'] ?? 'automatic';
		if ( ! in_array( $mode, array( 'automatic', 'direct', 'cloudflare', 'custom' ), true ) ) {
			return $remote; }
		$ranges        = 'cloudflare' === $mode || 'automatic' === $mode ? self::cloudflareRanges() : ( $settings['trustedRanges'] ?? array() );
		$private       = array( '127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '::1/128', 'fc00::/7' );
		$private_proxy = 'automatic' === $mode && self::inRanges( $remote, $private );
		if ( $private_proxy ) {
			$ranges = $private; }
		if ( 'direct' === $mode || ! self::inRanges( $remote, $ranges ) ) {
			return $remote;
		}
		$header = 'custom' === $mode ? ( $settings['header'] ?? 'HTTP_X_FORWARDED_FOR' ) : 'HTTP_CF_CONNECTING_IP';
		if ( $private_proxy ) {
			$header = ! empty( $server['HTTP_X_FORWARDED_FOR'] ) ? 'HTTP_X_FORWARDED_FOR' : 'HTTP_X_REAL_IP'; }
		$value = $server[ $header ] ?? '';
		if ( ! is_string( $value ) || strlen( $value ) > 2048 ) {
			return $remote;
		}
		if ( 'HTTP_CF_CONNECTING_IP' === $header || 'HTTP_X_REAL_IP' === $header ) {
			return filter_var( $value, FILTER_VALIDATE_IP ) ? $value : $remote; }
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

	/**
	 * @param list<string> $ranges */
	public static function inRanges( string $ip, array $ranges ): bool {
		$address = filter_var( $ip, FILTER_VALIDATE_IP ) ? inet_pton( $ip ) : false;
		if ( false === $address ) {
			return false;
		}
		foreach ( $ranges as $range ) {
			$parts   = explode( '/', $range );
			$network = filter_var( $parts[0], FILTER_VALIDATE_IP ) ? inet_pton( $parts[0] ) : false;
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
		$binary = filter_var( $ip, FILTER_VALIDATE_IP ) ? inet_pton( $ip ) : false;
		if ( false === $binary ) {
			return '';
		}
		$keep  = 4 === strlen( $binary ) ? 3 : 6;
		$value = inet_ntop( substr( $binary, 0, $keep ) . str_repeat( "\0", strlen( $binary ) - $keep ) );
		return $value ? $value : '';
	}

	/**
	 * @return list<string> */
	public static function cloudflareRanges(): array {
		$stored = get_option( 'cff_cloudflare_ranges', array() );
		if ( is_array( $stored ) && CloudflareRanges::valid( $stored ) ) {
			return $stored; }
		return array( '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22', '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32' );
	}
}
