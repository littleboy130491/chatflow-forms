/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Area, Button, Check, Field, JsonEditor, Notice, Select } from './controls';
import { ConditionEditor, firstCondition } from './RuleEditor';
import { uid } from './model';
import { errorMessage } from './api';
import type { AdminApi, FormDTO, FormSettings, FormSchema, Ending } from './api';
import type { Notification, Webhook } from '../shared/settings.generated';

interface WPEditor {
  initialize(id: string, options: unknown): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    wp?: { editor?: WPEditor };
  }
}
export function HtmlEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useRef(uid('cff_email')),
    change = useRef(onChange);
  const textarea = useRef<HTMLTextAreaElement>(null),
    instanceRef = useRef<{ getContent: () => string; setContent: (content: string) => void } | null>(null);
  change.current = onChange;
  useEffect(() => {
    const editor = window.wp?.editor;
    if (!editor) return;
    editor.initialize(id.current, {
      tinymce: {
        toolbar1: 'bold italic bullist numlist link unlink',
        setup: (instance: {
          on: (event: string, callback: () => void) => void;
          getContent: () => string;
          setContent: (content: string) => void;
        }) => {
          instanceRef.current = instance;
          instance.on('change keyup', () => change.current(instance.getContent()));
        },
      },
      quicktags: true,
    });
    return () => {
      instanceRef.current = null;
      editor.remove(id.current);
    };
  }, []);
  useEffect(() => {
    if (textarea.current && textarea.current.value !== value) textarea.current.value = value;
    if (instanceRef.current && instanceRef.current.getContent() !== value)
      instanceRef.current.setContent(value);
  }, [value]);
  return (
    <label>
      {__('Email body', 'chatflow-forms')}
      <textarea
        ref={textarea}
        id={id.current}
        defaultValue={value}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
      />
    </label>
  );
}
function EmailCard({
  notification,
  schema,
  onChange,
  onDelete,
  autoresponder,
  test,
  preview,
}: {
  notification: Notification;
  schema: FormSchema;
  onChange: (notification: Notification) => void;
  onDelete: () => void;
  autoresponder: boolean;
  test: (id: string, to: string) => Promise<void>;
  preview: (
    id: string,
    answers: Record<string, unknown>,
    submissionId?: number,
  ) => Promise<{ subject: string; html: string; plain: string }>;
}) {
  const [to, setTo] = useState(''),
    [error, setError] = useState(''),
    [sending, setSending] = useState(false),
    [answers, setAnswers] = useState<Record<string, unknown>>({}),
    [submissionId, setSubmissionId] = useState(''),
    [rendered, setRendered] = useState<{ subject: string; html: string; plain: string } | null>(null);
  return (
    <fieldset className="cff-card">
      <legend>{notification.id}</legend>
      <Check
        label={__('Enabled', 'chatflow-forms')}
        value={notification.enabled}
        onChange={(enabled) => onChange({ ...notification, enabled })}
      />
      {autoresponder ? (
        <Select
          label={__('Respondent email field', 'chatflow-forms')}
          value={notification.emailField ?? ''}
          choices={[
            { value: '', label: __('Choose email field', 'chatflow-forms') },
            ...schema.steps
              .filter((step) => step.type === 'email')
              .map((step) => ({ value: step.key, label: step.label })),
          ]}
          onChange={(emailField) => onChange({ ...notification, emailField })}
        />
      ) : (
        (['to', 'cc', 'bcc'] as const).map((key) => (
          <Field
            key={key}
            label={
              key === 'to'
                ? __('Recipients', 'chatflow-forms')
                : key === 'cc'
                  ? __('CC', 'chatflow-forms')
                  : __('BCC', 'chatflow-forms')
            }
            value={notification[key]?.join(', ') ?? ''}
            onChange={(value) =>
              onChange({
                ...notification,
                [key]: value
                  .split(',')
                  .map((email) => email.trim())
                  .filter(Boolean)
                  .slice(0, 20),
              })
            }
          />
        ))
      )}
      <Field
        label={__('From name', 'chatflow-forms')}
        value={notification.fromName}
        onChange={(fromName) => onChange({ ...notification, fromName })}
      />
      <Field
        label={__('From email', 'chatflow-forms')}
        value={notification.fromEmail}
        onChange={(fromEmail) => onChange({ ...notification, fromEmail })}
      />
      <Field
        label={__('Reply-To (address or email merge tag)', 'chatflow-forms')}
        value={notification.replyTo}
        onChange={(replyTo) => onChange({ ...notification, replyTo })}
      />
      <Field
        label={__('Subject', 'chatflow-forms')}
        value={notification.subject}
        onChange={(subject) => onChange({ ...notification, subject })}
      />
      <HtmlEditor value={notification.body} onChange={(body) => onChange({ ...notification, body })} />
      <p>
        {__(
          'Merge tags: {{all_answers}}, {{meta_table}}, {{admin_link}}, {{form_title}}, {{submission_id}}, {{site_name}}, {{date}} and any field key. Buttons: [cff_button url="https://…"]Label[/cff_button].',
          'chatflow-forms',
        )}
      </p>
      <Select
        label={__('Insert answer merge tag', 'chatflow-forms')}
        value=""
        choices={[
          { value: '', label: __('Choose a field', 'chatflow-forms') },
          ...schema.steps.map((step) => ({ value: step.key, label: step.label })),
        ]}
        onChange={(key) => {
          if (key) onChange({ ...notification, body: notification.body + `{{${key}}}` });
        }}
      />
      <Area
        label={__('Body HTML / merge tags', 'chatflow-forms')}
        value={notification.body}
        onChange={(body) => onChange({ ...notification, body })}
      />
      <Field
        label={__('Delay in seconds (0 = immediate)', 'chatflow-forms')}
        type="number"
        value={notification.delaySeconds ?? 0}
        onChange={(value) => onChange({ ...notification, delaySeconds: Number(value) })}
      />
      <Check
        label={__('Send only when conditions match', 'chatflow-forms')}
        value={Boolean(notification.conditions)}
        onChange={(enabled) => {
          const next = { ...notification };
          if (enabled) next.conditions = firstCondition(schema);
          else delete next.conditions;
          onChange(next);
        }}
      />
      {notification.conditions && (
        <ConditionEditor
          value={notification.conditions}
          schema={schema}
          onChange={(conditions) => onChange({ ...notification, conditions })}
        />
      )}
      <JsonEditor
        label={__('Sample answers (JSON object)', 'chatflow-forms')}
        value={answers}
        onChange={(value) => {
          if (!value || Array.isArray(value) || typeof value !== 'object') {
            setError(__('Sample answers must be an object.', 'chatflow-forms'));
            return;
          }
          setAnswers(value);
        }}
      />
      <Field
        label={__('Past submission ID (optional; requires submission access)', 'chatflow-forms')}
        type="number"
        value={submissionId}
        onChange={setSubmissionId}
      />
      <Button
        disabled={sending}
        onClick={async () => {
          setSending(true);
          setError('');
          try {
            setRendered(
              await preview(notification.id, answers, submissionId ? Number(submissionId) : undefined),
            );
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setSending(false);
          }
        }}
      >
        {__('Preview saved draft email', 'chatflow-forms')}
      </Button>
      {rendered && (
        <section>
          <h3>{rendered.subject}</h3>
          <iframe
            title={__('Email HTML preview', 'chatflow-forms')}
            sandbox=""
            srcDoc={rendered.html}
            style={{ width: '100%', height: 340 }}
          />
          <details>
            <summary>{__('Plain-text version', 'chatflow-forms')}</summary>
            <pre>{rendered.plain}</pre>
          </details>
        </section>
      )}
      <p>
        {__(
          'Preview saves the current draft. Test sends use the published version; publish changed notification settings before testing them.',
          'chatflow-forms',
        )}
      </p>
      <Field label={__('Test recipient', 'chatflow-forms')} type="email" value={to} onChange={setTo} />
      <Button
        variant="secondary"
        disabled={!to || sending}
        onClick={async () => {
          setSending(true);
          setError('');
          try {
            await test(notification.id, to);
            setError(__('Test email queued. Check the activity log for delivery.', 'chatflow-forms'));
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setSending(false);
          }
        }}
      >
        {__('Send test of published version', 'chatflow-forms')}
      </Button>
      {error && <p role="status">{error}</p>}
      <Button isDestructive onClick={onDelete}>
        {__('Remove email', 'chatflow-forms')}
      </Button>
    </fieldset>
  );
}
export function EndingsEditor({ form, onChange }: { form: FormDTO; onChange: (form: FormDTO) => void }) {
  const schema = form.schema;
  const change = (ending: Ending) =>
    onChange({
      ...form,
      schema: {
        ...schema,
        endings: schema.endings.map((item) =>
          item.id === ending.id ? ending : item,
        ) as FormSchema['endings'],
      },
    });
  return (
    <section>
      <h2>{__('Endings and completion', 'chatflow-forms')}</h2>
      <Select
        label={__('Default ending', 'chatflow-forms')}
        value={form.settings.completion?.defaultEndingId ?? schema.endings[0]?.id}
        choices={schema.endings.map((ending) => ({ value: ending.id, label: ending.id }))}
        onChange={(defaultEndingId) =>
          onChange({
            ...form,
            settings: { ...form.settings, completion: { ...form.settings.completion, defaultEndingId } },
          })
        }
      />
      <Field
        label={__('Allowed external redirect hosts (comma-separated)', 'chatflow-forms')}
        value={form.settings.completion?.allowedRedirectHosts?.join(', ') ?? ''}
        onChange={(value) =>
          onChange({
            ...form,
            settings: {
              ...form.settings,
              completion: {
                defaultEndingId: form.settings.completion?.defaultEndingId ?? schema.endings[0]!.id,
                allowedRedirectHosts: value
                  .split(',')
                  .map((host) => host.trim())
                  .filter(Boolean)
                  .slice(0, 20) as NonNullable<
                  NonNullable<FormSettings['completion']>['allowedRedirectHosts']
                >,
              },
            },
          })
        }
      />
      {schema.endings.map((ending) => (
        <fieldset key={ending.id} className="cff-card">
          <legend>{ending.id}</legend>
          <Select
            label={__('Ending type', 'chatflow-forms')}
            value={ending.type}
            choices={[
              { label: __('Message', 'chatflow-forms'), value: 'message' },
              { label: __('Redirect', 'chatflow-forms'), value: 'redirect' },
            ]}
            onChange={(type) => change({ ...ending, type: type as Ending['type'] })}
          />
          <Area
            label={__('Ending messages (one per line)', 'chatflow-forms')}
            value={ending.messages?.join('\n') ?? ''}
            onChange={(value) => change({ ...ending, messages: value.split('\n').slice(0, 50) })}
          />
          {ending.type === 'redirect' && (
            <Fragment>
              <Field
                label={__('Redirect URL', 'chatflow-forms')}
                value={ending.url}
                onChange={(url) => change({ ...ending, url })}
              />
              <Check
                label={__('Append whitelisted answers', 'chatflow-forms')}
                value={ending.appendQuery}
                onChange={(appendQuery) => change({ ...ending, appendQuery })}
              />
              <Field
                label={__('Whitelisted field keys', 'chatflow-forms')}
                value={ending.queryKeys?.join(', ') ?? ''}
                onChange={(value) =>
                  change({
                    ...ending,
                    queryKeys: value
                      .split(',')
                      .map((key) => key.trim())
                      .filter(Boolean),
                  })
                }
              />
              <Check
                label={__('Append submission UUID', 'chatflow-forms')}
                value={ending.appendSubmission}
                onChange={(appendSubmission) => change({ ...ending, appendSubmission })}
              />
              <Field
                label={__('Redirect delay (milliseconds)', 'chatflow-forms')}
                value={ending.delayMs ?? 0}
                type="number"
                onChange={(value) => change({ ...ending, delayMs: Number(value) })}
              />
            </Fragment>
          )}
          {(ending.buttons ?? []).map((button) => (
            <fieldset key={button.id}>
              <Field
                label={__('Button label', 'chatflow-forms')}
                value={button.label}
                onChange={(label) =>
                  change({
                    ...ending,
                    buttons: ending.buttons?.map((item) =>
                      item.id === button.id ? { ...item, label } : item,
                    ) as NonNullable<Ending['buttons']>,
                  })
                }
              />
              <Select
                label={__('Button action', 'chatflow-forms')}
                value={button.action}
                choices={[
                  { value: 'link', label: __('Link (including WhatsApp)', 'chatflow-forms') },
                  { value: 'restart', label: __('Start over', 'chatflow-forms') },
                ]}
                onChange={(action) =>
                  change({
                    ...ending,
                    buttons: ending.buttons?.map((item) =>
                      item.id === button.id ? { ...item, action } : item,
                    ) as NonNullable<Ending['buttons']>,
                  })
                }
              />
              {button.action === 'link' && (
                <Field
                  label={__('Button URL (merge tags allowed)', 'chatflow-forms')}
                  value={button.url}
                  onChange={(url) =>
                    change({
                      ...ending,
                      buttons: ending.buttons?.map((item) =>
                        item.id === button.id ? { ...item, url } : item,
                      ) as NonNullable<Ending['buttons']>,
                    })
                  }
                />
              )}
              <Button
                isDestructive
                onClick={() =>
                  change({
                    ...ending,
                    buttons: ending.buttons?.filter((item) => item.id !== button.id) as NonNullable<
                      Ending['buttons']
                    >,
                  })
                }
              >
                {__('Remove button', 'chatflow-forms')}
              </Button>
            </fieldset>
          ))}
          <Button
            disabled={(ending.buttons?.length ?? 0) >= 20}
            onClick={() =>
              change({
                ...ending,
                buttons: [
                  ...(ending.buttons ?? []),
                  { id: uid('btn'), label: __('Visit website', 'chatflow-forms'), action: 'link', url: '/' },
                ] as NonNullable<Ending['buttons']>,
              })
            }
          >
            {__('Add button', 'chatflow-forms')}
          </Button>
          <Button
            disabled={schema.endings.length <= 1}
            isDestructive
            onClick={() => {
              if (window.confirm(__('Remove ending? Update any rules that reference it.', 'chatflow-forms')))
                onChange({
                  ...form,
                  schema: {
                    ...schema,
                    endings: schema.endings.filter((item) => item.id !== ending.id) as FormSchema['endings'],
                  },
                });
            }}
          >
            {__('Remove ending', 'chatflow-forms')}
          </Button>
        </fieldset>
      ))}
      <Button
        onClick={() =>
          onChange({
            ...form,
            schema: {
              ...schema,
              endings: [
                ...schema.endings,
                { id: uid('end'), type: 'message', messages: [__('Thank you!', 'chatflow-forms')] },
              ],
            },
          })
        }
      >
        {__('Add ending', 'chatflow-forms')}
      </Button>
    </section>
  );
}
export function SettingsEditor({
  form,
  onChange,
  api,
  save,
}: {
  form: FormDTO;
  onChange: (settings: FormSettings) => void;
  api: AdminApi;
  save: () => Promise<FormDTO>;
}) {
  const [includePages, setIncludePages] = useState(() => (form.settings.display?.launcher?.includePageIds ?? []).join(','));
  const [excludePages, setExcludePages] = useState(() => (form.settings.display?.launcher?.excludePageIds ?? []).join(','));
  const settings: FormSettings = {
      ...api.config.defaults,
      ...form.settings,
      privacy: { ...api.config.defaults?.privacy, ...form.settings.privacy },
      spam: { ...api.config.defaults?.spam, ...form.settings.spam },
    },
    notifications = settings.notifications ?? {},
    integrations = settings.integrations ?? {},
    display = settings.display ?? {},
    launcher = display.launcher ?? {};
  const set = <K extends keyof FormSettings>(key: K, value: FormSettings[K]) =>
    onChange({ ...settings, [key]: value });
  const setLauncher = (changes: Partial<typeof launcher>) =>
    set('display', { ...display, launcher: { ...launcher, ...changes } });
  const pageIds = (input: string) =>
    [...new Set(input.split(',').map((value) => value.trim()).filter((value) => /^\d+$/.test(value)).map(Number).filter((value) => Number.isSafeInteger(value) && value > 0))].slice(0, 500);
  const test = async (notificationId: string, to: string) => {
    if (!form.id || !form.version)
      throw new Error(__('Publish the form before sending test mail.', 'chatflow-forms'));
    await api.request('admin/notifications/test', 'POST', { formId: form.id, notificationId, to });
  };
  const preview = async (notificationId: string, answers: Record<string, unknown>, submissionId?: number) => {
    const saved = await save();
    return api.request<{ subject: string; html: string; plain: string }>(
      'admin/notifications/preview',
      'POST',
      { formId: saved.id, notificationId, answers, ...(submissionId ? { submissionId } : {}) },
    );
  };
  return (
    <div className="cff-settings-grid">
      <section className="cff-card">
        <h2>{__('Sessions and resume', 'chatflow-forms')}</h2>
        {(
          [
            { key: 'savePartial', label: __('Save partial submissions', 'chatflow-forms'), fallback: true },
            { key: 'resumeEnabled', label: __('Enable resume', 'chatflow-forms'), fallback: true },
            { key: 'resumePrompt', label: __('Ask before resuming', 'chatflow-forms'), fallback: true },
            {
              key: 'deletePartialOnRestart',
              label: __('Delete partial on start over', 'chatflow-forms'),
              fallback: false,
            },
          ] as const
        ).map((item) => (
          <Check
            key={item.key}
            label={item.label}
            value={settings.sessions?.[item.key] ?? item.fallback}
            onChange={(value) => set('sessions', { ...settings.sessions, [item.key]: value })}
          />
        ))}
        <p>
          {__(
            'Resume stores answers on this device. Disclose personal-data storage in your privacy and cookie policy.',
            'chatflow-forms',
          )}
        </p>
        <Field
          label={__('Resume days (1–90)', 'chatflow-forms')}
          type="number"
          value={settings.sessions?.resumeDays ?? 30}
          onChange={(value) => set('sessions', { ...settings.sessions, resumeDays: Number(value) })}
        />
        <Field
          label={__('Abandon after days (1–90)', 'chatflow-forms')}
          type="number"
          value={settings.sessions?.abandonDays ?? 30}
          onChange={(value) => set('sessions', { ...settings.sessions, abandonDays: Number(value) })}
        />
        <Check
          label={__('Notify on abandoned contact leads', 'chatflow-forms')}
          value={notifications.notifyAbandoned}
          onChange={(notifyAbandoned) => set('notifications', { ...notifications, notifyAbandoned })}
        />
      </section>

      <section className="cff-card">
        <h2>{__('Display and engagement', 'chatflow-forms')}</h2>
        <Select
          label={__('Display mode', 'chatflow-forms')}
          value={display.mode ?? 'inline'}
          choices={[
            { value: 'inline', label: __('Inline', 'chatflow-forms') },
            { value: 'fullpage', label: __('Fullpage', 'chatflow-forms') },
            { value: 'launcher', label: __('Floating launcher', 'chatflow-forms') },
            { value: 'popup', label: __('Popup', 'chatflow-forms') },
          ]}
          onChange={(mode) => set('display', { ...display, mode: mode as NonNullable<typeof display.mode> })}
        />
        {(['launcher', 'popup'].includes(display.mode ?? '') && <>
          <Check
            label={__('Show automatically on matching pages', 'chatflow-forms')}
            value={launcher.enabled ?? false}
            onChange={(enabled) => setLauncher({ enabled })}
          />
          <Select
            label={__('Launcher position', 'chatflow-forms')}
            value={launcher.position ?? 'right'}
            choices={[
              { value: 'left', label: __('Left', 'chatflow-forms') },
              { value: 'right', label: __('Right', 'chatflow-forms') },
            ]}
            onChange={(position) => setLauncher({ position: position as 'left' | 'right' })}
          />
          <Field
            label={__('Auto-open after seconds (blank = off)', 'chatflow-forms')}
            type="number"
            value={launcher.autoOpenSeconds ?? ''}
            onChange={(value) => setLauncher({ autoOpenSeconds: value === '' ? null : Math.max(0, Math.min(3600, Number(value) || 0)) })}
          />
          <Field
            label={__('Auto-open at scroll percent (blank = off)', 'chatflow-forms')}
            type="number"
            value={launcher.scrollPercent ?? ''}
            onChange={(value) => setLauncher({ scrollPercent: value === '' ? null : Math.max(0, Math.min(100, Number(value) || 0)) })}
          />
          <Field
            label={__('Include page IDs (comma-separated; blank = all)', 'chatflow-forms')}
            value={includePages}
            onChange={(value) => {
              setIncludePages(value);
              setLauncher({ includePageIds: pageIds(value) as NonNullable<typeof launcher.includePageIds> });
            }}
          />
          <Field
            label={__('Exclude page IDs (comma-separated)', 'chatflow-forms')}
            value={excludePages}
            onChange={(value) => {
              setExcludePages(value);
              setLauncher({ excludePageIds: pageIds(value) as NonNullable<typeof launcher.excludePageIds> });
            }}
          />
          <p>{__('Page exclusions take precedence. A published form is required for automatic placement.', 'chatflow-forms')}</p>
        </>)}
      </section>
      <section className="cff-card">
        <h2>{__('Limits', 'chatflow-forms')}</h2>
        <Check
          label={__('Require login', 'chatflow-forms')}
          value={settings.limits?.requireLogin}
          onChange={(requireLogin) => set('limits', { ...settings.limits, requireLogin })}
        />
        {(['total', 'perUser'] as const).map((key) => (
          <Field
            key={key}
            label={
              key === 'total'
                ? __('Total submissions (blank = unlimited)', 'chatflow-forms')
                : __('Per user (blank = unlimited)', 'chatflow-forms')
            }
            type="number"
            value={settings.limits?.[key] ?? ''}
            onChange={(value) =>
              set('limits', { ...settings.limits, [key]: value === '' ? null : Number(value) })
            }
          />
        ))}
        <Field
          label={__('Closing date (UTC ISO 8601, blank = never)', 'chatflow-forms')}
          value={settings.limits?.closesAt ?? ''}
          onChange={(closesAt) => set('limits', { ...settings.limits, closesAt: closesAt || null })}
        />
      </section>
      <section className="cff-card">
        <h2>{__('Privacy and retention override', 'chatflow-forms')}</h2>
        <Check
          label={__('Store tracking metadata', 'chatflow-forms')}
          value={settings.privacy?.storeMeta ?? true}
          onChange={(storeMeta) => set('privacy', { ...settings.privacy, storeMeta })}
        />
        <Select
          label={__('IP storage', 'chatflow-forms')}
          value={settings.privacy?.ipMode ?? 'anonymized'}
          choices={[
            { value: 'none', label: __('Do not store', 'chatflow-forms') },
            { value: 'anonymized', label: __('Anonymized', 'chatflow-forms') },
            { value: 'full', label: __('Full IP', 'chatflow-forms') },
          ]}
          onChange={(ipMode) =>
            set('privacy', { ...settings.privacy, ipMode: ipMode as 'none' | 'anonymized' | 'full' })
          }
        />
        <Check
          label={__('Store user agent', 'chatflow-forms')}
          value={settings.privacy?.storeUserAgent}
          onChange={(storeUserAgent) => set('privacy', { ...settings.privacy, storeUserAgent })}
        />
        <Check
          label={__('Respect Do Not Track', 'chatflow-forms')}
          value={settings.privacy?.respectDnt ?? true}
          onChange={(respectDnt) => set('privacy', { ...settings.privacy, respectDnt })}
        />
        <Check
          label={__('Enable per-form automatic retention', 'chatflow-forms')}
          value={settings.privacy?.retentionEnabled}
          onChange={(retentionEnabled) => set('privacy', { ...settings.privacy, retentionEnabled })}
        />
        <Field
          label={__('Retention days', 'chatflow-forms')}
          type="number"
          value={settings.privacy?.retentionDays ?? 360}
          onChange={(value) => set('privacy', { ...settings.privacy, retentionDays: Number(value) })}
        />
        <Field
          label={__('Partial/abandoned retention days (blank = same)', 'chatflow-forms')}
          type="number"
          value={settings.privacy?.partialRetentionDays ?? ''}
          onChange={(value) =>
            set('privacy', { ...settings.privacy, partialRetentionDays: value === '' ? null : Number(value) })
          }
        />
      </section>
      <section className="cff-card">
        <h2>{__('Spam protection', 'chatflow-forms')}</h2>
        <Check
          label={__('Honeypot', 'chatflow-forms')}
          value={settings.spam?.honeypotEnabled ?? true}
          onChange={(honeypotEnabled) => set('spam', { ...settings.spam, honeypotEnabled })}
        />
        {(
          [
            { key: 'minSeconds', label: __('Minimum completion seconds', 'chatflow-forms'), fallback: 3 },
            { key: 'rateLimit', label: __('Submissions per rate window', 'chatflow-forms'), fallback: 10 },
            { key: 'rateWindowSeconds', label: __('Rate window seconds', 'chatflow-forms'), fallback: 600 },
          ] as const
        ).map((item) => (
          <Field
            key={item.key}
            label={item.label}
            type="number"
            value={settings.spam?.[item.key] ?? item.fallback}
            onChange={(value) => set('spam', { ...settings.spam, [item.key]: Number(value) })}
          />
        ))}
        <p>{__('Captcha and Akismet are optional later features, not enabled here.', 'chatflow-forms')}</p>
      </section>
      <section className="cff-card">
        <h2>{__('Admin notifications', 'chatflow-forms')}</h2>
        {(notifications.admin ?? []).map((notification) => (
          <EmailCard
            key={notification.id}
            notification={notification}
            schema={form.schema}
            autoresponder={false}
            test={test}
            preview={preview}
            onChange={(next) =>
              set('notifications', {
                ...notifications,
                admin: (notifications.admin ?? []).map((item) =>
                  item.id === next.id ? next : item,
                ) as NonNullable<NonNullable<FormSettings['notifications']>['admin']>,
              })
            }
            onDelete={() =>
              set('notifications', {
                ...notifications,
                admin: (notifications.admin ?? []).filter(
                  (item) => item.id !== notification.id,
                ) as NonNullable<NonNullable<FormSettings['notifications']>['admin']>,
              })
            }
          />
        ))}
        <Button
          disabled={(notifications.admin?.length ?? 0) >= 20}
          onClick={() =>
            set('notifications', {
              ...notifications,
              admin: [
                ...(notifications.admin ?? []),
                {
                  id: uid('mail'),
                  enabled: true,
                  to: [],
                  subject: __('New submission', 'chatflow-forms'),
                  body: '{{all_answers}}',
                },
              ] as NonNullable<NonNullable<FormSettings['notifications']>['admin']>,
            })
          }
        >
          {__('Add admin email', 'chatflow-forms')}
        </Button>
      </section>
      <section className="cff-card">
        <h2>{__('Autoresponders', 'chatflow-forms')}</h2>
        <Check
          label={__('Send only first matching autoresponder', 'chatflow-forms')}
          value={notifications.firstMatchOnly}
          onChange={(firstMatchOnly) => set('notifications', { ...notifications, firstMatchOnly })}
        />
        {(notifications.autoresponders ?? []).map((notification) => (
          <EmailCard
            key={notification.id}
            notification={notification}
            schema={form.schema}
            autoresponder
            test={test}
            preview={preview}
            onChange={(next) =>
              set('notifications', {
                ...notifications,
                autoresponders: notifications.autoresponders?.map((item) =>
                  item.id === next.id ? next : item,
                ) as NonNullable<NonNullable<FormSettings['notifications']>['autoresponders']>,
              })
            }
            onDelete={() =>
              set('notifications', {
                ...notifications,
                autoresponders: notifications.autoresponders?.filter(
                  (item) => item.id !== notification.id,
                ) as NonNullable<NonNullable<FormSettings['notifications']>['autoresponders']>,
              })
            }
          />
        ))}
        <Button
          disabled={
            !form.schema.steps.some((step) => step.type === 'email') ||
            (notifications.autoresponders?.length ?? 0) >= 20
          }
          onClick={() =>
            set('notifications', {
              ...notifications,
              autoresponders: [
                ...(notifications.autoresponders ?? []),
                {
                  id: uid('reply'),
                  enabled: true,
                  emailField: form.schema.steps.find((step) => step.type === 'email')?.key,
                  subject: __('Thank you for your submission', 'chatflow-forms'),
                  body: '{{all_answers}}',
                  delaySeconds: 0,
                },
              ] as NonNullable<NonNullable<FormSettings['notifications']>['autoresponders']>,
            })
          }
        >
          {__('Add autoresponder', 'chatflow-forms')}
        </Button>
      </section>
      <section className="cff-card">
        <h2>{__('Webhooks', 'chatflow-forms')}</h2>
        <Notice status="warning" isDismissible={false}>
          {__(
            'Only public HTTPS destinations. Private and loopback hosts are blocked server-side. Secrets remain private.',
            'chatflow-forms',
          )}
        </Notice>
        {(integrations.webhooks ?? []).map((webhook) => {
          const change = (next: Webhook) =>
            set('integrations', {
              ...integrations,
              webhooks: integrations.webhooks?.map((item) =>
                item.id === next.id ? next : item,
              ) as NonNullable<NonNullable<FormSettings['integrations']>['webhooks']>,
            });
          return (
            <fieldset key={webhook.id}>
              <legend>{webhook.id}</legend>
              <Check
                label={__('Enabled', 'chatflow-forms')}
                value={webhook.enabled}
                onChange={(enabled) => change({ ...webhook, enabled })}
              />
              <Field
                label={__('Webhook URL', 'chatflow-forms')}
                value={webhook.url}
                onChange={(url) => change({ ...webhook, url })}
              />
              <Field
                label={__('Signing secret', 'chatflow-forms')}
                type="password"
                value={webhook.secret}
                onChange={(secret) => change({ ...webhook, secret })}
              />
              {(['completed', 'partial', 'abandoned'] as const).map((event) => (
                <Check
                  key={event}
                  label={event}
                  value={(webhook.events as string[]).includes(event)}
                  onChange={(checked) =>
                    change({
                      ...webhook,
                      events: (checked
                        ? [...webhook.events, event]
                        : webhook.events.filter((item) => item !== event)) as Webhook['events'],
                    })
                  }
                />
              ))}
              <JsonEditor
                label={__('Custom headers (private)', 'chatflow-forms')}
                value={webhook.headers ?? {}}
                onChange={(headers) => change({ ...webhook, headers })}
              />
              <Button
                isDestructive
                onClick={() =>
                  set('integrations', {
                    ...integrations,
                    webhooks: (integrations.webhooks ?? []).filter(
                      (item) => item.id !== webhook.id,
                    ) as NonNullable<NonNullable<FormSettings['integrations']>['webhooks']>,
                  })
                }
              >
                {__('Remove webhook', 'chatflow-forms')}
              </Button>
            </fieldset>
          );
        })}
        <Button
          disabled={(integrations.webhooks?.length ?? 0) >= 20}
          onClick={() =>
            set('integrations', {
              ...integrations,
              webhooks: [
                ...(integrations.webhooks ?? []),
                { id: uid('hook'), enabled: true, url: '', events: ['completed'], headers: {} },
              ] as NonNullable<NonNullable<FormSettings['integrations']>['webhooks']>,
            })
          }
        >
          {__('Add webhook', 'chatflow-forms')}
        </Button>
      </section>
      <section className="cff-card">
        <h2>{__('Visitor phrase overrides', 'chatflow-forms')}</h2>
        <JsonEditor
          label={__('Phrase key → translated text', 'chatflow-forms')}
          value={settings.phrases ?? {}}
          onChange={(phrases) => set('phrases', phrases)}
        />
      </section>
    </div>
  );
}
