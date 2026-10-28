import { __, sprintf } from '@wordpress/i18n';
import { ApiError, AdminApi } from './api';
import type { FormDTO, FormSchema, FormSettings, Step, Option, Condition } from './api';
import type { ValidationIssue } from '../shared/contracts';
import { endingTitle } from './labels';

export const v1Types = [
  'short_text',
  'long_text',
  'email',
  'phone',
  'number',
  'rating',
  'scale',
  'nps',
  'slider',
  'date',
  'single_choice',
  'multi_choice',
  'yes_no',
  'consent',
  'hidden',
  'statement',
  'summary',
];
export function uid(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}_${cryptoApi.randomUUID().replace(/-/g, '')}`;
  }
  // HTTP development hosts are not secure contexts, so randomUUID can be unavailable.
  const random = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random}`;
}
export function uniqueKey(label: string, steps: Step[], reserved: string[] = []): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^[_0-9]+/, '')
      .slice(0, 55) || 'field';
  let key = base,
    n = 2;
  while (reserved.includes(key) || steps.some((step) => step.key === key)) key = `${base}_${n++}`;
  return key;
}
export function makeStep(type: Step['type'], steps: Step[], reserved: string[] = []): Step {
  const label = __('New question', 'chatflow-forms');
  const step: Step = {
    id: uid('stp'),
    key: uniqueKey(type, steps, reserved),
    type,
    label,
    messages: [label],
    required: false,
    logic: [],
  };
  if (['single_choice', 'multi_choice'].includes(type)) step.options = [makeOption('option_1', __('Option 1', 'chatflow-forms'))];
  if (type === 'phone') step.settings = { country: 'ID' };
  if (type === 'slider') step.validation = { min: 0, max: 100, step: 1 };
  if (type === 'address') step.settings = { addressFields: ['street', 'city', 'postcode', 'country'] };
  if (type === 'consent') {
    step.required = true;
    step.settings = { consentText: __('I agree to the privacy policy.', 'chatflow-forms') };
  }
  return step;
}
export function makeOption(value: string, label = value): Option {
  return { id: uid('opt'), value, label };
}
/** A stable stored value derived from an option label. */
export function uniqueOptionValue(label: string, used: readonly string[]): string {
  const base =
    label
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^[^a-z]+/, '')
      .replace(/_+$/, '')
      .slice(0, 55) || 'option';
  let value = base;
  let suffix = 2;
  while (used.includes(value)) value = `${base}_${suffix++}`;
  return value;
}
export function blankForm(defaults: FormSettings = {}): FormDTO {
  const ending = uid('end');
  return {
    id: 0,
    title: __('Untitled form', 'chatflow-forms'),
    slug: '',
    status: 'draft',
    version: 0,
    draftRevision: 0,
    schema: {
      schemaVersion: 1,
      bot: { name: 'ChatFlow', typingSpeed: 'normal' },
      steps: [makeStep('statement', [])],
      endings: [{ id: ending, type: 'message', messages: [__('Thank you!', 'chatflow-forms')] }],
    },
    settings: {
      completion: { defaultEndingId: ending },
      sessions: {
        savePartial: true,
        resumeEnabled: true,
        resumePrompt: true,
        resumeDays: 30,
        abandonDays: 30,
      },
      // Privacy, retention and spam values are inherited from global Settings at
      // runtime, so they are never copied in. The theme has no runtime fallback;
      // the global "default theme" seeds new forms only.
      // New forms start with the messaging look; existing forms keep their saved style.
      // Dark messaging uses fixed runtime colours; seed the accessible accent for light/auto.
      appearance: { ...(defaults.appearance?.theme === 'dark' ? {} : { primary: '#2271b1' }), ...defaults.appearance, style: 'messaging' },
    },
  };
}
export function duplicateStep(step: Step, steps: Step[], reserved: string[] = []): Step {
  const duplicate = structuredClone(step);
  duplicate.id = uid('stp');
  duplicate.key = uniqueKey(step.key, steps, reserved);
  if (duplicate.options)
    duplicate.options = duplicate.options.map((option) => ({ ...option, id: uid('opt') }));
  // Self-targets stay self-targets; all other references keep their immutable IDs.
  if (duplicate.logic)
    duplicate.logic = duplicate.logic.map((rule) => ({
      ...rule,
      then: 'to' in rule.then && rule.then.to === step.id ? { ...rule.then, to: duplicate.id } : rule.then,
    }));
  return duplicate;
}
export function reorder<T extends { id: string }>(items: T[], active: string, over: string): T[] {
  const from = items.findIndex((item) => item.id === active),
    to = items.findIndex((item) => item.id === over);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}
