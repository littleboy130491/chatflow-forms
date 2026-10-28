import { allowFieldTypes, replay } from '../shared/logic';
import { readPrefill } from '../shared/prefill';
import { collectMeta, urlSourceKeys } from '../tracking';
import { ApiClient, ApiError, uuid } from './api';
import { SessionStorage, type SavedSession } from './persistence';
import type { AnswerMap, Completion, PublicForm, ReplayContext, ReplayResult, RuntimeOptions, Session, Step } from './types';
import { RuntimeAnalytics, type EngagementConfig } from './engagement';
import { interpolateLink, interpolateMarkdown } from './content';
import { interpolate } from '../shared/logic';

export interface RuntimeState {
  phase: 'loading' | 'resume' | 'ready' | 'submitting' | 'done' | 'error';
  form: PublicForm | null; answers: AnswerMap; path: ReplayResult | null; activeId: string | null;
  acknowledged: string[]; busy: boolean; dirty: boolean; offline: boolean;
  error: string | null; fieldError: string | null; conflict: boolean; newerVersion: boolean;
  validation: boolean; storageUnavailable: boolean; completion: Completion | null;
}
type Mutation = { method: 'PATCH' | 'DELETE' | 'POST'; body: Record<string, unknown>; key: string };
const display = (step: Step) => ['statement', 'summary', 'media'].includes(step.type);

export class RuntimeController {
  state: RuntimeState = { phase: 'loading', form: null, answers: {}, path: null, activeId: null, acknowledged: [], busy: false, dirty: false, offline: false, error: null, fieldError: null, conflict: false, newerVersion: false, validation: false, storageUnavailable: false, completion: null };
  private listeners = new Set<() => void>();
  private renewal: Promise<void> | null = null;
  private saving: Promise<void> | null = null;
  private session: Session | null = null;
  private context: ReplayContext = { hidden: {}, url: {}, meta: {}, now: new Date().toISOString() };
  private pending: Mutation | null = null;
  private pendingStart: { token: string; key: string; meta: ReturnType<typeof collectMeta>; prefill: AnswerMap; version: number } | null = null;
  private saved: SavedSession | null = null;
  private latest: PublicForm | null = null;
  private stepStarted = Date.now();
  private timings: Record<string, number> = {};
  private disposed = false;
  private submittedOnce = false;
  private editing: string | null = null;
  private prefill: AnswerMap;
  private engagement: EngagementConfig | null = null;
  private analytics: RuntimeAnalytics | null = null;
  private engagementVersion = 0;
  private async loadEngagement(): Promise<void> {
    if (!this.state.form || this.options.preview || this.engagementVersion === this.state.form.form.version) return;
    this.engagement = null; this.analytics = null;
    if (this.state.form.features.engagement) {
      // Captcha/analytics config is not essential to answering. If it cannot load, let the
      // visitor continue; it is retried before submit, where the server enforces captcha.
      try { this.engagement = await this.api!.request<EngagementConfig>(`forms/${this.state.form.form.id}/engagement`, 'GET', undefined, {}, 'no-store', this.state.form.form.version); }
      catch { return; }
      this.analytics = new RuntimeAnalytics(this.api!, this.engagement.analytics, () => !!(this.options.tracking ?? globalThis.window?.cffTracking)?.consentGranted, () => { try { return this.options.analyticsOptOut === true || localStorage.getItem('cff_analytics_optout') === '1'; } catch { return this.options.analyticsOptOut === true; } });
    }
    this.engagementVersion = this.state.form.form.version;
  }
  constructor(public readonly options: RuntimeOptions, private readonly api: ApiClient | null, private readonly storage = new SessionStorage(), private readonly emit: (name: string, detail: Record<string, unknown>) => void = () => {}) { this.prefill = options.prefill ?? {}; if (options.preview && options.context) this.context = options.context; }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  dispose(): void { this.disposed = true; this.listeners.clear(); }
  private notify(): void { if (!this.disposed) for (const listener of this.listeners) listener(); }
  private event(name: string, extra: Record<string, unknown> = {}): void {
    if (this.options.preview || !this.state.form) return;
    this.emit(name, { formId: this.state.form.form.id, version: this.state.form.form.version, ...extra });
    if (name === 'cff:step' && typeof extra.stepId === 'string' && this.state.form.form.session.savePartial !== false) this.analytics?.add({ event: 'view', stepId: extra.stepId });
    if (name === 'cff:start') { this.analytics?.add({ event: 'view' }); if (this.session) void this.analytics?.flush(this.session); }
  }
  /** The visitor chose the form's direct contact link (e.g. WhatsApp) instead of continuing. */
  contactClicked(): void { this.event('cff:contact', this.state.activeId ? { stepId: this.state.activeId } : {}); }
  close(): void { if (this.session && this.state.phase !== 'done') { this.analytics?.add({ event: 'abandon', ...(this.state.activeId && this.state.form?.form.session.savePartial !== false ? { stepId: this.state.activeId } : {}) }); void this.analytics?.flush(this.session); } }
  async upload(step: Step, file: File) {
    if (!this.session || !this.api || !this.state.form?.features.uploads || this.options.preview || this.state.offline || this.state.busy || this.state.conflict) throw new ApiError('cff_upload_unavailable', 0);
    return this.ownerOperation(() => this.api!.upload(this.session!, step.id, file));
  }

