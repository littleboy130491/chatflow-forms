/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Field, JsonEditor, Select } from './controls';
import type { Condition, FormSchema, Rule } from './api';

type Predicate = Extract<Condition, { field: string }>;
const scoring = (rule: Rule): Extract<Rule['then'], { action: 'set_variable' }> => rule.then as Extract<Rule['then'], { action: 'set_variable' }>;
const operators: Predicate['op'][] = [
  'eq',
  'neq',
  'contains',
  'not_contains',
  'in',
  'not_in',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'is_empty',
  'is_not_empty',
  'starts_with',
  'matches',
  'date_before',
  'date_after',
  'age_gte',
];
export const operatorLabels: Record<Predicate['op'], string> = {
  eq: __('equals', 'chatflow-forms'),
  neq: __('does not equal', 'chatflow-forms'),
  contains: __('contains', 'chatflow-forms'),
  not_contains: __('does not contain', 'chatflow-forms'),
  in: __('is one of', 'chatflow-forms'),
  not_in: __('is not one of', 'chatflow-forms'),
  gt: __('is greater than', 'chatflow-forms'),
  gte: __('is at least', 'chatflow-forms'),
  lt: __('is less than', 'chatflow-forms'),
  lte: __('is at most', 'chatflow-forms'),
  between: __('is between', 'chatflow-forms'),
  is_empty: __('is empty', 'chatflow-forms'),
  is_not_empty: __('is not empty', 'chatflow-forms'),
  starts_with: __('starts with', 'chatflow-forms'),
  matches: __('matches pattern', 'chatflow-forms'),
  date_before: __('date is before', 'chatflow-forms'),
  date_after: __('date is after', 'chatflow-forms'),
  age_gte: __('age is at least', 'chatflow-forms'),
};
const actions = ['show', 'hide', 'jump', 'end', 'require', 'unrequire', 'set_variable'] as const;
export const actionLabels: Record<(typeof actions)[number], string> = {
  show: __('Show field', 'chatflow-forms'),
  hide: __('Hide field', 'chatflow-forms'),
  jump: __('Jump to field', 'chatflow-forms'),
  end: __('End with', 'chatflow-forms'),
  require: __('Make field required', 'chatflow-forms'),
  unrequire: __('Make field optional', 'chatflow-forms'),
  set_variable: __('Set variable', 'chatflow-forms'),
};
const actionChoices = () => actions.map((action) => ({ value: action, label: actionLabels[action] }));
const sourceLabels: Record<'answer' | 'hidden' | 'url', string> = {
  answer: __('Answer', 'chatflow-forms'),
  hidden: __('Hidden field', 'chatflow-forms'),
  url: __('URL parameter', 'chatflow-forms'),
};
const operationLabels: Record<'set' | 'add' | 'subtract', string> = {
  set: __('Set to', 'chatflow-forms'),
  add: __('Add', 'chatflow-forms'),
  subtract: __('Subtract', 'chatflow-forms'),
};
export function firstCondition(schema: FormSchema): Condition {
  return { field: schema.steps[0]?.key ?? 'field', source: 'answer', op: 'eq', value: '' };
}
function decodeValue(value: string, predicate: Predicate, schema: FormSchema): Predicate['value'] {
  const step = schema.steps.find((item) => item.key === predicate.field);
  if (['in', 'not_in', 'between'].includes(predicate.op)) return JSON.parse(value) as Predicate['value'];
  if (['is_empty', 'is_not_empty'].includes(predicate.op)) return undefined;
  if (['number'].includes(step?.type ?? '') || ['gt', 'gte', 'lt', 'lte', 'age_gte'].includes(predicate.op))
    return value === '' ? null : Number(value);
  if (['yes_no', 'consent'].includes(step?.type ?? '')) return value === 'true';
  return value;
}
export function ConditionEditor({
  value,
  schema,
  onChange,
  depth = 0,
}: {
  value: Condition;
  schema: FormSchema;
  onChange: (condition: Condition) => void;
  depth?: number;
}) {
  if ('all' in value || 'any' in value) {
    const mode = 'all' in value ? 'all' : 'any',
      conditions = 'all' in value ? value.all : value.any;
    const update = (items: Condition[]) => onChange(mode === 'all' ? { all: items } : { any: items });
    if (depth > 1)
      return (
        <JsonEditor label={__('Nested condition', 'chatflow-forms')} value={value} onChange={onChange} />
      );
    return (
      <fieldset>
        <Select
          label={__('Match conditions', 'chatflow-forms')}
          value={mode}
          choices={[
            { value: 'all', label: __('All (AND)', 'chatflow-forms') },
            { value: 'any', label: __('Any (OR)', 'chatflow-forms') },
          ]}
          onChange={(next) => onChange(next === 'all' ? { all: conditions } : { any: conditions })}
        />
        {conditions.map((condition, index) => (
          <div className="cff-rule" key={index}>
            <ConditionEditor
              value={condition}
              schema={schema}
              depth={depth + 1}
              onChange={(next) => update(conditions.map((item, at) => (at === index ? next : item)))}
            />
            <Button isDestructive onClick={() => update(conditions.filter((_, at) => at !== index))}>
              {__('Remove condition', 'chatflow-forms')}
            </Button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => update([...conditions, firstCondition(schema)])}>
          {__('Add condition', 'chatflow-forms')}
        </Button>
        {depth < 1 && (
          <Button onClick={() => update([...conditions, { any: [firstCondition(schema)] }])}>
            {__('Add OR group', 'chatflow-forms')}
          </Button>
        )}
      </fieldset>
    );
  }
  const step = schema.steps.find((item) => item.key === value.field),
    arrayValue = ['in', 'not_in', 'between'].includes(value.op);
  const shown = typeof value.value === 'object' ? JSON.stringify(value.value) : String(value.value ?? '');
  return (
    <div className="cff-condition">
      <Select
        label={__('Operand source', 'chatflow-forms')}
        value={value.source ?? 'answer'}
        choices={(['answer', 'hidden', 'url'] as const).map((source) => ({ value: source, label: sourceLabels[source] }))}
        onChange={(source) => onChange({ ...value, source: source as NonNullable<Predicate['source']> })}
      />
      {(value.source ?? 'answer') === 'answer' ? (
        <Select
          label={__('Field', 'chatflow-forms')}
          value={value.field}
          choices={schema.steps.map((item) => ({ value: item.key, label: `${item.label} (${item.key})` }))}
          onChange={(field) => onChange({ ...value, field, value: '' })}
        />
      ) : (
        <Field
          label={__('Key', 'chatflow-forms')}
          value={value.field}
          onChange={(field) => onChange({ ...value, field })}
        />
      )}
      <Select
        label={__('Operator', 'chatflow-forms')}
        value={value.op}
        choices={operators.map((op) => ({ value: op, label: operatorLabels[op] }))}
        onChange={(op) =>
          onChange({
            ...value,
            op: op as Predicate['op'],
            value: ['in', 'not_in', 'between'].includes(op) ? [] : '',
          })
        }
      />
      {!['is_empty', 'is_not_empty'].includes(value.op) &&
        (arrayValue ? (
          <JsonEditor
            label={__('Values (JSON array)', 'chatflow-forms')}
            value={value.value ?? []}
            onChange={(next) => onChange({ ...value, value: next })}
          />
        ) : step?.options?.length && ['eq', 'neq'].includes(value.op) ? (
          <Select
            label={__('Value', 'chatflow-forms')}
            value={shown}
            choices={[
              { label: __('Select an option', 'chatflow-forms'), value: '' },
              ...step.options.map((option) => ({ label: option.label, value: option.value })),
            ]}
            onChange={(next) => onChange({ ...value, value: next })}
          />
        ) : ['yes_no', 'consent'].includes(step?.type ?? '') ? (
          <Select
            label={__('Value', 'chatflow-forms')}
            value={shown}
            choices={[
              { label: __('Yes', 'chatflow-forms'), value: 'true' },
              { label: __('No', 'chatflow-forms'), value: 'false' },
            ]}
            onChange={(next) => onChange({ ...value, value: next === 'true' })}
          />
        ) : (
          <Field
            label={__('Value', 'chatflow-forms')}
            type={
              step?.type === 'date'
                ? 'date'
                : step?.type === 'number' || value.op === 'age_gte'
                  ? 'number'
                  : 'text'
            }
            value={shown}
            onChange={(next) => {
              const decoded = decodeValue(next, value, schema),
                condition = { ...value };
              if (decoded === undefined) delete condition.value;
              else condition.value = decoded;
              onChange(condition);
            }}
          />
        ))}
      {depth === 0 && (
        <Button onClick={() => onChange({ all: [value, firstCondition(schema)] })}>
          {__('Add AND / OR', 'chatflow-forms')}
        </Button>
      )}
    </div>
  );
}
export function RuleEditor({
  rules,
  schema,
  onChange,
}: {
  rules: Rule[];
  schema: FormSchema;
  onChange: (rules: Rule[]) => void;
}) {
  const set = (at: number, rule: Rule) => onChange(rules.map((item, index) => (index === at ? rule : item)));
  return (
    <section>
      <h3>{__('Logic rules (evaluated in order)', 'chatflow-forms')}</h3>
      {rules.map((rule, index) => (
        <fieldset className="cff-rule" key={index}>
          <legend>{index + 1}</legend>
          <ConditionEditor
            value={rule.if}
            schema={schema}
            onChange={(condition) => set(index, { ...rule, if: condition })}
          />
          {rule.then.action === 'set_variable' ? (<>
            <Select label={__('Action', 'chatflow-forms')} value="set_variable" choices={actionChoices()} onChange={action => set(index, { ...rule, then: { action: action as 'jump', to: schema.steps[0]?.id ?? '' } })} />
            <Select label={__('Variable', 'chatflow-forms')} value={rule.then.key} choices={(schema.variables ?? []).map(v => ({ value: v.key, label: v.key }))} onChange={key => set(index, { ...rule, then: { ...scoring(rule), key } })} />
            <Select label={__('Operation', 'chatflow-forms')} value={rule.then.operation} choices={(['set', 'add', 'subtract'] as const).map(value => ({ value, label: operationLabels[value] }))} onChange={operation => set(index, { ...rule, then: { ...scoring(rule), operation: operation as 'set' | 'add' | 'subtract' } })} />
            <Field label={__('Value', 'chatflow-forms')} value={String(rule.then.value ?? '')} onChange={value => set(index, { ...rule, then: { ...scoring(rule), value: schema.variables?.find(v => v.key === scoring(rule).key)?.type === 'number' ? Number(value) : schema.variables?.find(v => v.key === scoring(rule).key)?.type === 'boolean' ? value === 'true' : value } })} />
          </>) : (
            <>
              <Select
                label={__('Action', 'chatflow-forms')}
                value={rule.then.action}
                choices={actionChoices()}
                onChange={(action) =>
                  set(index, {
                    ...rule,
                    then: action === 'set_variable' ? { action: 'set_variable', key: schema.variables?.[0]?.key ?? '', operation: 'set', value: schema.variables?.[0]?.default ?? 0 } : {
                      action: action as Exclude<Rule['then']['action'], 'set_variable'>,
                      to: action === 'end' ? (schema.endings[0]?.id ?? '') : (schema.steps[0]?.id ?? ''),
                    },
                  })
                }
              />
              <Select
                label={__('Target', 'chatflow-forms')}
                value={rule.then.to}
                choices={
                  rule.then.action === 'end'
                    ? schema.endings.map((ending) => ({ value: ending.id, label: ending.id }))
                    : schema.steps.map((step) => ({ value: step.id, label: `${step.label} (${step.key})` }))
                }
                onChange={(to) => set(index, { ...rule, then: { ...rule.then, to } as Rule['then'] })}
              />
            </>
          )}
          <Button
            disabled={index === 0}
            onClick={() => {
              const next = [...rules];
              next.splice(index - 1, 0, ...next.splice(index, 1));
              onChange(next);
            }}
          >
            {__('Move up', 'chatflow-forms')}
          </Button>
          <Button
            disabled={index === rules.length - 1}
            onClick={() => {
              const next = [...rules];
              next.splice(index + 1, 0, ...next.splice(index, 1));
              onChange(next);
            }}
          >
            {__('Move down', 'chatflow-forms')}
          </Button>
          <Button isDestructive onClick={() => onChange(rules.filter((_, at) => at !== index))}>
            {__('Remove rule', 'chatflow-forms')}
          </Button>
        </fieldset>
      ))}
      <Button
        variant="secondary"
        disabled={rules.length >= 100}
        onClick={() =>
          onChange([
            ...rules,
            { if: firstCondition(schema), then: { action: 'jump', to: schema.steps.at(-1)?.id ?? '' } },
          ])
        }
      >
        {__('Add rule', 'chatflow-forms')}
      </Button>
    </section>
  );
}
