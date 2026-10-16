<?php
namespace ChatFlow\Ai;

/** Picks the configured AI backend from global settings. */
final class Providers {
	public const NAMES = array( 'anthropic', 'openrouter', 'openai' );

	/** @param array<string,mixed> $ai the `ai` settings group */
	public static function configured( array $ai ): bool {
		return null !== self::client( $ai );
	}

	/** @param array<string,mixed> $ai the `ai` settings group */
	public static function client( array $ai ): ?Provider {
		$text = static fn( string $key ): string => is_string( $ai[ $key ] ?? null ) ? $ai[ $key ] : '';
		switch ( $ai['provider'] ?? 'anthropic' ) {
			case 'openrouter':
				return OpenAiCompatible::validOpenRouterKey( $text( 'openrouterKey' ) ) ? OpenAiCompatible::openRouter( $text( 'openrouterKey' ), $text( 'openrouterModel' ) ) : null;
			case 'openai':
				return OpenAiCompatible::validBaseUrl( $text( 'baseUrl' ) ) && OpenAiCompatible::validModel( $text( 'compatModel' ) ) && OpenAiCompatible::validKey( $text( 'compatKey' ) )
					? new OpenAiCompatible( $text( 'baseUrl' ), $text( 'compatKey' ), $text( 'compatModel' ) )
					: null;
			default:
				return Claude::validKey( $text( 'apiKey' ) ) ? new Claude( $text( 'apiKey' ) ) : null;
		}
	}

	/**
	 * Validation message for a saved `ai` group, or null when it is valid. Empty
	 * fields are fine (the feature stays off); filled ones must be well formed.
	 *
	 * @param array<string,mixed> $ai
	 */
	public static function invalid( array $ai ): ?string {
		foreach ( array( 'apiKey', 'openrouterKey', 'openrouterModel', 'baseUrl', 'compatKey', 'compatModel' ) as $key ) {
			if ( ! is_string( $ai[ $key ] ?? '' ) ) {
				return 'AI settings must be text.';
			}
		}
		$text = static fn( string $key ): string => (string) ( $ai[ $key ] ?? '' );
		if ( ! in_array( $ai['provider'] ?? 'anthropic', self::NAMES, true ) ) {
			return 'Unknown AI provider.';
		}
		if ( '' !== $text( 'apiKey' ) && ! Claude::validKey( $text( 'apiKey' ) ) ) {
			return 'The Claude API key is malformed.';
		}
		if ( '' !== $text( 'openrouterKey' ) && ! OpenAiCompatible::validOpenRouterKey( $text( 'openrouterKey' ) ) ) {
			return 'The OpenRouter API key is malformed (it starts with sk-or-).';
		}
		foreach ( array( 'openrouterModel', 'compatModel' ) as $key ) {
			if ( '' !== $text( $key ) && ! OpenAiCompatible::validModel( $text( $key ) ) ) {
				return 'The AI model name is malformed.';
			}
		}
		if ( '' !== $text( 'baseUrl' ) && ! OpenAiCompatible::validBaseUrl( $text( 'baseUrl' ) ) ) {
			return 'The AI endpoint must be an https URL without credentials, query or fragment, e.g. https://api.openai.com/v1.';
		}
		if ( ! OpenAiCompatible::validKey( $text( 'compatKey' ) ) ) {
			return 'The endpoint API key is malformed.';
		}
		if ( 'openai' === ( $ai['provider'] ?? '' ) && ( '' === $text( 'baseUrl' ) ) !== ( '' === $text( 'compatModel' ) ) ) {
			return 'An OpenAI-compatible endpoint needs both a base URL and a model.';
		}
		return null;
	}
}
