<?php
namespace ChatFlow\Forms;

final class Form {
	/** @param array<string,mixed> $form_schema
	 *  @param array<string,mixed> $form_settings
	 */
	public function __construct(
		private int $form_id,
		private string $form_title,
		private string $form_slug,
		private array $form_schema,
		private array $form_settings,
		private int $form_version,
		private int $draft_revision,
		private string $form_status
	) {}

	public function id(): int {
		return $this->form_id; }
	public function title(): string {
		return $this->form_title; }
	public function slug(): string {
		return $this->form_slug; }
	/** @return array<string,mixed> */
	public function schema(): array {
		return $this->form_schema; }
	/** @return array<string,mixed> */
	public function settings(): array {
		return $this->form_settings; }
	public function version(): int {
		return $this->form_version; }
	public function draftRevision(): int {
		return $this->draft_revision; }
	public function status(): string {
		return $this->form_status; }

	/** @return array<string,mixed> */
	public function toArray(): array {
		return array(
			'id'            => $this->id(),
			'title'         => $this->title(),
			'slug'          => $this->slug(),
			'schema'        => $this->schema(),
			'settings'      => $this->settings(),
			'version'       => $this->version(),
			'draftRevision' => $this->draftRevision(),
			'status'        => $this->status(),
		);
	}
}
