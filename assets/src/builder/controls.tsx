/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
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
/**
 * A text field that applies its value on blur or Enter, after validation. Used for
 * identifiers whose rename rewrites references elsewhere, so a half-typed value
 * never collides with another field's references.
 */
export function CommitField({
  label,
  value,
  onCommit,
  validate,
  help,
}: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  validate: (value: string) => string;
  help?: string;
}) {
  const [draft, setDraft] = useState(value),
    [error, setError] = useState('');
  useEffect(() => {
    setDraft(value);
    setError('');
  }, [value]);
  const commit = () => {
    if (draft === value) return setError('');
    const message = validate(draft);
    setError(message);
    if (!message) onCommit(draft);
  };
  return (
    <div
      className={error ? 'cff-commit-field has-error' : 'cff-commit-field'}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        } else if (event.key === 'Escape' && draft !== value) {
          event.stopPropagation();
          setDraft(value);
          setError('');
        }
      }}
    >
      <Field label={label} value={draft} onChange={setDraft} {...(help ? { help } : {})} />
      {error && <p className="cff-field-error" role="alert">{error}</p>}
    </div>
  );
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
interface MediaAttachment { id: number; url?: string; alt?: string }
interface MediaFrame {
  on(event: string, callback: () => void): void;
  open(): void;
  state(): { get(key: string): { first(): { toJSON(): MediaAttachment } } };
}
/** Attachment ID with the WordPress media library picker; keeps the numeric field editable. */
export function MediaIdField({ label, value, onChange, help }: { label: string; value: number | undefined; onChange: (value: number) => void; help?: string }) {
  const media = (globalThis as unknown as { wp?: { media?: (options: Record<string, unknown>) => MediaFrame } }).wp?.media;
  const choose = () => {
    if (!media) return;
    const frame = media({ title: label, button: { text: __('Use image', 'chatflow-forms') }, multiple: false, library: { type: 'image' } });
    frame.on('select', () => {
      const attachment = frame.state().get('selection').first().toJSON();
      if (Number.isSafeInteger(attachment.id) && attachment.id > 0) onChange(attachment.id);
    });
    frame.open();
  };
  return <div className="cff-media-id">
    <Field label={label} type="number" value={value ?? ''} {...(help ? { help } : {})} onChange={(next) => onChange(Number(next) || 0)} />
    <Button variant="secondary" onClick={choose} disabled={!media}>{value ? __('Replace image', 'chatflow-forms') : __('Choose image', 'chatflow-forms')}</Button>
  </div>;
}
export function AnswerArea({ label, value, onChange, steps }: { label: string; value: string; onChange: (value: string) => void; steps: Step[] }) {
  const container = useRef<HTMLDivElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  const [fallback, setFallback] = useState('');
  const remember = (target: EventTarget | null) => {
    if (target instanceof HTMLTextAreaElement) selection.current = { start: target.selectionStart, end: target.selectionEnd };
  };
  // onSelect alone is unreliable (React derives it from global focus state); blur
  // also captures the caret when the admin moves to the "Insert an answer" menu.
  return <div ref={container} onSelect={(event) => remember(event.target)} onBlur={(event) => remember(event.target)}>
    <Area label={label} value={value} onChange={onChange} />
    <Field label={__('Text to use if the answer is missing (optional)', 'chatflow-forms')} value={fallback} onChange={setFallback} />
    <Select label={__('Insert an answer', 'chatflow-forms')} value="" choices={[
      { label: __('Choose a question', 'chatflow-forms'), value: '' },
      ...steps.map(step => ({ label: step.label || step.key, value: `{{${step.key}}}` })),
    ]} onChange={tag => {
      if (!tag) return;
      const textarea = container.current?.querySelector('textarea');
      if (textarea && textarea === textarea.ownerDocument.activeElement) remember(textarea);
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
