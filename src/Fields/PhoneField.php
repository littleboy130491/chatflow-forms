<?php
namespace ChatFlow\Fields;

final class PhoneField extends AbstractField {
	public function type(): string {
		return 'phone';
	}
}
