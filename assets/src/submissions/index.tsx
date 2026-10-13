import { createElement, createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export function mountSubmissions(root: HTMLElement): void {
  createRoot(root).render(createElement('p', null, __('The submissions module is not included in this foundation build.', 'chatflow-forms')));
}