export function publishDiff(
  previous: FormSchema | null,
  draft: FormSchema,
): { added: number; removed: number; changed: number } {
  const old = previous?.steps ?? [];
  return {
    added: draft.steps.filter((step) => !old.some((item) => item.id === step.id)).length,
    removed: old.filter((step) => !draft.steps.some((item) => item.id === step.id)).length,
    changed: draft.steps.filter((step) =>
      old.some((item) => item.id === step.id && JSON.stringify(item) !== JSON.stringify(step)),
    ).length,
  };
}
/** Human-readable list of what publishing would change compared with the live version. */
export function publishChanges(live: FormDTO | null, draft: FormDTO): string[] {
  if (!live) return [];
  const changes: string[] = [];
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const name = (step: Step) => step.label || step.key;
  if (live.title !== draft.title) changes.push(sprintf(__('Form name: “%1$s” → “%2$s”', 'chatflow-forms'), live.title, draft.title));
  const old = live.schema.steps, next = draft.schema.steps;
  for (const step of next) {
    const before = old.find((item) => item.id === step.id);
    if (!before) changes.push(sprintf(__('Added field: %s', 'chatflow-forms'), name(step)));
    else if (!same(before, step)) changes.push(sprintf(__('Edited field: %s', 'chatflow-forms'), name(step)));
  }
  for (const step of old)
    if (!next.some((item) => item.id === step.id)) changes.push(sprintf(__('Removed field: %s', 'chatflow-forms'), name(step)));
  const kept = (steps: Step[], other: Step[]) => steps.filter((step) => other.some((item) => item.id === step.id)).map((step) => step.id);
  if (!same(kept(old, next), kept(next, old))) changes.push(__('Changed the order of fields', 'chatflow-forms'));
  draft.schema.endings.forEach((ending, index) => {
    const before = live.schema.endings.find((item) => item.id === ending.id);
    if (!before) changes.push(sprintf(__('Added ending: %s', 'chatflow-forms'), endingTitle(ending, index)));
    else if (!same(before, ending)) changes.push(sprintf(__('Edited ending: %s', 'chatflow-forms'), endingTitle(ending, index)));
  });
  live.schema.endings.forEach((ending, index) => {
    if (!draft.schema.endings.some((item) => item.id === ending.id)) changes.push(sprintf(__('Removed ending: %s', 'chatflow-forms'), endingTitle(ending, index)));
  });
  const parts: [keyof FormSchema, string][] = [
    ['bot', __('Assistant name and avatar', 'chatflow-forms')],
    ['variables', __('Scoring variables', 'chatflow-forms')],
    ['outcomes', __('Outcome endings', 'chatflow-forms')],
    ['experiments', __('A/B test', 'chatflow-forms')],
  ];
  for (const [key, label] of parts) if (!same(live.schema[key], draft.schema[key])) changes.push(sprintf(__('Changed: %s', 'chatflow-forms'), label));
  const sections: [keyof FormSettings, string][] = [
    ['display', __('Display', 'chatflow-forms')],
    ['appearance', __('Appearance', 'chatflow-forms')],
    ['phrases', __('Wording', 'chatflow-forms')],
    ['completion', __('Completion', 'chatflow-forms')],
    ['sessions', __('Saving and resume', 'chatflow-forms')],
    ['limits', __('Limits', 'chatflow-forms')],
    ['privacy', __('Privacy', 'chatflow-forms')],
    ['spam', __('Spam protection', 'chatflow-forms')],
    ['notifications', __('Notifications', 'chatflow-forms')],
    ['integrations', __('Integrations', 'chatflow-forms')],
  ];
  for (const [key, label] of sections)
    if (!same(live.settings[key], draft.settings[key])) changes.push(sprintf(__('Settings changed: %s', 'chatflow-forms'), label));
  return changes;
}
export function editable(form: FormDTO): string {
  return JSON.stringify({ title: form.title, schema: form.schema, settings: form.settings });
}

