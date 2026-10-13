<?php
namespace ChatFlow\Fields;

interface FieldType {
	public function type(): string;

	/** @param array<string,mixed> $step
	 *  @param array<string,mixed> $context
	 */
	public function sanitize( mixed $value, array $step, array $context = array() ): mixed;

	/** @param array<string,mixed> $step
	 *  @param array<string,mixed> $context
	 *  @return list<array{path:string,code:string,message:string,fieldKey?:string}>
	 */
	public function validate( mixed $value, array $step, array $context = array() ): array;
}
