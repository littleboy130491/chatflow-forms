<?php
namespace ChatFlow\Templates;

/** Built-in vendor-neutral starting points. All content is editable before publishing. */
final class Starter {
	/** @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>} */
	public static function contact(): array {
		return self::form(
			__( 'Contact request', 'chatflow-forms' ),
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
			__( 'Customer feedback', 'chatflow-forms' ),
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
	public static function form( string $title, array $steps, string $thanks ): array {
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
				'completion'    => array( 'defaultEndingId' => 'ending_thanks' ),
				'appearance'    => array(
					'theme'   => 'light',
					'primary' => '#262626',
				),
				'sessions'      => array(
					'savePartial'   => true,
					'resumeEnabled' => true,
					'resumePrompt'  => true,
					'resumeDays'    => 30,
					'abandonDays'   => 30,
				),
				'spam'          => array(
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
	public static function step( string $key, string $type, string $label, array $messages, bool $required = false, array $extra = array() ): array {
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
	public static function options( string $key, array $labels ): array {
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

	/** @return list<array{slug:string,title:string,description:string}> */
	public static function gallery(): array {
		return array(
			array(
				'slug'        => 'blank',
				'title'       => __( 'Blank', 'chatflow-forms' ),
				'description' => __( 'A welcome statement ready for your questions.', 'chatflow-forms' ),
			),
			array(
				'slug'        => 'lead-capture',
				'title'       => __( 'Lead capture', 'chatflow-forms' ),
				'description' => __( 'Contact details and an enquiry.', 'chatflow-forms' ),
			),
			array(
				'slug'        => 'health-intake',
				'title'       => __( 'Health intake', 'chatflow-forms' ),
				'description' => __( 'Intake request and explicit consent; not medical advice or emergency care.', 'chatflow-forms' ),
			),
			array(
				'slug'        => 'product-recommender',
				'title'       => __( 'Product recommender', 'chatflow-forms' ),
				'description' => __( 'Usage-based recommendations with two conditional endings.', 'chatflow-forms' ),
			),
			array(
				'slug'        => 'feedback-nps',
				'title'       => __( 'Feedback / NPS', 'chatflow-forms' ),
				'description' => __( 'A 0–10 recommendation score and optional feedback.', 'chatflow-forms' ),
			),
			array(
				'slug'        => 'appointment-request',
				'title'       => __( 'Appointment request', 'chatflow-forms' ),
				'description' => __( 'Requested date and contact details; no booking or availability promise.', 'chatflow-forms' ),
			),
		);
	}
	/** @return array{title:string,schema:array<string,mixed>,settings:array<string,mixed>} */
	public static function definition( string $slug ): array {
		$title = '';
		foreach ( self::gallery() as $item ) {
			if ( $item['slug'] === $slug ) {
				$title = $item['title'];
			}
		}
		if ( ! $title ) {
			throw new \InvalidArgumentException( 'Unknown template.' );
		}
		$field   = static fn( $key, $type, $label, $required = true ) => array(
			'id'       => 'step_' . $key,
			'key'      => $key,
			'type'     => $type,
			'label'    => $label,
			'messages' => array( $label ),
			'required' => $required,
		);
		$steps   = array( $field( 'name', 'short_text', __( 'Your name', 'chatflow-forms' ) ), $field( 'email', 'email', __( 'Your email', 'chatflow-forms' ) ) );
		$endings = array(
			array(
				'id'       => 'ending_thanks',
				'type'     => 'message',
				'messages' => array( __( 'Thank you. Your request has been received.', 'chatflow-forms' ) ),
			),
		);
		if ( 'blank' === $slug ) {
			$steps = array( $field( 'welcome', 'statement', __( 'Welcome! Add your questions in the builder.', 'chatflow-forms' ), false ) );
		} elseif ( 'lead-capture' === $slug ) {
			$steps[] = $field( 'company', 'short_text', __( 'Company', 'chatflow-forms' ), false );
			$steps[] = $field( 'enquiry', 'long_text', __( 'What would you like help with?', 'chatflow-forms' ) );
		} elseif ( 'health-intake' === $slug ) {
			array_unshift( $steps, $field( 'notice', 'statement', __( 'This is an intake request, not medical advice. For urgent care, contact local emergency services.', 'chatflow-forms' ), false ) );
			$steps[] = $field( 'goal', 'long_text', __( 'What would you like to discuss at your appointment?', 'chatflow-forms' ) );
			$steps[] = array_merge( $field( 'consent', 'consent', __( 'Consent to process this intake request', 'chatflow-forms' ) ), array( 'settings' => array( 'consentText' => __( 'I agree that the information I provide may be used to respond to this intake request.', 'chatflow-forms' ) ) ) );
		} elseif ( 'feedback-nps' === $slug ) {
			$steps = array( $field( 'recommend', 'nps', __( 'How likely are you to recommend us? (0–10)', 'chatflow-forms' ) ), $field( 'comment', 'long_text', __( 'What could we improve?', 'chatflow-forms' ), false ) );
		} elseif ( 'appointment-request' === $slug ) {
			$steps[] = $field( 'date', 'date', __( 'Preferred appointment date (subject to confirmation)', 'chatflow-forms' ) );
			$steps[] = $field( 'notes', 'long_text', __( 'Anything else we should know?', 'chatflow-forms' ), false );
		} else {
			$steps   = array(
				array_merge(
					$field( 'usage', 'single_choice', __( 'Where will you use the product?', 'chatflow-forms' ) ),
					array(
						'options' => array(
							array(
								'id'    => 'option_home',
								'value' => 'home',
								'label' => __( 'Home', 'chatflow-forms' ),
							),
							array(
								'id'    => 'option_work',
								'value' => 'work',
								'label' => __( 'Work', 'chatflow-forms' ),
							),
						),
					)
				),
			);
			$endings = array(
				array(
					'id'       => 'ending_thanks',
					'type'     => 'message',
					'messages' => array( __( 'Explore our home range.', 'chatflow-forms' ) ),
				),
				array(
					'id'       => 'ending_work',
					'type'     => 'message',
					'messages' => array( __( 'Explore our professional range.', 'chatflow-forms' ) ),
				),
			);
		}
		$schema = array(
			'schemaVersion' => 1,
			'bot'           => array(
				'name'        => __( 'Assistant', 'chatflow-forms' ),
				'typingSpeed' => 'normal',
			),
			'steps'         => $steps,
			'endings'       => $endings,
		);
		if ( 'product-recommender' === $slug ) {
			$schema['outcomes'] = array(
				array(
					'if'       => array(
						'field' => 'usage',
						'op'    => 'eq',
						'value' => 'work',
					),
					'endingId' => 'ending_work',
				),
			);
		}
		return array(
			'title'    => $title,
			'schema'   => $schema,
			'settings' => array( 'completion' => array( 'defaultEndingId' => 'ending_thanks' ) ),
		);
	}
}
