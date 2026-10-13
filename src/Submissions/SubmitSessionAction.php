<?php
namespace ChatFlow\Submissions;

use ChatFlow\Fields\Registry;
use ChatFlow\Forms\FormRepository;
use ChatFlow\Logic\Engine;

final class SubmitSessionAction {
	private SessionService $sessions;
	public function __construct( FormRepository $forms, Engine $engine, Registry $fields ) {
		$this->sessions = new SessionService( $forms, $engine, $fields ); }
	/** @param array<string,mixed> $body @return array<string,mixed>|\WP_Error */
	public function execute( string $sessionId, array $body, string $requestToken, string $idempotencyKey ): array|\WP_Error {
		return $this->sessions->mutate( 'submit', $sessionId, $body, $requestToken, $idempotencyKey ); }
}
