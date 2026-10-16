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
  schema,
}: {
  option: Option;
  onChange: (option: Option) => void;
  onDelete: () => void;
  allowOther: boolean;
  schema: FormSchema;
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
      <details><summary>{__('Logic', 'chatflow-forms')}</summary><RuleEditor schema={schema} rules={option.logic ?? []} onChange={(logic) => onChange({ ...option, logic })} /></details>
      <Button isDestructive onClick={onDelete}>
        {__('Remove option', 'chatflow-forms')}
      </Button>
    </fieldset>
  );
}
const layoutLabels = (): Record<'chips' | 'cards' | 'dropdown', string> => ({
  chips: __('Chips', 'chatflow-forms'),
  cards: __('Cards', 'chatflow-forms'),
  dropdown: __('Dropdown', 'chatflow-forms'),
});
const sourceLabels = (): Record<'default' | 'url' | 'cookie' | 'meta' | 'merge', string> => ({
  default: __('Default value', 'chatflow-forms'),
  url: __('URL parameter', 'chatflow-forms'),
  cookie: __('Cookie', 'chatflow-forms'),
  meta: __('Page metadata', 'chatflow-forms'),
  merge: __('Merge tag', 'chatflow-forms'),
});
const mediaLabels = (): Record<'image' | 'video' | 'gif', string> => ({
  image: __('Image', 'chatflow-forms'),
  video: __('Video', 'chatflow-forms'),
  gif: __('GIF', 'chatflow-forms'),
});
const addressLabels = (): Record<'street' | 'city' | 'postcode' | 'country', string> => ({
  street: __('Street', 'chatflow-forms'),
  city: __('City', 'chatflow-forms'),
  postcode: __('Postcode', 'chatflow-forms'),
  country: __('Country', 'chatflow-forms'),
});
const formatLabels = (): Record<'text' | 'url' | 'email', string> => ({
  text: __('Any text', 'chatflow-forms'),
  url: __('URL', 'chatflow-forms'),
  email: __('Email address', 'chatflow-forms'),
});
const inputModeLabels = (): Record<string, string> => ({
  text: __('Standard keyboard', 'chatflow-forms'),
  numeric: __('Numbers', 'chatflow-forms'),
  tel: __('Telephone keypad', 'chatflow-forms'),
  decimal: __('Decimal numbers', 'chatflow-forms'),
  email: __('Email keyboard', 'chatflow-forms'),
  url: __('URL keyboard', 'chatflow-forms'),
  search: __('Search keyboard', 'chatflow-forms'),
  none: __('No on-screen keyboard', 'chatflow-forms'),
});
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
                choices={(['chips', 'cards', 'dropdown'] as const).map((value) => ({ label: layoutLabels()[value], value }))}
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
                        schema={schema}
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
          {step.type === 'calculated' && <Field label={__('Arithmetic expression (answer.key, variable.key)', 'chatflow-forms')} value={settings.expression ?? ''} onChange={expression => patchSettings({ expression })} />}
          {step.type === 'phone' && (
            <Field
              label={__('Default country (ISO code)', 'chatflow-forms')}
              value={settings.country ?? 'ID'}
              onChange={(country) => patchSettings({ country: country.toUpperCase() })}
            />
          )}
          {step.type === 'address' && (['street','city','postcode','country'] as const).map((field) => <Check key={field} label={addressLabels()[field]} value={(settings.addressFields ?? ['street','city','postcode','country']).some((value)=>value===field)}
            onChange={(checked)=>{const fields=settings.addressFields ?? ['street','city','postcode','country'];const next=checked ? [...fields.filter((value)=>value!==field),field] : fields.filter((value)=>value!==field);patchSettings({addressFields:next as NonNullable<Step['settings']>['addressFields'] & {length:number}});}} />)}
          {step.type === 'media' && <Fragment>
            <Select label={__('Media type','chatflow-forms')} value={settings.media?.type ?? 'image'} choices={(['image','video','gif'] as const).map((value)=>({value,label:mediaLabels()[value]}))} onChange={(type)=>patchSettings({media:{url:settings.media?.url ?? '',...settings.media,type:type as 'image'|'video'|'gif'}})} />
            <Field label={__('HTTPS media URL','chatflow-forms')} value={settings.media?.url ?? ''} onChange={(url)=>patchSettings({media:{type:'image',...settings.media,url}})} />
            <Field label={__('Alternative text','chatflow-forms')} value={settings.media?.alt ?? ''} onChange={(alt)=>patchSettings({media:{type:'image',url:'',...settings.media,alt}})} />
          </Fragment>}
          <Field
            label={__('Autocomplete', 'chatflow-forms')}
            value={settings.autocomplete}
            onChange={(autocomplete) => patchSettings({ autocomplete })}
          />
          <Select
            label={__('Keyboard hint', 'chatflow-forms')}
            value={settings.inputMode ?? 'text'}
            choices={['text', 'numeric', 'tel', 'decimal', 'email', 'url', 'search', 'none'].map((value) => ({
              label: inputModeLabels()[value] ?? value,
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
              {step.type === 'statement' && <Check
                label={__('Wait for the visitor to press a button', 'chatflow-forms')}
                value={settings.autoContinue === false}
                onChange={(wait) => patchSettings({ autoContinue: !wait })}
              />}
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
                choices={(['default', 'url', 'cookie', 'meta', 'merge'] as const).map((value) => ({
                  label: sourceLabels()[value],
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
              {settings.source === 'cookie' && <p>{__('Cookie sources support only utm_source, utm_medium, utm_campaign, utm_term, utm_content, campaign, tracking, cff_locale and cff_theme. Authentication, session and token cookies are never available.', 'chatflow-forms')}</p>}
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
          {step.type === 'file_upload' && <Fragment>
            <Field label={__('Maximum bytes per file','chatflow-forms')} type="number" value={validation.maxBytes ?? ''} onChange={(value)=>onChange({...step,validation:{...validation,maxBytes:Number(value)}})} />
            <Field label={__('Allowed MIME types (comma separated)','chatflow-forms')} value={(validation.mimeTypes ?? []).join(',')} onChange={(value)=>onChange({...step,validation:{...validation,mimeTypes:value.split(',').map((mime)=>mime.trim()).filter(Boolean)}})} />
          </Fragment>}
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
                choices={(['text', 'url', 'email'] as const).map((value) => ({ label: formatLabels()[value], value }))}
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
