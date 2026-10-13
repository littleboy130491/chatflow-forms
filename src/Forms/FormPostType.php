<?php
namespace ChatFlow\Forms;

final class FormPostType {
	public function register(): void {
		register_post_type(
			'cff_form',
			array(
				'labels'       => array(
					'name'          => __( 'ChatFlow Forms', 'chatflow-forms' ),
					'singular_name' => __( 'ChatFlow Form', 'chatflow-forms' ),
				),
				'public'       => false,
				'show_ui'      => true,
				'show_in_rest' => false,
				'rewrite'      => false,
				'query_var'    => false,
				'supports'     => array( 'title', 'revisions' ),
				'map_meta_cap' => false,
				'capabilities' => array_merge( array_fill_keys( array( 'edit_post', 'read_post', 'delete_post', 'edit_posts', 'edit_others_posts', 'read_private_posts', 'delete_posts', 'delete_private_posts', 'delete_published_posts', 'delete_others_posts', 'edit_private_posts', 'edit_published_posts', 'create_posts' ), 'cff_manage_forms' ), array( 'publish_posts' => 'do_not_allow' ) ),
			)
		);
		foreach ( array( '_cff_schema', '_cff_settings' ) as $key ) {
			register_post_meta(
				'cff_form',
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'show_in_rest'      => false,
					'revisions_enabled' => true,
					'auth_callback'     => static fn(): bool => current_user_can( 'cff_manage_forms' ),
				)
			);
		}
	}
}
