<?php
namespace ChatFlow\Frontend;

use ChatFlow\Forms\Form;
use ChatFlow\Rest\Settings;
use ChatFlow\Spam\Captcha;

final class Engagement {
	/** Safe uncached projection: secret keys and private spam settings never leave PHP.
	 * @return array<string,mixed> */
	public static function config( Form $form ): array {
		$global = Settings::get();
		return array(
			'captcha'   => Captcha::publicConfig( $global['spam'], $form->settings()['spam'] ?? array() ),
			'analytics' => array(
				'enabled'         => (bool) $global['tracking']['enabled'],
				'consentRequired' => (bool) $global['tracking']['consentRequired'],
				'respectDnt'      => (bool) ( $global['privacy']['respectDnt'] || ( $form->settings()['privacy']['respectDnt'] ?? false ) ),
			),
		);
	}
}
