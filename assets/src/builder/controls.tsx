/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useRef, useState } from '@wordpress/element';
import {
  Button,
  TextControl,
  TextareaControl,
  ToggleControl,
  SelectControl,
  Notice,
} from '@wordpress/components';
import type { ComponentProps } from 'react';
import { __ } from '@wordpress/i18n';
import type { Step } from './api';

export { Button, TextControl, TextareaControl, ToggleControl, SelectControl, Notice };
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  help,
  placeholder,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: ComponentProps<typeof TextControl>['type'];
  help?: string;
  placeholder?: string;
}) {
  return <TextControl label={label} value={value ?? ''} type={type} help={help} placeholder={placeholder} onChange={onChange} />;
}
export function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <TextareaControl label={label} value={value} onChange={onChange} />;
}
export function AnswerArea({ label, value, onChange, steps }: { label: string; value: string; onChange: (value: string) => void; steps: Step[] }) {
  const container = useRef<HTMLDivElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  const [fallback, setFallback] = useState('');
  return <div ref={container} onSelect={(event) => {
    if (event.target instanceof HTMLTextAreaElement) selection.current = { start: event.target.selectionStart, end: event.target.selectionEnd };
  }}>
    <Area label={label} value={value} onChange={onChange} />
    <Field label={__('Text to use if the answer is missing (optional)', 'chatflow-forms')} value={fallback} onChange={setFallback} />
    <Select label={__('Insert an answer', 'chatflow-forms')} value="" choices={[
      { label: __('Choose a question', 'chatflow-forms'), value: '' },
      ...steps.map(step => ({ label: step.label || step.key, value: `{{${step.key}}}` })),
    ]} onChange={tag => {
      if (!tag) return;
      if (fallback) tag = tag.slice(0, -2) + '|' + fallback.replace(/[{}]/g, '') + '}}';
      const start = Math.min(selection.current?.start ?? value.length, value.length);
      const end = Math.min(selection.current?.end ?? start, value.length);
      onChange(value.slice(0, start) + tag + value.slice(end));
      selection.current = { start: start + tag.length, end: start + tag.length };
      requestAnimationFrame(() => { const input = container.current?.querySelector('textarea'); input?.focus(); input?.setSelectionRange(start + tag.length, start + tag.length); });
    }} />
    <p className="description">{__('Missing answers use the optional fallback, or appear blank if it is empty.', 'chatflow-forms')}</p>
  </div>;
}
export function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}) {
  return <ToggleControl label={label} checked={value ?? false} onChange={onChange} />;
}
export function Select({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string | undefined;
  choices: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return <SelectControl label={label} value={value ?? ''} options={choices} onChange={onChange} />;
}
export function JsonEditor<T>({
  label,
  value,
  onChange,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null),
    [error, setError] = useState('');
  const apply = () => {
    try {
      onChange(JSON.parse(draft ?? JSON.stringify(value)) as T);
      setDraft(null);
      setError('');
    } catch {
      setError(__('Invalid JSON. Nothing was changed.', 'chatflow-forms'));
    }
  };
  return (
    <Fragment>
      <Area label={label} value={draft ?? JSON.stringify(value, null, 2)} onChange={setDraft} />
      <Button variant="secondary" onClick={apply}>
        {__('Apply JSON', 'chatflow-forms')}
      </Button>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
    </Fragment>
  );
}
