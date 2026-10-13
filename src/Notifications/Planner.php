<?php
namespace ChatFlow\Notifications;

use ChatFlow\Forms\Form;
use ChatFlow\Submissions\Submission;
use ChatFlow\Logic\Operators;
use ChatFlow\Integrations\Activity;

final class Planner {
	/** @return list<array{channel:string,id:string,delay:int}> */
	public function plan( Submission $submission, Form $form, string $event ): array {
		$settings  = $form->settings()['notifications'] ?? array();
		$completed = 'submission.completed' === $event;
		$abandoned = 'submission.abandoned' === $event && ! empty( $settings['notifyAbandoned'] ) && $this->contact( $submission, $form );
		if ( ! $completed && ! $abandoned ) {
			return array();
		}
		$result = array();
		foreach ( array(
			'admin'          => 'admin_mail',
			'autoresponders' => 'autoresponder',
		) as $group => $channel ) {
			if ( ! $completed && 'autoresponders' === $group ) {
				continue;
			}
			foreach ( $settings[ $group ] ?? array() as $notification ) {
				if ( empty( $notification['enabled'] ) ) {
					continue;
				}
				$meta      = $submission->meta();
				$variables = $submission->storage()['variables'] ?? array();
				$variables = is_string( $variables ) ? json_decode( $variables, true, 16, JSON_THROW_ON_ERROR ) : $variables;
				$variables = is_array( $variables ) ? $variables : array();
				if ( isset( $notification['conditions'] ) && ! Operators::evaluateCondition( $notification['conditions'], $submission->answers(), $variables, $meta['context'] ?? array( 'now' => $submission->createdAt() ) ) ) {
					continue;
				}
				if ( 'autoresponder' === $channel && ! $this->recipient( $submission, $form, (string) ( $notification['emailField'] ?? '' ) ) ) {
					Activity::record( $submission->id(), 'autoresponder_missing_email' );
					continue;
				}
				$result[] = array(
					'channel' => $channel,
					'id'      => $notification['id'],
					'delay'   => (int) ( $notification['delaySeconds'] ?? 0 ),
				);
				if ( 'autoresponder' === $channel && ! empty( $settings['firstMatchOnly'] ) ) {
					break;
				}
			}
		}
		return $result;
	}

	public function recipient( Submission $submission, Form $form, string $key ): string {
		foreach ( $form->schema()['steps'] ?? array() as $step ) {
			if ( $key === $step['key'] && 'email' === $step['type'] ) {
				$value = $submission->answers()[ $key ] ?? '';
				return is_string( $value ) && ! preg_match( '/[\r\n]/', $value ) && is_email( $value ) ? $value : '';
			}
		}
		return '';
	}

	private function contact( Submission $submission, Form $form ): bool {
		foreach ( $form->schema()['steps'] ?? array() as $step ) {
			$value = $submission->answers()[ $step['key'] ] ?? null;
			if ( ( 'email' === $step['type'] && $this->recipient( $submission, $form, $step['key'] ) ) || ( 'phone' === $step['type'] && is_string( $value ) && preg_match( '/^\+[1-9][0-9]{7,14}$/', $value ) ) ) {
				return true;
			}
		}
		return false;
	}
}
