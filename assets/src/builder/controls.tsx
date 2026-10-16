/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useState } from '@wordpress/element';
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
