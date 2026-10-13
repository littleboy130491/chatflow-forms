<?php
namespace ChatFlow\Notifications;

use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Submission;
use ChatFlow\Integrations\HookDispatcher;

final class Mailer {
	/** @param array<string,mixed> $notification */
	public function send( array $notification, Submission $submission, Form $form, bool $admin = false, ?string $test_recipient = null ): string {
		try {
			$rendered = ( new Renderer() )->render( $notification, $submission, $form, $admin );
			$settings = (array) ( get_option( 'cff_settings', array() )['email'] ?? array() );
			$to       = $admin ? (array) ( $notification['to'] ?? array() ) : array( ( new Planner() )->recipient( $submission, $form, (string) ( $notification['emailField'] ?? '' ) ) );
			$headers  = array( 'Content-Type: text/html; charset=UTF-8' );
			$from     = (string) ( $notification['fromEmail'] ?? $settings['fromEmail'] ?? '' );
			$name     = wp_strip_all_tags( (string) ( $notification['fromName'] ?? $settings['fromName'] ?? get_bloginfo( 'name' ) ) );
			if ( is_email( $from ) && ! preg_match( '/[\r\n<>]/', $name . $from ) ) {
				$headers[] = 'From: ' . $name . ' <' . $from . '>';
			}
			$reply = (string) ( $notification['replyTo'] ?? $settings['replyTo'] ?? '' );
			if ( $admin && ! empty( $notification['emailField'] ) ) {
				$reply = ( new Planner() )->recipient( $submission, $form, $notification['emailField'] );
			}
			if ( is_email( $reply ) && ! preg_match( '/[\r\n]/', $reply ) ) {
				$headers[] = 'Reply-To: ' . $reply;
			}
			foreach ( array(
				'cc'  => 'Cc',
				'bcc' => 'Bcc',
			) as $key => $header ) {
				foreach ( $admin ? ( $notification[ $key ] ?? array() ) : array() as $email ) {
					if ( ! is_string( $email ) || ! is_email( $email ) || preg_match( '/[\r\n]/', $email ) ) {
						return 'mail_invalid_recipient';
					}
					$headers[] = $header . ': ' . $email;
				}
			}
			$attachments = array();
			foreach ( $notification['attachmentIds'] ?? array() as $attachment_id ) {
				$path = get_attached_file( (int) $attachment_id );
				if ( ! $path || 'attachment' !== get_post_type( (int) $attachment_id ) ) {
					return 'mail_invalid_attachment';
				}
				$attachments[] = $path;
			}
			$args = array(
				'to'          => $to,
				'subject'     => $rendered['subject'],
				'message'     => $rendered['html'],
				'headers'     => $headers,
				'attachments' => $attachments,
			);
			$args = HookDispatcher::filter( $admin ? 'cff_email_args' : 'cff_autoresponder_args', $args, array( $submission, $form ), $submission->id() );
			if ( ! is_array( $args ) ) {
				return 'mail_invalid_arguments';
			}
			// Test requests never accidentally contact real recipients, even after filters.
			if ( null !== $test_recipient ) {
				$args['to']      = array( $test_recipient );
				$args['headers'] = array_values( array_filter( (array) ( $args['headers'] ?? array() ), static fn( $header ): bool => is_string( $header ) && ! preg_match( '/^(?:Cc|Bcc):/i', $header ) ) );
			}
			$args['to'] = (array) ( $args['to'] ?? array() );
			if ( ! $args['to'] || ! is_string( $args['subject'] ?? null ) || ! is_string( $args['message'] ?? null ) || preg_match( '/[\r\n]/', $args['subject'] ) || ! is_array( $args['headers'] ?? null ) || ! is_array( $args['attachments'] ?? null ) ) {
				return 'mail_invalid_arguments';
			}
			foreach ( $args['to'] as $recipient ) {
				if ( ! is_string( $recipient ) || ! is_email( $recipient ) || preg_match( '/[\r\n]/', $recipient ) ) {
					return 'mail_invalid_recipient';
				}
			}
			foreach ( $args['headers'] as $header ) {
				if ( ! is_string( $header ) || preg_match( '/[\r\n\x00]/', $header ) ) {
					return 'mail_invalid_headers';
				}
			}
			$uploads = wp_upload_dir();
			$root    = realpath( $uploads['basedir'] );
			foreach ( $args['attachments'] as $attachment ) {
				$path = is_string( $attachment ) ? realpath( $attachment ) : false;
				if ( ! $path || ! $root || ! str_starts_with( $path, $root . DIRECTORY_SEPARATOR ) || ! is_file( $path ) || ! is_readable( $path ) ) {
					return 'mail_invalid_attachment';
				}
			}
			// PHPMailer exposes upstream camelCase properties.
			// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$alternative = static function ( $mailer ) use ( $args, $rendered ): void {
				if ( $mailer->Body === $args['message'] ) {
					$mailer->AltBody = $rendered['plain'];
				}
			};
			// phpcs:enable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			add_action( 'phpmailer_init', $alternative );
			try {
				$sent = wp_mail( $args['to'], $args['subject'], $args['message'], $args['headers'], $args['attachments'] );
			} finally {
				remove_action( 'phpmailer_init', $alternative );
			}
			return $sent ? 'sent' : 'mail_failed';
		} catch ( \Throwable $error ) {
			return 'mail_exception';
		}
	}
}
