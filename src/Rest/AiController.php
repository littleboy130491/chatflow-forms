<?php
namespace ChatFlow\Rest;

use ChatFlow\Ai\Blueprint;
use ChatFlow\Ai\Claude;
use ChatFlow\Ai\Provider;
use ChatFlow\Ai\Providers;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Forms\SchemaValidator;
use ChatFlow\Logic\Diagnostics;
use ChatFlow\Spam\RateLimiter;
use ChatFlow\Submissions\Database;

/**
 * Optional AI assist (Phase 3): generate a draft form from a prompt, and rephrase
 * existing bot copy in a chosen tone. Admin-only, rate limited per user, and it
 * only ever sends the admin's prompt or the form's own copy - never submissions.
 * The backend is Anthropic, OpenRouter or an OpenAI-compatible endpoint.
 */
final class AiController {
	public const TONES = array( 'friendly', 'professional', 'playful', 'concise', 'formal' );

	public function __construct( private FormRepository $forms ) {}

	public function register(): void {
		foreach ( array(
			array( '/admin/ai/generate', 'generate' ),
			array( '/admin/ai/rephrase', 'rephrase' ),
		) as [$route, $callback] ) {
			register_rest_route(
				'cff/v1',
				$route,
				array(
					'methods'             => 'POST',
					'permission_callback' => static fn( $request ) => RestModule::authorize( $request, 'cff_manage_forms' ),
					'callback'            => array( $this, $callback ),
				)
			);
		}
	}

	public static function configured(): bool {
		return Providers::configured( (array) ( Settings::get()['ai'] ?? array() ) );
	}

	private static function language( mixed $locale ): string {
		return is_string( $locale ) && str_starts_with( $locale, 'id' ) ? 'Indonesian' : 'English';
	}

	private function client(): Provider|\WP_Error {
		$client = Providers::client( (array) ( Settings::get()['ai'] ?? array() ) );
		if ( ! $client ) {
			return Claude::error( 'cff_ai_not_configured' );
		}
		if ( ! ( new RateLimiter() )->consume( 'ai:' . get_current_user_id(), 30, 3600 ) ) {
			return Claude::error( 'cff_ai_rate_limited' );
		}
		return $client;
	}

	public function generate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$body   = (array) $request->get_json_params();
		$prompt = is_string( $body['prompt'] ?? null ) ? trim( $body['prompt'] ) : '';
		if ( '' === $prompt || mb_strlen( $prompt ) > 4000 ) {
			return Database::error( 'cff_ai_prompt', 'Describe the form in 1–4000 characters.', 422 );
		}
		$client = $this->client();
		if ( is_wp_error( $client ) ) {
			return $client;
		}
		$language = self::language( $body['locale'] ?? get_user_locale() );
		$system   = 'You design short conversational forms for a WordPress chat-style form plugin. A friendly assistant asks one question per step. '
			. 'Write every title, question, message and option in ' . $language . '. Keep the form focused: usually 4 to 12 steps, never more than ' . Blueprint::MAX_STEPS . '. '
			. 'Each step has a short label (used in admin reports) and a message (what the assistant says). Use single_choice or multi_choice only with 2 to 8 options. '
			. 'Add a consent step only when the form collects personal data for follow-up, and do not invent legal text beyond a plain one-sentence agreement. '
			. 'The ending is the closing thank-you message. The site owner reviews and edits the draft before publishing.';
		$data     = $client->json( $system, "<form_request>\n" . $prompt . "\n</form_request>", Blueprint::schema(), 'medium' );
		if ( is_wp_error( $data ) ) {
			return $data;
		}
		$form = Blueprint::toForm( $data );
		if ( is_string( $form ) ) {
			return Claude::error( $form );
		}
		$errors = array_merge( ( new SchemaValidator() )->validatePublishable( $form['schema'] ), Diagnostics::diagnoseSchema( $form['schema'] ) );
		if ( $errors ) {
			return Claude::error( 'cff_ai_invalid_output' );
		}
		$created = $this->forms->create( $form['title'], $form['schema'], $form['settings'] );
		if ( is_wp_error( $created ) ) {
			return $created;
		}
		$response = new \WP_REST_Response( $created->toArray(), 201 );
		$response->header( 'Cache-Control', 'private,no-store' );
		return $response;
	}

	public function rephrase( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$body  = (array) $request->get_json_params();
		$tone  = $body['tone'] ?? '';
		$items = array();
		foreach ( is_array( $body['items'] ?? null ) ? $body['items'] : array() as $item ) {
			if ( is_array( $item ) && is_string( $item['id'] ?? null ) && preg_match( '/^[A-Za-z0-9_:.-]{1,200}$/D', $item['id'] ) && is_string( $item['text'] ?? null ) && '' !== trim( $item['text'] ) && mb_strlen( $item['text'] ) <= 2000 ) {
				$items[ $item['id'] ] = $item['text'];
			}
		}
		if ( ! in_array( $tone, self::TONES, true ) || ! $items || count( $items ) > 200 ) {
			return Database::error( 'cff_ai_rephrase', 'Choose a tone and send 1–200 texts of at most 2000 characters.', 422 );
		}
		$client = $this->client();
		if ( is_wp_error( $client ) ) {
			return $client;
		}
		$system = 'You rewrite the copy of a conversational form so it reads in a ' . $tone . ' tone. Keep the language of each text, its meaning and roughly its length. '
			. 'Keep every merge tag such as {{name}} exactly as written. Return one item per input id; return the text unchanged if it already fits.';
		$input  = array();
		foreach ( $items as $id => $text ) {
			$input[] = array(
				'id'   => $id,
				'text' => $text,
			);
		}
		$schema = array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'required'             => array( 'items' ),
			'properties'           => array(
				'items' => array(
					'type'  => 'array',
					'items' => array(
						'type'                 => 'object',
						'additionalProperties' => false,
						'required'             => array( 'id', 'text' ),
						'properties'           => array(
							'id'   => array( 'type' => 'string' ),
							'text' => array( 'type' => 'string' ),
						),
					),
				),
			),
		);
		$data   = $client->json( $system, "<texts>\n" . wp_json_encode( $input, JSON_UNESCAPED_UNICODE ) . "\n</texts>", $schema, 'low' );
		if ( is_wp_error( $data ) ) {
			return $data;
		}
		$accepted = Blueprint::acceptRewrites( $items, $data );
		$out      = array();
		foreach ( $accepted as $id => $text ) {
			$out[] = array(
				'id'   => $id,
				'text' => $text,
			);
		}
		$response = new \WP_REST_Response( array( 'items' => $out ), 200 );
		$response->header( 'Cache-Control', 'private,no-store' );
		return $response;
	}
}
