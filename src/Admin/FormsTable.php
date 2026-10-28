<?php
namespace ChatFlow\Admin;

use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\Statistics;

if ( ! class_exists( '\WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

final class FormsTable extends \WP_List_Table {
	public function __construct( private FormRepository $forms ) {
		parent::__construct(
			array(
				'singular' => 'cff_form',
				'plural'   => 'cff_forms',
				'ajax'     => false,
			)
		);
	}

	/** @return array<string,string> */
	public function get_columns(): array {
		return array(
			'name'             => __( 'Name', 'chatflow-forms' ),
			'status'           => __( 'Status', 'chatflow-forms' ),
			'completed'        => __( 'Submissions', 'chatflow-forms' ),
			'completionRate'   => __( 'Completion rate', 'chatflow-forms' ),
			'lastSubmissionAt' => __( 'Last submission', 'chatflow-forms' ),
			'shortcode'        => __( 'Shortcode', 'chatflow-forms' ),
		);
	}

	/** @return array<string,array{string,bool}> */
	protected function get_sortable_columns(): array {
		return array( 'name' => array( 'title', false ) );
	}

	/** @return array<string,string> */
	protected function get_views(): array {
		if ( ! current_user_can( 'cff_manage_forms' ) ) {
			return array();
		}
		$current = $this->currentStatus();
		$current = '' === $current ? 'all' : $current;
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only list filter.
		$search  = isset( $_GET['s'] ) && is_string( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		$views   = array();
		foreach ( array(
			'all'     => __( 'All', 'chatflow-forms' ),
			'draft'   => __( 'Draft', 'chatflow-forms' ),
			'publish' => __( 'Live', 'chatflow-forms' ),
			'trash'   => __( 'Trash', 'chatflow-forms' ),
		) as $view => $label ) {
			$args = array( 'page' => 'cff-forms' );
			if ( 'all' !== $view ) {
				$args['status'] = $view;
			}
			if ( '' !== $search ) {
				$args['s'] = $search;
			}
			$current_attr = $view === $current ? ' class="current" aria-current="page"' : '';
			$views[ $view ] = '<a href="' . esc_url( add_query_arg( $args, admin_url( 'admin.php' ) ) ) . '"' . $current_attr . '>' . esc_html( $label ) . '</a>';
		}
		return $views;
	}

	private function currentStatus(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only list filter.
		$status = isset( $_GET['status'] ) && is_string( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : '';
		return in_array( $status, array( 'draft', 'publish', 'trash' ), true ) ? $status : '';
	}

	public function isTrashView(): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only list filter.
		return isset( $_GET['status'] ) && 'trash' === $_GET['status'];
	}

	public function prepare_items(): void {
		if ( ! current_user_can( 'cff_manage_forms' ) ) {
			$this->items = array();
			return;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only list filters.
		$status  = isset( $_GET['status'] ) && is_string( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : '';
		$search  = isset( $_GET['s'] ) && is_string( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		$orderby = isset( $_GET['orderby'] ) && 'title' === $_GET['orderby'] ? 'title' : 'modified';
		$order   = isset( $_GET['order'] ) && is_string( $_GET['order'] ) && 'asc' === strtolower( $_GET['order'] ) ? 'ASC' : 'DESC';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		$query       = new \WP_Query(
			array(
				'post_type'      => 'cff_form',
				'post_status'    => in_array( $status, array( 'draft', 'publish', 'trash' ), true ) ? $status : array( 'draft', 'publish' ),
				'posts_per_page' => 20,
				'paged'          => $this->get_pagenum(),
				'orderby'        => $orderby,
				'order'          => $order,
				's'              => $search,
			)
		);
		$this->items = array();
		foreach ( $query->posts as $post ) {
			if ( 'trash' === $post->post_status ) {
				// Trashed forms cannot be loaded as drafts; list them by post data only.
				$this->items[] = array_merge(
					array(
						'id'     => (int) $post->ID,
						'name'   => $post->post_title,
						'status' => 'trash',
					),
					Statistics::get( (int) $post->ID )
				);
				continue;
			}
			$form = $this->forms->getDraft( $post->ID );
			if ( $form ) {
				$display   = $form->settings()['display'] ?? array();
				$mode      = in_array( $display['mode'] ?? 'inline', array( 'inline', 'fullpage', 'launcher', 'popup' ), true ) ? $display['mode'] : 'inline';
				$position  = ( 'launcher' === $mode || 'popup' === $mode ) && 'left' === ( $display['launcher']['position'] ?? 'right' ) ? ' position="left"' : '';
				$shortcode = '[chatflow id="' . $form->id() . '" mode="' . $mode . '"' . $position . ']';
				$this->items[] = array_merge(
					array(
						'id'        => $form->id(),
						'name'      => $form->title(),
						'status'    => $form->status(),
						'shortcode' => $shortcode,
					),
					Statistics::get( $form->id() )
				);
			}
		}
		$this->_column_headers = array( $this->get_columns(), array(), $this->get_sortable_columns(), 'name' );
		$this->set_pagination_args(
			array(
				'total_items' => $query->found_posts,
				'per_page'    => 20,
			)
		);
	}

	/** @param array<string,mixed> $item */
	public function column_name( $item ): string {
		if ( 'trash' === ( $item['status'] ?? '' ) ) {
			$actions = array(
				'untrash' => '<a href="' . esc_url( AdminModule::trashActionUrl( 'restore', (int) $item['id'] ) ) . '">' . esc_html__( 'Restore', 'chatflow-forms' ) . '</a>',
				'delete'  => '<a class="submitdelete" href="' . esc_url( AdminModule::trashActionUrl( 'delete', (int) $item['id'] ) ) . '" data-cff-confirm="' . esc_attr__( 'Delete this form permanently? This cannot be undone. Forms that still have submissions cannot be deleted.', 'chatflow-forms' ) . '">' . esc_html__( 'Delete permanently', 'chatflow-forms' ) . '</a>',
			);
			return '<strong>' . esc_html( $item['name'] ) . '</strong>' . $this->row_actions( $actions );
		}
		$edit                 = add_query_arg(
			array(
				'page'   => 'cff-builder',
				'formId' => $item['id'],
			),
			admin_url( 'admin.php' )
		);
		$actions              = array( 'edit' => '<a href="' . esc_url( $edit ) . '">' . esc_html__( 'Edit', 'chatflow-forms' ) . '</a>' );
		$actions['duplicate'] = $this->button( $item['id'], 'duplicate', __( 'Duplicate', 'chatflow-forms' ) );
		$actions['preview']   = '<a href="' . esc_url( add_query_arg( 'preview', '1', $edit ) ) . '">' . esc_html__( 'Preview', 'chatflow-forms' ) . '</a>';
		$actions['export']    = $this->button( $item['id'], 'export', __( 'Export JSON', 'chatflow-forms' ) );
		$actions['trash']     = $this->button( $item['id'], 'trash', __( 'Trash', 'chatflow-forms' ) );
		return '<strong><a href="' . esc_url( $edit ) . '">' . esc_html( $item['name'] ) . '</a></strong>' . $this->row_actions( $actions );
	}

	/** @param array<string,mixed> $item */
	public function column_default( $item, $column_name ): string {
		if ( 'shortcode' === $column_name ) {
			$shortcode = (string) ( $item['shortcode'] ?? '[chatflow id="' . (int) $item['id'] . '"]' );
			return '<code>' . esc_html( $shortcode ) . '</code> ' . $this->button( $item['id'], 'copy', __( 'Copy', 'chatflow-forms' ), $shortcode );
		}
		if ( 'status' === $column_name ) {
			$labels = array(
				'publish' => __( 'Live', 'chatflow-forms' ),
				'trash'   => __( 'Trash', 'chatflow-forms' ),
				'draft'   => __( 'Draft', 'chatflow-forms' ),
			);
			$status = (string) ( $item['status'] ?? 'draft' );
			$class  = 'publish' === $status ? 'is-live' : ( 'trash' === $status ? 'is-trash' : 'is-draft' );
			return '<span class="cff-status-pill ' . esc_attr( $class ) . '">' . esc_html( $labels[ $status ] ?? __( 'Draft', 'chatflow-forms' ) ) . '</span>';
		}
		if ( 'lastSubmissionAt' === $column_name ) {
			$value = $item[ $column_name ] ?? null;
			if ( ! is_string( $value ) || '' === $value ) {
				return '—';
			}
			$timestamp = strtotime( $value . ' UTC' );
			return esc_html( false === $timestamp ? $value : wp_date( 'M j, Y H:i', $timestamp ) );
		}
		$value = $item[ $column_name ] ?? '—';
		return esc_html( (string) $value ) . ( 'completionRate' === $column_name ? '%' : '' );
	}

	public function no_items(): void {
		if ( $this->isTrashView() ) {
			esc_html_e( 'No forms in the trash.', 'chatflow-forms' );
			return;
		}
		esc_html_e( 'No forms found.', 'chatflow-forms' );
	}

	private function button( int $id, string $action, string $label, ?string $shortcode = null ): string {
		$data = ' data-cff-action="' . esc_attr( $action ) . '" data-form-id="' . esc_attr( (string) $id ) . '"';
		if ( null !== $shortcode ) {
			$data .= ' data-cff-shortcode="' . esc_attr( $shortcode ) . '"';
		}
		return '<button type="button" class="button-link"' . $data . '>' . esc_html( $label ) . '</button>';
	}
}
