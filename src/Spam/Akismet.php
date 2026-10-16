<?php
namespace ChatFlow\Spam;

use ChatFlow\Forms\Form;
use ChatFlow\Tracking\IpResolver;

final class Akismet {
	/** null = service unavailable (quarantine), true = spam, false = ham.
	 * @param array<string,mixed> $answers
	 * @param array<string,mixed> $settings
	 * @param array<string,mixed> $server */
	public function check( Form $form, array $answers, array $settings, array $server ): ?bool {
		$key = $settings['spam']['akismetKey'] ?? '';
		$ip  = ( new IpResolver() )->resolve( $server, $settings['proxy'] ?? array() );
		if ( ! is_string( $key ) || '' === $key || ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return null; }
		$body = array(
			'api_key'         => $key,
			'blog'            => home_url( '/' ),
			'user_ip'         => $ip,
			'comment_type'    => 'contact-form',
			'comment_content' => '',
		);
		foreach ( $form->schema()['steps'] as $step ) {
			$value = $answers[ $step['key'] ] ?? null;
			if ( ! is_string( $value ) ) {
				continue; }
			if ( 'email' === $step['type'] ) {
				$body['comment_author_email'] = substr( $value, 0, 254 ); }
			if ( in_array( $step['type'], array( 'short_text', 'long_text' ), true ) ) {
				$body['comment_content'] = mb_substr( $body['comment_content'] . "\n" . $value, 0, 10000, 'UTF-8' ); }
		}
		// Only the configured service receives these deliberate fields, not arbitrary server headers.
		$response = wp_remote_post(
			'https://rest.akismet.com/1.1/comment-check',
			array(
				'timeout'             => 8,
				'redirection'         => 0,
				'sslverify'           => true,
				'limit_response_size' => 1024,
				'body'                => $body,
			)
		);
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null; }
		return match ( trim( wp_remote_retrieve_body( $response ) ) ) {
			'true' => true, 'false' => false, default => null };
	}
}
