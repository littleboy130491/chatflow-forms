<?php
namespace ChatFlow\Frontend;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Logic\Engine;
use ChatFlow\Rest\Settings;
use ChatFlow\Rest\UploadSession;
use ChatFlow\Spam\RateLimiter;
use ChatFlow\Submissions\Database;

final class EventCollector {
	public const EVENTS = array( 'view', 'answer', 'back', 'abandon' );
	/** @param array<string,mixed> $body
	 * @param array<string,mixed> $server
	 * @return array{stored:int}|\WP_Error */
	public function collect( string $id, string $token, array $body, array $server ): array|\WP_Error {
		if ( strlen( Database::json( $body ) ) > 4096 || array_diff( array_keys( $body ), array( 'events', 'optOut', 'consentGranted' ) ) || ! is_bool( $body['optOut'] ?? false ) || ! is_bool( $body['consentGranted'] ?? false ) || ! is_array( $body['events'] ?? null ) || ! array_is_list( $body['events'] ) || count( $body['events'] ) > 10 ) {
			return Database::error( 'cff_events_invalid', 'Invalid events.', 422 ); }
		foreach ( $body['events'] as $event ) {
			if ( ! is_array( $event ) || array_diff( array_keys( $event ), array( 'event', 'stepId' ) ) || ! in_array( $event['event'] ?? null, self::EVENTS, true ) || ! is_string( $event['stepId'] ?? '' ) || strlen( $event['stepId'] ?? '' ) > 64 ) {
				return Database::error( 'cff_events_invalid', 'Invalid events.', 422 ); }
		}
		return Database::transaction(
			static function () use ( $id, $token, $body, $server ) {
				global $wpdb;
				$row = UploadSession::lock( $id, $token );
				if ( is_wp_error( $row ) ) {
					return $row; }
				$global = Settings::get();
				$form   = ( new FormRepository() )->getPublished( (int) $row['form_id'], (int) $row['form_version'] );
				if ( ! $form ) {
					return Database::error( 'cff_form_not_found', 'Published form not found.', 404 ); }
				$respect = $global['privacy']['respectDnt'] || ( $form->settings()['privacy']['respectDnt'] ?? false );
				if ( ! $global['tracking']['enabled'] || ( $body['optOut'] ?? false ) || '1' === ( $server['HTTP_SEC_GPC'] ?? '' ) || $respect && '1' === ( $server['HTTP_DNT'] ?? '' ) || $global['tracking']['consentRequired'] && ! ( $body['consentGranted'] ?? false ) ) {
					return array( 'stored' => 0 ); }
				$context = Database::decode( $row['context'] );
				$path    = ( new Engine() )->replay( $form->schema(), $context['_answers'] ?? array(), $context );
				foreach ( $body['events'] as $event ) {
					$step = $event['stepId'] ?? '';
					if ( '' === $step ? 'view' !== $event['event'] : ! in_array( $step, $path['visited'], true ) ) {
						return Database::error( 'cff_events_step', 'Event step does not belong to the session path.', 422 ); }
					if ( 'answer' === $event['event'] ) {
						$answered = false;
						foreach ( $form->schema()['steps'] as $field ) {
							if ( $field['id'] === $step && array_key_exists( $field['key'], $path['answers'] ) && $path['currentStepId'] !== $step ) {
								$answered = true; }
						}
						if ( ! $answered ) {
							return Database::error( 'cff_events_step', 'An answer event requires a saved answer.', 422 ); }
					}
				}
				if ( ! ( new RateLimiter() )->consume( 'events:' . $id, 50, 60 ) ) {
					return Database::error( 'cff_rate_limit', 'Event limit reached.', 429 ); }
				$count  = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->prefix}cff_events WHERE session_id=%d", $row['id'] ) );
				$events = array_slice( $body['events'], 0, max( 0, 200 - $count ) );
				foreach ( $events as $event ) {
					Database::check(
						$wpdb->insert(
							$wpdb->prefix . 'cff_events',
							array(
								'form_id'      => (int) $row['form_id'],
								'form_version' => (int) $row['form_version'],
								'session_id'   => (int) $row['id'],
								'step_id'      => $event['stepId'] ?? '',
								'event'        => $event['event'],
								'variant_id'   => '',
								'payload'      => null,
								'ts'           => Database::now(),
							)
						)
					);
				}
				return array( 'stored' => count( $events ) );
			}
		);
	}
}
