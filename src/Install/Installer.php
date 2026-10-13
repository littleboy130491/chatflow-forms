<?php
namespace ChatFlow\Install;

use ChatFlow\Forms\FormPostType;

final class Installer {
	public const DB_VERSION   = 2;
	public const CAPABILITIES = array( 'cff_manage_forms', 'cff_view_submissions', 'cff_edit_submissions', 'cff_delete_submissions', 'cff_export_submissions', 'cff_purge_submissions', 'cff_manage_settings' );
	public const TABLES       = array( 'form_versions', 'submissions', 'submission_values', 'submission_notes', 'sessions', 'requests', 'uploads', 'exports', 'events', 'stats_daily', 'deliveries', 'audit_log', 'rate_limits' );

	public static function activate( bool $network_wide = false ): void {
		self::eachSite(
			$network_wide,
			static function (): void {
				self::migrate();
				self::grantCapabilities();
				( new FormPostType() )->register();
				flush_rewrite_rules( false );
			}
		);
	}

	public static function maybeUpgrade(): void {
		if ( (int) get_option( 'cff_db_version', 0 ) < self::DB_VERSION ) {
			self::migrate();
			self::grantCapabilities();
		}
	}

	public static function initializeSite( \WP_Site $site ): void {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		if ( is_plugin_active_for_network( plugin_basename( CFF_FILE ) ) ) {
			switch_to_blog( (int) $site->blog_id );
			try {
				self::activate();
			} finally {
				restore_current_blog();
			}
		}
	}

	public static function uninitializeSite( \WP_Site $site ): void {
		// Site deletion is an explicit WordPress lifecycle operation, not plugin uninstall.
		switch_to_blog( (int) $site->blog_id );
		try {
			self::deleteSiteData();
		} finally {
			restore_current_blog();
		}
	}

	public static function deactivate( bool $network_wide = false ): void {
		self::eachSite(
			$network_wide,
			static function (): void {
				self::unschedule();
				flush_rewrite_rules( false );
			}
		);
	}

	public static function uninstall(): void {
		self::eachSite(
			is_multisite(),
			static function (): void {
				self::unschedule();
				$settings = get_option( 'cff_settings', array() );
				if ( is_array( $settings ) && true === ( $settings['delete_data_on_uninstall'] ?? false ) ) {
					self::deleteSiteData();
				}
			}
		);
	}

	private static function unschedule(): void {
		foreach ( array( 'cff_retention', 'cff_abandon_sessions', 'cff_refresh_cloudflare_ranges', 'cff_aggregate_stats', 'cff_recover_deliveries', 'cff_dispatch_delivery', 'cff_export_batch', 'cff_purge_batch', 'cff_private_cleanup' ) as $hook ) {
			wp_clear_scheduled_hook( $hook );
		}
		if ( function_exists( 'as_unschedule_all_actions' ) && class_exists( '\\ActionScheduler_StoreSchema' ) && ( new \ActionScheduler_StoreSchema() )->tables_exist() ) {
			as_unschedule_all_actions( '', array(), 'cff' );
		}
	}

