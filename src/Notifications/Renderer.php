<?php
namespace ChatFlow\Notifications;

use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Submission;
use ChatFlow\Integrations\Payload;
use ChatFlow\Logic\Interpolator;

final class Renderer {
	/**
	 * @param array<string,mixed> $notification
	 * @return array{subject:string,html:string,plain:string}
	 */
	public function render( array $notification, Submission $submission, Form $form, bool $admin = false ): array {
		$payload    = Payload::build( $submission, $form );
		$plain_tags = array(
			'form_title'    => $form->title(),
			'submission_id' => $submission->uuid(),
			'site_name'     => get_bloginfo( 'name' ),
			'date'          => $submission->createdAt(),
			'admin_link'    => $admin ? admin_url( 'admin.php?page=cff-submissions&submission=' . $submission->id() ) : '',
			'all_answers'   => $this->plainAnswers( $payload['fields'] ),
			'meta_table'    => $this->plainMeta( $payload['meta'] ),
		);
		$subject    = $this->plain( (string) ( $notification['subject'] ?? '' ), $submission->answers(), $payload['meta'], $plain_tags );
		$subject    = trim( preg_replace( '/[\r\n\x00-\x1f\x7f]+/', ' ', wp_strip_all_tags( $subject ) ) ?? '' );
		$source     = (string) ( $notification['body'] ?? '' );
		$rich       = array(
			'all_answers' => $this->table( $payload['fields'], 'label' ),
			'meta_table'  => $this->metaTable( $payload['meta'] ),
			'admin_link'  => $admin ? '<a href="' . esc_url( $plain_tags['admin_link'] ) . '">' . esc_html__( 'View submission', 'chatflow-forms' ) . '</a>' : '',
		);
		$allowed    = self::allowedHtml();
		$source     = wp_kses( $source, $allowed, array( 'https', 'http', 'mailto', 'tel' ) );
		$body       = preg_replace_callback(
			'/\[cff_button\s+([^\]]+)\]([^\[]*)\[\/cff_button\]/',
			function ( array $matches ) use ( $submission, $payload, $plain_tags ): string {
				$attributes = shortcode_parse_atts( $matches[1] );
				$url        = Interpolator::interpolateUrl( (string) ( $attributes['url'] ?? '' ), $submission->answers(), $payload['meta'] );
				if ( 'https' !== wp_parse_url( $url, PHP_URL_SCHEME ) || ! wp_http_validate_url( $url ) ) {
					return '';
				}
				return '<p><a href="' . esc_url( $url ) . '" style="display:inline-block;padding:12px 20px;background:#262626;color:#fff;text-decoration:none">' . esc_html( $this->plain( $matches[2], $submission->answers(), $payload['meta'], $plain_tags ) ) . '</a></p>';
			},
			$source
		) ?? '';
		$body       = preg_replace_callback(
			'/\{\{\s*([^{}]+?)\s*\}\}/',
			static function ( array $matches ) use ( $submission, $payload, $plain_tags, $rich ): string {
				$key = trim( $matches[1] );
				if ( isset( $rich[ $key ] ) ) {
					return $rich[ $key ];
				}
				$value = $plain_tags[ $key ] ?? Interpolator::interpolate( $matches[0], $submission->answers(), $payload['meta'] );
				return esc_html( $value );
			},
			$body
		) ?? '';
		$body       = wp_kses( wpautop( $body ), $allowed, array( 'https', 'http', 'mailto', 'tel' ) );
		$plain      = $this->plain( $source, $submission->answers(), $payload['meta'], $plain_tags );
		$plain      = html_entity_decode( wp_strip_all_tags( preg_replace( '/\[\/?cff_button[^\]]*\]/', '', $plain ) ?? '' ), ENT_QUOTES, 'UTF-8' );
		$branding   = (array) ( get_option( 'cff_settings', array() )['email'] ?? array() );
		$title      = $form->title();
		$template   = $admin ? 'admin' : 'autoresponder';
		ob_start();
		try {
			include $this->template( $template );
			$content = (string) ob_get_clean();
			ob_start();
			include $this->template( 'layout' );
			$html = (string) ob_get_clean();
		} catch ( \Throwable $error ) {
			ob_end_clean();
			throw $error;
		}
		return array(
			'subject' => $subject,
			'html'    => $html,
			'plain'   => $plain,
		);
	}

	private function template( string $name ): string {
		$override = locate_template( 'chatflow/emails/' . $name . '.php' );
		return $override ? $override : CFF_PATH . 'templates/emails/' . $name . '.php';
	}

	/**
	 * @param array<string,mixed> $answers
	 * @param array<string,mixed> $meta
	 * @param array<string,string> $tags
	 */
	private function plain( string $text, array $answers, array $meta, array $tags ): string {
		return preg_replace_callback( '/\{\{\s*([^{}]+?)\s*\}\}/', static fn( array $matches ): string => $tags[ trim( $matches[1] ) ] ?? Interpolator::interpolate( $matches[0], $answers, $meta ), $text ) ?? '';
	}

	/** @param list<array<string,mixed>> $fields */
	private function plainAnswers( array $fields ): string {
		return implode( "\n", array_map( static fn( array $field ): string => $field['label'] . ': ' . Interpolator::interpolate( '{{value}}', array( 'value' => $field['value'] ) ), $fields ) );
	}

	/** @param array<string,mixed> $meta */
	private function plainMeta( array $meta ): string {
		$lines = array();
		foreach ( $meta as $key => $value ) {
			$lines[] = $key . ': ' . Interpolator::interpolate( '{{value}}', array( 'value' => $value ) );
		}
		return implode( "\n", $lines );
	}

	/** @param array<string,mixed> $meta */
	private function metaTable( array $meta ): string {
		$rows = array();
		foreach ( $meta as $key => $value ) {
			$rows[] = array(
				'label' => $key,
				'value' => $value,
			);
		}
		return $this->table( $rows, 'label' );
	}

	/** @param list<array<string,mixed>> $rows */
	private function table( array $rows, string $label ): string {
		$html = '<table style="width:100%;border-collapse:collapse"><tbody>';
		foreach ( $rows as $row ) {
			$value = Interpolator::interpolate( '{{value}}', array( 'value' => $row['value'] ) );
			$html .= '<tr><th style="padding:8px;border-bottom:1px solid #ddd;text-align:left">' . esc_html( $row[ $label ] ) . '</th><td style="padding:8px;border-bottom:1px solid #ddd">' . nl2br( esc_html( $value ) ) . '</td></tr>';
		}
		return $html . '</tbody></table>';
	}

	/** @return array<string,array<string,bool>> */
	public static function allowedHtml(): array {
		return array(
			'p'          => array( 'style' => true ),
			'br'         => array(),
			'strong'     => array(),
			'b'          => array(),
			'em'         => array(),
			'i'          => array(),
			'a'          => array(
				'href'  => true,
				'style' => true,
				'title' => true,
			),
			'ul'         => array(),
			'ol'         => array(),
			'li'         => array(),
			'h1'         => array(),
			'h2'         => array(),
			'h3'         => array(),
			'blockquote' => array(),
			'hr'         => array(),
			'img'        => array(
				'src'    => true,
				'alt'    => true,
				'width'  => true,
				'height' => true,
				'style'  => true,
			),
			'table'      => array( 'style' => true ),
			'tbody'      => array(),
			'tr'         => array(),
			'th'         => array( 'style' => true ),
			'td'         => array( 'style' => true ),
		);
	}
}
