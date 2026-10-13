<?php
defined( 'ABSPATH' ) || exit;
$cff_form = $GLOBALS['cff_fullpage_form'] ?? null;
if ( ! $cff_form instanceof \ChatFlow\Forms\Form ) {
	return; }
?><!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo( 'charset' ); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?php echo esc_html( $cff_form->title() ); ?></title><?php wp_head(); ?></head>
<body <?php body_class( 'cff-fullpage' ); ?>><?php wp_body_open(); ?>
<main aria-label="<?php echo esc_attr( $cff_form->title() ); ?>"><?php echo cff_render_form( $cff_form->id() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Renderer escapes attributes and JSON. ?></main>
<?php wp_footer(); ?></body></html>
