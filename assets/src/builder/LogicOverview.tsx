/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { FlowMap } from './FlowMap';
import { PowerEditor } from './PowerEditor';
import { actionLabels, operatorLabels } from './RuleEditor';
import type { Condition, FormSchema, Step } from './api';
import type { ValidationIssue } from '../shared/contracts';

type Predicate = Extract<Condition, { field: string }>;
type Rule = NonNullable<Step['logic']>[number];

const quote = (value: unknown) => (typeof value === 'string' ? `“${value}”` : String(value));

/** Human-readable sentence for one condition, used in the overview instead of raw JSON. */
export function conditionText(condition: Condition, schema: FormSchema): string {
  if ('all' in condition || 'any' in condition) {
    const children = 'all' in condition ? condition.all : condition.any;
    if (!children.length) return __('always', 'chatflow-forms');
    const joiner = 'all' in condition ? __(' and ', 'chatflow-forms') : __(' or ', 'chatflow-forms');
    return children.map((child) => conditionText(child, schema)).join(joiner);
  }
  const predicate = condition as Predicate;
  const source = predicate.source ?? 'answer';
  const field = source === 'answer'
    ? schema.steps.find((step) => step.key === predicate.field)?.label ?? predicate.field
    : `${source === 'hidden'
        ? __('Hidden field', 'chatflow-forms')
        : source === 'url'
          ? __('URL parameter', 'chatflow-forms')
          : __('Variable', 'chatflow-forms')} “${predicate.field}”`;
  const operator = operatorLabels[predicate.op] ?? predicate.op;
  const value = predicate.value;
  if (predicate.op === 'is_empty' || predicate.op === 'is_not_empty') return `${field} ${operator}`;
  if (Array.isArray(value)) return `${field} ${operator} ${value.map(quote).join(', ')}`;
  if (typeof value === 'boolean') return `${field} ${operator} ${value ? __('Yes', 'chatflow-forms') : __('No', 'chatflow-forms')}`;
  if (value === undefined || value === null || value === '') return `${field} ${operator} ${__('an empty value', 'chatflow-forms')}`;
  return `${field} ${operator} ${quote(value)}`;
}

const endingLabel = (schema: FormSchema, id: string) => {
  const ending = schema.endings.find((item) => item.id === id);
  if (!ending) return id;
  const message = ending.messages?.find((text) => text.trim());
  return message
    ? message.replace(/\s+/g, ' ').trim().slice(0, 80)
    : ending.type === 'redirect'
      ? __('Redirect', 'chatflow-forms')
      : __('Thank-you message', 'chatflow-forms');
};

/** Human-readable sentence for a rule action. */
export function actionText(then: Rule['then'], schema: FormSchema): string {
  if (then.action === 'set_variable') {
    const operator = then.operation === 'set' ? '=' : then.operation === 'add' ? '+=' : '-=';
    return sprintf(
      /* translators: 1: action label, 2: variable key, 3: assignment operator, 4: value */
      __('%1$s: %2$s %3$s %4$s', 'chatflow-forms'),
      actionLabels.set_variable,
      then.key,
      operator,
      quote(then.value),
    );
  }
  const target = then.action === 'end'
    ? endingLabel(schema, then.to)
    : schema.steps.find((step) => step.id === then.to)?.label ?? then.to;
  return `${actionLabels[then.action]} ${quote(target)}`;
}

function issueLocation(path: string, schema: FormSchema): string {
  const step = path.match(/^\/steps\/(\d+)/);
  if (step) {
    const item = schema.steps[Number(step[1])];
    return item ? sprintf(
      /* translators: 1: field number, 2: field label */
      __('Field %1$d: %2$s', 'chatflow-forms'),
      Number(step[1]) + 1,
      item.label,
    ) : '';
  }
  const ending = path.match(/^\/endings\/(\d+)/);
  if (ending) return sprintf(
    /* translators: %d: ending number */
    __('Ending %d', 'chatflow-forms'),
    Number(ending[1]) + 1,
  );
  const outcome = path.match(/^\/outcomes\/(\d+)/);
  if (outcome) return sprintf(
    /* translators: %d: outcome number */
    __('Outcome %d', 'chatflow-forms'),
    Number(outcome[1]) + 1,
  );
  const variable = path.match(/^\/variables\/(\d+)/);
  if (variable) return sprintf(
    /* translators: %d: variable number */
    __('Variable %d', 'chatflow-forms'),
    Number(variable[1]) + 1,
  );
  return '';
}