	private static function deleteSiteData(): void {
		global $wpdb;
		( new \ChatFlow\Privacy\PrivateFiles() )->cleanupSite();
		foreach ( self::TABLES as $table ) {
			$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $wpdb->prefix . 'cff_' . $table ) );
		}
		foreach ( get_posts(
			array(
				'post_type'   => 'cff_form',
				'post_status' => array_keys( get_post_stati() ),
				'numberposts' => -1,
				'fields'      => 'ids',
			)
		) as $id ) {
			wp_delete_post( (int) $id, true );
		}
		$grants = get_option( 'cff_cap_grants', array() );
		if ( is_array( $grants ) ) {
			foreach ( $grants as $name => $caps ) {
				$role = get_role( (string) $name );
				if ( $role && is_array( $caps ) ) {
					foreach ( array_intersect( $caps, self::CAPABILITIES ) as $cap ) {
						$role->remove_cap( $cap );
					}
				}
			}
		}
		foreach ( array( 'cff_db_version', 'cff_settings', 'cff_cap_grants', 'cff_frontend_base', 'cff_flush_rewrites', 'cff_cloudflare_ranges', 'cff_abandon_cursor' ) as $option ) {
			delete_option( $option );
		}
		foreach ( $wpdb->get_col( $wpdb->prepare( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s", $wpdb->esc_like( 'cff_purge_' ) . '%', $wpdb->esc_like( 'cff_cleanup_' ) . '%' ) ) as $option ) {
			delete_option( $option );
		}
	}

	private static function grantCapabilities(): void {
		/** @var array<string,list<string>> $mapping */
		$mapping = apply_filters( 'cff_capability_roles', array( 'administrator' => self::CAPABILITIES ) );
		$grants  = get_option( 'cff_cap_grants', array() );
		$grants  = is_array( $grants ) ? $grants : array();
		foreach ( $mapping as $name => $caps ) {
			$role = get_role( $name );
			if ( ! $role ) {
				continue;
			}
			foreach ( array_intersect( $caps, self::CAPABILITIES ) as $cap ) {
				if ( ! $role->has_cap( $cap ) ) {
					$role->add_cap( $cap );
					$grants[ $name ][] = $cap;
				}
			}
		}
		update_option( 'cff_cap_grants', $grants, false );
	}

	/** @param callable():void $callback */
	private static function eachSite( bool $network_wide, callable $callback ): void {
		if ( ! is_multisite() || ! $network_wide ) {
			$callback();
			return;
		}
		$offset = 0;
		do {
			$ids = get_sites(
				array(
					'fields'  => 'ids',
					'number'  => 100,
					'offset'  => $offset,
					'orderby' => 'id',
					'order'   => 'ASC',
				)
			);
			foreach ( $ids as $id ) {
				switch_to_blog( (int) $id );
				try {
					$callback();
				} finally {
					restore_current_blog();
				}
			}
			$offset += 100;
		} while ( count( $ids ) === 100 );
	}

	public static function migrate(): void {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$current = (int) get_option( 'cff_db_version', 0 );
		for ( $version = $current + 1; $version <= self::DB_VERSION; ++$version ) {
			foreach ( self::migrationSql( $version ) as $sql ) {
				dbDelta( $sql );
				if ( '' !== $wpdb->last_error ) {
					throw new \RuntimeException( 'ChatFlow database migration failed; version was not advanced.' );
				}
			}
			update_option( 'cff_db_version', $version, false );
		}
	}

	/** @return list<string> */
	private static function migrationSql( int $version ): array {
		global $wpdb;
		$p = $wpdb->prefix . 'cff_';
		$c = $wpdb->get_charset_collate();
		if ( 1 === $version ) {
			return array(
				"CREATE TABLE {$p}form_versions (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					form_id bigint(20) unsigned NOT NULL,
					version int unsigned NOT NULL,
					form_title text NOT NULL,
					form_slug varchar(200) NOT NULL,
					schema longtext NOT NULL,
					settings longtext NOT NULL,
					schema_hash char(64) NOT NULL,
					created_at datetime NOT NULL,
					created_by bigint(20) unsigned NOT NULL DEFAULT 0,
					PRIMARY KEY  (id),
					UNIQUE KEY form_version (form_id,version)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}submissions (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					uuid char(36) NOT NULL,
					form_id bigint(20) unsigned NOT NULL,
					form_version int unsigned NOT NULL,
					status varchar(20) NOT NULL DEFAULT 'partial',
					answers longtext NOT NULL,
					variables longtext NOT NULL,
					visited longtext NOT NULL,
					consent longtext NOT NULL,
					meta longtext NOT NULL,
					ending_id varchar(64) NOT NULL DEFAULT '',
					current_step_id varchar(64) NOT NULL DEFAULT '',
					progress smallint unsigned NOT NULL DEFAULT 0,
					is_read tinyint(1) NOT NULL DEFAULT 0,
					is_starred tinyint(1) NOT NULL DEFAULT 0,
					user_id bigint(20) unsigned DEFAULT NULL,
					ip varbinary(16) DEFAULT NULL,
					user_agent text,
					browser varchar(100) NOT NULL DEFAULT '',
					browser_version varchar(50) NOT NULL DEFAULT '',
					os varchar(100) NOT NULL DEFAULT '',
					os_version varchar(50) NOT NULL DEFAULT '',
					device_type varchar(32) NOT NULL DEFAULT '',
					device_brand varchar(100) NOT NULL DEFAULT '',
					page_url text,
					referrer text,
					landing_page text,
					landing_referrer text,
					utm_source varchar(255) NOT NULL DEFAULT '',
					utm_medium varchar(255) NOT NULL DEFAULT '',
					utm_campaign varchar(255) NOT NULL DEFAULT '',
					utm_term varchar(255) NOT NULL DEFAULT '',
					utm_content varchar(255) NOT NULL DEFAULT '',
					click_ids longtext,
					locale varchar(32) NOT NULL DEFAULT '',
					timezone varchar(64) NOT NULL DEFAULT '',
					screen varchar(32) NOT NULL DEFAULT '',
					country char(2) DEFAULT NULL,
					started_at datetime NOT NULL,
					completed_at datetime DEFAULT NULL,
					abandoned_at datetime DEFAULT NULL,
					duration_ms bigint unsigned NOT NULL DEFAULT 0,
					step_timings longtext,
					spam_reasons longtext,
					created_at datetime NOT NULL,
					updated_at datetime NOT NULL,
					PRIMARY KEY  (id),
					UNIQUE KEY uuid (uuid),
					KEY form_status_created (form_id,status,created_at),
					KEY status_updated (status,updated_at),
					KEY utm_source (utm_source(64)),
					KEY utm_campaign (utm_campaign(64)),
					KEY user_id (user_id)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}submission_values (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					submission_id bigint(20) unsigned NOT NULL,
					field_id varchar(64) NOT NULL,
					field_key varchar(64) NOT NULL,
					value_text longtext,
					value_num decimal(30,10) DEFAULT NULL,
					PRIMARY KEY  (id),
					UNIQUE KEY submission_field (submission_id,field_key),
					KEY field_text (field_key,value_text(64)),
					KEY field_num (field_key,value_num)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}submission_notes (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					submission_id bigint(20) unsigned NOT NULL,
					user_id bigint(20) unsigned NOT NULL DEFAULT 0,
					type varchar(32) NOT NULL,
					body longtext NOT NULL,
					created_at datetime NOT NULL,
					PRIMARY KEY  (id),
					KEY submission_created (submission_id,created_at)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}sessions (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					public_id char(36) NOT NULL,
					resume_hash char(64) NOT NULL,
					form_id bigint(20) unsigned NOT NULL,
					form_version int unsigned NOT NULL,
					submission_id bigint(20) unsigned DEFAULT NULL,
					status varchar(20) NOT NULL DEFAULT 'active',
					revision bigint unsigned NOT NULL DEFAULT 0,
					context longtext NOT NULL,
					started_at datetime NOT NULL,
					last_seen_at datetime NOT NULL,
					expires_at datetime NOT NULL,
					closed_at datetime DEFAULT NULL,
					PRIMARY KEY  (id),
					UNIQUE KEY public_id (public_id),
					UNIQUE KEY resume_hash (resume_hash),
					KEY form_status (form_id,status),
					KEY expiry (expires_at),
					KEY submission_id (submission_id)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}requests (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					scope_hash char(64) NOT NULL,
					key_hash char(64) NOT NULL,
					request_hash char(64) NOT NULL,
					status varchar(20) NOT NULL DEFAULT 'pending',
					response longtext,
					response_code smallint unsigned DEFAULT NULL,
					expires_at datetime NOT NULL,
					PRIMARY KEY  (id),
					UNIQUE KEY scope_key (scope_hash,key_hash),
					KEY expiry (expires_at)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}uploads (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					uuid char(36) NOT NULL,
					session_id bigint(20) unsigned NOT NULL,
					submission_id bigint(20) unsigned DEFAULT NULL,
					field_id varchar(64) NOT NULL,
					storage_key varchar(255) NOT NULL,
					original_name varchar(255) NOT NULL,
					mime varchar(100) NOT NULL,
					bytes bigint unsigned NOT NULL,
					created_at datetime NOT NULL,
					expires_at datetime DEFAULT NULL,
					PRIMARY KEY  (id),
					UNIQUE KEY uuid (uuid),
					KEY submission_id (submission_id),
					KEY session_id (session_id),
					KEY expiry (expires_at)
				) ENGINE=InnoDB {$c};",
			);
		}
		if ( 2 === $version ) {
			return array(
				"CREATE TABLE {$p}events (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					form_id bigint(20) unsigned NOT NULL,
					form_version int unsigned NOT NULL,
					session_id bigint(20) unsigned NOT NULL,
					step_id varchar(64) NOT NULL DEFAULT '',
					event varchar(32) NOT NULL,
					variant_id varchar(64) NOT NULL DEFAULT '',
					payload longtext,
					ts datetime NOT NULL,
					PRIMARY KEY  (id),
					KEY form_event_ts (form_id,event,ts),
					KEY session_id (session_id)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}stats_daily (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					form_id bigint(20) unsigned NOT NULL,
					form_version int unsigned NOT NULL,
					day date NOT NULL,
					metric varchar(32) NOT NULL,
					dimension_hash char(64) NOT NULL,
					dimension longtext NOT NULL,
					value decimal(30,10) NOT NULL DEFAULT 0,
					PRIMARY KEY  (id),
					UNIQUE KEY rollup (form_id,form_version,day,metric,dimension_hash)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}exports (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					uuid char(36) NOT NULL,
					user_id bigint(20) unsigned NOT NULL,
					form_id bigint(20) unsigned NOT NULL,
					status varchar(20) NOT NULL,
					format varchar(10) NOT NULL DEFAULT 'csv',
					criteria longtext NOT NULL,
					storage_key varchar(255) NOT NULL DEFAULT '',
					download_hash char(64) NOT NULL DEFAULT '',
					cursor_id bigint unsigned NOT NULL DEFAULT 0,
					row_count bigint unsigned NOT NULL DEFAULT 0,
					created_at datetime NOT NULL,
					expires_at datetime NOT NULL,
					PRIMARY KEY  (id),
					UNIQUE KEY uuid (uuid),
					KEY user_status (user_id,status),
					KEY expiry (expires_at)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}deliveries (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					submission_id bigint(20) unsigned NOT NULL,
					form_version int unsigned NOT NULL,
					event varchar(64) NOT NULL,
					channel varchar(32) NOT NULL,
					destination_id varchar(64) NOT NULL,
					dedupe_hash char(64) NOT NULL,
					status varchar(20) NOT NULL DEFAULT 'pending',
					attempts smallint unsigned NOT NULL DEFAULT 0,
					action_id bigint unsigned DEFAULT NULL,
					payload longtext NOT NULL,
					last_error varchar(255) NOT NULL DEFAULT '',
					next_attempt_at datetime DEFAULT NULL,
					created_at datetime NOT NULL,
					updated_at datetime NOT NULL,
					PRIMARY KEY  (id),
					UNIQUE KEY dedupe_hash (dedupe_hash),
					KEY submission_id (submission_id),
					KEY status_next (status,next_attempt_at)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}audit_log (
					id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
					user_id bigint(20) unsigned NOT NULL DEFAULT 0,
					event varchar(64) NOT NULL,
					criteria longtext NOT NULL,
					affected_count bigint unsigned NOT NULL DEFAULT 0,
					created_at datetime NOT NULL,
					PRIMARY KEY  (id),
					KEY event_created (event,created_at)
				) ENGINE=InnoDB {$c};",
				"CREATE TABLE {$p}rate_limits (
					bucket_hash char(64) NOT NULL,
					hits int unsigned NOT NULL DEFAULT 0,
					expires_at datetime NOT NULL,
					PRIMARY KEY  (bucket_hash),
					KEY expiry (expires_at)
				) ENGINE=InnoDB {$c};",
			);
		}
		return array();
	}
}
