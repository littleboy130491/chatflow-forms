/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Check, Field, Notice, Select } from './controls';
import { uid } from './model';
import type { FormSchema, FormSettings } from './api';
import type { Connector } from '../shared/settings.generated';

type Integrations = NonNullable<FormSettings['integrations']>;
type Connectors = NonNullable<Integrations['connectors']>;
export type ConnectorType = Connector['type'];

export const connectorLabels: Record<ConnectorType, string> = {
  slack: 'Slack',
  mailchimp: 'Mailchimp',
  hubspot: 'HubSpot',
  ga4: 'Google Analytics 4',
  meta_capi: 'Meta Conversions API',
};
/** Delivery events shared by connectors and webhooks. */
export const deliveryEventLabels: Record<'completed' | 'partial' | 'abandoned', string> = {
  completed: __('Completed submission', 'chatflow-forms'),
  partial: __('Partial submission saved', 'chatflow-forms'),
  abandoned: __('Abandoned submission', 'chatflow-forms'),
};
/** Which per-form options each provider uses; mirrors the PHP connector checks. */
export const connectorNeeds: Record<ConnectorType, { email?: 'required' | 'optional'; phone?: boolean; consent: 'required' | 'optional'; fields?: string; list?: boolean; tags?: boolean; eventName?: string; message?: boolean }> = {
  slack: { consent: 'optional', message: true },
  mailchimp: { email: 'required', consent: 'required', fields: 'FNAME', list: true, tags: true },
  hubspot: { email: 'required', consent: 'optional', fields: 'firstname' },
  ga4: { consent: 'required', eventName: 'generate_lead' },
  meta_capi: { email: 'optional', phone: true, consent: 'required', eventName: 'Lead' },
};

export function newConnector(type: ConnectorType): Connector {
  return { id: uid('conn'), type, enabled: true, events: ['completed'] };
}

type MappingRow = { remote: string; key: string };
const toObject = (rows: MappingRow[]) => Object.fromEntries(rows.filter((row) => row.remote.trim() && row.key).map((row) => [row.remote.trim(), row.key]));
/** Provider field ← question rows, instead of hand-written JSON. Incomplete rows stay local until filled in. */
function FieldMapping({ example, value, choices, onChange }: { example: string; value: Record<string, string>; choices: { value: string; label: string }[]; onChange: (fields: Record<string, string>) => void }) {
  const [rows, setRows] = useState<MappingRow[]>(() => Object.entries(value).map(([remote, key]) => ({ remote, key })));
  const stored = JSON.stringify(value);
  // Follow undo/redo and reloads without discarding a row that is still being filled in.
  useEffect(() => {
    if (JSON.stringify(toObject(rows)) !== stored) setRows(Object.entries(value).map(([remote, key]) => ({ remote, key })));
  }, [stored]);
  const update = (next: MappingRow[]) => { setRows(next); onChange(toObject(next)); };
  return (
    <fieldset className="cff-field-mapping">
      <legend>{__('Send answers to provider fields', 'chatflow-forms')}</legend>
      {rows.map((row, index) => (
        <div className="cff-field-mapping-row" key={index}>
          <Field
            label={__('Provider field name', 'chatflow-forms')}
            value={row.remote}
            placeholder={example}
            onChange={(remote) => update(rows.map((item, i) => (i === index ? { ...item, remote } : item)))}
          />
          <Select
            label={__('Question', 'chatflow-forms')}
            value={row.key}
            choices={choices}
            onChange={(key) => update(rows.map((item, i) => (i === index ? { ...item, key } : item)))}
          />
          <Button variant="link" isDestructive onClick={() => update(rows.filter((_, i) => i !== index))}>{__('Remove', 'chatflow-forms')}</Button>
        </div>
      ))}
      <Button variant="secondary" disabled={rows.length >= 30} onClick={() => setRows([...rows, { remote: '', key: '' }])}>{__('Add a field', 'chatflow-forms')}</Button>
    </fieldset>
  );
}

