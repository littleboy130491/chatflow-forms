<?php
namespace ChatFlow\Tests\Foundation\Unit;

use ChatFlow\Ai\Blueprint;
use ChatFlow\Ai\Claude;
use PHPUnit\Framework\TestCase;

final class AiAssistTest extends TestCase {
	public function testBlueprintAssignsKeysIdsAndDropsUnusableSteps(): void {
		$form = Blueprint::toForm(
			array(
				'title'   => '<b>Project</b> enquiry',
				'botName' => 'Ima',
				'ending'  => 'Thanks, {{name}}!',
				'steps'   => array(
					array(
						'type'     => 'short_text',
						'label'    => 'Name',
						'message'  => 'What is your name?',
						'required' => true,
						'options'  => array(),
					),
					array(
						'type'     => 'single_choice',
						'label'    => 'Budget',
						'message'  => 'Your budget?',
						'required' => false,
						'options'  => array( 'Small', 'Large', 'Small', '' ),
					),
					array(
						'type'     => 'single_choice',
						'label'    => 'Only one option',
						'message'  => 'Pick',
						'required' => false,
						'options'  => array( 'Solo' ),
					),
					array(
						'type'     => 'file_upload',
						'label'    => 'Unsupported',
						'message'  => 'x',
						'required' => false,
						'options'  => array(),
					),
					array(
						'type'     => 'short_text',
						'label'    => 'Name',
						'message'  => '',
						'required' => false,
						'options'  => array(),
					),
					array(
						'type'     => 'consent',
						'label'    => 'Agree',
						'message'  => 'I agree to be contacted.',
						'required' => false,
						'options'  => array(),
					),
					array(
						'type'     => 'statement',
						'label'    => 'Intro',
						'message'  => 'Hello!',
						'required' => true,
						'options'  => array(),
					),
				),
			)
		);
		self::assertIsArray( $form );
		self::assertSame( 'Project enquiry', $form['title'] );
		self::assertSame( 'Ima', $form['schema']['bot']['name'] );
		self::assertSame( array( 'name', 'budget', 'name_2', 'agree', 'intro' ), array_column( $form['schema']['steps'], 'key' ) );
		self::assertSame( array( 'Small', 'Large' ), array_column( $form['schema']['steps'][1]['options'], 'value' ) );
		self::assertSame( array( 'Name' ), $form['schema']['steps'][2]['messages'], 'Empty messages fall back to the label.' );
		self::assertTrue( $form['schema']['steps'][3]['required'], 'Consent is always required.' );
		self::assertSame( 'I agree to be contacted.', $form['schema']['steps'][3]['settings']['consentText'] );
		self::assertFalse( $form['schema']['steps'][4]['required'], 'Statements are never required.' );
		self::assertSame( array( 'Thanks, {{name}}!' ), $form['schema']['endings'][0]['messages'] );
		self::assertSame( 'ending_thanks', $form['settings']['completion']['defaultEndingId'] );
	}

	public function testBlueprintRejectsEmptyFormsAndCapsSteps(): void {
		self::assertSame( 'cff_ai_empty_form', Blueprint::toForm( array( 'title' => 'X', 'steps' => array() ) ) );
		self::assertSame( 'cff_ai_empty_form', Blueprint::toForm( array( 'title' => '' ) ) );
		$step = array(
			'type'     => 'short_text',
			'label'    => 'Q',
			'message'  => 'Q?',
			'required' => false,
			'options'  => array(),
		);
		$form = Blueprint::toForm(
			array(
				'title'   => 'Long',
				'botName' => '',
				'ending'  => '',
				'steps'   => array_fill( 0, 50, $step ),
			)
		);
		self::assertCount( Blueprint::MAX_STEPS, $form['schema']['steps'] );
		self::assertSame( 'Assistant', $form['schema']['bot']['name'] );
		self::assertSame( 'field', Blueprint::key( '123 ---', array() ) );
	}

	public function testRewritesKeepMergeTagsAndOnlyKnownIds(): void {
		$originals = array(
			'step:a:message:0' => 'Hi {{name}}, what is your email?',
			'step:b:label'     => 'Budget',
			'ending:x:0'       => 'Thanks {{ name }}!',
		);
		$accepted  = Blueprint::acceptRewrites(
			$originals,
			array(
				'items' => array(
					array(
						'id'   => 'step:a:message:0',
						'text' => 'Hey {{name}}! Mind sharing your <b>email</b>?',
					),
					array(
						'id'   => 'step:b:label',
						'text' => 'Budget {{secret}}',
					),
					array(
						'id'   => 'ending:x:0',
						'text' => 'Much appreciated, {{name}}!',
					),
					array(
						'id'   => 'injected',
						'text' => 'x',
					),
				),
			)
		);
		self::assertSame(
			array(
				'step:a:message:0' => 'Hey {{name}}! Mind sharing your email?',
				'ending:x:0'       => 'Much appreciated, {{name}}!',
			),
			$accepted
		);
		self::assertSame( array(), Blueprint::acceptRewrites( $originals, 'not-an-array' ) );
	}

	public function testRequestBodyUsesStructuredOutputFallbacksAndNoThinkingOverride(): void {
		$body = Claude::body( 'sys', 'user', Blueprint::schema(), 'medium' );
		self::assertSame( Claude::MODEL, $body['model'] );
		self::assertSame( 'default', $body['fallbacks'] );
		self::assertSame( 'json_schema', $body['output_config']['format']['type'] );
		self::assertSame( 'medium', $body['output_config']['effort'] );
		self::assertArrayNotHasKey( 'thinking', $body );
		self::assertArrayNotHasKey( 'tool_choice', $body );
		self::assertSame( array( 'role' => 'user', 'content' => 'user' ), $body['messages'][0] );
	}

	public function testResponseParsingHandlesRefusalTruncationAndTextBlocks(): void {
		self::assertSame( 'cff_ai_refused', Claude::parse( array( 'stop_reason' => 'refusal', 'content' => array() ) ) );
		self::assertSame( 'cff_ai_incomplete', Claude::parse( array( 'stop_reason' => 'max_tokens', 'content' => array() ) ) );
		self::assertSame(
			array( 'ok' => true ),
			Claude::parse(
				array(
					'stop_reason' => 'end_turn',
					'content'     => array(
						array(
							'type'     => 'thinking',
							'thinking' => '',
						),
						array(
							'type' => 'text',
							'text' => '{"ok":',
						),
						array(
							'type' => 'text',
							'text' => 'true}',
						),
					),
				)
			)
		);
		self::assertSame( 'cff_ai_invalid_output', Claude::parse( array( 'stop_reason' => 'end_turn', 'content' => array( array( 'type' => 'text', 'text' => 'nope' ) ) ) ) );
		self::assertNull( Claude::statusCode( 200 ) );
		self::assertSame( 'cff_ai_auth', Claude::statusCode( 401 ) );
		self::assertSame( 'cff_ai_rate_limited', Claude::statusCode( 429 ) );
		self::assertSame( 'cff_ai_unavailable', Claude::statusCode( 529 ) );
		self::assertTrue( Claude::validKey( 'sk-ant-api03-' . str_repeat( 'a', 40 ) ) );
		self::assertFalse( Claude::validKey( 'not-a-key' ) );
	}
}
