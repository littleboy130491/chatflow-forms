<?php
namespace ChatFlow\Integrations\Connectors;

/** Creates or updates a CRM contact keyed by email through a private app token. */
final class HubSpot extends BaseConnector {
	public const TOKEN    = '/^[A-Za-z0-9_-]{10,500}$/D';
	public const PROPERTY = '/^[a-z][a-z0-9_]{0,99}$/D';
	public const ENDPOINT = 'https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert';

	public function type(): string {
		return 'hubspot';
	}

	public function configIssues( array $config, array $keys ): array {
		return $this->referenceIssues( $config, $keys, array( 'emailField' ), self::PROPERTY );
	}

	public function configured( array $credentials ): bool {
		return is_string( $credentials['accessToken'] ?? null ) && (bool) preg_match( self::TOKEN, $credentials['accessToken'] );
	}

	public function requests( array $config, array $credentials, array $payload ): array|string {
		if ( ! $this->configured( $credentials ) ) {
			return 'connector_not_configured';
		}
		if ( ! self::consented( $config, $payload ) ) {
			return 'cancelled';
		}
		$email = self::email( $payload, (string) ( $config['emailField'] ?? '' ) );
		if ( '' === $email ) {
			return 'connector_missing_email';
		}
		$properties          = self::mapped( $config, $payload, self::PROPERTY );
		$properties['email'] = $email;
		return array(
			self::request(
				'POST',
				self::ENDPOINT,
				array( 'Authorization' => 'Bearer ' . $credentials['accessToken'] ),
				array(
					'inputs' => array(
						array(
							'idProperty' => 'email',
							'id'         => $email,
							'properties' => $properties,
						),
					),
				)
			),
		);
	}
}