/** True when a condition references a removed field key or variable key. */
function conditionReferences(condition: Condition | undefined, key: string, source: 'answer' | 'variable' = 'answer'): boolean {
  if (!condition || typeof condition !== 'object') return false;
  if ('all' in condition) return condition.all.some((child) => conditionReferences(child, key, source));
  if ('any' in condition) return condition.any.some((child) => conditionReferences(child, key, source));
  return (condition.source ?? 'answer') === source && condition.field === key;
}

/** Remove a condition's rule rather than silently turning it into "always". */
function keepRule(rule: NonNullable<Step['logic']>[number], stepId: string, stepKey: string): boolean {
  if ('to' in rule.then && rule.then.action !== 'end' && rule.then.to === stepId) return false;
  return !conditionReferences(rule.if, stepKey);
}

/** Remove a step and every schema reference to it. */
export function removeStep(schema: FormSchema, stepId: string, stepKey: string): FormSchema {
  const next: FormSchema = {
    ...schema,
    steps: schema.steps
      .filter((step) => step.id !== stepId)
      .map((step) => ({
        ...step,
        logic: step.logic?.filter((rule) => keepRule(rule, stepId, stepKey)),
        options: step.options?.map((option) => ({
          ...option,
          logic: option.logic?.filter((rule) => keepRule(rule, stepId, stepKey)),
        })),
      })) as FormSchema['steps'],
    groups: (schema.groups ?? []).map((group) => ({ ...group, stepIds: group.stepIds.filter((id) => id !== stepId) })),
  };
  if (schema.outcomes) next.outcomes = schema.outcomes.filter((outcome) => !conditionReferences(outcome.if, stepKey));
  if (schema.flowPositions) next.flowPositions = schema.flowPositions.filter((position) => position.id !== stepId);
  if (schema.experiments)
    next.experiments = schema.experiments.map((experiment) => ({
      ...experiment,
      variants: experiment.variants.map((variant) => {
        const next = { ...variant };
        if (!next.stepOrder || next.stepOrder.includes(stepId)) delete next.stepOrder;
        const copy = variant.copy?.filter((item) => item.stepId !== stepId);
        if (copy && copy.length) next.copy = copy;
        else delete next.copy;
        return next;
      }),
    })) as NonNullable<FormSchema['experiments']>;
  return next;
}

/** Remove an ending and fix the default ending, outcomes and rule targets that used it. */
export function removeEnding(form: FormDTO, endingId: string): FormDTO {
  const endings = form.schema.endings.filter((ending) => ending.id !== endingId);
  const fallback = endings[0]?.id;
  const settings = { ...form.settings };
  if (settings.completion?.defaultEndingId === endingId) {
    if (fallback) settings.completion = { ...settings.completion, defaultEndingId: fallback };
    else delete settings.completion;
  }
  const clearRule = (rule: NonNullable<Step['logic']>[number]): boolean =>
    !(rule.then.action === 'end' && rule.then.to === endingId);
  const schema: FormSchema = {
    ...form.schema,
    endings: endings as FormSchema['endings'],
    steps: form.schema.steps.map((step) => ({
      ...step,
      logic: step.logic?.filter(clearRule),
      options: step.options?.map((option) => ({ ...option, logic: option.logic?.filter(clearRule) })),
    })) as FormSchema['steps'],
  };
  if (form.schema.outcomes) schema.outcomes = form.schema.outcomes.filter((outcome) => outcome.endingId !== endingId);
  return { ...form, schema, settings };
}

type Predicate = Extract<Condition, { field: string }>;
type Rule = NonNullable<Step['logic']>[number];
/** Loosely typed view of the settings that reference field keys (the generated types are tuples). */
interface KeyedSettings {
  notifications?: { admin?: KeyedNotification[]; autoresponders?: KeyedNotification[] };
  integrations?: { connectors?: KeyedConnector[] };
  sessions?: { magicLinks?: { enabled?: boolean; emailField?: string } };
}
interface KeyedNotification { enabled: boolean; emailField?: string; conditions?: Condition }
interface KeyedConnector { enabled: boolean; emailField?: string; phoneField?: string; consentField?: string; fields?: Record<string, string> }

