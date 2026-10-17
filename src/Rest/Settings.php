<?php
namespace ChatFlow\Rest;

use ChatFlow\Submissions\Database;

final class Settings {
	/** Stands in for a stored secret in admin responses; sending it back keeps the stored value. */
	public const MASK = '********';
	/** Secret members, as group/member paths (connectors: group/provider/member). */
	private const SECRETS = array(
		array( 'spam', 'secretKey' ),
		array( 'spam', 'akismetKey' ),
		array( 'ai', 'apiKey' ),
		array( 'ai', 'openrouterKey' ),
		array( 'ai', 'compatKey' ),
		array( 'connectors', 'slack', 'webhookUrl' ),
		array( 'connectors', 'mailchimp', 'apiKey' ),
		array( 'connectors', 'hubspot', 'accessToken' ),
		array( 'connectors', 'ga4', 'apiSecret' ),
		array( 'connectors', 'meta_capi', 'accessToken' ),
	);

	/**
	 * Settings for the admin screen: stored secrets are replaced by MASK, never echoed.
	 *
	 * @param array<string,mixed> $settings
	 * @return array<string,mixed>
	 */
	public static function masked( array $settings ): array {
		foreach ( self::SECRETS as $path ) {
			$ref = &$settings;
			foreach ( $path as $key ) {
				if ( ! is_array( $ref ) || ! array_key_exists( $key, $ref ) ) {
					unset( $ref );
					continue 2; }
				$ref = &$ref[ $key ];
			}
			if ( is_string( $ref ) && '' !== $ref ) {
				$ref = self::MASK; }
			unset( $ref );
		}
		return $settings;
	}

