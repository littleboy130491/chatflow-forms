<?php
namespace ChatFlow\Submissions;

use ChatFlow\Forms\Form;
use ChatFlow\Integrations\HookDispatcher;
use ChatFlow\Logic\Interpolator;

final class Ending {
	/** @return array<string,mixed>|\WP_Error */
	public function build( Submission $submission, Form $form, ?string $id ): array|\WP_Error {
		$endings = $form->schema()['endings'];
		$id      = $id ? $id : ( $form->settings()['completion']['defaultEndingId'] ?? ( $endings[0]['id'] ?? '' ) );
		$ending  = null;
		foreach ( $endings as $candidate ) {
			if ( $candidate['id'] === $id ) {
				$ending = $candidate;
				break; }
		}
		if ( ! $ending ) {
			return Database::error( 'cff_invalid_ending', 'No valid completion ending.', 422 ); }
		$answers = $submission->answers();
		$meta    = $submission->meta();
		$public  = array(
			'id'       => $ending['id'],
			'type'     => $ending['type'],
			// Messages render as Markdown in the chat: substituted values must stay literal text.
			'messages' => array_map( fn( $text ) => Interpolator::interpolate( $text, self::escapeMarkdown( $answers ), self::escapeMarkdown( $meta ) ), $ending['messages'] ?? array() ),
			'buttons'  => array(),
		);
		foreach ( $ending['buttons'] ?? array() as $button ) {
			$item = array(
				'id'     => $button['id'],
				'label'  => Interpolator::interpolate( $button['label'], $answers, $meta ),
				'action' => $button['action'],
			);
			if ( 'link' === $button['action'] ) {
				$url = Interpolator::interpolateUrl( $button['url'] ?? '', $answers, $meta );
				$url = self::validateUrl( $url, $form );
				if ( null === $url ) {
					return Database::error( 'cff_unsafe_url', 'A completion link is not allowed.', 422 ); }
				$item['url'] = $url;
			}
			$public['buttons'][] = $item;
		}
		$response = array(
			'submission' => array(
				'uuid'   => $submission->uuid(),
				'status' => 'completed',
			),
			'ending'     => $public,
		);
		if ( 'redirect' === $ending['type'] ) {
			$url = Interpolator::interpolateUrl( $ending['url'] ?? '', $answers, $meta );
			if ( $ending['appendQuery'] ?? false ) {
				$values = array_intersect_key( $answers, array_flip( $ending['queryKeys'] ?? array() ) );
				foreach ( $values as $key => $value ) {
					if ( ! is_scalar( $value ) ) {
						unset( $values[ $key ] ); }
				}
				$url = add_query_arg( $values, $url );
			}
			if ( $ending['appendSubmission'] ?? false ) {
				$url = add_query_arg( 'submission', $submission->uuid(), $url ); }
			$url = HookDispatcher::filter( 'cff_redirect_url', $url, array( $submission, $form ), $submission->id() );
			$url = is_string( $url ) ? self::validateUrl( $url, $form ) : null;
			if ( null === $url ) {
				return Database::error( 'cff_unsafe_redirect', 'The completion redirect is not allowed.', 422 ); }
			$response['redirectUrl']       = $url;
			$response['ending']['delayMs'] = $ending['delayMs'] ?? 0;
		}
		return $response;
	}

	public static function validateUrl( string $url, Form $form ): ?string {
		if ( '' === $url || strlen( $url ) > 8000 || preg_match( '/[\x00-\x20\x7f\\\\]/', $url ) || preg_match( '/%(?:0[ad]|5c)/i', $url ) ) {
			return null; }
		if ( str_starts_with( $url, '/' ) && ! str_starts_with( $url, '//' ) ) {
			return home_url( $url ); }
		$parts = wp_parse_url( $url );
		$site  = wp_parse_url( home_url() );
		if ( ! is_array( $parts ) || empty( $parts['host'] ) || isset( $parts['user'] ) || isset( $parts['pass'] ) ) {
			return null; }
		$same = strtolower( $parts['host'] ) === strtolower( $site['host'] ?? '' ) && ( $parts['port'] ?? null ) === ( $site['port'] ?? null );
		// Official WhatsApp click-to-chat hosts are always allowed (https only, below).
		$hosts = array_merge( array( 'wa.me', 'api.whatsapp.com' ), array_map( 'strtolower', $form->settings()['completion']['allowedRedirectHosts'] ?? array() ) );
		if ( ! $same && ( ! in_array( strtolower( $parts['host'] ), $hosts, true ) || isset( $parts['port'] ) ) ) {
			return null; }
		if ( 'https' !== strtolower( $parts['scheme'] ?? '' ) && ! ( $same && 'http' === ( $parts['scheme'] ?? '' ) && 'http' === ( $site['scheme'] ?? '' ) ) ) {
			return null; }
		return $url;
	}

	/** Backslash-escape the runtime's Markdown syntax ([]()*\\) in every string value. */
	public static function escapeMarkdown( mixed $value ): mixed {
		if ( is_string( $value ) ) {
			return preg_replace( '/[\\\\\[\]()*]/', '\\\\$0', $value ) ?? $value;
		}
		if ( is_array( $value ) ) {
			return array_map( array( self::class, 'escapeMarkdown' ), $value );
		}
		return $value;
	}
}