/** Read-only summary of every branching rule, with a jump back to the field editor. */
function FieldRules({ schema, onEditStep }: { schema: FormSchema; onEditStep: (id: string) => void }) {
  const groups = schema.steps.flatMap((step, index) => {
    const rows: { rule: Rule; option?: string }[] = [
      ...(step.logic ?? []).map((rule) => ({ rule })),
      ...(step.options ?? []).flatMap((option) =>
        (option.logic ?? []).map((rule) => ({ rule, option: option.label })),
      ),
    ];
    return rows.length ? [{ step, index, rows }] : [];
  });
  const count = groups.reduce((total, group) => total + group.rows.length, 0);
  return (
    <section className="cff-card cff-logic-card" aria-labelledby="cff-logic-rules-title">
      <header className="cff-card-head">
        <div>
          <h2 id="cff-logic-rules-title">{__('Field rules', 'chatflow-forms')}</h2>
          <p>{__('Rules are checked in order. The first one that matches wins.', 'chatflow-forms')}</p>
        </div>
        {count > 0 && (
          <span className="cff-count-pill">
            {count === 1
              ? __('1 rule', 'chatflow-forms')
              : sprintf(
                  /* translators: %d: number of rules */
                  __('%d rules', 'chatflow-forms'),
                  count,
                )}
          </span>
        )}
      </header>
      {groups.length === 0 ? (
        <div className="cff-empty-card">
          <strong>{__('No field rules yet.', 'chatflow-forms')}</strong>
          <p>{__('Open a field on the Build tab, switch to Logic and add a rule to show, hide or jump.', 'chatflow-forms')}</p>
        </div>
      ) : (
        <ul className="cff-rule-list">
          {groups.map(({ step, index, rows }) => (
            <li key={step.id}>
              <button
                type="button"
                className="cff-rule-row"
                aria-label={sprintf(
                  /* translators: %s: field label */
                  __('Edit rules for %s', 'chatflow-forms'),
                  step.label,
                )}
                onClick={() => onEditStep(step.id)}
              >
                <span className="cff-rule-row-head">
                  <span className="cff-rule-row-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="cff-rule-row-name">{step.label}</span>
                  <span className="cff-rule-row-count">
                    {rows.length === 1
                      ? __('1 rule', 'chatflow-forms')
                      : sprintf(
                          /* translators: %d: number of rules */
                          __('%d rules', 'chatflow-forms'),
                          rows.length,
                        )}
                  </span>
                  <span className="cff-rule-row-go" aria-hidden="true">{__('Edit', 'chatflow-forms')} ›</span>
                </span>
                <span className="cff-rule-row-lines">
                  {rows.map((row, at) => (
                    <span className="cff-rule-line" key={at}>
                      {row.option && (
                        <span className="cff-rule-line-option">
                          {sprintf(
                            /* translators: %s: answer option label */
                            __('Option: %s', 'chatflow-forms'),
                            row.option,
                          )}
                        </span>
                      )}
                      <span className="cff-rule-if">{__('If', 'chatflow-forms')}</span>
                      <span className="cff-rule-text">{conditionText(row.rule.if, schema)}</span>
                      <span className="cff-rule-arrow" aria-hidden="true">→</span>
                      <span className="cff-rule-text">{actionText(row.rule.then, schema)}</span>
                    </span>
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LogicOverview({
  schema,
  issues,
  onEditStep,
  onChange,
}: {
  schema: FormSchema;
  issues: ValidationIssue[];
  onEditStep: (id: string) => void;
  onChange: (schema: FormSchema) => void;
}) {
  return (
    <section className="cff-logic-page" aria-label={__('Logic overview', 'chatflow-forms')}>
      <header className="cff-logic-head">
        <h2>{__('Logic', 'chatflow-forms')}</h2>
        <p>{__('Branch, score and route answers, then check the whole form for broken references in one place.', 'chatflow-forms')}</p>
      </header>

      <section
        className={`cff-logic-status ${issues.length ? 'is-warning' : 'is-ok'}`}
        aria-live="polite"
      >
        <span className="cff-logic-status-icon" aria-hidden="true">{issues.length ? '!' : '✓'}</span>
        <div className="cff-logic-status-body">
          <strong>
            {issues.length
              ? __('Logic warnings', 'chatflow-forms')
              : __('No logic warnings detected.', 'chatflow-forms')}
          </strong>
          {issues.length > 0 && (
            <ul>
              {issues.map((issue, index) => (
                <li key={index}>
                  {issueLocation(issue.path, schema) && (
                    <span className="cff-issue-location">{issueLocation(issue.path, schema)}</span>
                  )}
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <FieldRules schema={schema} onEditStep={onEditStep} />

      <section className="cff-card cff-logic-card" aria-labelledby="cff-logic-map-title">
        <header className="cff-card-head">
          <div>
            <h2 id="cff-logic-map-title">{__('Branching map', 'chatflow-forms')}</h2>
            <p>{__('The default path runs down the list; animated arrows are rules that skip ahead.', 'chatflow-forms')}</p>
          </div>
        </header>
        <FlowMap
          schema={schema}
          onChange={onChange}
          onSelect={(id) => onEditStep(id)}
        />
      </section>

      <PowerEditor schema={schema} onChange={onChange} />
    </section>
  );
}
