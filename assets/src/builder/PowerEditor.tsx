/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Area, Button, Check, Field, Select } from './controls';
import { ConditionEditor, firstCondition } from './RuleEditor';
import type { FormSchema } from './api';

export function PowerEditor({ schema, onChange }: { schema: FormSchema; onChange: (schema: FormSchema) => void }) {
  const variables = schema.variables ?? [], outcomes = schema.outcomes ?? [], experiment = schema.experiments?.[0];
  type Variant = NonNullable<FormSchema['experiments']>[number]['variants'][number];
  type DraftVariant = Omit<Variant, 'stepOrder'> & { stepOrder?: string[] | undefined };
  type DraftExperiment = Omit<NonNullable<FormSchema['experiments']>[number], 'variants'> & { variants: DraftVariant[] };
  const save = (next: Omit<FormSchema, 'experiments'> & { experiments?: DraftExperiment[] }) => onChange(next as FormSchema);
  return <div className="cff-power-settings">
    <h3>{__('Scoring variables', 'chatflow-forms')}</h3>
    {variables.map((v, i) => <fieldset key={i}>
      <Field label={__('Key (lowercase)', 'chatflow-forms')} value={v.key} onChange={key => onChange({ ...schema, variables: variables.map((item, j) => j === i ? { ...item, key } : item) })} />
      <Select label={__('Type', 'chatflow-forms')} value={v.type} choices={['number', 'boolean', 'string'].map(value => ({ value, label: value }))} onChange={type => onChange({ ...schema, variables: variables.map((item, j) => j === i ? { ...item, type: type as typeof v.type, default: type === 'number' ? 0 : type === 'boolean' ? false : '' } : item) })} />
      <Field label={__('Default value', 'chatflow-forms')} type={v.type === 'number' ? 'number' : 'text'} value={String(v.default)} onChange={defaultValue => onChange({ ...schema, variables: variables.map((item, j) => j === i ? { ...item, default: v.type === 'number' ? Number(defaultValue) : v.type === 'boolean' ? defaultValue === 'true' : defaultValue } : item) })} />
      <Button isDestructive onClick={() => onChange({ ...schema, variables: variables.filter((_, j) => j !== i) })}>{__('Remove variable', 'chatflow-forms')}</Button>
    </fieldset>)}
    <Button disabled={variables.length >= 100} onClick={() => {
      const keys = new Set(variables.map(v => v.key)); let index = 1; while (keys.has(`score_${index}`)) index++;
      onChange({ ...schema, variables: [...variables, { key: `score_${index}`, type: 'number', default: 0 }] });
    }}>{__('Add score', 'chatflow-forms')}</Button>
    <h3>{__('Outcome endings (first matching condition wins)', 'chatflow-forms')}</h3>
    {outcomes.map((outcome, i) => <fieldset key={i}>
      <ConditionEditor value={outcome.if} schema={schema} onChange={condition => onChange({ ...schema, outcomes: outcomes.map((item, j) => j === i ? { ...item, if: condition } : item) })} />
      <Select label={__('Ending', 'chatflow-forms')} value={outcome.endingId} choices={schema.endings.map(e => ({ value: e.id, label: e.id }))} onChange={endingId => onChange({ ...schema, outcomes: outcomes.map((item, j) => j === i ? { ...item, endingId } : item) })} />
      <Button isDestructive onClick={() => onChange({ ...schema, outcomes: outcomes.filter((_, j) => j !== i) })}>{__('Remove outcome', 'chatflow-forms')}</Button>
    </fieldset>)}
    <Button disabled={outcomes.length >= 100} onClick={() => onChange({ ...schema, outcomes: [...outcomes, { if: firstCondition(schema), endingId: schema.endings[0]!.id }] })}>{__('Add outcome', 'chatflow-forms')}</Button>
    <h3>{__('A/B copy and order experiment', 'chatflow-forms')}</h3>
    {!experiment ? <Button onClick={() => save({ ...schema, experiments: [{ id: 'experiment_1', enabled: false, variants: [{ id: 'a', weight: 50 }, { id: 'b', weight: 50 }] }] })}>{__('Create experiment', 'chatflow-forms')}</Button> : <>
      <Field label={__('Experiment ID', 'chatflow-forms')} value={experiment.id} onChange={id => save({ ...schema, experiments: [{ ...experiment, id }] })} />
      <Check label={__('Assign variants to new sessions', 'chatflow-forms')} value={experiment.enabled} onChange={enabled => save({ ...schema, experiments: [{ ...experiment, enabled }] })} />
      {experiment.variants.map((variant, index) => <fieldset key={index}>
        <Field label={__('Variant ID', 'chatflow-forms')} value={variant.id} onChange={id => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, id } : v) }] })} />
        <Field label={__('Weight (1–100)', 'chatflow-forms')} type="number" value={variant.weight} onChange={weight => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, weight: Number(weight) } : v) }] })} />
        {schema.steps.map(step => <Area key={step.id} label={`${step.label} (${step.key}) — ${__('Variant messages, one per line; blank inherits base', 'chatflow-forms')}`} value={variant.copy?.find(c => c.stepId === step.id)?.messages.join('\n') ?? ''}
          onChange={messages => {
            const copy = (variant.copy ?? []).filter(c => c.stepId !== step.id);
            if (messages.trim()) copy.push({ stepId: step.id, messages: messages.split('\n') });
            save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, copy } : v) }] });
          }} />)}
        <Check label={__('Override step order (safe independent steps only)', 'chatflow-forms')} value={Boolean(variant.stepOrder)} onChange={override => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, ...(override ? { stepOrder: schema.steps.map(s => s.id) } : { stepOrder: undefined }) } : v) }] })} />
        {variant.stepOrder?.map((id, at) => <Select key={at} label={`${at + 1}. ${__('Step', 'chatflow-forms')}`} value={id} choices={schema.steps.map(s => ({ value: s.id, label: s.label }))} onChange={target => {
          const order = [...variant.stepOrder!], other = order.indexOf(target); [order[at], order[other]] = [order[other]!, order[at]!];
          save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, stepOrder: order } : v) }] });
        }} />)}
        <Button disabled={experiment.variants.length <= 2} isDestructive onClick={() => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.filter((_, i) => i !== index) }] })}>{__('Remove variant', 'chatflow-forms')}</Button>
      </fieldset>)}
      <Button disabled={experiment.variants.length >= 5} onClick={() => save({ ...schema, experiments: [{ ...experiment, variants: [...experiment.variants, { id: `v${experiment.variants.length + 1}`, weight: 50 }] }] })}>{__('Add variant', 'chatflow-forms')}</Button>
      <Button isDestructive onClick={() => save({ ...schema, experiments: [] })}>{__('Remove experiment', 'chatflow-forms')}</Button>
    </>}
  </div>;
}
