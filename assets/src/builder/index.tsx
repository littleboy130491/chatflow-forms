import { createElement, createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export function mountBuilder(root: HTMLElement): void {
  createRoot(root).render(createElement('p', null, __('The form builder module is not included in this foundation build.', 'chatflow-forms')));
}