function mapCondition(condition: Condition, leaf: (predicate: Predicate) => Condition): Condition {
  if ('all' in condition) return { all: condition.all.map((child) => mapCondition(child, leaf)) } as Condition;
  if ('any' in condition) return { any: condition.any.map((child) => mapCondition(child, leaf)) } as Condition;
  return leaf(condition);
}
/** Apply a transform to every rule (step and option) and outcome condition. */
function mapSchemaRules(schema: FormSchema, rule: (rule: Rule) => Rule | null, outcome: (condition: Condition) => Condition | null): FormSchema {
  const rules = (list: Rule[] | undefined) => list?.map(rule).filter((item): item is Rule => item !== null);
  const next: FormSchema = {
    ...schema,
    steps: schema.steps.map((step) => ({
      ...step,
      logic: rules(step.logic),
      options: step.options?.map((option) => ({ ...option, logic: rules(option.logic) })),
    })) as FormSchema['steps'],
  };
  if (schema.outcomes)
    next.outcomes = schema.outcomes.flatMap((item) => {
      const condition = outcome(item.if);
      return condition ? [{ ...item, if: condition }] : [];
    });
  return next;
}
function mapNotifications(settings: KeyedSettings, transform: (notification: KeyedNotification) => KeyedNotification): void {
  for (const list of ['admin', 'autoresponders'] as const) {
    const items = settings.notifications?.[list];
    if (items) settings.notifications![list] = items.map(transform);
  }
}
/** Rewrite {{key}}, {{answer:key}} and {{key|fallback}} merge tags in every string. */
function renameMergeTags<T>(value: T, from: string, to: string): T {
  if (typeof value === 'string')
    return value.replace(/\{\{([ \t\r\n]*)(answer:)?([a-z][a-z0-9_]*)(?=[ \t\r\n]*(?:\|[^{}]*)?\}\})/g, (tag: string, space: string, prefix = '', key: string) =>
      key === from ? `{{${space}${prefix}${to}` : tag) as T;
  if (Array.isArray(value)) return value.map((item: unknown) => renameMergeTags(item, from, to)) as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, renameMergeTags(item, from, to)])) as T;
  return value;
}
function renameInExpressions(schema: FormSchema, kind: 'answer' | 'variable', from: string, to: string): FormSchema {
  const pattern = new RegExp(`(?<![A-Za-z0-9_.])${kind}\\.${from}(?![a-z0-9_])`, 'g');
  return {
    ...schema,
    steps: schema.steps.map((step) =>
      step.type === 'calculated' && step.settings?.expression
        ? { ...step, settings: { ...step.settings, expression: step.settings.expression.replace(pattern, `${kind}.${to}`) } }
        : step,
    ) as FormSchema['steps'],
  };
}

/** Delete a field and clean every schema and settings reference to it. */
export function removeField(form: FormDTO, stepId: string): FormDTO {
  const key = form.schema.steps.find((step) => step.id === stepId)?.key ?? '';
  const settings = structuredClone(form.settings), keyed = settings as KeyedSettings;
  // A notification or connector that depended on the field is switched off rather
  // than left to send to everyone (or to nobody) without the admin noticing.
  mapNotifications(keyed, (notification) => {
    const next = { ...notification };
    if (conditionReferences(next.conditions, key)) {
      delete next.conditions;
      next.enabled = false;
    }
    if (next.emailField === key) {
      delete next.emailField;
      next.enabled = false;
    }
    return next;
  });
  const connectors = keyed.integrations?.connectors;
  if (connectors)
    keyed.integrations!.connectors = connectors.map((connector) => {
      const next = { ...connector };
      for (const name of ['emailField', 'phoneField', 'consentField'] as const)
        if (next[name] === key) {
          delete next[name];
          next.enabled = false;
        }
      if (next.fields) next.fields = Object.fromEntries(Object.entries(next.fields).filter(([, value]) => value !== key));
      return next;
    });
  const magic = keyed.sessions?.magicLinks;
  if (magic?.emailField === key) {
    delete magic.emailField;
    magic.enabled = false;
  }
  return { ...form, schema: removeStep(form.schema, stepId, key), settings };
}

