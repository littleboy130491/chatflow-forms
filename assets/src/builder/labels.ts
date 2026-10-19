import { __, sprintf } from '@wordpress/i18n';
import type { Ending, Step } from './api';

/** A bounded text label, never executable markup. Field keys and IDs stay immutable. */
export function questionLabel(message: string): string {
  let text = message.replace(/<[^>]*>/g, ' ');
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;
  }
  const characters = [...text.replace(/\s+/g, ' ').trim()];
  return characters.length > 80 ? characters.slice(0, 79).join('') + '…' : characters.join('');
}

export function withStepMessages(step: Step, messages: string[]): Step {
  const followsQuestion = !step.label.trim() || step.label === 'New question' ||
    step.label === __('New question', 'chatflow-forms') || step.label === questionLabel(step.messages[0] ?? '');
  return {
    ...step,
    messages,
    ...(followsQuestion ? { label: questionLabel(messages[0] ?? '') || __('New question', 'chatflow-forms') } : {}),
  };
}

export function endingTitle(ending: Ending, index: number): string {
  const title = questionLabel(ending.messages?.find(message => message.trim()) ?? '') ||
    (ending.type === 'redirect' ? __('Redirect to website', 'chatflow-forms') : __('Thank-you message', 'chatflow-forms'));
  return `${sprintf(__('Ending %d', 'chatflow-forms'), index + 1)} · ${title}`;
}
