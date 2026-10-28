/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Field, Select } from '../builder/controls';
import { FormPicker } from './FormPicker';
import type { AdminApi } from '../builder/api';
import { answerOperators, operatorLabel } from './model';
import type { Filters as FilterValues } from './model';
export function Filters({
  api,
  value,
  onChange,
  purge = false,
  questions = [],
}: {
  api?: AdminApi;
  value: FilterValues;
  onChange: (value: FilterValues) => void;
  purge?: boolean;
  questions?: { key: string; label: string }[];
}) {
  const update = (key: string, next: string | number | boolean | undefined) => {
    const values = { ...value };
    if (next === '' || next === undefined) delete values[key];
    else values[key] = next;
    onChange(values);
  };
  return (
    <div className="cff-settings-grid cff-inbox-filters">
      {api ? <FormPicker api={api} value={String(value.formId ?? '')} onChange={next => update('formId', Number(next) || undefined)} /> : <Field label={__('Form ID (blank = all)', 'chatflow-forms')} type="number" value={value.formId ?? ''} onChange={next => update('formId', Number(next) || undefined)} />}
      <Field
        label={__('From date', 'chatflow-forms')}
        type="date"
        value={value.from ?? ''}
        onChange={(next) => update('from', next)}
      />
      <Field
        label={__('To date', 'chatflow-forms')}
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
        <details className="cff-disclosure cff-advanced-filters"><summary>{__('Advanced filters', 'chatflow-forms')}</summary><div className="cff-settings-grid">
          {/* Deleted forms keep retained submissions but no longer appear in the picker. */}
          {api && <Field label={__('Deleted form ID (for responses of a form that no longer exists)', 'chatflow-forms')} type="number" value={value.formId ?? ''} onChange={next => update('formId', Number(next) || undefined)} />}
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
          {/* Pick the question by its label when the loaded responses tell us the labels. */}
          {questions.length > 0 && !(value.fieldKey && !questions.some((question) => question.key === value.fieldKey)) ? (
            <Select
              label={__('Answer to question', 'chatflow-forms')}
              value={value.fieldKey ?? ''}
              choices={[{ value: '', label: __('Any question', 'chatflow-forms') }, ...questions.map((question) => ({ value: question.key, label: question.label || question.key }))]}
              onChange={(next) => update('fieldKey', next)}
            />
          ) : (
            <Field
              label={__('Answer field key', 'chatflow-forms')}
              value={value.fieldKey ?? ''}
              onChange={(next) => update('fieldKey', next)}
            />
          )}
          {value.fieldKey && <Select
            label={__('Condition', 'chatflow-forms')}
            value={value.operator ?? 'eq'}
            choices={answerOperators.map((operator) => ({ value: operator, label: operatorLabel(operator) }))}
            onChange={(next) => update('operator', next)}
          />}
          {value.fieldKey && <Field
            label={__('Answer value', 'chatflow-forms')}
            value={value.value ?? ''}
            onChange={(next) => update('value', next)}
          />}
        </div></details>
      )}
    </div>
  );
}
