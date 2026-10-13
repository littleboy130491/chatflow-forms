<?php
namespace ChatFlow\Tracking;

final class CloudflareRanges {
	public function register(): void {
		add_filter( 'cron_schedules', array( $this, 'schedules' ) );
		add_action( 'init', array( $this, 'schedule' ) );
		add_action( 'cff_cloudflare_refresh', array( $this, 'refresh' ) );
	}
	/** @param array<string,mixed> $schedules
	 * @return array<string,mixed> */
	public function schedules( array $schedules ): array {
		$schedules['cff_weekly'] = array(
			'interval' => 604800,
			'display'  => __( 'ChatFlow weekly', 'chatflow-forms' ),
		);
		return $schedules; }
	public function schedule(): void {
		if ( ! wp_next_scheduled( 'cff_cloudflare_refresh' ) ) {
			wp_schedule_event( time() + 3600, 'cff_weekly', 'cff_cloudflare_refresh' ); } }
	public function refresh(): void {
		$ranges = array();
		foreach ( array( 'ips-v4', 'ips-v6' ) as $suffix ) {
			$response = wp_safe_remote_get(
				'https://www.cloudflare.com/' . $suffix . '/',
				array(
					'timeout'             => 10,
					'redirection'         => 0,
					'sslverify'           => true,
					'limit_response_size' => 8192,
				)
			);
			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				return; }
			$body = trim( wp_remote_retrieve_body( $response ) );
			if ( '' === $body ) {
				return; }
			$part = preg_split( '/\r?\n/', $body );
			if ( ! is_array( $part ) || count( $part ) < ( 'ips-v4' === $suffix ? 5 : 2 ) ) {
				return; }
			foreach ( $part as $range ) {
				if ( ( 'ips-v4' === $suffix ) === str_contains( $range, ':' ) ) {
					return; }
			}
			$ranges = array_merge( $ranges, $part );
		}
		if ( self::valid( $ranges ) ) {
			update_option( 'cff_cloudflare_ranges', array_values( array_unique( $ranges ) ), false ); }
	}
	/** @param array<mixed> $ranges */
	public static function valid( array $ranges ): bool {
		if ( count( $ranges ) < 7 || count( $ranges ) > 100 ) {
			return false; }
		$v4 = 0;
		$v6 = 0;
		foreach ( $ranges as $range ) {
			if ( ! is_string( $range ) || ! preg_match( '/^([a-fA-F0-9:.]+)\/(\d{1,3})$/D', $range, $match ) || ! filter_var( $match[1], FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
				return false; }
			$ipv6 = str_contains( $match[1], ':' );
			$bits = (int) $match[2];
			if ( $bits < ( $ipv6 ? 28 : 12 ) || $bits > ( $ipv6 ? 128 : 32 ) ) {
				return false; }
			$ipv6 ? ++$v6 : ++$v4;
		}
		return $v4 >= 5 && $v6 >= 2;
	}
}
