<?php
namespace ChatFlow\Spam;

use ChatFlow\Forms\Form;

final class Protection {
	/**
	 * @param array<string,mixed> $body
	 * @return list<string> */
	public function reasons( Form $form, array $body, int $started ): array {
		$settings = array_merge( \ChatFlow\Rest\Settings::get()['spam'], $form->settings()['spam'] ?? array() );
		$reasons  = array();
		if ( ( $settings['honeypotEnabled'] ?? true ) && '' !== ( $body['honeypot'] ?? '' ) ) {
			$reasons[] = 'honeypot';
		}
		if ( time() - $started < ( $settings['minSeconds'] ?? 3 ) ) {
			$reasons[] = 'time_trap';
		}
		$global   = \ChatFlow\Rest\Settings::get();
		$provider = $form->settings()['spam']['captcha'] ?? $global['spam']['captcha'] ?? 'none';
		if ( ! ( new Captcha() )->verify( $provider, $body['captchaToken'] ?? null, $global['spam'] ) ) {
			$reasons[] = 'captcha_failed'; }
		if ( ! $reasons && ( $settings['akismetEnabled'] ?? $global['spam']['akismetEnabled'] ?? false ) ) {
			$result = ( new Akismet() )->check( $form, is_array( $body['answers'] ?? null ) ? $body['answers'] : array(), $global, $_SERVER );
			if ( false !== $result ) {
				$reasons[] = null === $result ? 'akismet_unavailable' : 'akismet_spam'; }
		}
		return $reasons;
	}
}
