/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Field, Select } from '../builder/controls';
import { answerOperators } from './model';
import type { Filters as FilterValues } from './model';
export function Filters({
  value,
  onChange,
  purge = false,
}: {
  value: FilterValues;
  onChange: (value: FilterValues) => void;
  purge?: boolean;
}) {
  const update = (key: string, next: string | number | boolean | undefined) => {
    const values = { ...value };
    if (next === '' || next === undefined) delete values[key];
    else values[key] = next;
    onChange(values);
  };
  return (
    <div className="cff-settings-grid">
      <Field
        label={__('Form ID (blank = all)', 'chatflow-forms')}
        type="number"
        value={value.formId ?? ''}
        onChange={(next) => update('formId', Number(next) || undefined)}
      />
      <Field
        label={__('From date (UTC)', 'chatflow-forms')}
        type="date"
        value={value.from ?? ''}
        onChange={(next) => update('from', next)}
      />
      <Field
        label={__('To date (UTC)', 'chatflow-forms')}
        type="date"
        value={value.to ?? ''}
        onChange={(next) => update('to', next)}
      />
      {!purge && (
        <Field
          label={__('Search answers / email / phone', 'chatflow-forms')}
          value={value.search ?? ''}
          onChange={(next) => update('search', next)}
        />
      )}
      {!purge && (
        <React.Fragment>
          <Select
            label={__('Read state', 'chatflow-forms')}
            value={value.isRead === undefined ? '' : String(value.isRead)}
            choices={[
              { value: '', label: __('Any', 'chatflow-forms') },
              { value: 'true', label: __('Read', 'chatflow-forms') },
              { value: 'false', label: __('Unread', 'chatflow-forms') },
            ]}
            onChange={(next) => update('isRead', next === '' ? undefined : next === 'true')}
          />
          <Select
            label={__('Star state', 'chatflow-forms')}
            value={value.isStarred === undefined ? '' : String(value.isStarred)}
            choices={[
              { value: '', label: __('Any', 'chatflow-forms') },
              { value: 'true', label: __('Starred', 'chatflow-forms') },
              { value: 'false', label: __('Not starred', 'chatflow-forms') },
            ]}
            onChange={(next) => update('isStarred', next === '' ? undefined : next === 'true')}
          />
          <Field
            label={__('UTM source', 'chatflow-forms')}
            value={value.utmSource ?? ''}
            onChange={(next) => update('utmSource', next)}
          />
          <Field
            label={__('UTM campaign', 'chatflow-forms')}
            value={value.utmCampaign ?? ''}
            onChange={(next) => update('utmCampaign', next)}
          />
          <Select
            label={__('Device', 'chatflow-forms')}
            value={value.device ?? ''}
            choices={[
              { value: '', label: __('Any', 'chatflow-forms') },
              { value: 'mobile', label: __('Mobile', 'chatflow-forms') },
              { value: 'tablet', label: __('Tablet', 'chatflow-forms') },
              { value: 'desktop', label: __('Desktop', 'chatflow-forms') },
            ]}
            onChange={(next) => update('device', next)}
          />
          <Field
            label={__('Answer field key', 'chatflow-forms')}
            value={value.fieldKey ?? ''}
            onChange={(next) => update('fieldKey', next)}
          />
          <Select
            label={__('Answer operator', 'chatflow-forms')}
            value={value.operator ?? 'eq'}
            choices={answerOperators.map((operator) => ({ value: operator, label: operator }))}
            onChange={(next) => update('operator', next)}
          />
          <Field
            label={__('Answer value', 'chatflow-forms')}
            value={value.value ?? ''}
            onChange={(next) => update('value', next)}
          />
        </React.Fragment>
      )}
    </div>
  );
}
