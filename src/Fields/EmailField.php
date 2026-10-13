<?php
namespace ChatFlow\Fields;

final class EmailField extends AbstractField {
	public function type(): string {
		return 'email';
	}
}
