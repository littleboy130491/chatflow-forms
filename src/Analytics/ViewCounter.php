<?php
namespace ChatFlow\Analytics;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Rest\Settings;
use ChatFlow\Spam\RateLimiter;
use ChatFlow\Submissions\Database;
use ChatFlow\Tracking\IpResolver;

/**
 * Anonymous daily impression counters: no visitor identifiers, answers or URLs are persisted.
 * Every opened embed counts as one impression; this does not count unique people.
 */
final class ViewCounter {
	public function __construct( private FormRepository $forms = new FormRepository() ) {}

	/** @return array{recorded:bool}|\WP_Error */
	public function record( int $form_id, int $version, bool $do_not_track = false ): array|\WP_Error {
		global $wpdb;
		$form = $this->forms->getPublished( $form_id );
		if ( ! $form ) {
			return Database::error( 'cff_not_found', 'Published form not found.', 404 );
		}
		if ( $form->version() !== $version ) {
			return Database::error( 'cff_version_conflict', 'Load the current published form.', 409 );
		}
		$settings = Settings::get();
		if ( $do_not_track && $settings['privacy']['respectDnt'] ) {
			return array( 'recorded' => false );
		}
		$ip = ( new IpResolver() )->resolve( $_SERVER, $settings['proxy'] );
		if ( ! ( new RateLimiter() )->consume( 'form-view:' . $form_id . ':' . $ip, 120, 600 ) ) {
			return Database::error( 'cff_rate_limit', 'Too many form impressions.', 429, array( 'retryAfter' => 600 ) );
		}
		$dimension = '{}';
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Prepared scalar values, trusted WP table prefix and fixed SQL.
		Database::check(
			$wpdb->query(
				$wpdb->prepare(
					"INSERT INTO {$wpdb->prefix}cff_stats_daily (form_id,form_version,day,metric,dimension_hash,dimension,value)
					VALUES (%d,%d,UTC_DATE(),%s,%s,%s,1)
					ON DUPLICATE KEY UPDATE value=value+1",
					$form_id,
					$version,
					'view',
					hash( 'sha256', $dimension ),
					$dimension
				)
			)
		);
		return array( 'recorded' => true );
	}
}
