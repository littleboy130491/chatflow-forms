<?php
namespace ChatFlow\Integrations;

final class Webhook {
	/** @param array<string,mixed> $settings */
	public function send( array $settings, string $bytes, string $event, int $delivery_id ): string {
		$url   = (string) ( $settings['url'] ?? '' );
		$parts = wp_parse_url( $url );
		if ( ! is_array( $parts ) || 'https' !== ( $parts['scheme'] ?? '' ) || empty( $parts['host'] ) || isset( $parts['user'] ) || isset( $parts['pass'] ) || isset( $parts['fragment'] ) || ( isset( $parts['port'] ) && 443 !== $parts['port'] ) || preg_match( '/[\x00-\x20\x7f\\\\]/', $url ) ) {
			return 'webhook_unsafe_url';
		}
		$host      = strtolower( $parts['host'] );
		$addresses = $this->resolve( $host );
		if ( ! $addresses || ! wp_http_validate_url( $url ) ) {
			return 'webhook_unsafe_host';
		}
		foreach ( $addresses as $ip ) {
			if ( ! self::publicIp( $ip ) ) {
				return 'webhook_unsafe_host';
			}
		}
		if ( ! extension_loaded( 'curl' ) || ! class_exists( '\WpOrg\Requests\Transport\Curl' ) ) {
			return 'webhook_secure_transport_unavailable';
		}
		$secret = $settings['secret'] ?? '';
		if ( ! is_string( $secret ) || strlen( $secret ) < 16 ) {
			return 'webhook_secret_required';
		}
		$headers = array();
		foreach ( (array) ( $settings['headers'] ?? array() ) as $key => $value ) {
			if ( ! is_string( $value ) || preg_match( '/[\r\n\x00]/', $value ) || ! preg_match( '/^(?:Authorization|X-[A-Za-z0-9-]+)$/i', (string) $key ) || str_starts_with( strtolower( (string) $key ), 'x-cff-' ) || preg_match( '/^x-(?:forwarded|real-ip|http-method|original|rewrite)/i', (string) $key ) ) {
				return 'webhook_unsafe_headers';
			}
			$headers[ $key ] = $value;
		}
		$headers['Content-Type']    = 'application/json; charset=utf-8';
		$headers['X-CFF-Event']     = $event;
		$headers['X-CFF-Delivery']  = (string) $delivery_id;
		$headers['X-CFF-Signature'] = 'sha256=' . hash_hmac( 'sha256', $bytes, $secret );
		$pinned                     = false;
		$transport                  = static function ( &$request_url, &$request_headers, &$data, &$type, &$options ) use ( $url ): void {
			if ( $request_url === $url ) {
				$options['transport']        = '\WpOrg\Requests\Transport\Curl';
				$options['proxy']            = false;
				$options['follow_redirects'] = false;
			}
		};
		$pin                        = static function ( $handle, $args, $request_url ) use ( $url, $host, $addresses, &$pinned ): void {
			if ( $request_url !== $url ) {
				return;
			}
			$ip = $addresses[0];
			$ip = str_contains( $ip, ':' ) ? '[' . $ip . ']' : $ip;
			curl_setopt( $handle, CURLOPT_RESOLVE, array( $host . ':443:' . $ip ) );
			curl_setopt( $handle, CURLOPT_PROXY, '' );
			curl_setopt( $handle, CURLOPT_FOLLOWLOCATION, false );
			curl_setopt( $handle, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS );
			$pinned = true;
		};
		add_action( 'requests-requests.before_request', $transport, PHP_INT_MAX, 5 );
		add_action( 'http_api_curl', $pin, PHP_INT_MAX, 3 );
		try {
			$response = wp_safe_remote_post(
				$url,
				array(
					'headers'             => $headers,
					'body'                => $bytes,
					'timeout'             => 10,
					'redirection'         => 0,
					'sslverify'           => true,
					'reject_unsafe_urls'  => true,
					'limit_response_size' => 1024,
					'data_format'         => 'body',
				)
			);
		} catch ( \Throwable $error ) {
			return 'webhook_transport_error';
		} finally {
			remove_action( 'http_api_curl', $pin, PHP_INT_MAX );
			remove_action( 'requests-requests.before_request', $transport, PHP_INT_MAX );
		}
		// pre_http_request mocks may bypass the transport; never claim delivery then.
		if ( ! $pinned && ! is_wp_error( $response ) ) {
			return 'webhook_secure_transport_unavailable';
		}
		if ( is_wp_error( $response ) ) {
			return 'webhook_transport_error';
		}
		$code = wp_remote_retrieve_response_code( $response );
		return $code >= 200 && $code < 300 ? 'sent' : 'webhook_http_' . (int) $code;
	}

	/** @return list<string> */
	private function resolve( string $host ): array {
		$host = trim( $host, '[]' );
		if ( filter_var( $host, FILTER_VALIDATE_IP ) ) {
			return array( $host );
		}
		if ( ! preg_match( '/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/', $host ) || ! str_contains( $host, '.' ) || preg_match( '/\.(?:local|localhost|internal|test|invalid)$/', $host ) ) {
			return array();
		}
		$records = dns_get_record( $host, DNS_A | DNS_AAAA );
		$ips     = array();
		foreach ( false === $records ? array() : $records as $record ) {
			if ( isset( $record['ip'] ) ) {
				$ips[] = $record['ip'];
			}
			if ( isset( $record['ipv6'] ) ) {
				$ips[] = $record['ipv6'];
			}
		}
		return array_values( array_unique( $ips ) );
	}

	public static function publicIp( string $ip ): bool {
		if ( ! filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
			return false;
		}
		$packed = inet_pton( $ip );
		if ( false === $packed ) {
			return false;
		}
		if ( 4 === strlen( $packed ) ) {
			$first  = ord( $packed[0] );
			$second = ord( $packed[1] );
			$third  = ord( $packed[2] );
			return $first < 224
				&& ! ( 100 === $first && $second >= 64 && $second <= 127 )
				&& ! ( 192 === $first && 0 === $second && in_array( $third, array( 0, 2 ), true ) )
				&& ! ( 192 === $first && 88 === $second && 99 === $third )
				&& ! ( 198 === $first && ( in_array( $second, array( 18, 19 ), true ) || ( 51 === $second && 100 === $third ) ) )
				&& ! ( 203 === $first && 0 === $second && 113 === $third );
		}
		// Only globally routed unicast; excludes mapped IPv4, NAT64 and local scopes.
		return ( ord( $packed[0] ) & 0xe0 ) === 0x20
			&& ! ( 0x20 === ord( $packed[0] ) && 0x02 === ord( $packed[1] ) )
			&& ! ( 0x20 === ord( $packed[0] ) && 0x01 === ord( $packed[1] ) && ord( $packed[2] ) < 2 )
			&& ! str_starts_with( strtolower( $ip ), '2001:db8:' );
	}
}
