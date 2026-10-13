<?php
namespace ChatFlow\Integrations;

use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Submission;

final class Payload {
	/** @return array<string,mixed> */
	public static function build( Submission $submission, Form $form, ?string $event = null ): array {
		$event = $event ?? 'submission.' . $submission->status();
		if ( ! in_array( $event, array( 'submission.completed', 'submission.partial', 'submission.abandoned' ), true ) ) {
			throw new \InvalidArgumentException( 'Unsupported delivery event.' );
		}
		if ( $submission->formId() !== $form->id() || $submission->formVersion() !== $form->version() ) {
			throw new \InvalidArgumentException( 'Form snapshot mismatch.' );
		}
		$answers = self::answers( $submission->answers(), $form );
		$meta    = self::meta( $submission->meta(), $form );
		$payload = array(
			'event'      => $event,
			'submission' => array(
				'uuid'        => $submission->uuid(),
				'status'      => substr( $event, 11 ),
				'created_at'  => ( new \DateTimeImmutable( $submission->createdAt(), new \DateTimeZone( 'UTC' ) ) )->format( DATE_ATOM ),
				'duration_ms' => max( 0, (int) ( $submission->storage()['duration_ms'] ?? $submission->meta()['duration_ms'] ?? $submission->meta()['durationMs'] ?? 0 ) ),
				'ending'      => $submission->endingId() ? $submission->endingId() : null,
			),
			'form'       => array(
				'id'      => $form->id(),
				'slug'    => $form->slug(),
				'title'   => $form->title(),
				'version' => $form->version(),
			),
			'answers'    => $answers,
			'fields'     => self::fields( $answers, $form ),
			'meta'       => $meta,
		);
		if ( true === ( $submission->storage()['_cff_payload_frozen'] ?? false ) ) {
			return $payload;
		}
		$filtered = HookDispatcher::filter( 'cff_submission_payload', $payload, array( $submission, $form ), $submission->id() );
		if ( is_array( $filtered ) ) {
			$payload['answers'] = self::answers( is_array( $filtered['answers'] ?? null ) ? $filtered['answers'] : $answers, $form );
			$payload['fields']  = self::fields( $payload['answers'], $form );
			$payload['meta']    = self::meta( is_array( $filtered['meta'] ?? null ) ? $filtered['meta'] : $meta, $form );
		}
		return $payload;
	}

	/**
	 * @param array<string,mixed> $answers
	 * @return array<string,mixed>
	 */
	private static function answers( array $answers, Form $form ): array {
		$result = array();
		foreach ( $form->schema()['steps'] ?? array() as $step ) {
			if ( ! in_array( $step['type'], array( 'statement', 'summary', 'media' ), true ) && array_key_exists( $step['key'], $answers ) ) {
				$result[ $step['key'] ] = self::jsonValue( $answers[ $step['key'] ] );
			}
		}
		return $result;
	}

	/**
	 * @param array<string,mixed> $answers
	 * @return list<array<string,mixed>>
	 */
	private static function fields( array $answers, Form $form ): array {
		$fields = array();
		foreach ( $form->schema()['steps'] ?? array() as $step ) {
			if ( array_key_exists( $step['key'], $answers ) ) {
				$fields[] = array(
					'key'   => $step['key'],
					'label' => self::text( $step['label'] ),
					'type'  => $step['type'],
					'value' => $answers[ $step['key'] ],
				);
			}
		}
		return $fields;
	}

