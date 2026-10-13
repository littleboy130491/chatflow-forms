<?php
namespace ChatFlow\Fields;

final class YesNoField extends AbstractField {
	public function type(): string {
		return 'yes_no';
	}
}
