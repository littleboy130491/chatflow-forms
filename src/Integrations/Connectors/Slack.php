<?php
namespace ChatFlow\Integrations\Connectors;

/** Posts a plain message to a Slack incoming webhook. */
final class Slack extends BaseConnector {
	public const URL = '#^https://hooks\.slack\.com/services/[A-Za-z0-9_/-]{10,200}$#D';

	public function type(): string {
		return 'slack';
	}

	public function configIssues( array $config, array $keys ): array {
		$issues = $this->referenceIssues( $config, $keys, array(), '/^$/' );
		if ( ! empty( $config['fields'] ) ) {
			$issues[] = 'slack does not use field mappings.';
		}
		return $issues;
	}

	public function configured( array $credentials ): bool {
		return is_string( $credentials['webhookUrl'] ?? null ) && (bool) preg_match( self::URL, $credentials['webhookUrl'] );
	}

	/** Slack mrkdwn treats &, < and > as control characters. */
	public static function escape( string $text ): string {
		return str_replace( array( '&', '<', '>' ), array( '&amp;', '&lt;', '&gt;' ), $text );
	}

	public function requests( array $config, array $credentials, array $payload ): array|string {
		if ( ! $this->configured( $credentials ) ) {
			return 'connector_not_configured';
		}
		if ( ! self::consented( $config, $payload ) ) {
			return 'cancelled';
		}
		$status = self::text( $payload['submission']['status'] ?? '', 40 );
		$lines  = array( '*' . self::escape( self::text( $payload['form']['title'] ?? '', 200 ) ) . '*: new ' . self::escape( $status ) . ' submission' );
		$intro  = self::text( $config['message'] ?? '', 1000 );
		if ( '' !== $intro ) {
			$lines[] = self::escape( \ChatFlow\Logic\Interpolator::interpolate( $intro, (array) ( $payload['answers'] ?? array() ) ) );
		}
		foreach ( array_slice( (array) ( $payload['fields'] ?? array() ), 0, 25 ) as $field ) {
			$value = self::text( $field['value'] ?? null, 300 );
			if ( '' !== $value ) {
				$lines[] = '• ' . self::escape( self::text( $field['label'] ?? $field['key'] ?? '', 120 ) ) . ': ' . self::escape( $value );
			}
		}
		return array( self::request( 'POST', $credentials['webhookUrl'], array(), array( 'text' => mb_substr( implode( "\n", $lines ), 0, 3500, 'UTF-8' ) ) ) );
	}
}
