<?php
namespace ChatFlow\Integrations\Elementor;

use ChatFlow\Forms\FormRepository;

if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
	return;
}

final class FormWidget extends \Elementor\Widget_Base {
	public function get_name(): string {
		return 'chatflow-form'; }
	public function get_title(): string {
		return __( 'ChatFlow Form', 'chatflow-forms' ); }
	public function get_icon(): string {
		return 'eicon-chat'; }
	/** @return list<string> */
	public function get_categories(): array {
		return array( 'general' ); }
	/** @return list<string> */
	public function get_keywords(): array {
		return array( 'chatflow', 'form', 'chat' ); }
	protected function register_controls(): void {
		$this->start_controls_section( 'cff_content', array( 'label' => __( 'ChatFlow form', 'chatflow-forms' ) ) );
		$this->add_control(
			'form_id',
			array(
				'label'       => __( 'Published form ID', 'chatflow-forms' ),
				'type'        => \Elementor\Controls_Manager::NUMBER,
				'min'         => 1,
				'step'        => 1,
				'default'     => 0,
				'description' => __( 'Copy the ID from ChatFlow Forms. Only published forms render.', 'chatflow-forms' ),
			)
		);
		$this->add_control(
			'mode',
			array(
				'label'   => __( 'Display mode', 'chatflow-forms' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'default' => 'inline',
				'options' => array(
					'inline'   => __( 'Inline', 'chatflow-forms' ),
					'fullpage' => __( 'Full page', 'chatflow-forms' ),
					'launcher' => __( 'Launcher', 'chatflow-forms' ),
					'popup'    => __( 'Popup', 'chatflow-forms' ),
				),
			)
		);
		$this->add_control(
			'height',
			array(
				'label'   => __( 'Minimum height', 'chatflow-forms' ),
				'type'    => \Elementor\Controls_Manager::NUMBER,
				'min'     => 200,
				'max'     => 2000,
				'step'    => 1,
				'default' => 600,
			)
		);
		$this->end_controls_section();
	}
	protected function render(): void {
		$settings = $this->get_settings_for_display();
		$id       = absint( $settings['form_id'] ?? 0 );
		if ( ! $id || ! ( new FormRepository() )->getPublished( $id ) ) {
			if ( current_user_can( 'cff_manage_forms' ) ) {
				echo '<p>' . esc_html__( 'Choose a published ChatFlow form ID.', 'chatflow-forms' ) . '</p>'; }
			return;
		}
		$mode   = in_array( $settings['mode'] ?? '', array( 'inline', 'fullpage', 'launcher', 'popup' ), true ) ? $settings['mode'] : 'inline';
		$height = max( 200, min( 2000, (int) ( $settings['height'] ?? 600 ) ) );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Numeric ID/height, whitelisted mode; core shortcode renderer escapes its public projection.
		echo do_shortcode( '[chatflow id="' . $id . '" mode="' . $mode . '" height="' . $height . '"]' );
	}
}
