<?php
/** @var string $title */
/** @var string $body */
defined( 'ABSPATH' ) || exit;
?>
<h2><?php echo esc_html( $title ); ?></h2>
<?php echo wp_kses( $body, \ChatFlow\Notifications\Renderer::allowedHtml() ); ?>