/** Rename a field key and rewrite conditions, merge tags, formulas and settings that use it. */
export function renameStepKey(form: FormDTO, stepId: string, to: string): FormDTO {
  const from = form.schema.steps.find((step) => step.id === stepId)?.key;
  if (!from || from === to) return form;
  const leaf = (predicate: Predicate): Condition =>
    (predicate.source ?? 'answer') === 'answer' && predicate.field === from ? { ...predicate, field: to } : predicate;
  let schema = mapSchemaRules(
    { ...form.schema, steps: form.schema.steps.map((step) => (step.id === stepId ? { ...step, key: to } : step)) as FormSchema['steps'] },
    (rule) => ({ ...rule, if: mapCondition(rule.if, leaf) }),
    (condition) => mapCondition(condition, leaf),
  );
  schema = renameInExpressions(schema, 'answer', from, to);
  const settings = structuredClone(form.settings), keyed = settings as KeyedSettings;
  mapNotifications(keyed, (notification) => ({
    ...notification,
    ...(notification.conditions ? { conditions: mapCondition(notification.conditions, leaf) } : {}),
    ...(notification.emailField === from ? { emailField: to } : {}),
  }));
  for (const connector of keyed.integrations?.connectors ?? []) {
    for (const name of ['emailField', 'phoneField', 'consentField'] as const) if (connector[name] === from) connector[name] = to;
    if (connector.fields)
      connector.fields = Object.fromEntries(Object.entries(connector.fields).map(([remote, value]) => [remote, value === from ? to : value]));
  }
  const magic = keyed.sessions?.magicLinks;
  if (magic?.emailField === from) magic.emailField = to;
  return { ...form, schema: renameMergeTags(schema, from, to), settings: renameMergeTags(settings, from, to) };
}

/** Rename a choice's stored value and the conditions that compare against it. */
export function renameOptionValue(form: FormDTO, stepId: string, optionId: string, to: string): FormDTO {
  const step = form.schema.steps.find((item) => item.id === stepId);
  const from = step?.options?.find((option) => option.id === optionId)?.value;
  if (!step || from === undefined || from === to) return form;
  const swap = (value: unknown): unknown => (value === from ? to : Array.isArray(value) ? value.map(swap) : value);
  const leaf = (predicate: Predicate): Condition =>
    (predicate.source ?? 'answer') === 'answer' && predicate.field === step.key && 'value' in predicate
      ? ({ ...predicate, value: swap(predicate.value) } as Condition)
      : predicate;
  const schema = mapSchemaRules(
    {
      ...form.schema,
      steps: form.schema.steps.map((item) =>
        item.id === stepId ? { ...item, options: item.options?.map((option) => (option.id === optionId ? { ...option, value: to } : option)) } : item,
      ) as FormSchema['steps'],
    },
    (rule) => ({ ...rule, if: mapCondition(rule.if, leaf) }),
    (condition) => mapCondition(condition, leaf),
  );
  const settings = structuredClone(form.settings), keyed = settings as KeyedSettings;
  mapNotifications(keyed, (notification) =>
    notification.conditions ? { ...notification, conditions: mapCondition(notification.conditions, leaf) } : notification,
  );
  return { ...form, schema, settings };
}

/** Rename a scoring variable everywhere it is set, compared or calculated. */
export function renameVariable(form: FormDTO, from: string, to: string): FormDTO {
  if (from === to) return form;
  const leaf = (predicate: Predicate): Condition =>
    predicate.source === 'variable' && predicate.field === from ? { ...predicate, field: to } : predicate;
  let schema = mapSchemaRules(
    { ...form.schema, variables: form.schema.variables?.map((item) => (item.key === from ? { ...item, key: to } : item)) as FormSchema['variables'] & object },
    (rule) => ({
      ...rule,
      if: mapCondition(rule.if, leaf),
      then: rule.then.action === 'set_variable' && rule.then.key === from ? { ...rule.then, key: to } : rule.then,
    }),
    (condition) => mapCondition(condition, leaf),
  );
  schema = renameInExpressions(schema, 'variable', from, to);
  const settings = structuredClone(form.settings), keyed = settings as KeyedSettings;
  mapNotifications(keyed, (notification) =>
    notification.conditions ? { ...notification, conditions: mapCondition(notification.conditions, leaf) } : notification,
  );
  return { ...form, schema, settings };
}