	/**
	 * @param array<string,mixed> $meta
	 * @return array<string,mixed>
	 */
	public static function meta( array $meta, Form $form ): array {
		$privacy = $form->settings()['privacy'] ?? array();
		if ( false === ( $privacy['storeMeta'] ?? true ) ) {
			return array();
		}
		$result = array();
		foreach ( array( 'browser', 'os', 'device', 'page_url', 'referrer', 'landing_page' ) as $key ) {
			$aliases = array(
				'device'       => 'device_type',
				'page_url'     => 'pageUrl',
				'landing_page' => 'landingPage',
			);
			$value   = $meta[ $key ] ?? $meta[ $aliases[ $key ] ?? $key ] ?? null;
			if ( is_string( $value ) ) {
				$result[ $key ] = in_array( $key, array( 'page_url', 'referrer', 'landing_page' ), true ) ? self::publicUrl( $value ) : self::text( $value );
			}
		}
		$ip_mode = $privacy['ipMode'] ?? 'anonymized';
		if ( 'none' !== $ip_mode && ! empty( $meta['ip'] ) && is_string( $meta['ip'] ) && filter_var( $meta['ip'], FILTER_VALIDATE_IP ) ) {
			$result['ip'] = 'full' === $ip_mode ? $meta['ip'] : wp_privacy_anonymize_ip( $meta['ip'] );
		}
		foreach ( array(
			'utm'       => array( 'source', 'medium', 'campaign', 'term', 'content' ),
			'click_ids' => array( 'gclid', 'fbclid', 'msclkid', 'ttclid' ),
		) as $group => $keys ) {
			$values = $meta[ $group ] ?? $meta[ 'click_ids' === $group ? 'clickIds' : $group ] ?? array();
			$values = is_array( $values ) ? $values : array();
			foreach ( $keys as $key ) {
				$value = $values[ $key ] ?? ( 'utm' === $group ? ( $meta[ 'utm_' . $key ] ?? null ) : null );
				if ( is_string( $value ) ) {
					$result[ $group ][ $key ] = self::text( $value );
				}
			}
		}
		// Extensions use an explicit namespace; core private keys are never spread.
		foreach ( $meta as $key => $value ) {
			if ( preg_match( '/^custom_[a-z0-9_]{1,50}$/', (string) $key ) && ! preg_match( '/token|secret|pass|credential|cookie|header|path|url|hash|authorization|nonce/i', (string) $key ) && is_scalar( $value ) ) {
				$result[ $key ] = self::jsonValue( $value );
			}
		}
		return $result;
	}

	public static function publicUrl( string $url ): string {
		$parts = wp_parse_url( $url );
		if ( ! is_array( $parts ) || ! isset( $parts['host'], $parts['scheme'] ) || ! in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) ) {
			return '';
		}
		// Queries may contain signed links, tokens or arbitrary visitor PII.
		return esc_url_raw( $parts['scheme'] . '://' . $parts['host'] . ( isset( $parts['port'] ) ? ':' . $parts['port'] : '' ) . ( $parts['path'] ?? '/' ) );
	}

	public static function text( string $value ): string {
		return mb_substr( wp_strip_all_tags( $value ), 0, 100000 );
	}

	public static function jsonValue( mixed $value, int $depth = 0 ): mixed {
		if ( $depth > 5 ) {
			return null;
		}
		if ( is_string( $value ) ) {
			return self::text( $value );
		}
		if ( is_array( $value ) ) {
			$result = array();
			foreach ( array_slice( $value, 0, 200, true ) as $key => $item ) {
				$result[ $key ] = self::jsonValue( $item, $depth + 1 );
			}
			return $result;
		}
		return is_int( $value ) || is_bool( $value ) || null === $value || ( is_float( $value ) && is_finite( $value ) ) ? $value : null;
	}

	/** @param array<string,mixed> $payload */
	public static function bytes( array $payload ): string {
		$sort = static function ( mixed $value ) use ( &$sort ): mixed {
			if ( is_array( $value ) ) {
				if ( ! array_is_list( $value ) ) {
					ksort( $value, SORT_STRING );
				}
				$value = array_map( $sort, $value );
			}
			return $value;
		};
		foreach ( array( 'answers', 'meta' ) as $key ) {
			if ( empty( $payload[ $key ] ) ) {
				$payload[ $key ] = (object) array();
			}
		}
		return json_encode( $sort( $payload ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR );
	}
}
