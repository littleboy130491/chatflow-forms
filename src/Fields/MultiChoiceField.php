<?php
namespace ChatFlow\Fields;

final class MultiChoiceField extends AbstractField {
	public function type(): string {
		return 'multi_choice';
	}
}
