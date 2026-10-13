import { createElement } from '@wordpress/element';
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { BlockEditor } from './editor';
export const blockName = 'chatflow/form';
registerBlockType(blockName, {
  apiVersion: 3,
  title: __('ChatFlow Form', 'chatflow-forms'),
  description: __('A published conversational form.', 'chatflow-forms'),
  category: 'widgets',
  icon: 'format-chat',
  supports: { html: false },
  attributes: {
    formId: { type: 'integer', default: 0 },
    mode: { type: 'string', default: 'inline' },
    height: { type: 'integer', default: 600 },
    theme: { type: 'string', default: 'auto' },
  },
  edit: (props) =>
    createElement(BlockEditor, {
      attributes: props.attributes as { formId: number; mode: string; height: number; theme: string },
      setAttributes: props.setAttributes,
    }),
  save: () => null,
});
