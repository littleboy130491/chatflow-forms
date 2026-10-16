<?php
namespace ChatFlow\Integrations\Connectors;

/**
 * A native connector turns one frozen submission payload into one or more HTTPS
 * requests to a fixed provider host. Builders are pure so they can be tested
 * without WordPress; transport, retries and logging belong to the outbox.
 */
interface Connector {
	public function type(): string;

	/**
	 * Publish-time checks for the per-form configuration.
	 *
	 * @param array<string,mixed> $config
	 * @param list<string>        $keys answer keys in the form schema
	 * @return list<string> human-readable problems
	 */
	public function configIssues( array $config, array $keys ): array;

	/** @param array<string,mixed> $credentials */
	public function configured( array $credentials ): bool;

	/**
	 * @param array<string,mixed> $config      per-form configuration
	 * @param array<string,mixed> $credentials global provider credentials
	 * @param array<string,mixed> $payload     frozen v1 submission payload
	 * @return list<array{method:string,url:string,headers:array<string,string>,body:string}>|string requests, or a skip outcome
	 */
	public function requests( array $config, array $credentials, array $payload ): array|string;
}
