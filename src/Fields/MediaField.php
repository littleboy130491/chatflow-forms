<?php
namespace ChatFlow\Fields;

final class MediaField extends AbstractField {
	public function type(): string {
		return 'media';
	}
	public function sanitize( mixed $value, array $step, array $context = array() ): mixed {
		return null;
	}
	public function validate( mixed $value, array $step, array $context = array() ): array {
		return array();
	}
}
