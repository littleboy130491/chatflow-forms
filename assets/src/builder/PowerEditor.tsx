/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Area, Button, Check, CommitField, Field, Select } from './controls';
import { removeVariable, renameVariable } from './model';
import { ConditionEditor, firstCondition } from './RuleEditor';
import type { FormDTO, FormSchema } from './api';

const endingLabel = (ending: FormSchema['endings'][number]) => {
  const message = ending.messages?.find((text) => text.trim());
  return message
    ? `${message.replace(/\s+/g, ' ').trim().slice(0, 60)} (${ending.id})`
    : `${ending.type === 'redirect' ? __('Redirect', 'chatflow-forms') : __('Thank-you message', 'chatflow-forms')} (${ending.id})`;
};

export function PowerEditor({ schema, onChange, onForm }: { schema: FormSchema; onChange: (schema: FormSchema) => void; onForm: (transform: (form: FormDTO) => FormDTO) => void }) {
  const variables = schema.variables ?? [], outcomes = schema.outcomes ?? [], experiment = schema.experiments?.[0];
  type Variant = NonNullable<FormSchema['experiments']>[number]['variants'][number];
  type DraftVariant = Omit<Variant, 'stepOrder'> & { stepOrder?: string[] | undefined };
  type DraftExperiment = Omit<NonNullable<FormSchema['experiments']>[number], 'variants'> & { variants: DraftVariant[] };
  const save = (next: Omit<FormSchema, 'experiments'> & { experiments?: DraftExperiment[] }) => onChange(next as FormSchema);
  // Most forms never use these; they stay collapsed until a form does.
  return <div className="cff-power-settings">
    <details className="cff-card cff-power-section" open={variables.length > 0}>
      <summary className="cff-card-head">
        <div>
          <h2 id="cff-power-variables">{__('Scoring variables', 'chatflow-forms')}</h2>
          <p>{__('Totals you can add to as answers come in, then test in rules and outcomes.', 'chatflow-forms')}</p>
        </div>
      </summary>
      {variables.length === 0 && (
        <p className="cff-empty-note">{__('No scoring variables yet. Add one to start tallying answers.', 'chatflow-forms')}</p>
      )}
      {variables.map((v, i) => <fieldset className="cff-power-item" key={i}>
        <legend>{sprintf(
          /* translators: %d: variable number */
          __('Variable %d', 'chatflow-forms'),
          i + 1,
        )}</legend>
        <div className="cff-power-grid">
          <CommitField
            label={__('Key (lowercase)', 'chatflow-forms')}
            value={v.key}
            validate={key => !/^[a-z][a-z0-9_]{0,63}$/.test(key)
              ? __('Start with a lowercase letter; use only lowercase letters, numbers and underscores (64 max).', 'chatflow-forms')
              : variables.some((item, j) => j !== i && item.key === key) ? __('Another variable already uses this key.', 'chatflow-forms') : ''}
            onCommit={key => onForm(form => renameVariable(form, v.key, key))}
            help={__('Applied when you leave the field. Rules, outcomes and formulas that use this variable are updated.', 'chatflow-forms')}
          />
          <Select label={__('Type', 'chatflow-forms')} value={v.type} choices={['number', 'boolean', 'string'].map(value => ({ value, label: value }))} onChange={type => onChange({ ...schema, variables: variables.map((item, j) => j === i ? { ...item, type: type as typeof v.type, default: type === 'number' ? 0 : type === 'boolean' ? false : '' } : item) })} />
          <Field label={__('Default value', 'chatflow-forms')} type={v.type === 'number' ? 'number' : 'text'} value={String(v.default)} onChange={defaultValue => onChange({ ...schema, variables: variables.map((item, j) => j === i ? { ...item, default: v.type === 'number' ? Number(defaultValue) : v.type === 'boolean' ? defaultValue === 'true' : defaultValue } : item) })} />
        </div>
        <Button variant="link" isDestructive onClick={() => {
          if (window.confirm(__('Remove this variable? Rules and outcomes that use it are removed, and notifications that depend on it are switched off.', 'chatflow-forms'))) onForm(form => removeVariable(form, v.key));
        }}>{__('Remove variable', 'chatflow-forms')}</Button>
      </fieldset>)}
      <div className="cff-power-actions">
        <Button variant="secondary" disabled={variables.length >= 100} onClick={() => {
          const keys = new Set(variables.map(v => v.key)); let index = 1; while (keys.has(`score_${index}`)) index++;
          onChange({ ...schema, variables: [...variables, { key: `score_${index}`, type: 'number', default: 0 }] });
        }}>{__('Add score', 'chatflow-forms')}</Button>
      </div>
    </details>

    <details className="cff-card cff-power-section" open={outcomes.length > 0}>
      <summary className="cff-card-head">
        <div>
          <h2 id="cff-power-outcomes">{__('Outcome endings', 'chatflow-forms')}</h2>
          <p>{__('The first matching outcome decides the ending instead of normal completion.', 'chatflow-forms')}</p>
        </div>
      </summary>
      {outcomes.length === 0 && (
        <p className="cff-empty-note">{__('No outcomes yet. The form ends normally unless an outcome matches.', 'chatflow-forms')}</p>
      )}
      {outcomes.map((outcome, i) => <fieldset className="cff-power-item" key={i}>
        <legend>{sprintf(
          /* translators: %d: outcome number */
          __('Outcome %d', 'chatflow-forms'),
          i + 1,
        )}</legend>
        <ConditionEditor value={outcome.if} schema={schema} onChange={condition => onChange({ ...schema, outcomes: outcomes.map((item, j) => j === i ? { ...item, if: condition } : item) })} />
        <Select label={__('Ending', 'chatflow-forms')} value={outcome.endingId} choices={schema.endings.map(e => ({ value: e.id, label: endingLabel(e) }))} onChange={endingId => onChange({ ...schema, outcomes: outcomes.map((item, j) => j === i ? { ...item, endingId } : item) })} />
        <Button variant="link" isDestructive onClick={() => onChange({ ...schema, outcomes: outcomes.filter((_, j) => j !== i) })}>{__('Remove outcome', 'chatflow-forms')}</Button>
      </fieldset>)}
      <div className="cff-power-actions">
        <Button variant="secondary" disabled={outcomes.length >= 100} onClick={() => onChange({ ...schema, outcomes: [...outcomes, { if: firstCondition(schema), endingId: schema.endings[0]!.id }] })}>{__('Add outcome', 'chatflow-forms')}</Button>
      </div>
    </details>

    <details className="cff-card cff-power-section" open={Boolean(experiment)}>
      <summary className="cff-card-head">
        <div>
          <h2 id="cff-power-experiment">{__('A/B copy and order experiment', 'chatflow-forms')}</h2>
          <p>{__('Test alternate copy or a reordered question set on new sessions.', 'chatflow-forms')}</p>
        </div>
      </summary>
      {!experiment ? <div className="cff-power-actions"><Button variant="secondary" onClick={() => save({ ...schema, experiments: [{ id: 'experiment_1', enabled: false, variants: [{ id: 'a', weight: 50 }, { id: 'b', weight: 50 }] }] })}>{__('Create experiment', 'chatflow-forms')}</Button></div> : <>
        <Field label={__('Experiment ID', 'chatflow-forms')} value={experiment.id} onChange={id => save({ ...schema, experiments: [{ ...experiment, id }] })} />
        <Check label={__('Assign variants to new sessions', 'chatflow-forms')} value={experiment.enabled} onChange={enabled => save({ ...schema, experiments: [{ ...experiment, enabled }] })} />
        {experiment.variants.map((variant, index) => <fieldset className="cff-power-item" key={index}>
          <legend>{sprintf(
            /* translators: %d: variant number */
            __('Variant %d', 'chatflow-forms'),
            index + 1,
          )}</legend>
          <Field label={__('Variant ID', 'chatflow-forms')} value={variant.id} onChange={id => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, id } : v) }] })} />
          <Field label={__('Weight (1–100)', 'chatflow-forms')} type="number" value={variant.weight} onChange={weight => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, weight: Number(weight) } : v) }] })} />
          <details className="cff-power-copy">
            <summary>{__('Copy overrides', 'chatflow-forms')}</summary>
            {schema.steps.map(step => <Area key={step.id} label={`${step.label} (${step.key}) — ${__('Variant messages, one per line; blank inherits base', 'chatflow-forms')}`} value={variant.copy?.find(c => c.stepId === step.id)?.messages.join('\n') ?? ''}
              onChange={messages => {
                const copy = (variant.copy ?? []).filter(c => c.stepId !== step.id);
                if (messages.trim()) copy.push({ stepId: step.id, messages: messages.split('\n') });
                save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, copy } : v) }] });
              }} />)}
          </details>
          <Check label={__('Override step order (safe independent steps only)', 'chatflow-forms')} value={Boolean(variant.stepOrder)} onChange={override => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, ...(override ? { stepOrder: schema.steps.map(s => s.id) } : { stepOrder: undefined }) } : v) }] })} />
          {variant.stepOrder?.map((id, at) => <Select key={at} label={`${at + 1}. ${__('Step', 'chatflow-forms')}`} value={id} choices={schema.steps.map(s => ({ value: s.id, label: s.label }))} onChange={target => {
            const order = [...variant.stepOrder!], other = order.indexOf(target); [order[at], order[other]] = [order[other]!, order[at]!];
            save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.map((v, i) => i === index ? { ...v, stepOrder: order } : v) }] });
          }} />)}
          <Button variant="link" isDestructive disabled={experiment.variants.length <= 2} onClick={() => save({ ...schema, experiments: [{ ...experiment, variants: experiment.variants.filter((_, i) => i !== index) }] })}>{__('Remove variant', 'chatflow-forms')}</Button>
        </fieldset>)}
        <div className="cff-power-actions">
          <Button variant="secondary" disabled={experiment.variants.length >= 5} onClick={() => save({ ...schema, experiments: [{ ...experiment, variants: [...experiment.variants, { id: `v${experiment.variants.length + 1}`, weight: 50 }] }] })}>{__('Add variant', 'chatflow-forms')}</Button>
          <Button variant="link" isDestructive onClick={() => save({ ...schema, experiments: [] })}>{__('Remove experiment', 'chatflow-forms')}</Button>
        </div>
      </>}
    </details>
  </div>;
}