  async initialize(): Promise<void> {
    const fragment = this.options.preview ? null : globalThis.location?.hash.match(/^#cff-magic=([A-Za-z0-9_-]{43})$/);
    const magic = fragment?.[1];
    if (globalThis.location?.hash.startsWith('#cff-magic=')) globalThis.history.replaceState(globalThis.history.state, '', globalThis.location.pathname + globalThis.location.search);
    try {
      const formId = this.options.form?.form.id ?? this.options.formId;
      if (!this.options.preview && formId) this.saved = this.storage.read(formId);
      this.state.form = this.options.form ?? await this.api!.form(this.options.formId!);
      if (this.disposed) return;
      this.latest = this.state.form;
      allowFieldTypes(this.state.form.features?.fieldTypes ?? []);
      if (this.options.preview) { if (this.options.previewAnswers) this.state.answers = { ...this.options.previewAnswers }; this.state.phase = 'ready'; this.compute(); return; }
      this.prefill = { ...readPrefill(globalThis.location?.search ?? '', this.state.form.form.schema), ...this.prefill };
      await this.loadEngagement();
      const form = this.state.form.form;
      if (magic) {
        await this.adopt(await this.api!.magicResume(form.id, magic));
        this.state.acknowledged = this.displayBeforeCurrent();
        // The link is single-use: keep the fresh credential so a reload resumes the same session.
        this.compute(); this.state.phase = 'ready'; this.persist(); return;
      }
      this.saved = form.session.resumeEnabled ? this.storage.read(form.id) : null;
      const token = form.session.resumeEnabled ? this.storage.credential(form.id) : null;
      if (token) {
        await this.adopt(await this.api!.resume(form.id, token));
        if (this.saved?.dirty && this.saved.sessionId === this.session?.sessionId) {
          this.state.answers = this.saved.answers; this.state.dirty = true;
          this.state.conflict = this.saved.revision !== this.session.revision;
          this.timings = this.saved.stepTimings;
        }
        this.state.acknowledged = this.saved?.acknowledged ?? this.displayBeforeCurrent();
        this.compute();
        this.state.newerVersion = this.latest.form.version !== this.session?.version;
        this.state.phase = form.session.resumePrompt || this.state.newerVersion ? 'resume' : 'ready';
        if (this.state.phase === 'ready' && this.state.dirty && !this.state.conflict) await this.flush();
        return;
      }
      await this.start();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'cff_network' && this.saved?.form && this.saved.context && !this.options.preview) {
        this.state.form = this.saved.form; this.context = this.saved.context; this.state.answers = this.saved.answers;
        this.state.acknowledged = this.saved.acknowledged; this.state.dirty = this.saved.dirty; this.timings = this.saved.stepTimings;
        this.state.offline = true; this.state.phase = 'resume'; this.compute();
      } else this.handle(error);
    }
    finally { this.notify(); }
  }