export function ConnectorSettings({ schema, integrations, onChange }: { schema: FormSchema; integrations: Integrations; onChange: (next: Integrations) => void }) {
  const [adding, setAdding] = useState<ConnectorType>('slack');
  const connectors = (integrations.connectors ?? []) as Connector[];
  const save = (next: Connector[]) => onChange({ ...integrations, connectors: next as Connectors });
  const fieldChoices = (types: string[] | null, empty: string) => [
    { value: '', label: empty },
    ...schema.steps.filter((step) => !types || types.includes(step.type)).map((step) => ({ value: step.key, label: `${step.label} (${step.key})` })),
  ];
  return (
    <section className="cff-card">
      <h2>{__('Native connectors', 'chatflow-forms')}</h2>
      <Notice status="info" isDismissible={false}>
        {__('Connectors run in the background after submission, with the same retries and delivery log as webhooks. Add provider credentials in Site defaults first. Marketing and ad connectors only send when the chosen consent question was answered yes.', 'chatflow-forms')}
      </Notice>
      {connectors.map((connector) => {
        const needs = connectorNeeds[connector.type];
        const change = (patch: Partial<Connector>) => save(connectors.map((item) => (item.id === connector.id ? { ...item, ...patch } : item)));
        const optional = (key: 'emailField' | 'phoneField' | 'consentField' | 'listId' | 'eventName' | 'message') => (value: string) => {
          const next = { ...connector } as Record<string, unknown>;
          if (value === '') delete next[key]; else next[key] = value;
          save(connectors.map((item) => (item.id === connector.id ? (next as unknown as Connector) : item)));
        };
        return (
          <fieldset key={connector.id} className="cff-connector">
            <legend>{connectorLabels[connector.type]}</legend>
            <Check label={__('Enabled', 'chatflow-forms')} value={connector.enabled} onChange={(enabled) => change({ enabled })} />
            {(['completed', 'partial', 'abandoned'] as const).map((event) => (
              <Check
                key={event}
                label={deliveryEventLabels[event]}
                value={(connector.events as string[]).includes(event)}
                onChange={(checked) => change({ events: (checked ? [...connector.events, event] : connector.events.filter((item) => item !== event)) as Connector['events'] })}
              />
            ))}
            {needs.email && (
              <Select
                label={needs.email === 'required' ? __('Email question (required)', 'chatflow-forms') : __('Email question (optional, sent hashed)', 'chatflow-forms')}
                value={connector.emailField ?? ''}
                choices={fieldChoices(['email', 'short_text', 'hidden'], __('Choose a question', 'chatflow-forms'))}
                onChange={optional('emailField')}
              />
            )}
            {needs.phone && (
              <Select label={__('Phone question (optional, sent hashed)', 'chatflow-forms')} value={connector.phoneField ?? ''} choices={fieldChoices(['phone', 'short_text', 'hidden'], __('None', 'chatflow-forms'))} onChange={optional('phoneField')} />
            )}
            <Select
              label={needs.consent === 'required' ? __('Consent question (required; must be answered yes)', 'chatflow-forms') : __('Consent question (optional; send only when answered yes)', 'chatflow-forms')}
              value={connector.consentField ?? ''}
              choices={fieldChoices(['consent', 'yes_no'], __('None', 'chatflow-forms'))}
              onChange={optional('consentField')}
            />
            {needs.list && (
              <Fragment>
                <Field label={__('Mailchimp audience ID', 'chatflow-forms')} value={connector.listId ?? ''} onChange={optional('listId')} />
                <Check label={__('Double opt-in (subscriber confirms by email)', 'chatflow-forms')} value={connector.doubleOptIn ?? true} onChange={(doubleOptIn) => change({ doubleOptIn })} />
              </Fragment>
            )}
            {needs.tags && (
              <Field
                label={__('Tags (comma-separated)', 'chatflow-forms')}
                value={(connector.tags ?? []).join(', ')}
                onChange={(value) => change({ tags: value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20) as NonNullable<Connector['tags']> })}
              />
            )}
            {needs.fields && (
              <FieldMapping
                example={needs.fields}
                value={connector.fields ?? {}}
                choices={fieldChoices(null, __('Choose a question', 'chatflow-forms'))}
                onChange={(fields) => change({ fields })}
              />
            )}
            {needs.eventName && <Field label={`${__('Event name', 'chatflow-forms')} (${needs.eventName})`} value={connector.eventName ?? ''} onChange={optional('eventName')} />}
            {needs.message && <Field label={__('Message intro (merge tags allowed)', 'chatflow-forms')} value={connector.message ?? ''} onChange={optional('message')} />}
            <Button isDestructive onClick={() => save(connectors.filter((item) => item.id !== connector.id))}>
              {__('Remove connector', 'chatflow-forms')}
            </Button>
          </fieldset>
        );
      })}
      <div className="cff-connector-add">
        <Select
          label={__('Connector', 'chatflow-forms')}
          value={adding}
          choices={(Object.keys(connectorLabels) as ConnectorType[]).map((type) => ({ value: type, label: connectorLabels[type] }))}
          onChange={(type) => setAdding(type as ConnectorType)}
        />
        <Button disabled={connectors.length >= 10} onClick={() => save([...connectors, newConnector(adding)])}>
          {__('Add connector', 'chatflow-forms')}
        </Button>
      </div>
    </section>
  );
}
