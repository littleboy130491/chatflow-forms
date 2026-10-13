<?php
namespace ChatFlow\Submissions;

use ChatFlow\Forms\Form;
use ChatFlow\Forms\FormRepository;

final class Submission {
	/** @param array<string,mixed> $row */
	public function __construct( private array $row, private ?Form $form = null ) {}
	public function id(): int {
		return (int) $this->row['id']; }
	public function uuid(): string {
		return $this->row['uuid']; }
	public function formId(): int {
		return (int) $this->row['form_id']; }
	public function formVersion(): int {
		return (int) $this->row['form_version']; }
	public function status(): string {
		return $this->row['status']; }
	/** @return array<string,mixed> */
	public function answers(): array {
		return Database::decode( $this->row['answers'] ); }
	/** @return array<string,mixed> */
	public function meta(): array {
		return Database::decode( $this->row['meta'] ); }
	public function endingId(): string {
		return $this->row['ending_id']; }
	public function createdAt(): string {
		return gmdate( 'c', strtotime( $this->row['created_at'] . ' UTC' ) ); }
	/** @return array<string,mixed> */
	public function toArray(): array {
		$form = $this->form ?? ( new FormRepository() )->getVersion( $this->formId(), $this->formVersion() );
		if ( ! $form ) {
			throw new \RuntimeException( 'Form snapshot unavailable.' ); }
		return \ChatFlow\Integrations\Payload::build( $this, $form );
	}
	/** @return array<string,mixed> */
	public function admin(): array {
		$meta = $this->meta();
		unset( $meta['context'] );
		return array(
			'id'            => $this->id(),
			'uuid'          => $this->uuid(),
			'formId'        => $this->formId(),
			'formVersion'   => $this->formVersion(),
			'status'        => $this->status(),
			'answers'       => (object) $this->answers(),
			'meta'          => (object) $meta,
			'endingId'      => $this->endingId(),
			'createdAt'     => $this->createdAt(),
			'updatedAt'     => $this->row['updated_at'],
			'durationMs'    => (int) $this->row['duration_ms'],
			'isRead'        => (bool) $this->row['is_read'],
			'isStarred'     => (bool) $this->row['is_starred'],
			'visited'       => Database::decode( $this->row['visited'] ),
			'currentStepId' => $this->row['current_step_id'] ? $this->row['current_step_id'] : null,
			'progress'      => (int) $this->row['progress'],
			'consent'       => Database::decode( $this->row['consent'] ),
		);
	}
	/** @return array<string,mixed> */
	public function storage(): array {
		return $this->row; }
}
