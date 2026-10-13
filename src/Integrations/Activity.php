<?php
namespace ChatFlow\Integrations;

final class Activity {
	public static function record( int $submission_id, string $code, int $delivery_id = 0, int $attempt = 0 ): void {
		global $wpdb;
		if ( $submission_id < 1 ) {
			return;
		}
		try {
			$wpdb->insert(
				$wpdb->prefix . 'cff_submission_notes',
				array(
					'submission_id' => $submission_id,
					'user_id'       => 0,
					'type'          => 'delivery',
					'body'          => wp_json_encode(
						array(
							'code'       => sanitize_key( $code ),
							'deliveryId' => $delivery_id,
							'attempt'    => $attempt,
						)
					),
					'created_at'    => gmdate( 'Y-m-d H:i:s' ),
				),
				array( '%d', '%d', '%s', '%s', '%s' )
			);
		} catch ( \Throwable $error ) {
			// Activity is best-effort and cannot change a committed visitor outcome.
		}
	}
}
