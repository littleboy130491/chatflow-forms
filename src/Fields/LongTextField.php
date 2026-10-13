<?php
namespace ChatFlow\Fields;

final class LongTextField extends AbstractField {
	public function type(): string {
		return 'long_text';
	}
}
