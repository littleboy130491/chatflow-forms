<?php
namespace ChatFlow\Spam;

final class Captcha {
	/** @param array<string,mixed> $settings
	 * @param array<string,mixed> $form
	 * @return array{provider:string,siteKey:string} */
	public static function publicConfig( array $settings, array $form ): array {
		$provider = $form['captcha'] ?? $settings['captcha'] ?? 'none';
		return array(
			'provider' => $provider,
			'siteKey'  => 'none' !== $provider && $provider === ( $settings['captcha'] ?? 'none' ) ? (string) ( $settings['siteKey'] ?? '' ) : '',
		);
	}

	/** @param array<string,mixed> $settings */
	public function verify( string $provider, mixed $token, array $settings ): bool {
		if ( 'none' === $provider ) {
			return true; }
		$endpoints = array(
			'turnstile' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
			'hcaptcha'  => 'https://api.hcaptcha.com/siteverify',
			'recaptcha' => 'https://www.google.com/recaptcha/api/siteverify',
		);
		if ( ! isset( $endpoints[ $provider ] ) || $provider !== ( $settings['captcha'] ?? 'none' ) || ! is_string( $token ) || '' === $token || strlen( $token ) > 2048 || empty( $settings['secretKey'] ) || empty( $settings['siteKey'] ) ) {
			return false; }
		$body = array(
			'secret'   => $settings['secretKey'],
			'response' => $token,
		);
		if ( 'hcaptcha' === $provider ) {
			$body['sitekey'] = $settings['siteKey']; }
		$response = wp_remote_post(
			$endpoints[ $provider ],
			array(
				'timeout'             => 8,
				'redirection'         => 0,
				'sslverify'           => true,
				'limit_response_size' => 8192,
				'body'                => $body,
			)
		);
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false; }
		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
		if ( ! is_array( $data ) || true !== ( $data['success'] ?? false ) || strtolower( (string) ( $data['hostname'] ?? '' ) ) !== $host ) {
			return false; }
		$timestamp = is_string( $data['challenge_ts'] ?? null ) ? strtotime( $data['challenge_ts'] ) : false;
		if ( false === $timestamp || $timestamp > time() + 30 || time() - $timestamp > ( 'recaptcha' === $provider ? 120 : 300 ) ) {
			return false; }
		if ( 'recaptcha' === $provider ) {
			return 'cff_submit' === ( $data['action'] ?? null ) && is_numeric( $data['score'] ?? null ) && $data['score'] >= ( $settings['minScore'] ?? 0.5 ) && $data['score'] <= 1;
		}
		return 'hcaptcha' === $provider || 'cff_submit' === ( $data['action'] ?? null );
	}
}
