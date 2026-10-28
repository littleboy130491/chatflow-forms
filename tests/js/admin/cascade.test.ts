import { describe, expect, it } from 'vitest';
import { blankForm, removeField, removeVariable, renameOptionValue, renameStepKey, renameVariable } from '../../../assets/src/builder/model';
import type { FormDTO, Step } from '../../../assets/src/builder/api';

/** A form whose second field is referenced from rules, outcomes, merge tags, formulas and settings. */
function fixture(): FormDTO {
  const form = blankForm();
  const ending = form.schema.endings[0]!.id;
  const steps = [
    { id: 'first', key: 'name', type: 'short_text', label: 'Name', messages: ['Hi {{ answer:email | friend }}, {{email}} and {{meta:email}}'], logic: [{ if: { field: 'email', op: 'is_not_empty' }, then: { action: 'jump', to: 'pick' } }] },
    { id: 'mail', key: 'email', type: 'email', label: 'Email', messages: ['Email?'] },
    {
      id: 'pick', key: 'plan', type: 'single_choice', label: 'Plan', messages: ['Plan?'],
      options: [{ id: 'basic', value: 'basic', label: 'Basic' }, { id: 'pro', value: 'pro', label: 'Pro' }],
      logic: [{ if: { field: 'plan', op: 'in', value: ['pro', 'basic'] }, then: { action: 'set_variable', key: 'score', operation: 'add', value: 1 } }],
    },
    { id: 'calc', key: 'total', type: 'calculated', label: 'Total', messages: [], settings: { expression: 'variable.score * 2 + answer.emails' } },
  ] as unknown as Step[];
  form.schema = {
    ...form.schema,
    steps: steps as FormDTO['schema']['steps'],
    variables: [{ key: 'score', type: 'number', default: 0 }],
    outcomes: [
      { if: { field: 'plan', op: 'eq', value: 'pro' }, endingId: ending },
      { if: { field: 'score', source: 'variable', op: 'gt', value: 1 }, endingId: ending },
    ],
  };
  form.settings = {
    notifications: {
      admin: [{ id: 'mail_1', enabled: true, subject: 'New {{email}}', body: 'From {{email|unknown}}', conditions: { all: [{ field: 'email', op: 'is_not_empty' }] } }],
      autoresponders: [{ id: 'auto_1', enabled: true, subject: 'Thanks', body: 'Hi', emailField: 'email', conditions: { field: 'score', source: 'variable', op: 'gt', value: 0 } }],
    },
    integrations: { connectors: [{ id: 'crm', type: 'hubspot', enabled: true, events: ['completed'], emailField: 'email', fields: { firstname: 'name', mail: 'email' } }] },
    sessions: { magicLinks: { enabled: true, emailField: 'email' } },
  } as unknown as FormDTO['settings'];
  return form;
}
const json = (value: unknown) => JSON.stringify(value);