	/**
	 * Replace MASK placeholders in submitted settings with the stored secret.
	 *
	 * @param array<string,mixed> $input
	 * @param array<string,mixed> $stored
	 * @return array<string,mixed>
	 */
	private static function unmask( array $input, array $stored ): array {
		foreach ( self::SECRETS as $path ) {
			$ref  = &$input;
			$have = $stored;
			foreach ( $path as $key ) {
				if ( ! is_array( $ref ) || ! array_key_exists( $key, $ref ) ) {
					unset( $ref );
					continue 2; }
				$ref  = &$ref[ $key ];
				$have = is_array( $have ) ? ( $have[ $key ] ?? '' ) : '';
			}
			if ( self::MASK === $ref ) {
				$ref = is_string( $have ) ? $have : ''; }
			unset( $ref );
		}
		return $input;
	}
	/** @return array<string,mixed> */
	public static function defaults(): array {
		return array(
			'delete_data_on_uninstall' => false,
			'fullpageBase'             => 'chat',
			'defaultTheme'             => 'light',
			'tracking'                 => array(
				'enabled'         => false,
				'consentRequired' => true,
				'days'            => 30,
			),
			'privacy'                  => array(
				'ip'             => 'anonymized',
				'storeUserAgent' => false,
				'storeMeta'      => true,
				'respectDnt'     => true,
			),
			'retention'                => array(
				'enabled'     => false,
				'days'        => 360,
				'partialDays' => null,
			),
			'spam'                     => array(
				'honeypotEnabled'   => true,
				'minSeconds'        => 2,
				'rateLimit'         => 10,
				'rateWindowSeconds' => 600,
				'captcha'           => 'none',
				'siteKey'           => '',
				'secretKey'         => '',
				'minScore'          => 0.5,
				'akismetEnabled'    => false,
				'akismetKey'        => '',
			),
			'proxy'                    => array(
				'mode'          => 'automatic',
				'trustedRanges' => array(),
				'header'        => 'HTTP_X_FORWARDED_FOR',
			),
			'email'                    => array(
				'fromName'   => get_bloginfo( 'name' ),
				'fromEmail'  => get_option( 'admin_email' ),
				'replyTo'    => '',
				'logoUrl'    => '',
				'brandColor' => '#262626',
				'footerText' => '',
			),
			'connectors'               => \ChatFlow\Integrations\Connectors\Connectors::defaults(),
			'ai'                       => array(
				'provider'        => 'anthropic',
				'apiKey'          => '',
				'openrouterKey'   => '',
				'openrouterModel' => '',
				'baseUrl'         => '',
				'compatKey'       => '',
				'compatModel'     => '',
			),
			'mcp'                      => array( 'enabled' => false ),
		);
	}
	/** @return array<string,mixed> */
	public static function get(): array {
		return array_replace_recursive( self::defaults(), (array) get_option( 'cff_settings', array() ) ); }
	/** @return array<string,mixed>|\WP_Error
	 * @param array<string,mixed> $input
	 */
	public static function save( array $input ): array|\WP_Error {
		$input    = self::unmask( $input, self::get() );
		$defaults = self::defaults();
		foreach ( array( 'tracking', 'privacy', 'retention', 'spam', 'proxy', 'email', 'connectors', 'ai', 'mcp' ) as $group ) {
			if ( isset( $input[ $group ] ) && ! is_array( $input[ $group ] ) ) {
				return Database::error( 'cff_settings_invalid', 'Invalid settings group.', 422 );
			}
		}
		if ( array_diff( array_keys( $input ), array_keys( $defaults ) ) ) {
			return Database::error( 'cff_settings_invalid', 'Unknown global setting.', 422 ); }
		$result = array_replace_recursive( self::get(), $input );
		foreach ( array( 'tracking', 'privacy', 'retention', 'spam', 'proxy', 'email', 'ai', 'mcp' ) as $group ) {
			if ( ! is_array( $result[ $group ] ) || array_diff( array_keys( $result[ $group ] ), array_keys( $defaults[ $group ] ) ) ) {
				return Database::error( 'cff_settings_invalid', 'Invalid settings group.', 422 ); }
		}
		foreach ( array( array( 'tracking', 'enabled' ), array( 'tracking', 'consentRequired' ), array( 'privacy', 'storeUserAgent' ), array( 'privacy', 'storeMeta' ), array( 'privacy', 'respectDnt' ), array( 'retention', 'enabled' ), array( 'mcp', 'enabled' ) ) as [$group, $key] ) {
			if ( ! is_bool( $result[ $group ][ $key ] ) ) {
				return Database::error( 'cff_settings_invalid', 'Boolean setting required.', 422 ); }
		}
		if ( ! is_bool( $result['delete_data_on_uninstall'] ) || ! in_array( $result['privacy']['ip'], array( 'full', 'anonymized', 'none' ), true ) || ! in_array( $result['defaultTheme'], array( 'light', 'dark', 'auto' ), true ) || ! is_string( $result['fullpageBase'] ) || ! preg_match( '/^[a-z0-9][a-z0-9-]{0,49}$/D', $result['fullpageBase'] ) || ! is_int( $result['retention']['days'] ) || $result['retention']['days'] < 1 || $result['retention']['days'] > 36500 || ! is_int( $result['tracking']['days'] ) || $result['tracking']['days'] < 1 || $result['tracking']['days'] > 90 ) {
			return Database::error( 'cff_settings_invalid', 'Invalid general/privacy settings.', 422 ); }
		if ( ! in_array( $result['proxy']['mode'], array( 'automatic', 'direct', 'cloudflare', 'custom' ), true ) || ! in_array( $result['proxy']['header'], array( 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CF_CONNECTING_IP' ), true ) || ! is_array( $result['proxy']['trustedRanges'] ) || count( $result['proxy']['trustedRanges'] ) > 100 ) {
			return Database::error( 'cff_settings_invalid', 'Invalid trusted proxy settings.', 422 ); }
		foreach ( $result['proxy']['trustedRanges'] as $range ) {
			if ( ! is_string( $range ) ) {
				return Database::error( 'cff_settings_invalid', 'Invalid proxy range.', 422 ); }
			$parts = explode( '/', $range );
			if ( ! filter_var( $parts[0], FILTER_VALIDATE_IP ) || count( $parts ) > 2 || ( isset( $parts[1] ) && ( ! ctype_digit( $parts[1] ) || (int) $parts[1] > ( str_contains( $parts[0], ':' ) ? 128 : 32 ) ) ) ) {
				return Database::error( 'cff_settings_invalid', 'Invalid proxy CIDR.', 422 ); }
		}
		foreach ( $result['email'] as $key => $value ) {
			if ( ! is_string( $value ) || strlen( $value ) > 4000 || preg_match( '/[\r\n]/', $value ) && in_array( $key, array( 'fromName', 'fromEmail', 'replyTo' ), true ) ) {
				return Database::error( 'cff_settings_invalid', 'Invalid email setting.', 422 ); }
		}
		foreach ( array( 'fromEmail', 'replyTo' ) as $key ) {
			if ( '' !== $result['email'][ $key ] && ! is_email( $result['email'][ $key ] ) ) {
				return Database::error( 'cff_settings_invalid', 'Invalid sender address.', 422 ); }
		}
		if ( ! preg_match( '/^#[a-f0-9]{6}$/iD', $result['email']['brandColor'] ) || ( '' !== $result['email']['logoUrl'] && ! wp_http_validate_url( $result['email']['logoUrl'] ) ) ) {
			return Database::error( 'cff_settings_invalid', 'Invalid email appearance.', 422 ); }
		$old = self::get();
		if ( null !== $result['retention']['partialDays'] && ( ! is_int( $result['retention']['partialDays'] ) || $result['retention']['partialDays'] < 1 || $result['retention']['partialDays'] > 36500 ) ) {
			return Database::error( 'cff_settings_invalid', 'Invalid partial retention.', 422 ); }
		if ( ! is_bool( $result['spam']['honeypotEnabled'] ) || ! is_bool( $result['spam']['akismetEnabled'] ) || ! in_array( $result['spam']['captcha'], array( 'none', 'turnstile', 'hcaptcha', 'recaptcha' ), true ) || ! is_numeric( $result['spam']['minScore'] ) || ! is_int( $result['spam']['minScore'] ) && ! is_float( $result['spam']['minScore'] ) || $result['spam']['minScore'] < 0 || $result['spam']['minScore'] > 1 ) {
			return Database::error( 'cff_settings_invalid', 'Invalid honeypot setting.', 422 ); }
		foreach ( array( 'siteKey', 'secretKey', 'akismetKey' ) as $key ) {
			if ( ! is_string( $result['spam'][ $key ] ) || strlen( $result['spam'][ $key ] ) > 500 || preg_match( '/[\x00-\x20\x7f]/', $result['spam'][ $key ] ) ) {
				return Database::error( 'cff_settings_invalid', 'Invalid provider key.', 422 );
			}
		}
		if ( 'none' !== $result['spam']['captcha'] && ( '' === $result['spam']['siteKey'] || '' === $result['spam']['secretKey'] ) || $result['spam']['akismetEnabled'] && '' === $result['spam']['akismetKey'] ) {
			return Database::error( 'cff_settings_invalid', 'Enabled providers require their keys.', 422 );
		}
		foreach ( array(
			'minSeconds'        => array( 0, 60 ),
			'rateLimit'         => array( 1, 1000 ),
			'rateWindowSeconds' => array( 1, 86400 ),
		) as $key => [$min, $max] ) {
			if ( ! is_int( $result['spam'][ $key ] ) || $result['spam'][ $key ] < $min || $result['spam'][ $key ] > $max ) {
				return Database::error( 'cff_settings_invalid', 'Invalid spam defaults.', 422 ); }
		}
		$ai_error = \ChatFlow\Ai\Providers::invalid( $result['ai'] );
		if ( null !== $ai_error ) {
			return Database::error( 'cff_settings_invalid', $ai_error, 422 );
		}
		if ( ! \ChatFlow\Integrations\Connectors\Connectors::validCredentials( $result['connectors'] ) ) {
			return Database::error( 'cff_settings_invalid', 'Connector credentials are incomplete or malformed.', 422 );
		}
		update_option( 'cff_settings', $result, false );
		if ( $old['fullpageBase'] !== $result['fullpageBase'] ) {
			update_option( 'cff_flush_rewrites', true, false ); }
		return $result;
	}
}
