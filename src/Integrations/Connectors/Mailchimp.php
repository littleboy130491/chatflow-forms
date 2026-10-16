<?php
namespace ChatFlow\Integrations\Connectors;

/** Upserts an audience member; marketing lists always require an explicit consent answer. */
final class Mailchimp extends BaseConnector {
	public const API_KEY = '/^[a-f0-9]{32}-([a-z]{2,4}[0-9]{1,3})$/D';
	public const LIST_ID = '/^[a-z0-9]{5,20}$/D';
	public const MERGE   = '/^[A-Z][A-Z0-9_]{0,9}$/D';

	public function type(): string {
		return 'mailchimp';
	}

	public function configIssues( array $config, array $keys ): array {
		$issues = $this->referenceIssues( $config, $keys, array( 'listId', 'emailField', 'consentField' ), self::MERGE );
		if ( '' !== (string) ( $config['listId'] ?? '' ) && ! preg_match( self::LIST_ID, (string) $config['listId'] ) ) {
			$issues[] = 'mailchimp listId must be the audience ID.';
		}
		foreach ( (array) ( $config['tags'] ?? array() ) as $tag ) {
			if ( ! is_string( $tag ) || '' === trim( $tag ) || mb_strlen( $tag ) > 100 ) {
				$issues[] = 'mailchimp tags must be short non-empty text.';
				break;
			}
		}
		return $issues;
	}

	public function configured( array $credentials ): bool {
		return is_string( $credentials['apiKey'] ?? null ) && (bool) preg_match( self::API_KEY, $credentials['apiKey'] );
	}

	public function requests( array $config, array $credentials, array $payload ): array|string {
		if ( ! $this->configured( $credentials ) || ! preg_match( self::LIST_ID, (string) ( $config['listId'] ?? '' ) ) || '' === (string) ( $config['consentField'] ?? '' ) ) {
			return 'connector_not_configured';
		}
		if ( ! self::consented( $config, $payload ) ) {
			return 'cancelled';
		}
		$email = self::email( $payload, (string) ( $config['emailField'] ?? '' ) );
		if ( '' === $email ) {
			return 'connector_missing_email';
		}
		preg_match( self::API_KEY, $credentials['apiKey'], $match );
		$member  = 'https://' . $match[1] . '.api.mailchimp.com/3.0/lists/' . $config['listId'] . '/members/' . md5( $email );
		$headers = array( 'Authorization' => 'Basic ' . base64_encode( 'chatflow:' . $credentials['apiKey'] ) );
		$body    = array(
			'email_address' => $email,
			'status_if_new' => false === ( $config['doubleOptIn'] ?? true ) ? 'subscribed' : 'pending',
		);
		$merge   = self::mapped( $config, $payload, self::MERGE );
		if ( $merge ) {
			$body['merge_fields'] = $merge;
		}
		$requests = array( self::request( 'PUT', $member, $headers, $body ) );
		$tags     = array_values( array_filter( array_map( static fn( $tag ) => is_string( $tag ) ? self::text( $tag, 100 ) : '', (array) ( $config['tags'] ?? array() ) ) ) );
		if ( $tags ) {
			$requests[] = self::request(
				'POST',
				$member . '/tags',
				$headers,
				array(
					'tags' => array_map(
						static fn( $name ) => array(
							'name'   => $name,
							'status' => 'active',
						),
						array_slice( $tags, 0, 20 )
					),
				)
			);
		}
		return $requests;
	}
}