/** Delete a scoring variable and the rules, outcomes and notification conditions that use it. */
export function removeVariable(form: FormDTO, key: string): FormDTO {
  const schema = mapSchemaRules(
    { ...form.schema, variables: (form.schema.variables ?? []).filter((item) => item.key !== key) as FormSchema['variables'] & object },
    (rule) => (conditionReferences(rule.if, key, 'variable') || (rule.then.action === 'set_variable' && rule.then.key === key) ? null : rule),
    (condition) => (conditionReferences(condition, key, 'variable') ? null : condition),
  );
  const settings = structuredClone(form.settings), keyed = settings as KeyedSettings;
  mapNotifications(keyed, (notification) => {
    if (!conditionReferences(notification.conditions, key, 'variable')) return notification;
    const next = { ...notification, enabled: false };
    delete next.conditions;
    return next;
  });
  return { ...form, schema, settings };
}
export interface DraftState {
  form: FormDTO;
  saved: string;
  saving: boolean;
  conflict: ApiError | null;
  /** Another admin holds the WordPress edit lock; saving can be retried once it clears. */
  locked: boolean;
  error: string;
  /** Field-level errors returned by the server, when available. */
  issues: ValidationIssue[];
  history: FormDTO[];
  future: FormDTO[];
}

/** Serializes mutations; edits made during a save never disappear with its response. */
export class DraftController {
  state: DraftState;
  private listeners = new Set<() => void>();
  private inflight: Promise<FormDTO> | null = null;
  private generation = 0;
  private seenKeys = new Set<string>();
  private seenOptions = new Map<string, Set<string>>();
  private publishing: Promise<FormDTO> | null = null;
  /** Groups rapid keystrokes into one undo entry. */
  private lastEditAt = 0;
  constructor(
    private api: AdminApi,
    form: FormDTO,
  ) {
    this.remember(form);
    this.state = {
      form,
      saved: form.id ? editable(form) : '',
      saving: false,
      conflict: null,
      locked: false,
      error: '',
      issues: [],
      history: [],
      future: [],
    };
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = (): DraftState => this.state;
  private emit(change: Partial<DraftState>): void {
    this.state = { ...this.state, ...change };
    for (const listener of this.listeners) listener();
  }
  edit(transform: (form: FormDTO) => FormDTO): void {
    const now = Date.now();
    const coalesce = this.lastEditAt > 0 && now - this.lastEditAt < 700;
    this.lastEditAt = now;
    this.generation++;
    const form = transform(structuredClone(this.state.form));
    this.remember(form);
    this.emit({
      form,
      // Coalesce a burst of keystrokes into one undo step, so Undo reverts the
      // field edit rather than the last character typed.
      history: coalesce ? this.state.history : [...this.state.history.slice(-49), this.state.form],
      future: [],
      error: '',
      issues: [],
    });
  }
  reservedKeys(): string[] {
    return [...this.seenKeys];
  }
  reservedOptionValues(stepId: string): string[] {
    return [...(this.seenOptions.get(stepId) ?? [])];
  }
  private remember(form: FormDTO): void {
    form.schema.steps.forEach((step) => {
      this.seenKeys.add(step.key);
      const values = this.seenOptions.get(step.id) ?? new Set<string>();
      step.options?.forEach((option) => values.add(option.value));
      this.seenOptions.set(step.id, values);
    });
  }
  undo(): void {
    const previous = this.state.history.at(-1);
    if (previous) {
      this.generation++;
      this.lastEditAt = 0;
      this.emit({
        form: {
          ...this.state.form,
          title: previous.title,
          schema: previous.schema,
          settings: previous.settings,
        },
        history: this.state.history.slice(0, -1),
        future: [this.state.form, ...this.state.future],
        error: '',
        issues: [],
      });
    }
  }
  redo(): void {
    const next = this.state.future[0];
    if (next) {
      this.generation++;
      this.lastEditAt = 0;
      this.emit({
        form: { ...this.state.form, title: next.title, schema: next.schema, settings: next.settings },
        history: [...this.state.history, this.state.form],
        future: this.state.future.slice(1),
        error: '',
        issues: [],
      });
    }
  }
  dirty(): boolean {
    return editable(this.state.form) !== this.state.saved;
  }
  async save(): Promise<FormDTO> {
    if (this.inflight) {
      await this.inflight;
      return this.dirty() ? this.save() : this.state.form;
    }
    if (this.state.conflict) throw this.state.conflict;
    if (!this.dirty()) return this.state.form;
    const snapshot = structuredClone(this.state.form),
      generation = this.generation;
    this.emit({ saving: true, error: '' });
    this.inflight = this.api.request<FormDTO>(
      snapshot.id ? `admin/forms/${snapshot.id}` : 'admin/forms',
      snapshot.id ? 'PUT' : 'POST',
      {
        title: snapshot.title,
        schema: snapshot.schema,
        settings: snapshot.settings,
        ...(snapshot.id ? { draftRevision: snapshot.draftRevision } : {}),
      },
    );
    try {
      const saved = await this.inflight;
      this.emit({
        form:
          generation === this.generation
            ? saved
            : {
                ...this.state.form,
                id: saved.id,
                slug: saved.slug,
                version: saved.version,
                draftRevision: saved.draftRevision,
                status: saved.status,
              },
        saved: editable(saved),
        locked: false,
        issues: [],
      });
      return this.state.form;
    } catch (error) {
      this.fail(error, __('Save failed.', 'chatflow-forms'));
      throw error;
    } finally {
      this.inflight = null;
      this.emit({ saving: false });
    }
  }
  async publish(): Promise<FormDTO> {
    if (this.publishing) return this.publishing;
    this.publishing = this.publishOnce();
    try {
      return await this.publishing;
    } finally {
      this.publishing = null;
    }
  }
  private async publishOnce(): Promise<FormDTO> {
    await this.save();
    // Save again if edits were made while the last draft was being persisted.
    if (this.dirty()) await this.save();
    const snapshot = this.state.form,
      generation = this.generation;
    this.emit({ saving: true, error: '' });
    try {
      this.inflight = this.api.request<FormDTO>(`admin/forms/${snapshot.id}/publish`, 'POST', {
        draftRevision: snapshot.draftRevision,
      });
      const published = await this.inflight;
      this.emit({
        form:
          generation === this.generation
            ? published
            : {
                ...this.state.form,
                slug: published.slug,
                version: published.version,
                status: published.status,
                draftRevision: published.draftRevision,
              },
        saved: editable(published),
        locked: false,
        issues: [],
      });
      return published;
    } catch (error) {
      this.fail(error, __('Publish failed.', 'chatflow-forms'));
      throw error;
    } finally {
      this.inflight = null;
      this.emit({ saving: false });
    }
  }
  /** Only a draft-revision conflict pauses saving; an edit lock is transient and retryable. */
  private fail(error: unknown, fallback: string): void {
    const code = error instanceof ApiError ? error.code : '';
    const locked = code === 'cff_form_locked';
    const raw = error instanceof ApiError ? error.data.errors : undefined;
    const issues = Array.isArray(raw)
      ? raw.filter((item): item is ValidationIssue => Boolean(item) && typeof item === 'object' && typeof (item as { message?: unknown }).message === 'string')
      : [];
    this.emit({
      conflict: error instanceof ApiError && code === 'cff_revision_conflict' ? error : null,
      locked,
      issues,
      error: locked
        ? __(
            'This form is locked by another admin who is editing it. Your local edits are kept; saving resumes once their editing lock clears.',
            'chatflow-forms',
          )
        : error instanceof Error
          ? error.message
          : fallback,
    });
  }
  async reload(): Promise<void> {
    if (this.inflight) await this.inflight.catch(() => undefined);
    const latest = await this.api.request<FormDTO>(`admin/forms/${this.state.form.id}`);
    this.generation++;
    this.lastEditAt = 0;
    this.emit({
      form: latest,
      saved: editable(latest),
      conflict: null,
      locked: false,
      error: '',
      issues: [],
      history: [],
      future: [],
    });
  }
  async rebaseLocal(): Promise<void> {
    if (this.inflight) await this.inflight.catch(() => undefined);
    const latest = await this.api.request<FormDTO>(`admin/forms/${this.state.form.id}`);
    this.generation++;
    this.lastEditAt = 0;
    this.emit({
      form: {
        ...this.state.form,
        draftRevision: latest.draftRevision,
        version: latest.version,
        status: latest.status,
      },
      saved: editable(latest),
      conflict: null,
      error: '',
      issues: [],
    });
  }
}
