<?php
namespace ChatFlow\Integrations\Connectors;

/**
 * Sends a Meta Conversions API event. Email and phone leave only as SHA-256
 * hashes of their normalized values; the submission UUID is the event ID so a
 * browser pixel event with the same ID is deduplicated.
 */
final class MetaCapi extends BaseConnector {
	public const PIXEL   = '/^[0-9]{5,20}$/D';
	public const TOKEN   = '/^[A-Za-z0-9]{20,500}$/D';
	public const TEST    = '/^[A-Z0-9]{0,20}$/D';
	public const EVENT   = '/^[A-Za-z][A-Za-z0-9_]{0,49}$/D';
	public const VERSION = 'v23.0';

	public function type(): string {
		return 'meta_capi';
	}

	public function configIssues( array $config, array $keys ): array {
		$issues = $this->referenceIssues( $config, $keys, array( 'consentField' ), '/^$/' );
		if ( '' !== (string) ( $config['eventName'] ?? '' ) && ! preg_match( self::EVENT, (string) $config['eventName'] ) ) {
			$issues[] = 'meta_capi eventName must start with a letter and use letters, digits or underscores.';
		}
		if ( ! empty( $config['fields'] ) ) {
			$issues[] = 'meta_capi only sends hashed email and phone, so field mappings are not allowed.';
		}
		return $issues;
	}

	public function configured( array $credentials ): bool {
		return is_string( $credentials['pixelId'] ?? null ) && preg_match( self::PIXEL, $credentials['pixelId'] )
			&& is_string( $credentials['accessToken'] ?? null ) && preg_match( self::TOKEN, $credentials['accessToken'] )
			&& is_string( $credentials['testEventCode'] ?? '' ) && preg_match( self::TEST, $credentials['testEventCode'] ?? '' );
	}

	public static function hashPhone( string $phone ): string {
		$digits = preg_replace( '/\D+/', '', $phone ) ?? '';
		return strlen( $digits ) >= 7 ? hash( 'sha256', $digits ) : '';
	}

	public function requests( array $config, array $credentials, array $payload ): array|string {
		if ( ! $this->configured( $credentials ) || '' === (string) ( $config['consentField'] ?? '' ) ) {
			return 'connector_not_configured';
		}
		if ( ! self::consented( $config, $payload ) ) {
			return 'cancelled';
		}
		$user  = array();
		$email = self::email( $payload, (string) ( $config['emailField'] ?? '' ) );
		if ( '' !== $email ) {
			$user['em'] = array( hash( 'sha256', $email ) );
		}
		$phone = self::hashPhone( self::text( self::answer( $payload, (string) ( $config['phoneField'] ?? '' ) ), 40 ) );
		if ( '' !== $phone ) {
			$user['ph'] = array( $phone );
		}
		$time   = strtotime( (string) ( $payload['submission']['created_at'] ?? '' ) );
		$time   = false === $time ? time() : $time;
		$fbclid = self::text( $payload['meta']['click_ids']['fbclid'] ?? '', 500 );
		if ( '' !== $fbclid ) {
			$user['fbc'] = 'fb.1.' . ( $time * 1000 ) . '.' . $fbclid;
		}
		if ( ! $user ) {
			return 'connector_missing_identity';
		}
		$name  = (string) ( $config['eventName'] ?? '' );
		$event = array(
			'event_name'    => preg_match( self::EVENT, $name ) ? $name : 'Lead',
			'event_time'    => $time,
			'event_id'      => self::text( $payload['submission']['uuid'] ?? '', 64 ),
			'action_source' => 'website',
			'user_data'     => $user,
		);
		$page  = self::text( $payload['meta']['page_url'] ?? '', 2000 );
		if ( '' !== $page && str_starts_with( $page, 'https://' ) ) {
			$event['event_source_url'] = $page;
		}
		$body = array(
			'data'         => array( $event ),
			'access_token' => $credentials['accessToken'],
		);
		if ( '' !== (string) ( $credentials['testEventCode'] ?? '' ) ) {
			$body['test_event_code'] = $credentials['testEventCode'];
		}
		return array( self::request( 'POST', 'https://graph.facebook.com/' . self::VERSION . '/' . $credentials['pixelId'] . '/events', array(), $body ) );
	}
}
