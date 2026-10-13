<?php
/** @var string $body */
defined( 'ABSPATH' ) || exit;
echo wp_kses( $body, \ChatFlow\Notifications\Renderer::allowedHtml() );
