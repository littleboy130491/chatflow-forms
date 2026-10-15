<?php
namespace ChatFlow\Templates;

/** Built-in vendor-neutral starting points. All content is editable before publishing. */
final class Starter {
	/** @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>} */
	public static function contact(): array {
		return self::form(
			'Contact request',
			array(
				self::step( 'intro', 'statement', 'Welcome', array( 'Hello! Tell us how we can help.' ) ),
				self::step( 'name', 'short_text', 'Your name', array( 'What should we call you?' ), true ),
				self::step( 'email', 'email', 'Email address', array( 'Where can we reply to you?' ), true ),
				self::step(
					'topic',
					'single_choice',
					'Reason for contact',
					array( 'What would you like to discuss?' ),
					true,
					array(
						'options' => self::options( 'topic', array( 'Sales inquiry', 'Customer support', 'Partnership', 'Other' ) ),
					)
				),
				self::step( 'message', 'long_text', 'Your message', array( 'Tell us a little more.' ), true ),
				self::step(
					'consent',
					'consent',
					'Contact permission',
					array( 'May we use these details to respond to your request?' ),
					true,
					array(
						'settings' => array( 'consentText' => 'I agree to be contacted about this request.' ),
					)
				),
			),
			'Thank you! Your message has been recorded.'
		);
	}

	/** @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>} */
	public static function feedback(): array {
		return self::form(
			'Customer feedback',
			array(
				self::step( 'intro', 'statement', 'Welcome', array( 'We would appreciate your feedback.' ) ),
				self::step(
					'experience',
					'single_choice',
					'Overall experience',
					array( 'How would you describe your experience?' ),
					true,
					array(
						'options' => self::options( 'experience', array( 'Excellent', 'Good', 'Fair', 'Poor' ) ),
					)
				),
				self::step( 'improvements', 'long_text', 'Suggestions', array( 'What could we improve?' ) ),
				self::step( 'recommend', 'yes_no', 'Recommendation', array( 'Would you recommend us to someone else?' ) ),
			),
			'Thank you for sharing your feedback.'
		);
	}

	/**
	 * @param list<array<string,mixed>> $steps
	 * @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>}
	 */
	private static function form( string $title, array $steps, string $thanks ): array {
		return array(
			'title'    => $title,
			'schema'   => array(
				'schemaVersion' => 1,
				'bot'           => array(
					'name'        => 'Assistant',
					'typingSpeed' => 'normal',
				),
				'steps'         => $steps,
				'endings'       => array(
					array(
						'id'       => 'ending_thanks',
						'type'     => 'message',
						'messages' => array( $thanks ),
					),
				),
			),
			'settings' => array(
				'completion' => array( 'defaultEndingId' => 'ending_thanks' ),
				'appearance' => array( 'theme' => 'light', 'primary' => '#262626' ),
				'sessions'   => array(
					'savePartial'    => true,
					'resumeEnabled' => true,
					'resumePrompt'  => true,
					'resumeDays'    => 30,
					'abandonDays'   => 30,
				),
				'spam'       => array(
					'honeypotEnabled'   => true,
					'minSeconds'        => 2,
					'rateLimit'         => 10,
					'rateWindowSeconds' => 600,
					'captcha'           => 'none',
					'akismetEnabled'    => false,
				),
				'notifications' => array(
					'admin'          => array(),
					'autoresponders' => array(),
				),
			),
		);
	}

	/**
	 * @param list<string> $messages
	 * @param array<string,mixed> $extra
	 * @return array<string,mixed>
	 */
	private static function step( string $key, string $type, string $label, array $messages, bool $required = false, array $extra = array() ): array {
		return array_merge(
			array(
				'id'       => 'step_' . $key,
				'key'      => $key,
				'type'     => $type,
				'label'    => $label,
				'messages' => $messages,
				'required' => $required,
			),
			$extra
		);
	}

	/** @param list<string> $labels
	 * @return list<array{id:string,value:string,label:string}>
	 */
	private static function options( string $key, array $labels ): array {
		$options = array();
		foreach ( $labels as $index => $label ) {
			$options[] = array(
				'id'    => 'option_' . $key . '_' . $index,
				'value' => $label,
				'label' => $label,
			);
		}
		return $options;
	}
}
