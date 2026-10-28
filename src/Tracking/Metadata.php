<?php
namespace ChatFlow\Tracking;

use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Database;

final class Metadata {
	/**
	 * @param array<string,mixed> $input
	 * @return array<string,mixed>|\WP_Error */
	public function validate( array $input ): array|\WP_Error {
		$allowed = array( 'pageUrl', 'pageTitle', 'referrer', 'landingPage', 'landingReferrer', 'utm', 'clickIds', 'urlParams', 'locale', 'timezone', 'screen', 'stepTimings' );
		if ( array_diff( array_keys( $input ), $allowed ) ) {
			return Database::error( 'cff_invalid_meta', 'Unknown client metadata.', 422 );
		}
		$result = array();
		if ( isset( $input['pageTitle'] ) ) {
			if ( ! is_string( $input['pageTitle'] ) || strlen( $input['pageTitle'] ) > 500 ) {
				return Database::error( 'cff_invalid_meta', 'Invalid page title.', 422 );
			} $result['page_title'] = sanitize_text_field( $input['pageTitle'] ); }
		foreach ( array(
			'pageUrl'         => 'page_url',
			'referrer'        => 'referrer',
			'landingPage'     => 'landing_page',
			'landingReferrer' => 'landing_referrer',
		) as $key => $column ) {
			if ( isset( $input[ $key ] ) ) {
				$value = $input[ $key ];
				if ( ! is_string( $value ) || strlen( $value ) > 2000 || ( '' !== $value && ! self::url( $value ) ) ) {
					return Database::error( 'cff_invalid_meta', 'Invalid tracking URL.', 422 );
				}
				$result[ $column ] = $value;
			}
		}
		foreach ( array(
			'utm'      => array( 'source', 'medium', 'campaign', 'term', 'content' ),
			'clickIds' => array( 'gclid', 'fbclid', 'msclkid', 'ttclid' ),
		) as $key => $keys ) {
			$values = $input[ $key ] ?? array();
			if ( is_object( $values ) ) {
				$values = (array) $values;
			}
			if ( ! is_array( $values ) || array_diff( array_keys( $values ), $keys ) ) {
				return Database::error( 'cff_invalid_meta', 'Invalid attribution.', 422 );
			}
			foreach ( $values as $name => $value ) {
				if ( ! is_string( $value ) || strlen( $value ) > 255 ) {
					return Database::error( 'cff_invalid_meta', 'Invalid attribution value.', 422 );
				}
				$result[ 'utm' === $key ? 'utm' : 'click_ids' ][ $name ] = sanitize_text_field( $value );
			}
		}
		if ( isset( $input['urlParams'] ) ) {
			$values = $input['urlParams'];
			if ( is_object( $values ) ) {
				$values = (array) $values;
			}
			if ( ! is_array( $values ) || count( $values ) > 100 ) {
				return Database::error( 'cff_invalid_meta', 'Invalid URL parameters.', 422 );
			}
			$result['url_params'] = array();
			foreach ( $values as $key => $value ) {
				if ( ! is_string( $key ) || ! preg_match( '/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/D', $key ) || ! is_string( $value ) || strlen( $value ) > 1000 ) {
					return Database::error( 'cff_invalid_meta', 'Invalid URL parameter.', 422 );
				}
				$result['url_params'][ $key ] = sanitize_text_field( $value );
			}
		}
		foreach ( array(
			'locale'   => 32,
			'timezone' => 64,
			'screen'   => 32,
		) as $key => $max ) {
			if ( isset( $input[ $key ] ) ) {
				if ( ! is_string( $input[ $key ] ) || strlen( $input[ $key ] ) > $max ) {
					return Database::error( 'cff_invalid_meta', 'Invalid device metadata.', 422 );
				}
				$result[ $key ] = sanitize_text_field( $input[ $key ] );
			}
		}
		if ( isset( $result['timezone'] ) && ! in_array( $result['timezone'], timezone_identifiers_list(), true ) ) {
			return Database::error( 'cff_invalid_meta', 'Invalid timezone.', 422 );
		}
		return $result;
	}

