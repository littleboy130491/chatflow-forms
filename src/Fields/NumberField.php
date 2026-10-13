<?php
namespace ChatFlow\Fields;

final class NumberField extends AbstractField {
	public function type(): string {
		return 'number';
	}
}
