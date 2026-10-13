/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, createRoot, useEffect, useMemo, useState } from '@wordpress/element';
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
import { googleFont, googleFonts } from '../shared/fonts';
import { Templates } from './Templates';
import { FlowMap } from './FlowMap';
import { PowerEditor } from './PowerEditor';
import { Share } from './Share';
import { Contrast } from './Contrast';
export { mountFormsList } from './forms-list';
import './style.css';

export const fieldLabels: Record<string, string> = {
  short_text: __('Short text', 'chatflow-forms'),
  long_text: __('Long text', 'chatflow-forms'),
  email: __('Email', 'chatflow-forms'),
  phone: __('Phone', 'chatflow-forms'),
  number: __('Number', 'chatflow-forms'),
  calculated: __('Calculated number', 'chatflow-forms'),
  rating: __('Rating', 'chatflow-forms'),
  scale: __('Scale', 'chatflow-forms'),
  nps: __('Net promoter score', 'chatflow-forms'),
  slider: __('Slider', 'chatflow-forms'),
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
function TemplatePicker({ api, onOpen }: { api: AdminApi; onOpen: (form: FormDTO) => void }) {
  return <section><h1>{__('New form — choose a template', 'chatflow-forms')}</h1><Templates api={api} onOpen={onOpen} /><Button variant="primary" onClick={() => onOpen(blankForm(api.config.defaults))}>{__('New blank form', 'chatflow-forms')}</Button></section>;
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
    [publishConfirm, setPublishConfirm] = useState(false);
  const [baseline, setBaseline] = useState<FormSchema | null>(null);
  const [baselineError, setBaselineError] = useState('');
  useEffect(() => {
    if (!form.version || !form.id) return;
    let active = true;
    void api.request<FormDTO>(`admin/forms/${form.id}/published`).then(live => {
      if (active) { setBaseline(live.schema); setBaselineError(''); }
    }).catch(err => { if (active) { setBaseline(null); setBaselineError(errorMessage(err)); } });
    return () => { active = false; };
  }, [api, form.id, form.version]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const issues = useMemo(() => diagnoseSchema(schema), [schema]);
  const edit = (transform: (form: FormDTO) => FormDTO) => controller.edit(transform);
  const setSchema = (next: FormSchema) => edit((value) => ({ ...value, schema: next }));
  const step = schema.steps.find((item) => item.id === selected);
  const add = (type: string) => {
    const next = makeStep(type as Step['type'], schema.steps, controller.reservedKeys());
    setSchema({ ...schema, steps: [...schema.steps, next] });
    setSelected(next.id);
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
    const warn = (event: BeforeUnloadEvent) => {
      if (controller.dirty()) {
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
        <Button
          onClick={() => {
            if (!dirty || window.confirm(__('Leave with unsaved changes?', 'chatflow-forms'))) onBack();
          }}
        >
          {__('All forms', 'chatflow-forms')}
        </Button>
        <Field
          label={__('Form name', 'chatflow-forms')}
          value={form.title}
          onChange={(title) => edit((value) => ({ ...value, title }))}
        />
        <span role="status">
          {state.saving
            ? __('Saving…', 'chatflow-forms')
            : dirty
              ? __('Unsaved draft', 'chatflow-forms')
              : __('Draft saved', 'chatflow-forms')}{' '}
          · {__('Live version', 'chatflow-forms')} {form.version}
        </span>
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
        <Button
          variant="primary"
          disabled={state.saving || Boolean(state.conflict) || Boolean(lockError) || (form.version > 0 && !baseline)}
          onClick={() => setPublishConfirm(true)}
        >
          {__('Publish', 'chatflow-forms')}
        </Button>
      </header>
      {state.error && (
        <Notice status="error" isDismissible={false}>
          {state.error}
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
        <section className="cff-card" role="dialog" aria-label={__('Confirm publish', 'chatflow-forms')}>
          <p>
            {sprintf(
              __(
                'Steps: %d added, %d changed, %d removed. A new version freezes schema and private settings.',
                'chatflow-forms',
              ),
              diff.added,
              diff.changed,
              diff.removed,
            )}
          </p>
          {form.version > 0 && (
            <p>
              {__(
                'Diff compares this draft to the current published snapshot.',
                'chatflow-forms',
              )}
            </p>
          )}
          <Button onClick={() => setPublishConfirm(false)}>{__('Cancel', 'chatflow-forms')}</Button>
          <Button
            variant="primary"
            disabled={state.saving || Boolean(lockError) || (form.version > 0 && !baseline)}
            onClick={async () => {
              try {
                const published = await controller.publish();
                setBaseline(published.schema);
                setPublishConfirm(false);
              } catch {
                /* The controller displays server validation and conflict errors. */
              }
            }}
          >
            {__('Publish new version', 'chatflow-forms')}
          </Button>
        </section>
      )}
      <nav className="cff-tabs">
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
          <div className="cff-builder-grid">
            <aside className="cff-palette">
              <h2>{__('Field palette', 'chatflow-forms')}</h2>
              <Field label={__('Search fields', 'chatflow-forms')} value={search} onChange={setSearch} />
              {api.config.features.fieldTypes
                .filter(
                  (type) =>
                    (fieldLabels[type] ?? type).toLowerCase().includes(search.toLowerCase()),
                )
                .map((type) => (
                  <Button key={type} disabled={schema.steps.length >= 500} onClick={() => add(type)}>
                    {fieldLabels[type] ?? type}
                  </Button>
                ))}
            </aside>
            <section className="cff-flow">
              <h2>{__('Conversation flow', 'chatflow-forms')}</h2>
              <Button
                disabled={!marked.length || marked.length >= schema.steps.length}
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
                disabled={!marked.length}
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
                {schema.steps.map((item) => (
                  <SortableItem key={item.id} id={item.id}>
                    <article className={`cff-card ${selected === item.id ? 'is-selected' : ''}`}>
                      <Check
                        label={__('Select field', 'chatflow-forms')}
                        value={marked.includes(item.id)}
                        onChange={(checked) =>
                          setMarked(checked ? [...marked, item.id] : marked.filter((id) => id !== item.id))
                        }
                      />
                      <Button onClick={() => setSelected(item.id)}>
                        {item.label} · {fieldLabels[item.type] ?? item.type}
                      </Button>
                      <small>
                        {item.key} {item.required && __('Required', 'chatflow-forms')}{' '}
                        {item.hiddenByDefault && __('Hidden', 'chatflow-forms')}
                      </small>
                      <Field
                        label={__('First bot message', 'chatflow-forms')}
                        value={item.messages[0] ?? ''}
                        onChange={(message) =>
                          setSchema({
                            ...schema,
                            steps: schema.steps.map((field) =>
                              field.id === item.id
                                ? { ...field, messages: [message, ...field.messages.slice(1)] }
                                : field,
                            ) as FormSchema['steps'],
                          })
                        }
                      />
                      <Button
                        disabled={schema.steps.length >= 500}
                        onClick={() => {
                          const copy = duplicateStep(item, schema.steps, controller.reservedKeys());
                          setSchema({ ...schema, steps: [...schema.steps, copy] });
                          setSelected(copy.id);
                        }}
                      >
                        {__('Duplicate field', 'chatflow-forms')}
                      </Button>
                    </article>
                  </SortableItem>
                ))}
              </SortableContext>
            </section>
            {step && (
              <Inspector
                key={step.id}
                step={step}
                reservedValues={controller.reservedOptionValues(step.id)}
                schema={schema}
                onChange={(next) =>
                  setSchema({
                    ...schema,
                    steps: schema.steps.map((item) =>
                      item.id === next.id ? next : item,
                    ) as FormSchema['steps'],
                  })
                }
              />
            )}
          </div>
        </DndContext>
      )}
      {tab === 'logic' && (
        <section>
          <h2>{__('Logic diagnostics', 'chatflow-forms')}</h2>
          {issues.length ? (
            <ul>
              {issues.map((issue, index) => (
                <li key={index}>
                  {issue.path}: {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p>{__('No logic warnings detected.', 'chatflow-forms')}</p>
          )}
          <table className="widefat">
            <tbody>
              {schema.steps
                .filter((item) => item.logic?.length)
                .map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Button
                        onClick={() => {
                          setSelected(item.id);
                          setTab('build');
                        }}
                      >
                        {item.label}
                      </Button>
                    </td>
                    <td>
                      <pre>{JSON.stringify(item.logic, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <FlowMap schema={schema} onChange={setSchema} onSelect={id => { setSelected(id); setTab('build'); }} />
          <PowerEditor schema={schema} onChange={setSchema} />
        </section>
      )}
      {tab === 'design' && (
        <section className="cff-card">
          <h2>{__('Design basics', 'chatflow-forms')}</h2>
          <Contrast appearance={form.settings.appearance} />
          <Area label={__('Scoped custom CSS (inside the Shadow DOM)', 'chatflow-forms')} value={form.settings.appearance?.customCss ?? ''} onChange={customCss => edit(value => ({ ...value, settings: { ...value.settings, appearance: { ...value.settings.appearance, customCss } } }))} />
          <Select label={__('Theme preset', 'chatflow-forms')} value="" choices={[
            {value:'',label:__('Choose a preset', 'chatflow-forms')},
            {value:'neutral',label:__('Neutral light', 'chatflow-forms')},
            {value:'dark',label:__('Neutral dark', 'chatflow-forms')},
          ]} onChange={(preset)=>{if (!preset) return; edit((value)=>({...value,settings:{...value.settings,appearance:{...value.settings.appearance,
            theme:preset === 'dark' ? 'dark' : 'light', primary:preset === 'dark' ? '#d4d4d4' : '#262626',botBubbleBackground:preset === 'dark' ? '#262626' : '#f5f5f5',userBubbleBackground:preset === 'dark' ? '#404040' : '#e5e5e5',textColor:preset === 'dark' ? '#fafafa' : '#171717',radius:8,
          }}}));}} />
          <Check label={__('Confetti on completion (off by default)', 'chatflow-forms')} value={(form.settings.appearance as {confetti?:boolean})?.confetti ?? false}
            onChange={(confetti)=>edit((value)=>({...value,settings:{...value.settings,appearance:{...value.settings.appearance,confetti}}}))} />
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
            choices={['off', 'fast', 'normal', 'slow'].map((value) => ({ value, label: value }))}
            onChange={(typingSpeed) =>
              setSchema({
                ...schema,
                bot: { ...schema.bot, typingSpeed: typingSpeed as 'off' | 'fast' | 'normal' | 'slow' },
              })
            }
          />
          <Select
            label={__('Theme', 'chatflow-forms')}
            value={form.settings.appearance?.theme ?? 'light'}
            choices={['light', 'dark', 'auto'].map((value) => ({ value, label: value }))}
            onChange={(theme) =>
              edit((value) => ({
                ...value,
                settings: {
                  ...value.settings,
                  appearance: { ...value.settings.appearance, theme: theme as 'light' | 'dark' | 'auto' },
                },
              }))
            }
          />
          {(
            [
              { key: 'primary', label: __('Primary colour', 'chatflow-forms') },
              { key: 'botBubbleBackground', label: __('Bot bubble colour', 'chatflow-forms') },
              { key: 'userBubbleBackground', label: __('User bubble colour', 'chatflow-forms') },
              { key: 'textColor', label: __('Text colour', 'chatflow-forms') },
              { key: 'font', label: __('Font stack', 'chatflow-forms') },
              { key: 'radius', label: __('Corner radius (0–32)', 'chatflow-forms') },
              { key: 'width', label: __('Chat width (240–1600)', 'chatflow-forms') },
            ] as const
          ).map((item) => (
            <Field
              key={item.key}
              label={item.label}
              type={['radius', 'width'].includes(item.key) ? 'number' : 'text'}
              value={form.settings.appearance?.[item.key] ?? ''}
              onChange={(next) =>
                edit((value) => ({
                  ...value,
                  settings: {
                    ...value.settings,
                    appearance: {
                      ...value.settings.appearance,
                      [item.key]: ['radius', 'width'].includes(item.key) ? Number(next) : next,
                    },
                  },
                }))
              }
            />
          ))}
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
          <p>
            {__(
              'Check colour contrast in the real preview. Completion confetti respects reduced-motion preferences.',
              'chatflow-forms',
            )}
          </p>
        </section>
      )}
      {tab === 'settings' && (
        <Fragment>
          <EndingsEditor form={form} onChange={(next) => edit(() => next)} />
          <SettingsEditor
            form={form}
            api={api}
            save={() => controller.save()}
            onChange={(settings) => edit((value) => ({ ...value, settings }))}
          />
        </Fragment>
      )}
      {tab === 'share' && (
        <section className="cff-card">
          <h2>{__('Share', 'chatflow-forms')}</h2>
          {form.id ? (
            <Fragment>
              <code>{`[chatflow id="${form.id}" mode="inline"]`}</code>
              <p>{__('Use the ChatFlow Form block or an Elementor Shortcode widget.', 'chatflow-forms')}</p>
              <p>{`${api.config.siteUrl ?? ''}${api.config.fullpageBase ?? 'chat'}/${form.slug}/`}</p>
              <code>{`<cff-chat data-form-id="${form.id}" data-rest-url="${api.config.restUrl}"></cff-chat>`}</code>
              <p>
                {__(
                  'Published forms only. Custom elements require the plugin runtime asset; no tokens or private settings belong in HTML.',
                  'chatflow-forms',
                )}
              </p>
            </Fragment>
          ) : (
            <p>{__('Save this draft first to get its form ID.', 'chatflow-forms')}</p>
          )}
          {form.id > 0 && <Share form={form} config={api.config} />}
        </section>
      )}
      {preview && <Preview form={form} config={api.config} onClose={() => setPreview(false)} />}
    </main>
  );
}
function AdminBuilder({ config }: { config: AdminConfig }) {
  const api = useMemo(() => new AdminApi(config), [config]);
  const [form, setForm] = useState<FormDTO | null>(null),
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
        <TemplatePicker api={api} onOpen={setForm} />
      )}
    </Fragment>
  );
}
export function mountBuilder(root: HTMLElement, config: AdminConfig = window.cffAdmin): void {
  createRoot(root).render(<AdminBuilder config={config} />);
}
