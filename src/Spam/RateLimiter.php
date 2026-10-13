<?php
namespace ChatFlow\Spam;

use ChatFlow\Submissions\Database;

final class RateLimiter {
	public function consume( string $identity, int $limit, int $window, ?int $now = null ): bool {
		global $wpdb;
		$now  ??= time();
		$window = max( 1, min( 86400, $window ) );
		$bucket = hash_hmac( 'sha256', get_current_blog_id() . ':' . $identity . ':' . intdiv( $now, $window ), wp_salt( 'auth' ) );
		Database::check(
			$wpdb->query(
				$wpdb->prepare(
					"INSERT INTO {$wpdb->prefix}cff_rate_limits (bucket_hash,hits,expires_at) VALUES (%s,LAST_INSERT_ID(1),%s) ON DUPLICATE KEY UPDATE hits=LAST_INSERT_ID(hits+1)",
					$bucket,
					gmdate( 'Y-m-d H:i:s', ( intdiv( $now, $window ) + 1 ) * $window )
				)
			)
		);
		$hits = (int) $wpdb->get_var( 'SELECT LAST_INSERT_ID()' );
		return $hits <= $limit;
	}
}
