<?php
// Isolated WordPress boundary doubles: the module and export callback are real.
namespace ChatFlow\Privacy;

function add_action( $hook, $callback ): void {
	$GLOBALS['cff_download_hooks'][ $hook ] = $callback;
}
function add_filter( $hook, $callback ): void {}
function absint( $value ): int {
	return abs( (int) $value );
}
function wp_unslash( $value ): string {
	return stripslashes( $value );
}
function is_user_logged_in(): bool {
	return $GLOBALS['cff_download_logged_in'];
}
function current_user_can( $capability ): bool {
	\PHPUnit\Framework\Assert::assertSame( 'cff_export_submissions', $capability );
	return $GLOBALS['cff_download_capable'];
}
function wp_verify_nonce( $nonce, $action ): bool {
	++$GLOBALS['cff_download_nonce_checks'];
	\PHPUnit\Framework\Assert::assertSame( 'private-nonce', $nonce );
	\PHPUnit\Framework\Assert::assertSame( 'cff_export_42', $action );
	return $GLOBALS['cff_download_nonce'];
}
function esc_html__( $message, $domain ): string {
	return $message;
}
function wp_die( $message, $title, $args ): void {
	// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Test-only wp_die boundary; preserve message and HTTP status for assertions.
	throw new \RuntimeException( $message, $args['response'] );
}
