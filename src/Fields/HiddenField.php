<?php
namespace ChatFlow\Fields;

final class HiddenField extends AbstractField {
	public function type(): string {
		return 'hidden';
	}
}