	/**
	 * @param array<string,mixed> $client
	 * @param array<string,mixed> $server
	 * @return array<string,mixed> */
	public function collect( Form $form, array $client, array $server ): array {
		$global  = get_option( 'cff_settings', array() );
		$privacy = array_merge( $global['privacy'] ?? array(), $form->settings()['privacy'] ?? array() );
		if ( ! ( $privacy['storeMeta'] ?? true ) || ( ( $privacy['respectDnt'] ?? true ) && '1' === ( $server['HTTP_DNT'] ?? '' ) ) || '1' === ( $server['HTTP_SEC_GPC'] ?? '' ) ) {
			return array();
		}
		$meta = $client;
		$ip   = ( new IpResolver() )->resolve( $server, $global['proxy'] ?? array() );
		$mode = $privacy['ipMode'] ?? $privacy['ip'] ?? 'anonymized';
		if ( 'none' !== $mode && '' !== $ip ) {
			$meta['ip'] = 'full' === $mode ? $ip : IpResolver::anonymize( $ip );
		}
		if ( $privacy['storeUserAgent'] ?? false ) {
			$ua                 = substr( (string) ( $server['HTTP_USER_AGENT'] ?? '' ), 0, 1024 );
			$meta['user_agent'] = sanitize_text_field( $ua );
			$meta               = array_merge( $meta, $this->parseAgent( $ua ) );
		}
		if ( get_current_user_id() ) {
			$meta['user_id'] = get_current_user_id();
		}
		if ( IpResolver::inRanges( (string) ( $server['REMOTE_ADDR'] ?? '' ), IpResolver::cloudflareRanges() ) && preg_match( '/^[A-Z]{2}$/D', (string) ( $server['HTTP_CF_IPCOUNTRY'] ?? '' ) ) ) {
			$meta['country'] = $server['HTTP_CF_IPCOUNTRY'];
		}
		return $meta;
	}

	/**
	 * @param array<string,mixed> $meta
	 * @return array<string,mixed> */
	public function context( Form $form, array $meta ): array {
		$url    = array();
		$source = isset( $meta['url_params'] ) && is_array( $meta['url_params'] ) ? $meta['url_params'] : array();
		if ( ! $source ) {
			parse_str( (string) wp_parse_url( $meta['page_url'] ?? '', PHP_URL_QUERY ), $source );
		}
		foreach ( array_slice( $source, 0, 100, true ) as $key => $value ) {
			if ( is_string( $value ) && strlen( $value ) <= 1000 && preg_match( '/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/D', $key ) ) {
				$url[ $key ] = sanitize_text_field( $value );
			}
		}
		$flat = array();
		foreach ( $meta['utm'] ?? array() as $key => $value ) {
			$flat[ 'utm_' . $key ] = $value;
		}
		$flat   = array_merge( $flat, $meta['click_ids'] ?? array(), array_intersect_key( $meta, array_flip( array( 'page_url', 'page_title', 'referrer', 'locale', 'timezone' ) ) ) );
		$hidden = array();
		foreach ( $form->schema()['steps'] as $step ) {
			if ( 'hidden' !== $step['type'] ) {
				continue;
			}
			$settings = $step['settings'] ?? array();
			$key      = $settings['sourceKey'] ?? $step['key'];
			$source   = $settings['source'] ?? 'default';
			$value    = match ( $source ) {
				'url' => $url[ $key ] ?? null,
				'meta' => $flat[ $key ] ?? null,
				'cookie' => \ChatFlow\Security\CookieSources::allows( $key ) && isset( $_COOKIE[ $key ] ) && is_string( $_COOKIE[ $key ] ) ? substr( sanitize_text_field( wp_unslash( $_COOKIE[ $key ] ) ), 0, 1000 ) : null,
				default => $step['defaultValue'] ?? null,
			};
			$hidden[ $step['key'] ] = $value;
		}
		return array(
			'hidden' => $hidden,
			'url'    => $url,
			'meta'   => $flat,
			'now'    => gmdate( 'Y-m-d\TH:i:s\Z' ),
		);
	}

	private static function url( string $value ): bool {
		$parts = wp_parse_url( $value );
		return is_array( $parts ) && isset( $parts['host'], $parts['scheme'] ) && in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) && ! isset( $parts['user'] ) && ! isset( $parts['pass'] );
	}

	/**
	 * @return array<string,string> */
	private function parseAgent( string $ua ): array {
		if ( class_exists( '\ChatFlow\Vendor\DeviceDetector\DeviceDetector' ) ) {
			$detector = new \ChatFlow\Vendor\DeviceDetector\DeviceDetector( $ua );
			$detector->parse();
			$client = $detector->getClient();
			$os     = $detector->getOs();
			return array(
				'browser'         => $client['name'] ?? '',
				'browser_version' => $client['version'] ?? '',
				'os'              => $os['name'] ?? '',
				'os_version'      => $os['version'] ?? '',
				'device_type'     => $detector->getDeviceName() ? $detector->getDeviceName() : 'desktop',
				'device_brand'    => $detector->getBrandName() ? $detector->getBrandName() : '',
			);
		}
		return array(
			'browser'     => preg_match( '/Firefox|Chrome|Safari|Edge/i', $ua, $match ) ? $match[0] : 'Unknown',
			'os'          => preg_match( '/Android|iPhone|Windows|Macintosh|Linux/i', $ua, $match ) ? $match[0] : 'Unknown',
			'device_type' => preg_match( '/Mobile|Android|iPhone/i', $ua ) ? 'mobile' : 'desktop',
		);
	}
}
