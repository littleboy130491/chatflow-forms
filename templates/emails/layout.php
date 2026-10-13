<?php
/** @var array $branding */
/** @var string $content */
/** @var string $title */
defined( 'ABSPATH' ) || exit;
$color = sanitize_hex_color( $branding['brandColor'] ?? '#262626' );
$color = $color ? $color : '#262626';
$logo  = esc_url( $branding['logoUrl'] ?? '', array( 'https' ) );
?>
<!doctype html><html><head><meta charset="utf-8"><title><?php echo esc_html( $title ); ?></title></head>
<body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#262626"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:24px"><table role="presentation" style="max-width:640px;width:100%;margin:auto;background:#fff;border-top:4px solid <?php echo esc_attr( $color ); ?>"><tr><td style="padding:28px">
<?php
if ( $logo ) :
	?>
	<p><img src="<?php echo esc_url( $logo, array( 'https' ) ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" style="max-width:180px;height:auto"></p><?php endif; ?>
<?php echo wp_kses( $content, \ChatFlow\Notifications\Renderer::allowedHtml() ); ?>
<hr><p style="font-size:12px;color:#737373"><?php echo esc_html( $branding['footerText'] ?? get_bloginfo( 'name' ) ); ?></p>
</td></tr></table></td></tr></table></body></html>
