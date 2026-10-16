<?php
namespace ChatFlow\Integrations\Connectors;

/** Registry, credential defaults/validation and HTTPS transport for native connectors. */
final class Connectors {
	/** Requests may only reach these hosts; anything else is refused before sending. */
	private const HOSTS = array(
		'slack'     => '/^hooks\.slack\.com$/D',
		'mailchimp' => '/^[a-z]{2,4}[0-9]{1,3}\.api\.mailchimp\.com$/D',
		'hubspot'   => '/^api\.hubapi\.com$/D',
		'ga4'       => '/^www\.google-analytics\.com$/D',
		'meta_capi' => '/^graph\.facebook\.com$/D',
	);

	/** @return array<string,Connector> */
	public static function all(): array {
		$connectors = array();
		foreach ( array( new Slack(), new Mailchimp(), new HubSpot(), new Ga4(), new MetaCapi() ) as $connector ) {
			$connectors[ $connector->type() ] = $connector;
		}
		return $connectors;
	}

	public static function get( string $type ): ?Connector {
		return self::all()[ $type ] ?? null;
	}

	/** @return array<string,array<string,string>> */
	public static function defaults(): array {
		return array(
			'slack'     => array( 'webhookUrl' => '' ),
			'mailchimp' => array( 'apiKey' => '' ),
			'hubspot'   => array( 'accessToken' => '' ),
			'ga4'       => array(
				'measurementId' => '',
				'apiSecret'     => '',
			),
			'meta_capi' => array(
				'pixelId'       => '',
				'accessToken'   => '',
				'testEventCode' => '',
			),
		);
	}

	/**
	 * Credentials are either empty (provider off) or fully valid.
	 *
	 * @param mixed $credentials
	 */
	public static function validCredentials( mixed $credentials ): bool {
		$defaults = self::defaults();
		if ( ! is_array( $credentials ) || array_diff( array_keys( $credentials ), array_keys( $defaults ) ) ) {
			return false;
		}
		foreach ( $defaults as $type => $members ) {
			$values = $credentials[ $type ] ?? $members;
			if ( ! is_array( $values ) || array_diff( array_keys( $values ), array_keys( $members ) ) ) {
				return false;
			}
			$values += $members;
			foreach ( $values as $value ) {
				if ( ! is_string( $value ) || strlen( $value ) > 500 ) {
					return false;
				}
			}
			$required = array_diff_key( $values, array( 'testEventCode' => true ) );
			$filled   = array_filter( $required, static fn( $value ) => '' !== $value );
			if ( $filled && ! self::get( $type )->configured( $values ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Per-form configuration problems, reported at publish time.
	 *
	 * @param array<string,mixed> $settings
	 * @param array<string,mixed> $schema
	 * @return list<array{path:string,code:string,message:string}>
	 */
	public static function issues( array $settings, array $schema ): array {
		$keys   = array_values( array_map( static fn( $step ) => (string) $step['key'], $schema['steps'] ?? array() ) );
		$issues = array();
		$ids    = array();
		foreach ( $settings['integrations']['connectors'] ?? array() as $index => $config ) {
			$path      = '/integrations/connectors/' . $index;
			$connector = self::get( (string) ( $config['type'] ?? '' ) );
			$messages  = $connector ? $connector->configIssues( $config, $keys ) : array( 'Unknown connector type.' );
			if ( isset( $ids[ $config['id'] ?? '' ] ) ) {
				$messages[] = 'Connector IDs must be unique.';
			}
			$ids[ $config['id'] ?? '' ] = true;
			if ( empty( $config['enabled'] ) ) {
				continue;
			}
			foreach ( $messages as $message ) {
				$issues[] = array(
					'path'    => $path,
					'code'    => 'invalid_connector',
					'message' => $message,
				);
			}
		}
		return $issues;
	}

	/**
	 * Enabled connectors for an event whose consent gate (if any) is satisfied.
	 *
	 * @param array<string,mixed> $settings
	 * @param array<string,mixed> $payload
	 * @return list<array<string,mixed>>
	 */
	public static function planned( array $settings, string $event, array $payload ): array {
		$planned = array();
		foreach ( $settings['integrations']['connectors'] ?? array() as $config ) {
			if ( ! empty( $config['enabled'] ) && in_array( substr( $event, 11 ), (array) ( $config['events'] ?? array() ), true ) && self::get( (string) ( $config['type'] ?? '' ) ) && BaseConnector::consented( $config, $payload ) ) {
				$planned[] = $config;
			}
		}
		return $planned;
	}

	/**
	 * @param array<string,mixed> $config
	 * @param array<string,mixed> $payload
	 */
	public static function deliver( array $config, array $payload ): string {
		$type      = (string) ( $config['type'] ?? '' );
		$connector = self::get( $type );
		if ( ! $connector ) {
			return 'destination_missing';
		}
		$credentials = \ChatFlow\Rest\Settings::get()['connectors'][ $type ] ?? array();
		$requests    = $connector->requests( $config, is_array( $credentials ) ? $credentials : array(), $payload );
		if ( is_string( $requests ) ) {
			return $requests;
		}
		foreach ( $requests as $request ) {
			$outcome = self::send( $type, $request );
			if ( 'sent' !== $outcome ) {
				return $outcome;
			}
		}
		return 'sent';
	}

	public static function allowedUrl( string $type, string $url ): bool {
		$parts = wp_parse_url( $url );
		return is_array( $parts ) && 'https' === ( $parts['scheme'] ?? '' ) && ! isset( $parts['port'] ) && ! isset( $parts['user'] ) && ! isset( $parts['pass'] )
			&& isset( self::HOSTS[ $type ] ) && (bool) preg_match( self::HOSTS[ $type ], strtolower( (string) ( $parts['host'] ?? '' ) ) );
	}

	/** @param array{method:string,url:string,headers:array<string,string>,body:string} $request */
	private static function send( string $type, array $request ): string {
		if ( ! self::allowedUrl( $type, $request['url'] ) ) {
			return 'connector_unsafe_url';
		}
		$response = wp_safe_remote_request(
			$request['url'],
			array(
				'method'              => $request['method'],
				'headers'             => $request['headers'],
				'body'                => $request['body'],
				'timeout'             => 10,
				'redirection'         => 0,
				'sslverify'           => true,
				'reject_unsafe_urls'  => true,
				'limit_response_size' => 4096,
				'data_format'         => 'body',
			)
		);
		if ( is_wp_error( $response ) ) {
			return 'connector_transport_error';
		}
		$code = (int) wp_remote_retrieve_response_code( $response );
		return $code >= 200 && $code < 300 ? 'sent' : 'connector_http_' . $code;
	}
}
