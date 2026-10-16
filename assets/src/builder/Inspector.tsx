/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Area, Button, Check, Field, Select } from './controls';
import { RuleEditor } from './RuleEditor';
import { makeOption, reorder } from './model';
import type { ReactNode } from 'react';
import type { FormSchema, Step, Option } from './api';

export function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        className="cff-drag"
        aria-label={__('Drag or use arrow keys to reorder', 'chatflow-forms')}
        {...attributes}
        {...listeners}
      >
        ↕
      </button>
      {children}
    </div>
  );
}
function OptionEditor({
  option,
  onChange,
  onDelete,
  allowOther,
}: {
  option: Option;
  onChange: (option: Option) => void;
  onDelete: () => void;
  allowOther: boolean;
}) {
  return (
    <fieldset className="cff-option">
      <Field
        label={__('Option label', 'chatflow-forms')}
        value={option.label}
        onChange={(label) => onChange({ ...option, label })}
      />
      <Field
        label={__('Stored value', 'chatflow-forms')}
        value={option.value}
        onChange={(value) => onChange({ ...option, value })}
        help={__(
          'Changing a value changes exports and integrations. Its ID stays unchanged.',
          'chatflow-forms',
        )}
      />
      <Field
        label={__('Emoji', 'chatflow-forms')}
        value={option.emoji}
        onChange={(emoji) => onChange({ ...option, emoji })}
      />
      <Field
        label={__('Reaction text', 'chatflow-forms')}
        value={option.reaction}
        onChange={(reaction) => onChange({ ...option, reaction })}
      />
      <Field
        label={__('Image attachment ID', 'chatflow-forms')}
        type="number"
        value={option.image}
        onChange={(image) => {
          const next = { ...option };
          if (Number(image) > 0) next.image = Number(image);
          else delete next.image;
          onChange(next);
        }}
      />
      <Check
        label={__('Exclusive / none of the above', 'chatflow-forms')}
        value={option.isExclusive}
        onChange={(isExclusive) => onChange({ ...option, isExclusive })}
      />
      {allowOther && (
        <Check
          label={__('Other (free-text option)', 'chatflow-forms')}
          value={option.isOther}
          onChange={(isOther) => onChange({ ...option, isOther })}
        />
      )}
      <Button isDestructive onClick={onDelete}>
        {__('Remove option', 'chatflow-forms')}
      </Button>
    </fieldset>
  );
}
export function Inspector({
  step,
  schema,
  reservedValues = [],
  onChange,
}: {
  step: Step;
  schema: FormSchema;
  reservedValues?: string[];
  onChange: (step: Step) => void;
}) {
  const [tab, setTab] = useState('content'),
    [bulk, setBulk] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const validation = step.validation ?? {},
    settings = step.settings ?? {};
  const patchSettings = (patch: Partial<NonNullable<Step['settings']>>) =>
    onChange({ ...step, settings: { ...settings, ...patch } });
  const setOptions = (options: Option[]) => onChange({ ...step, options });
  return (
    <aside className="cff-inspector">
      <h2>{step.label}</h2>
      <nav className="cff-tabs">
        {[
          { value: 'content', label: __('Content', 'chatflow-forms') },
          { value: 'validation', label: __('Validation', 'chatflow-forms') },
          { value: 'logic', label: __('Logic', 'chatflow-forms') },
        ].map((item) => (
          <Button
            key={item.value}
            variant={tab === item.value ? 'primary' : 'secondary'}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
      {tab === 'content' && (
        <Fragment>
          <Field
            label={__('Label', 'chatflow-forms')}
            value={step.label}
            onChange={(label) => onChange({ ...step, label })}
          />
          <Field
            label={__('Field key', 'chatflow-forms')}
            value={step.key}
            onChange={(key) => onChange({ ...step, key })}
            help={__(
              'Keys are used by exports and integrations. Renaming keeps the immutable ID; review dependent merge tags and rules.',
              'chatflow-forms',
            )}
          />
          {step.messages.map((message, index) => (
            <div key={index}>
              <Area
                label={__('Bot message', 'chatflow-forms')}
                value={message}
                onChange={(value) =>
                  onChange({
                    ...step,
                    messages: step.messages.map((item, at) => (at === index ? value : item)),
                  })
                }
              />
              <Select
                label={__('Insert merge tag', 'chatflow-forms')}
                value=""
                choices={[
                  { label: __('Choose a field', 'chatflow-forms'), value: '' },
                  ...schema.steps
                    .filter((item) => item.id !== step.id)
                    .map((item) => ({ label: item.label, value: `{{${item.key}}}` })),
                ]}
                onChange={(tag) => {
                  if (tag)
                    onChange({
                      ...step,
                      messages: step.messages.map((item, at) => (at === index ? item + tag : item)),
                    });
                }}
              />
              <Button
                isDestructive
                onClick={() => onChange({ ...step, messages: step.messages.filter((_, at) => at !== index) })}
              >
                {__('Remove message', 'chatflow-forms')}
              </Button>
            </div>
          ))}
          <Button onClick={() => onChange({ ...step, messages: [...step.messages, ''] })}>
            {__('Add message', 'chatflow-forms')}
          </Button>
          <Field
            label={__('Placeholder', 'chatflow-forms')}
            value={step.placeholder}
            onChange={(placeholder) => onChange({ ...step, placeholder })}
          />
          <Area
            label={__('Help text', 'chatflow-forms')}
            value={step.helpText ?? ''}
            onChange={(helpText) => onChange({ ...step, helpText })}
          />
          <Check
            label={__('Required', 'chatflow-forms')}
            value={step.required}
            onChange={(required) => onChange({ ...step, required: step.type === 'consent' || required })}
          />
          <Check
            label={__('Hidden until shown by a rule', 'chatflow-forms')}
            value={step.hiddenByDefault}
            onChange={(hiddenByDefault) => onChange({ ...step, hiddenByDefault })}
          />
          {['single_choice', 'multi_choice'].includes(step.type) && (
            <Fragment>
              <Select
                label={__('Choice layout', 'chatflow-forms')}
                value={settings.layout ?? 'chips'}
                choices={['chips', 'cards', 'dropdown'].map((value) => ({ label: value, value }))}
                onChange={(layout) => patchSettings({ layout: layout as 'chips' | 'cards' | 'dropdown' })}
              />
              <DndContext
                sensors={sensors}
                onDragEnd={({ active, over }) => {
                  if (over) setOptions(reorder(step.options ?? [], String(active.id), String(over.id)));
                }}
              >
                <SortableContext
                  items={(step.options ?? []).map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {(step.options ?? []).map((option) => (
                    <SortableItem key={option.id} id={option.id}>
                      <OptionEditor
                        allowOther={step.type === 'single_choice'}
                        option={option}
                        onChange={(next) =>
                          setOptions((step.options ?? []).map((item) => (item.id === next.id ? next : item)))
                        }
                        onDelete={() =>
                          setOptions((step.options ?? []).filter((item) => item.id !== option.id))
                        }
                      />
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
              <Button
                disabled={(step.options?.length ?? 0) >= 200}
                onClick={() => {
                  const values = new Set([
                    ...reservedValues,
                    ...(step.options?.map((item) => item.value) ?? []),
                  ]);
                  let value = 'option_1',
                    count = 2;
                  while (values.has(value)) value = `option_${count++}`;
                  setOptions([...(step.options ?? []), makeOption(value)]);
                }}
              >
                {__('Add option', 'chatflow-forms')}
              </Button>
              <Area
                label={__('Bulk options (one label per line)', 'chatflow-forms')}
                value={bulk}
                onChange={setBulk}
              />
              <Button
                onClick={() => {
                  const existing = step.options ?? [];
                  const next = bulk
                    .split('\n')
                    .map((label) => label.trim())
                    .filter(Boolean)
                    .slice(0, 200 - existing.length)
                    .map((label) => ({ ...makeOption(`value_${crypto.randomUUID().slice(0, 8)}`), label }));
                  setOptions([...existing, ...next]);
                  setBulk('');
                }}
              >
                {__('Append options', 'chatflow-forms')}
              </Button>
            </Fragment>
          )}
          {['rating', 'scale', 'nps'].includes(step.type) && (
            <p className="description">
              {__('Rating: 1–5, scale: 1–10, NPS: 0–10. Values are stored as numbers.', 'chatflow-forms')}
            </p>
          )}
          {step.type === 'phone' && (
            <Field
              label={__('Default country (ISO code)', 'chatflow-forms')}
              value={settings.country ?? 'ID'}
              onChange={(country) => patchSettings({ country: country.toUpperCase() })}
            />
          )}
          <Field
            label={__('Autocomplete', 'chatflow-forms')}
            value={settings.autocomplete}
            onChange={(autocomplete) => patchSettings({ autocomplete })}
          />
          <Select
            label={__('Keyboard hint', 'chatflow-forms')}
            value={settings.inputMode ?? 'text'}
            choices={['text', 'numeric', 'tel', 'decimal', 'email', 'url', 'search', 'none'].map((value) => ({
              label: value,
              value,
            }))}
            onChange={(inputMode) =>
              patchSettings({
                inputMode: inputMode as NonNullable<NonNullable<Step['settings']>['inputMode']>,
              })
            }
          />
          {['statement', 'summary'].includes(step.type) && (
            <Fragment>
              <Field
                label={__('Continue / submit button', 'chatflow-forms')}
                value={settings.buttonLabel}
                onChange={(buttonLabel) => patchSettings({ buttonLabel })}
              />
              <Check
                label={__('Auto-continue statement', 'chatflow-forms')}
                value={settings.autoContinue}
                onChange={(autoContinue) => patchSettings({ autoContinue })}
              />
            </Fragment>
          )}
          {step.type === 'consent' && (
            <Fragment>
              <Area
                label={__('Consent text', 'chatflow-forms')}
                value={settings.consentText ?? ''}
                onChange={(consentText) => patchSettings({ consentText })}
              />
              <Field
                label={__('Privacy policy URL', 'chatflow-forms')}
                value={settings.privacyUrl}
                onChange={(privacyUrl) => patchSettings({ privacyUrl })}
              />
            </Fragment>
          )}
          {step.type === 'hidden' && (
            <Fragment>
              <Select
                label={__('Hidden value source', 'chatflow-forms')}
                value={settings.source ?? 'default'}
                choices={['default', 'url', 'cookie', 'meta', 'merge'].map((value) => ({
                  label: value,
                  value,
                }))}
                onChange={(source) =>
                  patchSettings({ source: source as NonNullable<NonNullable<Step['settings']>['source']> })
                }
              />
              <Field
                label={__('Source key', 'chatflow-forms')}
                value={settings.sourceKey}
                onChange={(sourceKey) => patchSettings({ sourceKey })}
              />
              <Field
                label={__('Default value', 'chatflow-forms')}
                value={typeof step.defaultValue === 'string' ? step.defaultValue : ''}
                onChange={(defaultValue) => onChange({ ...step, defaultValue })}
              />
            </Fragment>
          )}
        </Fragment>
      )}
      {tab === 'validation' && (
        <Fragment>
          {['short_text', 'long_text', 'email', 'phone'].includes(step.type) && (
            <Fragment>
              {(['minLength', 'maxLength'] as const).map((key) => (
                <Field
                  key={key}
                  label={
                    key === 'minLength'
                      ? __('Minimum length', 'chatflow-forms')
                      : __('Maximum length', 'chatflow-forms')
                  }
                  type="number"
                  value={validation[key]}
                  onChange={(value) => {
                    const next = { ...validation };
                    if (value === '') delete next[key];
                    else next[key] = Number(value);
                    onChange({ ...step, validation: next });
                  }}
                />
              ))}
              <Field
                label={__('Regex pattern', 'chatflow-forms')}
                value={validation.pattern}
                onChange={(pattern) => onChange({ ...step, validation: { ...validation, pattern } })}
              />
              <Select
                label={__('Format', 'chatflow-forms')}
                value={validation.format ?? 'text'}
                choices={['text', 'url', 'email'].map((value) => ({ label: value, value }))}
                onChange={(format) =>
                  onChange({
                    ...step,
                    validation: { ...validation, format: format as 'text' | 'url' | 'email' },
                  })
                }
              />
            </Fragment>
          )}
          {['number', 'date', 'slider'].includes(step.type) && (
            <Fragment>
              {(['min', 'max'] as const).map((key) => (
                <Field
                  key={key}
                  label={key === 'min' ? __('Minimum', 'chatflow-forms') : __('Maximum', 'chatflow-forms')}
                  value={validation[key]}
                  type={step.type === 'date' ? 'date' : 'number'}
                  onChange={(value) => {
                    const next = { ...validation };
                    if (value === '') delete next[key];
                    else next[key] = step.type === 'date' ? value : Number(value);
                    onChange({ ...step, validation: next });
                  }}
                />
              ))}
              <Field
                label={
                  step.type === 'date'
                    ? __('Minimum age', 'chatflow-forms')
                    : __('Number increment', 'chatflow-forms')
                }
                type="number"
                value={step.type === 'date' ? validation.minAge : validation.step}
                onChange={(value) => {
                  const key = step.type === 'date' ? 'minAge' : 'step';
                  const next = { ...validation };
                  if (value === '') delete next[key];
                  else next[key] = Number(value);
                  onChange({ ...step, validation: next });
                }}
              />
            </Fragment>
          )}
          {['number', 'slider'].includes(step.type) && (
            <Field
              label={__('Unit suffix', 'chatflow-forms')}
              value={settings.unit}
              onChange={(unit) => patchSettings({ unit })}
            />
          )}
          {step.type === 'multi_choice' &&
            (['minSelections', 'maxSelections'] as const).map((key) => (
              <Field
                key={key}
                label={
                  key === 'minSelections'
                    ? __('Minimum selections', 'chatflow-forms')
                    : __('Maximum selections', 'chatflow-forms')
                }
                type="number"
                value={validation[key]}
                onChange={(value) => {
                  const next = { ...validation };
                  if (value === '') delete next[key];
                  else next[key] = Number(value);
                  onChange({ ...step, validation: next });
                }}
              />
            ))}
        </Fragment>
      )}
      {tab === 'logic' && (
        <RuleEditor
          schema={schema}
          rules={step.logic ?? []}
          onChange={(logic) => onChange({ ...step, logic })}
        />
      )}
    </aside>
  );
}