describe('field key rename', () => {
  it('rewrites conditions, merge tags, formulas, notifications and integrations', () => {
    const form = renameStepKey(fixture(), 'mail', 'work_email');
    const [first, mail] = form.schema.steps;
    expect(mail!.key).toBe('work_email');
    expect(first!.logic![0]!.if).toEqual({ field: 'work_email', op: 'is_not_empty' });
    // Prefixes, spacing and fallbacks survive; meta tags and longer keys are untouched.
    expect(first!.messages[0]).toBe('Hi {{ answer:work_email | friend }}, {{work_email}} and {{meta:email}}');
    expect((form.schema.steps[3]!.settings as { expression: string }).expression).toBe('variable.score * 2 + answer.emails');
    const settings = form.settings as unknown as {
      notifications: { admin: { subject: string; body: string; conditions: unknown }[]; autoresponders: { emailField: string }[] };
      integrations: { connectors: { emailField: string; fields: Record<string, string> }[] };
      sessions: { magicLinks: { emailField: string } };
    };
    expect(settings.notifications.admin[0]).toMatchObject({ subject: 'New {{work_email}}', body: 'From {{work_email|unknown}}', conditions: { all: [{ field: 'work_email', op: 'is_not_empty' }] } });
    expect(settings.notifications.autoresponders[0]!.emailField).toBe('work_email');
    expect(settings.integrations.connectors[0]).toMatchObject({ emailField: 'work_email', fields: { firstname: 'name', mail: 'work_email' } });
    expect(settings.sessions.magicLinks.emailField).toBe('work_email');
    expect(json(form)).not.toMatch(/"(field|key|emailField|mail)":"email"|\{\{ *(answer:)?email/);
  });
  it('rewrites answer references inside formulas', () => {
    const form = fixture();
    (form.schema.steps[3]!.settings as { expression: string }).expression = 'answer.email + answer.email_2';
    expect((renameStepKey(form, 'mail', 'contact').schema.steps[3]!.settings as { expression: string }).expression).toBe('answer.contact + answer.email_2');
  });
});

describe('field deletion', () => {
  it('removes dependent rules and switches off settings that depended on the field', () => {
    const form = removeField(fixture(), 'mail');
    expect(form.schema.steps.map((step) => step.id)).toEqual(['first', 'pick', 'calc']);
    expect(form.schema.steps[0]!.logic).toEqual([]);
    const settings = form.settings as unknown as {
      notifications: { admin: { enabled: boolean; conditions?: unknown }[]; autoresponders: { enabled: boolean; emailField?: string }[] };
      integrations: { connectors: { enabled: boolean; emailField?: string; fields: Record<string, string> }[] };
      sessions: { magicLinks: { enabled: boolean; emailField?: string } };
    };
    expect(settings.notifications.admin[0]).toMatchObject({ enabled: false });
    expect(settings.notifications.admin[0]!.conditions).toBeUndefined();
    expect(settings.notifications.autoresponders[0]).toMatchObject({ enabled: false });
    expect(settings.notifications.autoresponders[0]!.emailField).toBeUndefined();
    expect(settings.integrations.connectors[0]).toMatchObject({ enabled: false, fields: { firstname: 'name' } });
    expect(settings.sessions.magicLinks).toEqual({ enabled: false });
  });
  it('never mutates the original form', () => {
    const form = fixture(), before = json(form);
    removeField(form, 'mail');
    renameStepKey(form, 'mail', 'other');
    removeVariable(form, 'score');
    expect(json(form)).toBe(before);
  });
});

describe('option value rename', () => {
  it('updates comparisons on that field, including list values', () => {
    const form = renameOptionValue(fixture(), 'pick', 'pro', 'premium');
    const pick = form.schema.steps[2]!;
    expect(pick.options!.map((option) => option.value)).toEqual(['basic', 'premium']);
    expect(pick.logic![0]!.if).toEqual({ field: 'plan', op: 'in', value: ['premium', 'basic'] });
    expect(form.schema.outcomes![0]!.if).toEqual({ field: 'plan', op: 'eq', value: 'premium' });
  });
});

describe('scoring variables', () => {
  it('renames conditions, set_variable actions and formulas', () => {
    const form = renameVariable(fixture(), 'score', 'points');
    expect(form.schema.variables![0]!.key).toBe('points');
    expect(form.schema.steps[2]!.logic![0]!.then).toMatchObject({ action: 'set_variable', key: 'points' });
    expect((form.schema.steps[3]!.settings as { expression: string }).expression).toBe('variable.points * 2 + answer.emails');
    expect(form.schema.outcomes![1]!.if).toMatchObject({ field: 'points', source: 'variable' });
    expect((form.settings as unknown as { notifications: { autoresponders: { conditions: unknown }[] } }).notifications.autoresponders[0]!.conditions).toMatchObject({ field: 'points' });
  });
  it('removes rules and outcomes that use a deleted variable and disables dependent notifications', () => {
    const form = removeVariable(fixture(), 'score');
    expect(form.schema.variables).toEqual([]);
    expect(form.schema.steps[2]!.logic).toEqual([]);
    expect(form.schema.outcomes).toHaveLength(1);
    const auto = (form.settings as unknown as { notifications: { autoresponders: { enabled: boolean; conditions?: unknown }[] } }).notifications.autoresponders[0]!;
    expect(auto.enabled).toBe(false);
    expect(auto.conditions).toBeUndefined();
  });
});

describe('publish change list', () => {
  it('names added, edited, removed and reordered fields, endings and settings sections', async () => {
    const { publishChanges } = await import('../../../assets/src/builder/model');
    const live = fixture();
    expect(publishChanges(null, live)).toEqual([]);
    expect(publishChanges(live, live)).toEqual([]);
    const draft = structuredClone(live);
    draft.title = 'Leads';
    draft.schema.steps = [draft.schema.steps[2]!, { ...draft.schema.steps[0]!, label: 'Full name' }, draft.schema.steps[3]!] as typeof draft.schema.steps;
    draft.schema.steps.push({ id: 'phone', key: 'phone', type: 'phone', label: 'Phone', messages: ['Phone?'] } as Step);
    draft.settings = { ...draft.settings, privacy: { storeMeta: false } } as typeof draft.settings;
    expect(publishChanges(live, draft)).toEqual([
      'Form name: “Untitled form” → “Leads”',
      'Edited field: Full name',
      'Added field: Phone',
      'Removed field: Email',
      'Changed the order of fields',
      'Settings changed: Privacy',
    ]);
  });
});
