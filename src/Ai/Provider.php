<?php
namespace ChatFlow\Ai;

/** An AI backend that returns JSON matching a schema. Server-side only. */
interface Provider {
	/**
	 * @param array<string,mixed> $schema
	 * @return array<string,mixed>|\WP_Error
	 */
	public function json( string $system, string $user, array $schema, string $effort ): array|\WP_Error;
}
