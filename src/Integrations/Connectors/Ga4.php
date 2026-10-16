<?php
namespace ChatFlow\Integrations\Connectors;

/**
 * Sends one server-side GA4 Measurement Protocol event. No answers or contact
 * details are sent; the client ID is the submission UUID, so the event is not
 * joined to a browser session.
 */
final class Ga4 extends BaseConnector {
	public const MEASUREMENT = '/^G-[A-Z0-9]{4,20}$/D';
	public const SECRET      = '/^[A-Za-z0-9_-]{8,100}$/D';
	public const EVENT       = '/^[A-Za-z][A-Za-z0-9_]{0,39}$/D';

	public function type(): string {
		return 'ga4';
	}

	public function configIssues( array $config, array $keys ): array {
		$issues = $this->referenceIssues( $config, $keys, array( 'consentField' ), '/^$/' );
		if ( '' !== (string) ( $config['eventName'] ?? '' ) && ! preg_match( self::EVENT, (string) $config['eventName'] ) ) {
			$issues[] = 'ga4 eventName must start with a letter and use letters, digits or underscores (max 40).';
		}
		if ( ! empty( $config['fields'] ) ) {
			$issues[] = 'ga4 does not send answers, so field mappings are not allowed.';
		}
		return $issues;
	}

	public function configured( array $credentials ): bool {
		return is_string( $credentials['measurementId'] ?? null ) && preg_match( self::MEASUREMENT, $credentials['measurementId'] )
			&& is_string( $credentials['apiSecret'] ?? null ) && preg_match( self::SECRET, $credentials['apiSecret'] );
	}

	public function requests( array $config, array $credentials, array $payload ): array|string {
		if ( ! $this->configured( $credentials ) || '' === (string) ( $config['consentField'] ?? '' ) ) {
			return 'connector_not_configured';
		}
		if ( ! self::consented( $config, $payload ) ) {
			return 'cancelled';
		}
		$name   = (string) ( $config['eventName'] ?? '' );
		$params = array(
			'form_id'              => (int) ( $payload['form']['id'] ?? 0 ),
			'form_version'         => (int) ( $payload['form']['version'] ?? 0 ),
			'submission_status'    => self::text( $payload['submission']['status'] ?? '', 40 ),
			'engagement_time_msec' => 1,
		);
		foreach ( array( 'source', 'medium', 'campaign' ) as $member ) {
			$value = self::text( $payload['meta']['utm'][ $member ] ?? '', 100 );
			if ( '' !== $value ) {
				$params[ 'campaign_' . $member ] = $value;
			}
		}
		$url = 'https://www.google-analytics.com/mp/collect?' . http_build_query(
			array(
				'measurement_id' => $credentials['measurementId'],
				'api_secret'     => $credentials['apiSecret'],
			)
		);
		return array(
			self::request(
				'POST',
				$url,
				array(),
				array(
					'client_id' => self::text( $payload['submission']['uuid'] ?? '', 64 ),
					'events'    => array(
						array(
							'name'   => preg_match( self::EVENT, $name ) ? $name : 'generate_lead',
							'params' => $params,
						),
					),
				)
			),
		);
	}
}
