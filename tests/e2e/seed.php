<?php
/**
 * Disposable wp-env browser fixture. Do not execute on a live WordPress site.
 * Usage: CFF_E2E=1 wp eval-file tests/e2e/seed.php
 */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI || '1' !== getenv( 'CFF_E2E' ) || ! in_array( wp_parse_url( home_url(), PHP_URL_HOST ), array( 'localhost', '127.0.0.1' ), true ) ) {
	throw new \RuntimeException( 'The E2E fixture may only run under local wp-env with CFF_E2E=1.' );
}
if ( ! class_exists( \ChatFlow\Forms\FormRepository::class ) ) {
	throw new \RuntimeException( 'Activate ChatFlow Forms before seeding the browser fixtures.' );
}
// The disposable wp-env fixture, never production: normalize admin credentials for repeatable login acceptance.
$e2e_admin = get_user_by( 'login', 'admin' );
if ( ! $e2e_admin ) {
	throw new \RuntimeException( 'The disposable environment is missing its admin user.' );
}
wp_set_password( 'password', $e2e_admin->ID );

$make_page = static function ( string $slug, string $body = '' ): int {
	$existing = get_page_by_path( $slug, OBJECT, 'page' );
	$args = array(
		'post_type'    => 'page',
		'post_name'    => $slug,
		'post_title'   => 'ChatFlow E2E: ' . $slug,
		'post_status'  => 'publish',
		'post_content' => $body,
	);
	if ( $existing ) {
		$args['ID'] = $existing->ID;
	}
	$id = wp_insert_post( $args, true );
	if ( is_wp_error( $id ) ) {
		throw new \RuntimeException( $id->get_error_message() );
	}
	return (int) $id;
};

$sitewide_page = $make_page( 'chatflow-e2e-sitewide', 'E2E site-wide placement target' );
$definition = \ChatFlow\Templates\Imajiner::definition();
$definition['schema']['bot']['typingSpeed'] = 'off';
$definition['settings']['spam']['minSeconds'] = 0;
$definition['settings']['notifications']['autoresponders'] = array();
$definition['settings']['display'] = array(
	'mode'     => 'launcher',
	'theme'    => 'light',
	'height'   => 600,
	'launcher' => array(
		'enabled'        => true,
		'position'       => 'right',
		'includePageIds' => array( $sitewide_page ),
		'excludePageIds' => array(),
	),
);
$forms = new \ChatFlow\Forms\FormRepository();
$draft = $forms->create( 'E2E Imajiner Survey', $definition['schema'], $definition['settings'] );
if ( is_wp_error( $draft ) ) {
	throw new \RuntimeException( $draft->get_error_message() );
}
$live = $forms->publish( $draft->id(), $draft->draftRevision() );
if ( is_wp_error( $live ) ) {
	throw new \RuntimeException( $live->get_error_message() );
}

$make_page( 'chatflow-e2e-inline', '[chatflow id="' . $live->id() . '" mode="inline"]' );
$make_page( 'chatflow-e2e-launcher', '[chatflow id="' . $live->id() . '" mode="launcher" position="left"]' );
$make_page( 'chatflow-e2e-popup', '[chatflow id="' . $live->id() . '" mode="popup"]' );
$make_page( 'chatflow-e2e-popup-auto', '[chatflow id="' . $live->id() . '" mode="popup" auto_open="1"]' );
// Four-field numeric feedback journey: actual WordPress persistence, validation, and frontend controls.
$score_steps = array();
foreach ( array(
	'rating' => array( 'label' => 'Rating', 'validation' => array() ),
	'scale'  => array( 'label' => 'Scale', 'validation' => array() ),
	'nps'    => array( 'label' => 'NPS', 'validation' => array() ),
	'slider' => array( 'label' => 'Slider', 'validation' => array( 'min' => 10, 'max' => 30, 'step' => 5 ) ),
) as $type => $meta ) {
	$score_steps[] = array(
		'id' => 'step_' . $type,
		'key' => $type,
		'type' => $type,
		'label' => $meta['label'],
		'messages' => array( 'Choose a ' . $type . ' value.' ),
		'required' => true,
		...( $meta['validation'] ? array( 'validation' => $meta['validation'] ) : array() ),
	);
}
$score_schema = array(
	'schemaVersion' => 1,
	'bot' => array( 'name' => 'Feedback Bot', 'typingSpeed' => 'off' ),
	'steps' => $score_steps,
	'endings' => array( array( 'id' => 'end_scores', 'type' => 'message', 'messages' => array( 'Feedback saved. Thank you!' ) ) ),
);
$score_settings = array(
	'completion' => array( 'defaultEndingId' => 'end_scores' ),
	'spam' => array( 'minSeconds' => 0 ),
);
$score_draft = $forms->create( 'E2E numeric scores', $score_schema, $score_settings );
if ( is_wp_error( $score_draft ) ) {
	throw new \RuntimeException( $score_draft->get_error_message() );
}
$score_live = $forms->publish( $score_draft->id(), $score_draft->draftRevision() );
if ( is_wp_error( $score_live ) ) {
	throw new \RuntimeException( $score_live->get_error_message() );
}
$make_page( 'chatflow-e2e-scores', '[chatflow id="' . $score_live->id() . '" mode="inline"]' );

update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules( false );
\WP_CLI::success( 'Created published form ' . $live->id() . ' and isolated E2E pages.' );
