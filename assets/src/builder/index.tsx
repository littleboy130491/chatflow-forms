/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, createRoot, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { createReduxStore, createRegistry, RegistryProvider, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { diagnoseSchema } from '../shared/logic/index';
import { Area, Button, Check, Field, Notice, Select } from './controls';
import { AdminApi, can, errorMessage } from './api';
import type { AdminConfig, FormDTO, FormSchema, Step } from './api';
import {
  blankForm,
  DraftController,
  duplicateStep,
  makeStep,
  publishDiff,
  reorder,
  uid,
} from './model';
import { Inspector, SortableItem } from './Inspector';
import { EndingsEditor, SettingsEditor } from './FormSettings';
import { Preview } from './Preview';
import { importForm } from './formIO';
import { googleFont, googleFonts } from '../shared/fonts';
import { LogicOverview } from './LogicOverview';
import { AiGenerate, AiRephrase } from './AiAssist';
import { Share, PublicLinkActions, publicFormUrl } from './Share';
import { Contrast } from './Contrast';
import { ThemeEditor } from './ThemeEditor';
import { ContactLinkEditor } from './Contact';
export { mountFormsList } from './forms-list';
import './style.css';

export const fieldLabels: Record<string, string> = {
  short_text: __('Short text', 'chatflow-forms'),
  long_text: __('Long text', 'chatflow-forms'),
  email: __('Email', 'chatflow-forms'),
  phone: __('Phone', 'chatflow-forms'),
  number: __('Number', 'chatflow-forms'),
  rating: __('Rating (1–5)', 'chatflow-forms'),
  scale: __('Scale (1–10)', 'chatflow-forms'),
  nps: __('NPS (0–10)', 'chatflow-forms'),
  slider: __('Slider', 'chatflow-forms'),
  calculated: __('Calculated number', 'chatflow-forms'),
  file_upload: __('File upload', 'chatflow-forms'),
  address: __('Address', 'chatflow-forms'),
  media: __('Media', 'chatflow-forms'),
  date: __('Date', 'chatflow-forms'),
  single_choice: __('Single choice', 'chatflow-forms'),
  multi_choice: __('Multiple choice', 'chatflow-forms'),
  yes_no: __('Yes / No', 'chatflow-forms'),
  consent: __('Consent', 'chatflow-forms'),
  hidden: __('Hidden field', 'chatflow-forms'),
  statement: __('Statement', 'chatflow-forms'),
  summary: __('Summary', 'chatflow-forms'),
};
export const typingSpeedLabels: Record<'off' | 'fast' | 'normal' | 'slow', string> = {
  off: __('Off (instant)', 'chatflow-forms'),
  fast: __('Fast', 'chatflow-forms'),
  normal: __('Normal', 'chatflow-forms'),
  slow: __('Slow', 'chatflow-forms'),
};
export const themeLabels: Record<'light' | 'dark' | 'auto', string> = {
  light: __('Light', 'chatflow-forms'),
  dark: __('Dark', 'chatflow-forms'),
  auto: __('Auto (follow visitor device)', 'chatflow-forms'),
};
const builtInPaletteGroups = (): Array<{ label: string; types: string[] }> => [
  { label: __('Basic', 'chatflow-forms'), types: ['statement', 'short_text', 'long_text', 'email', 'phone', 'number', 'date'] },
  { label: __('Choices', 'chatflow-forms'), types: ['single_choice', 'multi_choice', 'yes_no', 'consent'] },
  { label: __('Ratings', 'chatflow-forms'), types: ['rating', 'scale', 'nps', 'slider'] },
  { label: __('Advanced', 'chatflow-forms'), types: ['address', 'media', 'file_upload', 'calculated', 'hidden', 'summary'] },
];

/** Palette groups; types registered through the `cff_field_types` filter land in "Other". */
export function paletteGroups(available: readonly string[]): Array<{ label: string; types: string[] }> {
  const groups = builtInPaletteGroups();
  const grouped = new Set(groups.flatMap(group => group.types));
  return [...groups, { label: __('Other', 'chatflow-forms'), types: available.filter(type => !grouped.has(type)) }];
}
/** Keeps a reload on the builder from creating another blank draft once the form exists. */
export function builderUrlFor(href: string, id: number): string | null {
  const url = new URL(href);
  if (!id || (url.searchParams.get('formId') === String(id) && !url.searchParams.has('blank'))) return null;
  url.searchParams.delete('blank');
  url.searchParams.set('formId', String(id));
  return url.href;
}
export interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  locale: string;
}
/** Start panel: blank form, JSON import and the starter template gallery. */
export function FormStart({ api, onOpen }: { api: AdminApi; onOpen: (form: FormDTO) => void }) {
  const [error, setError] = useState(''),
    [importing, setImporting] = useState(false),
    [templates, setTemplates] = useState<TemplateSummary[]>([]),
    [templatesLoading, setTemplatesLoading] = useState(true),
    [creatingTemplate, setCreatingTemplate] = useState('');
  useEffect(() => {
    let active = true;
    api.request<{ items: TemplateSummary[] }>('admin/templates')
      .then((result) => { if (active) setTemplates(result.items); })
      .catch((err) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setTemplatesLoading(false); });
    return () => { active = false; };
  }, [api]);
  return (
    <section className="cff-admin cff-form-start">
      <h2>{__('Create a form', 'chatflow-forms')}</h2>
      {api.config.features.ai && <AiGenerate api={api} onOpen={onOpen} />}
      <Button variant="primary" onClick={() => onOpen(blankForm(api.config.defaults))}>
        {__('New blank form', 'chatflow-forms')}
      </Button>
      <label className="cff-import-form">
        {__('Import form JSON (creates a draft)', 'chatflow-forms')}
        <input
          type="file"
          accept=".json,application/json"
          disabled={importing}
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            setImporting(true);
            setError('');
            let imported: FormDTO | null = null;
            try {
              if (file.size > 1048576)
                throw new Error(__('Form file exceeds 1 MiB.', 'chatflow-forms'));
              imported = await importForm(await file.text(), api);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              input.value = '';
              setImporting(false);
            }
            if (imported) onOpen(imported);
          }}
        />
      </label>
      <section className="cff-templates" aria-label={__('Start from a template', 'chatflow-forms')}>
        <h2>{__('Start from a template', 'chatflow-forms')}</h2>
        <p>{__('Choose a starting point. You can edit every question before publishing.', 'chatflow-forms')}</p>
        {templatesLoading && <p role="status">{__('Loading…', 'chatflow-forms')}</p>}
        <div className="cff-template-grid">
          {templates.map((template) => (
            <article className="cff-template-card" key={template.id}>
              <h3>{template.title}</h3>
              <p>{template.description}</p>
              <span className="cff-template-locale">{template.locale.replace('_', '-')}</span>
              <Button
                variant="secondary"
                disabled={importing || Boolean(creatingTemplate)}
                onClick={async () => {
                  setCreatingTemplate(template.id);
                  setError('');
                  try {
                    onOpen(await api.request<FormDTO>(`admin/templates/${template.id}`, 'POST', {}));
                  } catch (err) {
                    setError(errorMessage(err));
                  } finally {
                    setCreatingTemplate('');
                  }
                }}
              >
                {creatingTemplate === template.id ? __('Creating draft…', 'chatflow-forms') : __('Use template', 'chatflow-forms')}
              </Button>
            </article>
          ))}
        </div>
      </section>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
    </section>
  );
}
function draftStore(controller: DraftController) {
  return createReduxStore('cff/builder', {
    reducer: (
      state = controller.snapshot(),
      action: { type: string; state?: ReturnType<DraftController['snapshot']> },
    ) => (action.type === 'SYNC' && action.state ? action.state : state),
    actions: { sync: (state: ReturnType<DraftController['snapshot']>) => ({ type: 'SYNC', state }) },
    selectors: { getState: (state: ReturnType<DraftController['snapshot']>) => state },
  });
}
function Builder({ api, initial, onBack }: { api: AdminApi; initial: FormDTO; onBack: () => void }) {
  const controller = useMemo(() => new DraftController(api, initial), [api, initial]);
  const store = useMemo(() => draftStore(controller), [controller]);
  const registry = useMemo(() => {
    const next = createRegistry();
    next.register(store);
    return next;
  }, [store]);
  useEffect(
    () => controller.subscribe(() => registry.dispatch(store).sync(controller.snapshot())),
    [controller, registry, store],
  );
  return (
    <RegistryProvider value={registry}>
      <BuilderView api={api} controller={controller} store={store} onBack={onBack} />
    </RegistryProvider>
  );
}
function BuilderView({
  api,
  controller,
  store,
  onBack,
}: {
  api: AdminApi;
  controller: DraftController;
  store: ReturnType<typeof draftStore>;
  onBack: () => void;
}) {
  const state = useSelect(
    (select) => select(store).getState() as ReturnType<DraftController['snapshot']>,
    [store],
  );
  const form = state.form,
    schema = form.schema;
  const [tab, setTab] = useState('build'),
    [selected, setSelected] = useState(schema.steps[0]?.id ?? ''),
    [marked, setMarked] = useState<string[]>([]),
    [preview, setPreview] = useState(api.config.preview === true),
    [search, setSearch] = useState(''),
    [inspectorOpen, setInspectorOpen] = useState(false),
    [paletteOpen, setPaletteOpen] = useState(false),
    [showHidden, setShowHidden] = useState(false),
    [publishConfirm, setPublishConfirm] = useState(false);
  const inspectorPanel = useRef<HTMLElement>(null);
  const [narrow, setNarrow] = useState(() => window.matchMedia?.('(max-width: 1100px)').matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 1100px)');
    if (!media) return;
    const changed = () => setNarrow(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  const step = schema.steps.find((item) => item.id === selected);
  const hasStep = Boolean(step);
  useEffect(() => {
    if (step) return;
    setSelected(schema.steps[0]?.id ?? '');
    setInspectorOpen(false);
  }, [step, schema.steps]);
  const focusField = () => {
    const buttons = inspectorPanel.current?.closest('main')?.querySelectorAll<HTMLButtonElement>('[data-step-id]');
    [...(buttons ?? [])].find(button => button.dataset.stepId === selected)?.focus();
  };
  const closeInspector = () => { setInspectorOpen(false); focusField(); };
  useEffect(() => {
    if (!narrow || !inspectorOpen || tab !== 'build' || !hasStep || !inspectorPanel.current) return;
    inspectorPanel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const background = inspectorPanel.current?.closest('main')?.querySelectorAll<HTMLElement>('.cff-toolbar, main > .cff-tabs, .cff-palette, .cff-flow, .cff-build-actions');
    const blocked = [...(background ?? [])].filter(element => !element.hasAttribute('inert'));
    blocked.forEach(element => element.setAttribute('inert', ''));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      blocked.forEach(element => element.removeAttribute('inert'));
      document.body.style.overflow = overflow;
      focusField();
    };
  }, [narrow, inspectorOpen, selected, tab, hasStep]);
  const [publishedForm, setPublishedForm] = useState<FormDTO | null>(null);
  const [liveForm, setLiveForm] = useState<FormDTO | null>(null);
  const baseline = liveForm?.schema ?? null;
  const [baselineError, setBaselineError] = useState('');
  useEffect(() => {
    if (!form.version || !form.id) return;
    let active = true;
    void api.request<FormDTO>(`admin/forms/${form.id}/published`).then(live => {
      if (active) { setLiveForm(live); setBaselineError(''); }
    }).catch(err => { if (active) { setLiveForm(null); setBaselineError(errorMessage(err)); } });
    return () => { active = false; };
  }, [api, form.id, form.version]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const issues = useMemo(() => diagnoseSchema(schema), [schema]);
  const edit = (transform: (form: FormDTO) => FormDTO) => controller.edit(transform);
  const setSchema = (next: FormSchema) => edit((value) => ({ ...value, schema: next }));
  const add = (type: string) => {
    const next = makeStep(type as Step['type'], schema.steps, controller.reservedKeys());
    setSchema({ ...schema, steps: [...schema.steps, next] });
    setSelected(next.id);
    setInspectorOpen(true);
    setPaletteOpen(false);
  };
  const deleteStep = (id: string) => {
    if (schema.steps.length <= 1) return;
    if (!window.confirm(__('Delete this field? Review broken references before publishing.', 'chatflow-forms')))
      return;
    const steps = schema.steps.filter((item) => item.id !== id);
    setSchema({
      ...schema,
      steps: steps as FormSchema['steps'],
      groups: (schema.groups ?? []).map((group) => ({
        ...group,
        stepIds: group.stepIds.filter((stepId) => stepId !== id),
      })),
    });
    setMarked(marked.filter((stepId) => stepId !== id));
    if (selected === id) setSelected(steps[0]?.id ?? '');
  };
  const duplicateField = (item: Step) => {
    if (schema.steps.length >= 500) return;
    const copy = duplicateStep(item, schema.steps, controller.reservedKeys());
    setSchema({ ...schema, steps: [...schema.steps, copy] });
    setSelected(copy.id);
    setInspectorOpen(true);
  };
  const dirty = controller.dirty();
  const [lockError, setLockError] = useState('');
  useEffect(() => {
    if (!form.id) return;
    let active = true;
    const acquire = () => { void api.request(`admin/forms/${form.id}/lock`, 'POST', {}).then(() => { if (active) setLockError(''); }).catch(err => { if (active) setLockError(errorMessage(err)); }); };
    acquire(); const timer = setInterval(acquire, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [api, form.id]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!lockError && !controller.state.conflict && controller.dirty() && !controller.state.saving)
        void controller.save().catch(() => undefined);
    }, 10000);
    return () => clearInterval(timer);
  }, [controller, lockError]);
  useEffect(() => {
    const next = builderUrlFor(window.location.href, form.id);
    if (next) window.history.replaceState(window.history.state, '', next);
  }, [form.id]);
  // Set after the admin already confirmed leaving, so the browser does not ask again.
  const leaving = useRef(false);
  const publishButton = useRef<HTMLDivElement>(null),
    publishDialog = useRef<HTMLElement>(null);
  const closePublish = () => {
    setPublishConfirm(false);
    publishButton.current?.querySelector('button')?.focus();
  };
  useEffect(() => {
    if (publishConfirm) publishDialog.current?.focus();
  }, [publishConfirm]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!leaving.current && controller.dirty()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [controller]);
  const diff = publishDiff(baseline, schema);
  return (
    <main className="cff-admin">
      <header className="cff-toolbar">
        <div className="cff-toolbar-main">
          <Button
            onClick={() => {
              if (!dirty || window.confirm(__('Leave with unsaved changes?', 'chatflow-forms'))) {
                leaving.current = true;
                onBack();
              }
            }}
          >
            {__('All forms', 'chatflow-forms')}
          </Button>
          <Field
            label={__('Form name', 'chatflow-forms')}
            value={form.title}
            onChange={(title) => edit((value) => ({ ...value, title }))}
          />
          <span
            role="status"
            className={`cff-save-state${dirty ? ' is-dirty' : ''}${form.version > 0 ? ' is-live' : ''}`}
          >
            {state.saving
              ? __('Saving…', 'chatflow-forms')
              : dirty
                ? __('Unsaved draft', 'chatflow-forms')
                : __('Draft saved', 'chatflow-forms')}{' '}
            ·{' '}
            {form.version > 0
              ? /* translators: %d: published version number */
                sprintf(__('Live version %d', 'chatflow-forms'), form.version)
              : __('Not published yet', 'chatflow-forms')}
          </span>
        </div>
        <div className="cff-toolbar-actions">
          <Button disabled={!state.history.length || state.saving} onClick={() => controller.undo()}>
            {__('Undo', 'chatflow-forms')}
          </Button>
          <Button disabled={!state.future.length || state.saving} onClick={() => controller.redo()}>
            {__('Redo', 'chatflow-forms')}
          </Button>
          <Button
            disabled={state.saving || Boolean(state.conflict) || Boolean(lockError)}
            onClick={() => {
              void controller.save().catch(() => undefined);
            }}
          >
            {__('Save draft', 'chatflow-forms')}
          </Button>
          <Button onClick={() => setPreview(!preview)}>{__('Preview', 'chatflow-forms')}</Button>
          <span ref={publishButton}>
            <Button
              variant="primary"
              aria-haspopup="dialog"
              disabled={state.saving || Boolean(state.conflict) || Boolean(lockError) || (form.version > 0 && !baseline)}
              onClick={() => setPublishConfirm(true)}
            >
              {__('Publish', 'chatflow-forms')}
            </Button>
          </span>
        </div>
      </header>
      {state.error && (
        <Notice status={state.locked ? 'warning' : 'error'} isDismissible={false}>
          <p>{state.error}</p>
          {state.locked && (
            <Button
              variant="secondary"
              disabled={state.saving}
              onClick={() => {
                void controller.save().catch(() => undefined);
              }}
            >
              {__('Retry save', 'chatflow-forms')}
            </Button>
          )}
        </Notice>
      )}
      {lockError && <Notice status="warning" isDismissible={false}>{lockError}</Notice>}
      {baselineError && <Notice status="error" isDismissible={false}>{baselineError}</Notice>}
      {state.conflict && (
        <Notice status="warning" isDismissible={false}>
          <p>
            {__(
              'Another admin changed this draft. Autosave is paused; your local edits are preserved.',
              'chatflow-forms',
            )}
          </p>
          <Button
            onClick={() => {
              if (window.confirm(__('Discard local edits and reload?', 'chatflow-forms')))
                void controller.reload().catch(() => undefined);
            }}
          >
            {__('Reload server draft', 'chatflow-forms')}
          </Button>
          <Button
            onClick={() => {
              if (
                window.confirm(
                  __(
                    'Keep local edits on the latest revision? The next save can replace another admin’s changes.',
                    'chatflow-forms',
                  ),
                )
              )
                void controller.rebaseLocal().catch(() => undefined);
            }}
          >
            {__('Keep local edits (explicit override)', 'chatflow-forms')}
          </Button>
        </Notice>
      )}
      {publishConfirm && (
        <section
          className="cff-card"
          role="dialog"
          aria-label={__('Publish form?', 'chatflow-forms')}
          ref={publishDialog}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closePublish();
          }}
        >
          <h2>{__('Publish form?', 'chatflow-forms')}</h2>
          <p>{sprintf(__('“%s” will be available to visitors. Later edits stay in your draft until you publish again.', 'chatflow-forms'), form.title)}</p>
          <details><summary>{__('Review changes and version details', 'chatflow-forms')}</summary>
            <p>{sprintf(__('Questions: %d added, %d changed, %d removed.', 'chatflow-forms'), diff.added, diff.changed, diff.removed)}</p>
            <p>{__('Publishing saves this draft and creates a fixed live version of the form and its private settings. Existing responses are kept.', 'chatflow-forms')}</p>
            {form.version > 0 && <p>{__('Changes are compared with the current live version.', 'chatflow-forms')}</p>}
          </details>
          <Button onClick={closePublish}>{__('Cancel', 'chatflow-forms')}</Button>
          <Button
            variant="primary"
            disabled={state.saving || Boolean(lockError) || (form.version > 0 && !baseline)}
            onClick={async () => {
              try {
                const published = await controller.publish();
                setLiveForm(published);
                setPublishedForm(published);
                closePublish();
              } catch {
                /* The controller displays server validation and conflict errors. */
              }
            }}
          >
            {__('Publish new version', 'chatflow-forms')}
          </Button>
        </section>
      )}
      {publishedForm && <section className="cff-card cff-publish-success" aria-label={__('Publication result', 'chatflow-forms')}>
        <h2 role="status">{__('Form published', 'chatflow-forms')}</h2>
        <p>{__('Your form is live. Share it with your visitors.', 'chatflow-forms')}</p>
        {publicFormUrl(publishedForm, api.config) && <PublicLinkActions url={publicFormUrl(publishedForm, api.config)!} />}
        <Button variant="secondary" onClick={() => { setTab('share'); setPublishedForm(null); }}>{__('Share and embed', 'chatflow-forms')}</Button>
        <Button onClick={() => setPublishedForm(null)}>{__('Dismiss', 'chatflow-forms')}</Button>
      </section>}
      <nav className="cff-tabs" aria-label={__('Builder sections', 'chatflow-forms')}>
        {[
          { value: 'build', label: __('Build', 'chatflow-forms') },
          { value: 'logic', label: __('Logic', 'chatflow-forms') },
          { value: 'design', label: __('Design', 'chatflow-forms') },
          { value: 'settings', label: __('Settings', 'chatflow-forms') },
          { value: 'share', label: __('Share', 'chatflow-forms') },
        ].map((item) => (
          <Button
            key={item.value}
            variant={tab === item.value ? 'primary' : 'secondary'}
            aria-pressed={tab === item.value}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
      {tab === 'build' && (
        <DndContext
          sensors={sensors}
          onDragEnd={({ active, over }) => {
            if (over)
              setSchema({
                ...schema,
                steps: reorder(schema.steps, String(active.id), String(over.id)) as FormSchema['steps'],
              });
          }}
        >
          <div className="cff-build-actions"><Button variant="secondary" aria-expanded={paletteOpen} onClick={() => { setPaletteOpen(!paletteOpen); setInspectorOpen(false); }}>{__('Add field', 'chatflow-forms')}</Button></div>
          <div className="cff-builder-grid">
            <aside className={`cff-palette ${paletteOpen ? 'is-open' : ''}`}>
              <h2>{__('Field palette', 'chatflow-forms')}</h2>
              <Field label={__('Search fields', 'chatflow-forms')} value={search} onChange={setSearch} />
              {paletteGroups(api.config.features.fieldTypes).map(group => {
                const types = api.config.features.fieldTypes.filter(type => group.types.includes(type) && (fieldLabels[type] ?? type).toLowerCase().includes(search.toLowerCase()));
                return types.length > 0 && <section className="cff-palette-group" key={group.label}>
                  <h3>{group.label}</h3>
                  {types.map(type => <Button key={type} variant="secondary" disabled={schema.steps.length >= 500} onClick={() => add(type)}>{fieldLabels[type] ?? type}</Button>)}
                </section>;
              })}
              {!api.config.features.fieldTypes.some(type => (fieldLabels[type] ?? type).toLowerCase().includes(search.toLowerCase())) && <p role="status">{__('No matching fields. Try another search.', 'chatflow-forms')}</p>}
            </aside>
            <section className="cff-flow">
              <h2>
                {__('Conversation flow', 'chatflow-forms')}
                <span className="cff-flow-count">
                  {sprintf(
                    /* translators: %d: number of questions */
                    __('%d fields', 'chatflow-forms'),
                    schema.steps.length,
                  )}
                </span>
                {schema.steps.some(item => item.type === 'hidden') && (
                  <Button variant="link" className="cff-hidden-toggle" aria-expanded={showHidden} onClick={() => setShowHidden(!showHidden)}>
                    {showHidden
                      ? __('Hide hidden fields', 'chatflow-forms')
                      : sprintf(
                          /* translators: %d: number of hidden fields */
                          __('Show hidden fields (%d)', 'chatflow-forms'),
                          schema.steps.filter(item => item.type === 'hidden').length,
                        )}
                  </Button>
                )}
              </h2>
              {marked.length > 0 && (
                <div className="cff-flow-toolbar">
                  <Button
                    disabled={marked.length >= schema.steps.length}
                    isDestructive
                    onClick={() => {
                      if (
                        window.confirm(
                          __(
                            'Delete selected fields? Review broken references before publishing.',
                            'chatflow-forms',
                          ),
                        )
                      ) {
                        setSchema({
                          ...schema,
                          steps: schema.steps.filter((item) => !marked.includes(item.id)) as FormSchema['steps'],
                          groups: (schema.groups ?? []).map((group) => ({
                            ...group,
                            stepIds: group.stepIds.filter((id) => !marked.includes(id)),
                          })),
                        });
                        setMarked([]);
                      }
                    }}
                  >
                    {__('Delete selected', 'chatflow-forms')}
                  </Button>
                  <Button
                    onClick={() =>
                      setSchema({
                        ...schema,
                        groups: [
                          ...(schema.groups ?? []),
                          { id: uid('grp'), title: __('New group', 'chatflow-forms'), stepIds: marked },
                        ],
                      })
                    }
                  >
                    {__('Group selected', 'chatflow-forms')}
                  </Button>
                </div>
              )}
              {(schema.groups ?? []).map((group) => (
                <fieldset key={group.id}>
                  <Field
                    label={__('Group title', 'chatflow-forms')}
                    value={group.title}
                    onChange={(title) =>
                      setSchema({
                        ...schema,
                        groups: (schema.groups ?? []).map((item) =>
                          item.id === group.id ? { ...item, title } : item,
                        ),
                      })
                    }
                  />
                  <p>
                    {group.stepIds
                      .map((id) => schema.steps.find((item) => item.id === id)?.label)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <Button
                    isDestructive
                    onClick={() =>
                      setSchema({
                        ...schema,
                        groups: (schema.groups ?? []).filter((item) => item.id !== group.id),
                      })
                    }
                  >
                    {__('Ungroup', 'chatflow-forms')}
                  </Button>
                </fieldset>
              ))}
              <SortableContext
                items={schema.steps.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {schema.steps.map((item, index) => ({ item, index })).filter(({ item }) => showHidden || item.type !== 'hidden' || selected === item.id).map(({ item, index }) => (
                  <SortableItem key={item.id} id={item.id}>
                    <article className={`cff-card ${selected === item.id ? 'is-selected' : ''}`}>
                      <button
                        type="button"
                        className="cff-card-open"
                        data-step-id={item.id}
                        aria-label={sprintf(
                          /* translators: %s: field label */
                          __('Edit field: %s', 'chatflow-forms'),
                          item.label,
                        )}
                        onClick={() => { setSelected(item.id); setInspectorOpen(true); }}
                      />
                      <label className="cff-field-select">
                        <input type="checkbox" checked={marked.includes(item.id)} onChange={event => setMarked(event.currentTarget.checked ? [...marked, item.id] : marked.filter(id => id !== item.id))} />
                        <span className="cff-visually-hidden">{__('Select field', 'chatflow-forms')}</span>
                      </label>
                      <div className="cff-step-head">
                        <span className="cff-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                        <span className="cff-step-title">{item.label}</span>
                        <span className="cff-step-type" aria-hidden="true">{fieldLabels[item.type] ?? item.type}</span>
                      </div>
                      <p className="cff-field-summary">{item.messages[0] || __('No message yet. Select this field to edit.', 'chatflow-forms')}</p>
                      <small>
                        {item.required && <span className="cff-badge cff-badge--required">{__('Required', 'chatflow-forms')}</span>}
                        {item.hiddenByDefault && <span className="cff-badge cff-badge--hidden">{__('Hidden', 'chatflow-forms')}</span>}
                        {Boolean(item.logic?.length) && <span className="cff-badge cff-badge--logic">{item.logic?.length === 1
                          ? __('1 rule', 'chatflow-forms')
                          : sprintf(
                              /* translators: %d: number of logic rules */
                              __('%d rules', 'chatflow-forms'),
                              item.logic?.length ?? 0,
                            )}</span>}
                      </small>
                    </article>
                  </SortableItem>
                ))}
              </SortableContext>
              <details className="cff-card">
                <summary>{__('Human contact during the conversation', 'chatflow-forms')}</summary>
                <ContactLinkEditor schema={schema} timezone={api.config.timezone} onChange={setSchema} />
              </details>
              <details className="cff-card">
                <summary>{__('Conversation endings', 'chatflow-forms')}</summary>
                <EndingsEditor form={form} onChange={(next) => edit(() => next)} />
              </details>
            </section>
            {step && (
              <section ref={inspectorPanel} role={narrow && inspectorOpen ? 'dialog' : undefined} aria-modal={narrow && inspectorOpen ? true : undefined} className={`cff-inspector-panel ${inspectorOpen ? 'is-open' : ''}`} aria-label={__('Field editor', 'chatflow-forms')} onKeyDown={event => {
                if (event.key === 'Escape') closeInspector();
                if (!narrow || event.key !== 'Tab') return;
                const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, a[href]')].filter(element => !element.closest('details:not([open])') || element.tagName === 'SUMMARY');
                const first = focusable[0], last = focusable.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
              }}>
              <div className="cff-inspector-back"><Button onClick={closeInspector}>{__('Back to flow', 'chatflow-forms')}</Button><Button onClick={() => { setInspectorOpen(false); setPaletteOpen(true); }}>{__('Add another field', 'chatflow-forms')}</Button></div>
              <Inspector
                key={step.id}
                step={step}
                reservedValues={controller.reservedOptionValues(step.id)}
                schema={schema}
                actions={(
                  <Fragment>
                    <Button
                      className="cff-inspector-action"
                      disabled={schema.steps.length >= 500}
                      onClick={() => duplicateField(step)}
                    >
                      {__('Duplicate field', 'chatflow-forms')}
                    </Button>
                    <Button
                      className="cff-inspector-action"
                      isDestructive
                      disabled={schema.steps.length <= 1}
                      onClick={() => deleteStep(step.id)}
                    >
                      {__('Delete field', 'chatflow-forms')}
                    </Button>
                  </Fragment>
                )}
                onChange={(next) =>
                  setSchema({
                    ...schema,
                    steps: schema.steps.map((item) =>
                      item.id === next.id ? next : item,
                    ) as FormSchema['steps'],
                  })
                }
              />
              </section>
            )}
          </div>
        </DndContext>
      )}
      {tab === 'logic' && (
        <LogicOverview
          schema={schema}
          issues={issues}
          onChange={setSchema}
          onEditStep={(id) => {
            setSelected(id);
            setInspectorOpen(true);
            setTab('build');
          }}
        />
      )}
      {tab === 'design' && api.config.features.ai && <AiRephrase api={api} schema={schema} onChange={setSchema} />}
      {tab === 'design' && (
        <Fragment>
          <ThemeEditor form={form} config={api.config} onChange={appearance => edit(value => ({ ...value, settings: { ...value.settings, appearance } }))} />
          <section className="cff-card">
            <h2>{__('Bot', 'chatflow-forms')}</h2>
          <Field
            label={__('Bot name', 'chatflow-forms')}
            value={schema.bot.name}
            onChange={(name) => setSchema({ ...schema, bot: { ...schema.bot, name } })}
          />
          <Field
            label={__('Avatar attachment ID', 'chatflow-forms')}
            type="number"
            value={schema.bot.avatar ?? ''}
            onChange={(value) =>
              setSchema({ ...schema, bot: { ...schema.bot, avatar: Number(value) || null } })
            }
          />
          <Select
            label={__('Typing speed', 'chatflow-forms')}
            value={schema.bot.typingSpeed ?? 'normal'}
            choices={(['off', 'fast', 'normal', 'slow'] as const).map((value) => ({
              value,
              label: typingSpeedLabels[value],
            }))}
            onChange={(typingSpeed) =>
              setSchema({
                ...schema,
                bot: { ...schema.bot, typingSpeed: typingSpeed as 'off' | 'fast' | 'normal' | 'slow' },
              })
            }
          />
            <ContactLinkEditor schema={schema} timezone={api.config.timezone} onChange={setSchema} />
          </section>
          <section className="cff-card">
            <h2>{__('Typography', 'chatflow-forms')}</h2>
            <Field label={__('Font stack', 'chatflow-forms')} value={form.settings.appearance?.font ?? ''} onChange={font => edit(value => ({ ...value, settings: { ...value.settings, appearance: { ...value.settings.appearance, font } } }))} />
          <Select
            label={__('Font source', 'chatflow-forms')}
            value={form.settings.appearance?.googleFont ?? 'system'}
            choices={[{ value: 'system', label: __('System / local — no ChatFlow font requests', 'chatflow-forms') }, ...googleFonts.map(font => ({ value: font, label: font }))]}
            onChange={font => edit(value => ({ ...value, settings: { ...value.settings, appearance: { ...value.settings.appearance, googleFont: googleFont(font) ?? 'system', inheritFont: false } } }))}
          />
          <p>{__('Google fonts are opt-in. Visitors and preview administrators contact Google (fonts.googleapis.com and fonts.gstatic.com), exposing their IP address and browser/network information. Review your privacy policy and consent requirements. System/local fonts remain the default; blocked fonts use the local fallback.', 'chatflow-forms')}</p>
          <Check
            label={__('Inherit theme font', 'chatflow-forms')}
            value={form.settings.appearance?.inheritFont}
            onChange={(inheritFont) =>
              edit((value) => ({
                ...value,
                settings: { ...value.settings, appearance: { ...value.settings.appearance, inheritFont, ...(inheritFont ? { googleFont: 'system' as const } : {}) } },
              }))
            }
          />
          </section>
          <section className="cff-card">
            <h2>{__('Accessibility and extras', 'chatflow-forms')}</h2>
            <Contrast appearance={form.settings.appearance} />
            <Check label={__('Confetti on completion (off by default)', 'chatflow-forms')} value={(form.settings.appearance as {confetti?:boolean})?.confetti ?? false}
              onChange={(confetti)=>edit((value)=>({...value,settings:{...value.settings,appearance:{...value.settings.appearance,confetti}}}))} />
            <Area label={__('Scoped custom CSS (inside the Shadow DOM)', 'chatflow-forms')} value={form.settings.appearance?.customCss ?? ''} onChange={customCss => edit(value => ({ ...value, settings: { ...value.settings, appearance: { ...value.settings.appearance, customCss } } }))} />
            <p>{__('Check colour contrast in the real preview. Completion confetti respects reduced-motion preferences.', 'chatflow-forms')}</p>
          </section>
        </Fragment>
      )}
      {tab === 'settings' && (
        <Fragment>
          <SettingsEditor
            completion={<EndingsEditor form={form} onChange={(next) => edit(() => next)} />}
            form={form}
            api={api}
            save={() => controller.save()}
            onChange={(settings) => edit((value) => ({ ...value, settings }))}
          />
        </Fragment>
      )}
      {tab === 'share' && (
        <section className="cff-card cff-share-card">
          <h2>{__('Share', 'chatflow-forms')}</h2>
          {liveForm || !form.version ? <Share form={liveForm ?? form} config={api.config} /> : baselineError ? <Notice status="error" isDismissible={false}>{baselineError}</Notice> : <p role="status">{__('Loading…', 'chatflow-forms')}</p>}
        </section>
      )}
      {preview && <Preview form={form} config={api.config} onClose={() => setPreview(false)} />}
    </main>
  );
}
function AdminBuilder({ config }: { config: AdminConfig }) {
  const api = useMemo(() => new AdminApi(config), [config]);
  const [form, setForm] = useState<FormDTO | null>(() => !config.formId && new URLSearchParams(window.location.search).get('blank') === '1' ? blankForm(config.defaults) : null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(Boolean(config.formId));
  useEffect(() => {
    if (config.formId)
      api
        .request<FormDTO>(`admin/forms/${config.formId}`)
        .then(setForm)
        .catch((err) => setError(errorMessage(err)))
        .finally(() => setLoading(false));
  }, [api, config.formId]);
  if (!can(config, 'manage_forms'))
    return (
      <Notice status="error" isDismissible={false}>
        {__('You cannot manage forms.', 'chatflow-forms')}
      </Notice>
    );
  if (loading) return <p>{__('Loading…', 'chatflow-forms')}</p>;
  return (
    <Fragment>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      {form ? (
        <Builder api={api} initial={form} onBack={() => { const url = new URL(config.adminUrl ?? "admin.php", window.location.href); url.searchParams.set("page", "cff-forms"); window.location.assign(url.href); }} />
      ) : (
        <FormStart api={api} onOpen={setForm} />
      )}
    </Fragment>
  );
}
export function mountBuilder(root: HTMLElement, config: AdminConfig = window.cffAdmin): void {
  createRoot(root).render(<AdminBuilder config={config} />);
}
