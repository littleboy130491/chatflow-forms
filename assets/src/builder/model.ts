import { __ } from '@wordpress/i18n';
import { ApiError, AdminApi } from './api';
import type { FormDTO, FormSchema, FormSettings, Step, Option } from './api';

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
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
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
  if (['single_choice', 'multi_choice'].includes(type)) step.options = [makeOption('option_1')];
  if (type === 'phone') step.settings = { country: 'ID' };
  if (type === 'slider') step.validation = { min: 0, max: 100, step: 1 };
  if (type === 'address') step.settings = { addressFields: ['street', 'city', 'postcode', 'country'] };
  if (type === 'consent') {
    step.required = true;
    step.settings = { consentText: __('I agree to the privacy policy.', 'chatflow-forms') };
  }
  return step;
}
export function makeOption(value: string): Option {
  return { id: uid('opt'), value, label: value };
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
      bot: { name: 'Ima', typingSpeed: 'normal' },
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
export function editable(form: FormDTO): string {
  return JSON.stringify({ title: form.title, schema: form.schema, settings: form.settings });
}
export interface DraftState {
  form: FormDTO;
  saved: string;
  saving: boolean;
  conflict: ApiError | null;
  /** Another admin holds the WordPress edit lock; saving can be retried once it clears. */
  locked: boolean;
  error: string;
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
    this.generation++;
    const form = transform(structuredClone(this.state.form));
    this.remember(form);
    this.emit({
      form,
      history: [...this.state.history.slice(-49), this.state.form],
      future: [],
      error: '',
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
      this.emit({
        form: {
          ...this.state.form,
          title: previous.title,
          schema: previous.schema,
          settings: previous.settings,
        },
        history: this.state.history.slice(0, -1),
        future: [this.state.form, ...this.state.future],
      });
    }
  }
  redo(): void {
    const next = this.state.future[0];
    if (next) {
      this.generation++;
      this.emit({
        form: { ...this.state.form, title: next.title, schema: next.schema, settings: next.settings },
        history: [...this.state.history, this.state.form],
        future: this.state.future.slice(1),
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
                version: published.version,
                status: published.status,
                draftRevision: published.draftRevision,
              },
        saved: editable(published),
        locked: false,
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
    this.emit({
      conflict: error instanceof ApiError && code === 'cff_revision_conflict' ? error : null,
      locked,
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
    this.emit({
      form: latest,
      saved: editable(latest),
      conflict: null,
      locked: false,
      error: '',
      history: [],
      future: [],
    });
  }
  async rebaseLocal(): Promise<void> {
    if (this.inflight) await this.inflight.catch(() => undefined);
    const latest = await this.api.request<FormDTO>(`admin/forms/${this.state.form.id}`);
    this.generation++;
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
    });
  }
}