  private displayBeforeCurrent(): string[] {
    const steps = this.state.form!.form.schema.steps;
    const ids = this.session?.visited ?? [];
    return ids.filter(id => id !== this.session?.currentStepId && steps.some(s => s.id === id && display(s)));
  }
  private async adopt(session: Session): Promise<void> {
    if (this.disposed) return;
    if (!this.state.form || session.formId !== this.state.form.form.id) throw new ApiError('cff_invalid_response', 0);
    if (!session.context?.now || !Number.isFinite(Date.parse(session.context.now))) throw new ApiError('cff_invalid_response', 0);
    if (session.status !== 'active') { this.storage.clear(session.formId); throw new ApiError('cff_session_expired', 401); }
    if (session.version !== this.state.form.form.version) {
      const pinned = await this.api!.form(session.formId, session.version);
      if (this.disposed) return;
      if (pinned.form.version !== session.version) throw new ApiError('cff_version_conflict', 409);
      this.state.form = pinned;
    }
    if (session.schema) this.state.form = { ...this.state.form, form: { ...this.state.form.form, schema: session.schema } };
    await this.loadEngagement();
    if (this.disposed) return;
    this.session = session;
    this.context = session.context ?? this.context;
    this.state.answers = session.answers;
    this.compute();
  }
  async start(): Promise<void> {
    if (this.state.busy || this.disposed) return;
    this.state.busy = true; this.state.error = null; this.notify();
    try {
      const form = this.state.form!.form;
      if (!this.options.preview) {
        if (!this.pendingStart) {
          const token = await this.api!.startToken(form.id, form.version);
          if (this.disposed) return;
          if (token.version !== form.version) throw new ApiError('cff_version_conflict', 409);
          this.pendingStart = { token: token.startToken, key: uuid(), meta: collectMeta(this.options.tracking ?? globalThis.window?.cffTracking, urlSourceKeys(form.schema)), prefill: {}, version: form.version };
        }
        const operation = this.pendingStart;
        await this.adopt(await this.api!.start(form.id, operation.version, operation.meta, operation.prefill, operation.token, operation.key));
        if (this.disposed) return;
        this.pendingStart = null;
      } else { this.compute(); }
      this.state.phase = this.state.path?.errors.length ? 'error' : 'ready'; this.persist(); this.event('cff:start');
    } catch (error) { this.handle(error); }
    finally { this.state.busy = false; this.notify(); }
  }
  async continueSaved(): Promise<void> {
    this.state.phase = this.state.path?.errors.length ? 'error' : 'ready'; this.notify(); this.event('cff:start', { resumed: true });
    if (!this.state.offline && !this.session && this.saved) { await this.reconnect(); return; }
    if (this.state.dirty && !this.state.conflict) await this.flush();
  }
  private compute(): void {
    const form = this.state.form; if (!form) return;
    let path = replay(form.form.schema, this.state.answers, this.context, 'partial');
    if (path.discardedKeys.length) {
      const cleaned = { ...this.state.answers }; for (const key of path.discardedKeys) delete cleaned[key];
      path = replay(form.form.schema, cleaned, this.context, 'partial');
    }
    this.state.path = path; this.state.answers = path.answers;
    if (path.errors.length) { this.state.error = 'invalid'; this.state.phase = 'error'; }
    const next = this.editing ?? path.visited.find(id => form.form.schema.steps.some(step => step.id === id && display(step)) && !this.state.acknowledged.includes(id)) ?? path.currentStepId;
    if (this.state.activeId !== next) {
      this.state.activeId = next ?? null; this.stepStarted = Date.now();
      if (next) this.event('cff:step', { stepId: next });
    }
    this.notify();
  }
  get activeStep(): Step | undefined { return this.state.form?.form.schema.steps.find(step => step.id === this.state.activeId); }
  get canSkip(): boolean {
    const step = this.activeStep; if (!step || step.type === 'consent' || display(step)) return false;
    const path = replay(this.state.form!.form.schema, { ...this.state.answers, [step.key]: null }, this.context, 'partial');
    return path.currentStepId !== step.id && !path.errors.some(issue => issue.fieldKey === step.key);
  }
  get meta(): AnswerMap { return (this.context.meta ?? {}) as AnswerMap; }
  get visibleSteps(): Step[] {
    const form = this.state.form; if (!form || !this.state.path) return [];
    const index = this.state.path.visited.indexOf(this.state.activeId ?? '');
    return this.state.path.visited.slice(0, index < 0 ? undefined : index + 1).map(id => form.form.schema.steps.find(step => step.id === id)!).filter(step => step && step.type !== 'hidden' && step.type !== 'calculated');
  }
  async answer(value: unknown): Promise<void> {
    const step = this.activeStep;
    if (!step || this.pending?.method === 'POST' || this.state.conflict) return;
    this.state.fieldError = null;
    if (this.state.validation) { this.state.validation = false; this.state.error = null; }
    if (display(step)) {
      // Display steps do not mutate answers; acknowledge them even while the
      // previous answer's PATCH is still saving, otherwise an auto-continued
      // statement can be dropped and leave the visitor stranded.
      this.timings[step.id] = (this.timings[step.id] ?? 0) + Math.max(0, Date.now() - this.stepStarted);
      this.state.acknowledged = [...new Set([...this.state.acknowledged, step.id])];
      this.compute(); this.persist(); return;
    }
    if (this.state.busy) return;
    const candidate = { ...this.state.answers, [step.key]: value } as AnswerMap;
    const test = replay(this.state.form!.form.schema, candidate, this.context, 'partial');
    const issue = test.errors.find(issue => issue.fieldKey === step.key);
    if (issue || test.currentStepId === step.id) { this.state.fieldError = issue?.code === 'required' || issue?.code === 'cff_required' ? (step.type === 'consent' ? 'consentRequired' : 'required') : issue?.code === 'invalid_email' ? 'invalidEmail' : 'invalid'; this.notify(); return; }
    this.timings[step.id] = (this.timings[step.id] ?? 0) + Math.max(0, Date.now() - this.stepStarted);
    this.state.answers = candidate; this.editing = null; this.state.dirty = true;
    this.compute(); this.persist();
    if (this.state.form!.form.session.savePartial !== false) await this.flush();
    if (this.session && !this.state.dirty) { this.analytics?.add({ event: 'answer', stepId: step.id }); void this.analytics?.flush(this.session); }
  }
  edit(id: string): void {
    if (this.state.busy || this.state.phase !== 'ready' || this.pending?.method === 'POST') return;
    const path = this.state.path; const step = this.state.form?.form.schema.steps.find(step => step.id === id);
    if (!path?.visited.includes(id) || !step || display(step) || step.type === 'hidden' || step.type === 'calculated') return;
    this.editing = id; this.state.fieldError = null;
    const cut = path.visited.indexOf(id);
    this.state.acknowledged = this.state.acknowledged.filter(key => path.visited.indexOf(key) < cut);
    this.compute();
  }
  back(): void {
    const steps = this.visibleSteps.filter(step => !display(step) && step.id !== this.state.activeId && Object.prototype.hasOwnProperty.call(this.state.answers, step.key));
    const previous = steps[steps.length - 1]; if (previous) { this.edit(previous.id); if (this.session && this.state.form?.form.session.savePartial !== false) { this.analytics?.add({ event: 'back', stepId: previous.id }); void this.analytics?.flush(this.session); } }
  }
  prefillAnswers(answers: AnswerMap): void {
    if (this.state.phase === 'done' || this.pending?.method === 'POST') return;
    this.prefill = { ...this.prefill, ...answers };
    this.notify();
  }
  setAppearance(appearance: PublicForm['form']['appearance']): void {
    if (!this.options.preview || !this.state.form) return;
    this.state.form = { ...this.state.form, form: { ...this.state.form.form, appearance } };
    this.notify();
  }
  jumpToStep(id: string): boolean {
    const step = this.state.form?.form.schema.steps.find(step => step.id === id);
    if (!this.options.preview || !step || step.type === 'hidden' || step.type === 'calculated') return false;
    this.editing = id; this.state.activeId = id; this.state.phase = 'ready';
    this.state.error = null; this.state.fieldError = null; this.notify(); return true;
  }
  // Page-script prefill never answers consent, uploads or non-input steps on the visitor's behalf.
  inputValue(step: Step): unknown { return this.state.answers[step.key] ?? (['hidden', 'calculated', 'file_upload', 'consent', 'statement', 'summary', 'media'].includes(step.type) ? undefined : this.prefill[step.key]) ?? step.defaultValue; }
  private inputAnswers(): AnswerMap {
    const keys = new Set(this.state.form!.form.schema.steps.filter(step => !display(step) && step.type !== 'hidden' && step.type !== 'calculated').map(step => step.key));
    return Object.fromEntries(Object.entries(this.state.answers).filter(([key]) => keys.has(key))) as AnswerMap;
  }
  async magicLink(channel: 'email' | 'whatsapp'): Promise<{ accepted: boolean; link?: string }> {
    if (!this.api || !this.session || !this.state.form?.form.session.magicLinks?.enabled || this.options.preview || this.state.offline || this.state.conflict || this.state.busy) throw new ApiError('cff_magic_unavailable', 0);
    if (this.state.dirty) await this.flush();
    if (this.state.dirty && this.state.form?.form.session.savePartial !== false) throw new ApiError('cff_save_failed', 0);
    return this.ownerOperation(() => this.api!.magicLink(this.session!, channel));
  }
  private persist(): void {
    if (!this.session && this.saved && this.state.offline && !this.options.preview) {
      this.saved = { ...this.saved, answers: this.state.answers, acknowledged: this.state.acknowledged, dirty: this.state.dirty, stepTimings: this.timings };
      this.state.storageUnavailable = !this.storage.write(this.saved); return;
    }
    if (this.options.preview || !this.state.form?.form.session.resumeEnabled || !this.session?.resumeToken || !this.session.resumeExpiresAt) return;
    this.state.storageUnavailable = !this.storage.write({ formId: this.session.formId, version: this.session.version, sessionId: this.session.sessionId, resumeToken: this.session.resumeToken, expiresAt: this.session.resumeExpiresAt, revision: this.session.revision, answers: this.state.answers, acknowledged: this.state.acknowledged, dirty: this.state.dirty, stepTimings: this.timings, form: this.state.form, context: this.context });
  }
  private async mutate<T>(operation: Mutation): Promise<T> {
    if (!this.session) throw new ApiError('cff_session_expired', 401);
    if (!(operation.method === 'POST' && this.submittedOnce)) await this.renewCredential();
    try { if (operation.method === 'POST') this.submittedOnce = true; return await this.api!.mutate<T>(this.session, operation.method, operation.body, operation.key); }
    catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || !this.session.resumeToken) throw error;
      await this.renewCredential(true);
      return this.api!.mutate<T>(this.session, operation.method, operation.body, operation.key);
    }
  }
  private async renewCredential(force = false): Promise<void> {
    if (!this.session || !this.api) throw new ApiError('cff_session_expired', 401);
    if (!force && Date.parse(this.session.requestExpiresAt) > Date.now() + 5000) return;
    if (!this.session.resumeToken) throw new ApiError('cff_session_expired', 401);
    if (!this.renewal) {
      const current = this.session;
      this.renewal = this.api.resume(current.formId, current.resumeToken!).then(fresh => {
        if (this.disposed) throw new ApiError('cff_cancelled', 0);
        if (fresh.status !== 'active') throw new ApiError('cff_session_expired', 401);
        this.session = { ...fresh, answers: current.answers }; this.persist();
      }).finally(() => { this.renewal = null; });
    }
    await this.renewal;
  }
  private async ownerOperation<T>(call: () => Promise<T>): Promise<T> {
    await this.renewCredential();
    try { return await call(); }
    catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || !this.session?.resumeToken) throw error;
      await this.renewCredential(true); return call();
    }
  }
  /** Timings only for steps still on the path; an edited branch leaves earlier steps behind. */
  private pathTimings(answers: AnswerMap): Record<string, number> {
    const visited = new Set(replay(this.state.form!.form.schema, answers, this.context, 'partial').visited);
    return Object.fromEntries(Object.entries(this.timings).filter(([id]) => visited.has(id)));
  }
  async flush(): Promise<void> {
    if (this.saving) return this.saving;
    if (this.disposed || this.options.preview || this.state.form?.form.session.savePartial === false || this.state.offline || this.state.busy || this.state.conflict || this.pending?.method === 'POST' || !this.session || !this.state.dirty) return;
    this.saving = this.saveLoop();
    try { await this.saving; } finally { this.saving = null; }
  }
  private async saveLoop(): Promise<void> {
    while (!this.disposed && !this.state.offline && !this.state.conflict && this.state.dirty && this.session) {
      const desired = this.inputAnswers();
      try {
        if (!this.pending) this.pending = { method: 'PATCH', key: uuid(), body: { version: this.session.version, revision: this.session.revision, answers: desired, stepTimings: this.pathTimings(desired) } };
        const operation = this.pending;
        const response = await this.mutate<Session>(operation);
        if (this.disposed) return;
        const newer = JSON.stringify(this.inputAnswers()) !== JSON.stringify(operation.body.answers);
        this.pending = null; this.session = { ...this.session, ...response };
        this.context = response.context ?? this.context;
        if (!newer) this.state.answers = response.answers;
        this.state.dirty = newer; this.state.error = null; this.compute(); this.persist();
      } catch (error) { this.handle(error); this.notify(); return; }
    }
  }
  async submit(honeypot = ''): Promise<void> {
    if (this.disposed || this.state.busy || this.state.offline || this.state.conflict || this.state.phase === 'done') return;
    if (this.state.activeId && !this.pending) return;
    const validation = replay(this.state.form!.form.schema, this.inputAnswers(), this.context, 'complete');
    if (validation.errors.length && !this.pending) { this.state.fieldError = 'invalid'; this.notify(); return; }
    if (this.options.preview) {
      const ending = this.state.form!.form.schema.endings.find(e => e.id === validation.endingId) ?? this.state.form!.form.schema.endings[0];
      const messages = (ending.messages ?? []).map(message => interpolateMarkdown(message, this.state.answers, this.meta));
      const buttons = (ending.buttons ?? []).map(button => ({ ...button, label: interpolate(button.label, this.state.answers, this.meta), ...(button.url ? { url: interpolateLink(button.url, this.state.answers, this.meta) } : {}) })) as Completion['ending']['buttons'];
      let redirectUrl: string | undefined;
      if (ending.type === 'redirect' && ending.url) {
        try {
          const url = new URL(interpolateLink(ending.url, this.state.answers, this.meta), globalThis.location?.href ?? 'https://localhost/');
          if (ending.appendQuery) for (const key of ending.queryKeys ?? []) { const value = this.state.answers[key]; if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') url.searchParams.set(key, String(value)); }
          if (ending.appendSubmission) url.searchParams.set('submission', '[submission UUID]');
          redirectUrl = url.href;
        } catch { /* An invalid destination is displayed by the editor, not opened in preview. */ }
      }
      this.state.completion = { submission: { uuid: '', status: 'completed' }, ending: { ...ending, messages, buttons }, ...(redirectUrl ? { redirectUrl } : {}) };
      this.state.phase = 'done'; this.notify(); return;
    }
    if (this.pending?.method !== 'POST') { await this.flush(); if (this.state.busy || this.state.phase !== 'ready' || (this.state.dirty && this.state.form!.form.session.savePartial !== false) || this.state.activeId || this.state.conflict || this.state.offline) return; }
    this.state.busy = true; this.state.phase = 'submitting'; this.state.error = null; this.notify();
    try {
      if (!this.pending) {
        let captchaToken = '';
        await this.loadEngagement();
        if (this.disposed) return;
        if (this.engagement && this.engagement.captcha.provider !== 'none') {
          try { captchaToken = await this.options.captcha?.(this.engagement.captcha) ?? ''; } catch { captchaToken = ''; }
          if (this.disposed) return;
          // A failed or expired challenge is retryable: keep the visitor on the review step with a clear message.
          if (!captchaToken) { this.state.phase = 'ready'; this.state.error = 'captchaFailed'; return; }
        }
        if (this.disposed) return;
        this.pending = { method: 'POST', key: uuid(), body: { version: this.session!.version, revision: this.session!.revision, answers: this.inputAnswers(), honeypot, ...(captchaToken ? { captchaToken } : {}) } };
      }
      if (this.session) await this.analytics?.flush(this.session);
      this.state.completion = await this.mutate<Completion>(this.pending);
      if (this.disposed) return;
      this.pending = null; this.state.phase = 'done'; this.state.dirty = false;
      this.storage.clear(this.state.form!.form.id);
      this.event('cff:complete', { submissionId: this.state.completion.submission.uuid, endingId: this.state.completion.ending.id });
    } catch (error) { this.state.phase = 'ready'; this.handle(error); }
    finally { this.state.busy = false; this.notify(); }
  }
  async restart(): Promise<void> {
    if (this.disposed || this.state.busy || this.pending?.method === 'POST' || this.pendingStart || this.state.offline) return;
    if (this.saving) { await this.saving; if (this.disposed || this.state.busy || this.state.offline || this.state.conflict) return; }
    this.state.busy = true; this.notify();
    try {
      if (this.session && this.state.phase !== 'done' && this.state.error !== 'expired' && !this.options.preview) {
        if (this.pending?.method === 'PATCH') { this.state.busy = false; await this.flush(); this.state.busy = true; if (this.pending) return; }
        this.pending ??= { method: 'DELETE', key: uuid(), body: { version: this.session.version, revision: this.session.revision } };
        await this.mutate(this.pending);
        if (this.disposed) return;
      }
      if (!this.options.preview) this.storage.clear(this.state.form!.form.id);
      this.session = null; this.saved = null; this.pending = null; this.pendingStart = null; this.submittedOnce = false;
      this.state.answers = {}; this.state.acknowledged = []; this.state.completion = null; this.state.conflict = false; this.state.error = null; this.state.fieldError = null; this.state.dirty = false; this.editing = null; this.timings = {}; this.prefill = {};
      if (!this.options.preview) this.state.form = await this.api!.form(this.state.form!.form.id);
      this.latest = this.state.form; this.state.newerVersion = false; this.state.busy = false;
      await this.start();
    } catch (error) { this.handle(error); }
    finally { this.state.busy = false; this.notify(); }
  }
  async resolveConflict(useLocal: boolean): Promise<void> {
    if (!this.session || this.state.busy) return;
    this.state.busy = true;
    try {
      const local = this.state.answers;
      const remote = await this.api!.resume(this.session.formId, this.session.resumeToken ?? this.storage.credential(this.session.formId) ?? '');
      await this.adopt(remote); if (useLocal) this.state.answers = local;
      this.pending = null; this.state.conflict = false; this.state.error = null; this.state.dirty = useLocal; this.compute(); this.persist();
    } catch (error) { this.handle(error); }
    finally { this.state.busy = false; this.notify(); }
    if (useLocal) await this.flush();
  }
  setOffline(offline: boolean): void {
    this.state.offline = offline; this.notify();
    if (!offline && this.state.phase === 'ready') { if (!this.session && this.saved) void this.reconnect(); else void this.flush(); }
  }
  markConflict(): void { if (this.state.phase !== 'done') { this.state.conflict = true; this.notify(); } }
  private async reconnect(): Promise<void> {
    if (!this.saved || this.state.busy) return;
    this.state.busy = true;
    try {
      const answers = this.state.answers;
      const dirty = this.state.dirty;
      const remote = await this.api!.resume(this.saved.formId, this.saved.resumeToken);
      await this.adopt(remote);
      if (dirty) { this.state.answers = answers; this.state.dirty = true; this.state.conflict = remote.revision !== this.saved.revision; this.compute(); }
      this.persist();
    } catch (error) { this.handle(error); }
    finally { this.state.busy = false; this.notify(); }
    await this.flush();
  }
  async retry(): Promise<void> {
    if (this.pending?.method === 'POST') await this.submit();
    else if (this.pending?.method === 'DELETE') await this.restart();
    else if (this.state.error === 'captchaFailed') await this.submit();
    else if (!this.session) { if (this.saved) await this.reconnect(); else if (this.state.form) await this.start(); else await this.initialize(); }
    else await this.flush();
  }
  private handle(error: unknown): void {
    const api = error instanceof ApiError ? error : new ApiError('cff_request_failed', 0);
    if ([401, 422].includes(api.status) || (api.status === 409 && !api.code.includes('pending'))) this.pendingStart = null;
    if ((api.status === 401 || api.code === 'cff_session_expired') && this.state.form && !this.options.preview) this.storage.clear(this.state.form.form.id);
    const validationMessage = api.issues.find(issue => typeof issue.message === 'string' && issue.message !== '')?.message;
    this.state.validation = api.status === 422;
    this.state.error = api.status === 429
      ? 'error'
      : api.code === 'cff_version_conflict'
        ? 'versionConflict'
        : api.status === 401 || api.code === 'cff_session_expired'
          ? 'expired'
          : api.status === 409
            ? 'conflict'
            : api.status === 422
              ? (validationMessage ?? 'invalid')
              : 'error';
    if (api.status === 409 && api.code !== 'cff_version_conflict' && !api.code.includes('pending') && !api.code.includes('idempotency')) this.state.conflict = true;
    if (api.status === 422) {
      this.pending = null; this.submittedOnce = false; this.state.fieldError = 'invalid';
      const field = this.state.form?.form.schema.steps.find(step => api.issues.some(issue => issue?.fieldKey === step.key));
      if (field && this.state.path?.visited.includes(field.id)) { this.editing = field.id; this.compute(); }
    }
    if (!this.session) this.state.phase = 'error';
    if (this.pending?.method === 'POST' && (api.status === 0 || api.status >= 500 || api.code.includes('pending'))) this.state.error = 'submissionPending';
    if (this.state.error !== 'expired') this.persist(); this.notify();
  }
}
