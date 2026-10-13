<?php
namespace ChatFlow\Spam;

use ChatFlow\Forms\Form;

final class Protection {
	/** @param array<string,mixed> $body @return list<string> */
	public function reasons( Form $form, array $body, int $started ): array {
		$settings = array_merge( \ChatFlow\Rest\Settings::get()['spam'], $form->settings()['spam'] ?? array() );
		$reasons  = array();
		if ( ( $settings['honeypotEnabled'] ?? true ) && '' !== ( $body['honeypot'] ?? '' ) ) {
			$reasons[] = 'honeypot';
		}
		if ( time() - $started < ( $settings['minSeconds'] ?? 3 ) ) {
			$reasons[] = 'time_trap';
		}
		return $reasons;
	}
}
