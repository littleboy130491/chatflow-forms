<?php
namespace ChatFlow\Forms;

use ChatFlow\Submissions\Database;

final class EditLock {
	public static function acquire( int $id ): bool|\WP_Error {
		if ( 'cff_form' !== get_post_type( $id ) ) {
			return Database::error( 'cff_not_found', 'Form not found.', 404 );
		}
		if ( ! function_exists( 'wp_check_post_lock' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}
		if ( wp_check_post_lock( $id ) ) {
			return Database::error( 'cff_form_locked', 'Another administrator is editing this form. Your local draft is retained; retry after their editing lock expires.', 409 );
		}
		wp_set_post_lock( $id );
		return true;
	}
}
