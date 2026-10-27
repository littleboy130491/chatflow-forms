/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import { WhatsAppLinkBuilder } from './Contact';
import { __, sprintf } from '@wordpress/i18n';
import { AnswerArea, Area, Button, Check, Field, JsonEditor, Notice, Select } from './controls';
import { ConditionEditor, firstCondition } from './RuleEditor';
import { uid } from './model';
import { endingTitle } from './labels';
import { EmailTemplates } from './EmailTemplates';
import { ConnectorSettings, deliveryEventLabels } from './ConnectorSettings';
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
/** Strict page ID list: any invalid entry rejects the whole input rather than guessing. */
export function pageIds(value: string): number[] {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 500 || parts.some((part) => !/^[1-9]\d*$/.test(part) || !Number.isSafeInteger(Number(part)))) return [];
  return [...new Set(parts.map(Number))];
}
function EmailCard({
  api,
  notification,
  schema,
  onChange,
  onDelete,
  autoresponder,
  test,
  preview,
}: {
  api: AdminApi;
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
      <EmailTemplates api={api} content={notification} onLoad={content => onChange({ ...notification, ...content })} />
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
        choices={schema.endings.map((ending, index) => ({ value: ending.id, label: endingTitle(ending, index) }))}
        onChange={(defaultEndingId) =>
          onChange({
            ...form,
            settings: { ...form.settings, completion: { ...form.settings.completion, defaultEndingId } },
          })
        }
      />
      {schema.endings.some(ending => ending.type === 'redirect') && <details className="cff-ending-advanced">
      <summary>{__('Advanced redirect settings', 'chatflow-forms')}</summary>
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
      </details>}
      {schema.endings.map((ending, index) => (
        <section
          key={ending.id}
          className="cff-card cff-ending"
          aria-labelledby={`cff-ending-${ending.id}`}
        >
          <h3 id={`cff-ending-${ending.id}`}>{endingTitle(ending, index)}</h3>
          <details className="cff-ending-advanced"><summary>{__('Technical details', 'chatflow-forms')}</summary><p><code>{ending.id}</code></p></details>
          <Select
            label={__('Ending type', 'chatflow-forms')}
            value={ending.type}
            choices={[
              { label: __('Show a thank-you message', 'chatflow-forms'), value: 'message' },
              { label: __('Go to a page or WhatsApp', 'chatflow-forms'), value: 'redirect' },
            ]}
            onChange={(type) => change({ ...ending, type: type as Ending['type'] })}
          />
          <AnswerArea
            label={__('Ending messages (one per line)', 'chatflow-forms')}
            value={ending.messages?.join('\n') ?? ''}
            steps={schema.steps}
            onChange={(value) => change({ ...ending, messages: value.split('\n').slice(0, 50) })}
          />
          {ending.type === 'redirect' && (
            <Fragment>
              <p className="description">{__('The submission is saved before the visitor is redirected. For WhatsApp, build a link below; the visitor must still send the message.', 'chatflow-forms')}</p>
              <WhatsAppLinkBuilder url={ending.url} steps={schema.steps} onChange={(url) => change({ ...ending, url })} />
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
          {(ending.buttons ?? []).map((button, buttonIndex) => (
            <fieldset key={button.id}>
              <legend>
                {sprintf(
                  /* translators: %d: button number */
                  __('Button %d', 'chatflow-forms'),
                  buttonIndex + 1,
                )}
              </legend>
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
                <Fragment>
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
                  <details className="cff-whatsapp-details">
                    <summary>{__('Build a WhatsApp link', 'chatflow-forms')}</summary>
                    <WhatsAppLinkBuilder
                      url={button.url}
                      onChange={(url) =>
                        change({
                          ...ending,
                          buttons: ending.buttons?.map((item) =>
                            item.id === button.id ? { ...item, url } : item,
                          ) as NonNullable<Ending['buttons']>,
                        })
                      }
                    />
                  </details>
                </Fragment>
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
        </section>
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
type Privacy = NonNullable<FormSettings['privacy']>;
type Spam = NonNullable<FormSettings['spam']>;
/** Copy of an optional settings group without one key; undefined when nothing is left. */
function withoutKey<T extends object>(group: T | undefined, key: keyof T): T | undefined {
  if (!group) return undefined;
  const next = { ...group };
  delete next[key];
  return Object.keys(next).length ? next : undefined;
}
export function captchaLabel(provider: string): string {
  switch (provider) {
    case 'turnstile':
      return __('Cloudflare Turnstile', 'chatflow-forms');
    case 'hcaptcha':
      return __('hCaptcha', 'chatflow-forms');
    case 'recaptcha':
      return __('Google reCAPTCHA v3', 'chatflow-forms');
    default:
      return __('Off', 'chatflow-forms');
  }
}
function InheritedValue({ overridden, onReset }: { overridden: boolean; onReset: () => void }) {
  return overridden ? (
    <Button variant="link" className="cff-inherit-reset" onClick={onReset}>
      {__('Use global default', 'chatflow-forms')}
    </Button>
  ) : (
    <p className="cff-inherited">{__('Using global default', 'chatflow-forms')}</p>
  );
}
export function SettingsEditor({
  form,
  onChange,
  api,
  save,
  completion,
}: {
  form: FormDTO;
  onChange: (settings: FormSettings) => void;
  api: AdminApi;
  save: () => Promise<FormDTO>;
  completion?: import('react').ReactNode;
}) {
  const [section, setSection] = useState('general');
  const [includePages, setIncludePages] = useState(() => (form.settings.display?.launcher?.includePageIds ?? []).join(','));
  const [excludePages, setExcludePages] = useState(() => (form.settings.display?.launcher?.excludePageIds ?? []).join(','));
  // Only keys the admin changes are written; global values are shown as inherited.
  const stored = form.settings,
    inherited = api.config.defaults ?? {};
  const settings: FormSettings = {
      ...stored,
      privacy: { ...inherited.privacy, ...stored.privacy },
      spam: { ...inherited.spam, ...stored.spam },
    },
    notifications = settings.notifications ?? {},
    integrations = settings.integrations ?? {},
    display = settings.display ?? {},
    launcher = display.launcher ?? {};
  const set = <K extends keyof FormSettings>(key: K, value: FormSettings[K]) =>
    onChange({ ...stored, [key]: value });
  const setPrivacy = <K extends keyof Privacy>(key: K, value: Privacy[K]) =>
    set('privacy', { ...stored.privacy, [key]: value });
  const setSpam = <K extends keyof Spam>(key: K, value: Spam[K]) => set('spam', { ...stored.spam, [key]: value });
  const resetPrivacy = (key: keyof Privacy) => set('privacy', withoutKey(stored.privacy, key));
  const resetSpam = (key: keyof Spam) => set('spam', withoutKey(stored.spam, key));
  const privacyReset = (key: keyof Privacy) => (
    <InheritedValue overridden={stored.privacy?.[key] !== undefined} onReset={() => resetPrivacy(key)} />
  );
  const spamReset = (key: keyof Spam) => (
    <InheritedValue overridden={stored.spam?.[key] !== undefined} onReset={() => resetSpam(key)} />
  );
  const globalCaptcha = inherited.spam?.captcha;
  const setLauncher = (changes: Partial<typeof launcher>) =>
    set('display', { ...display, launcher: { ...launcher, ...changes } });
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
    <div className="cff-settings-layout">
      <nav className="cff-tabs cff-settings-nav" aria-label={__('Form settings sections', 'chatflow-forms')}>
        {[
          { value: 'general', label: __('General / Completion', 'chatflow-forms') },
          { value: 'display', label: __('Display', 'chatflow-forms') },
          { value: 'notifications', label: __('Notifications', 'chatflow-forms') },
          { value: 'integrations', label: __('Integrations', 'chatflow-forms') },
          { value: 'privacy', label: __('Privacy', 'chatflow-forms') },
          { value: 'advanced', label: __('Advanced', 'chatflow-forms') },
        ].map(item => <Button key={item.value} variant={section === item.value ? 'primary' : 'secondary'} aria-pressed={section === item.value} onClick={() => setSection(item.value)}>{item.label}</Button>)}
      </nav>
      <div className="cff-settings-grid">
      <div hidden={section !== 'general'}>{completion}</div>
      <section className="cff-card" data-settings-group="general" hidden={section !== 'general'}>
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
        <h3>{__('Cross-device resume links', 'chatflow-forms')}</h3>
        <Check label={__('Enable one-time email resume links', 'chatflow-forms')} value={settings.sessions?.magicLinks?.enabled ?? false} onChange={enabled => set('sessions', { ...settings.sessions, magicLinks: { ...settings.sessions?.magicLinks, enabled } })} />
        <Check label={__('Allow user-initiated WhatsApp sharing', 'chatflow-forms')} value={settings.sessions?.magicLinks?.whatsapp ?? false} onChange={whatsapp => set('sessions', { ...settings.sessions, magicLinks: { ...settings.sessions?.magicLinks, whatsapp } })} />
        <Select label={__('Recipient email field', 'chatflow-forms')} value={settings.sessions?.magicLinks?.emailField ?? ''} choices={[{ value: '', label: __('Choose an email field', 'chatflow-forms') }, ...form.schema.steps.filter(step => step.type === 'email').map(step => ({ value: step.key, label: step.label }))]} onChange={emailField => set('sessions', { ...settings.sessions, magicLinks: { ...settings.sessions?.magicLinks, emailField } })} />
        <Field label={__('Link lifetime in minutes (5–1440)', 'chatflow-forms')} type="number" value={settings.sessions?.magicLinks?.ttlMinutes ?? 30} onChange={ttlMinutes => set('sessions', { ...settings.sessions, magicLinks: { ...settings.sessions?.magicLinks, ttlMinutes: Number(ttlMinutes) } })} />
        <p>{__('Email uses your WordPress mail delivery. WhatsApp sharing opens your device share sheet or copies the link; it does not send a provider message.', 'chatflow-forms')}</p>
        <Check
          label={__('Notify on abandoned contact leads', 'chatflow-forms')}
          value={notifications.notifyAbandoned}
          onChange={(notifyAbandoned) => set('notifications', { ...notifications, notifyAbandoned })}
        />
      </section>

      <section className="cff-card" data-settings-group="display" hidden={section !== 'display'}>
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
              const ids = pageIds(value);
              if (!value.trim() || ids.length) setLauncher({ includePageIds: ids as NonNullable<typeof launcher.includePageIds> });
            }}
          />
          <Field
            label={__('Exclude page IDs (comma-separated)', 'chatflow-forms')}
            value={excludePages}
            onChange={(value) => {
              setExcludePages(value);
              const ids = pageIds(value);
              if (!value.trim() || ids.length) setLauncher({ excludePageIds: ids as NonNullable<typeof launcher.excludePageIds> });
            }}
          />
          <p>{__('Page exclusions take precedence. A published form is required for automatic placement.', 'chatflow-forms')}</p>
        </>)}
      </section>
      <section className="cff-card" data-settings-group="general" hidden={section !== 'general'}>
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
      <section className="cff-card" data-settings-group="privacy" hidden={section !== 'privacy'}>
        <h2>{__('Privacy and retention override', 'chatflow-forms')}</h2>
        <p>{__('Fields without an override follow the global Settings screen.', 'chatflow-forms')}</p>
        <Check
          label={__('Store tracking metadata', 'chatflow-forms')}
          value={settings.privacy?.storeMeta ?? true}
          onChange={(storeMeta) => setPrivacy('storeMeta', storeMeta)}
        />
        {privacyReset('storeMeta')}
        <Select
          label={__('IP storage', 'chatflow-forms')}
          value={settings.privacy?.ipMode ?? 'anonymized'}
          choices={[
            { value: 'none', label: __('Do not store', 'chatflow-forms') },
            { value: 'anonymized', label: __('Anonymized', 'chatflow-forms') },
            { value: 'full', label: __('Full IP', 'chatflow-forms') },
          ]}
          onChange={(ipMode) => setPrivacy('ipMode', ipMode as Privacy['ipMode'])}
        />
        {privacyReset('ipMode')}
        <Check
          label={__('Store user agent', 'chatflow-forms')}
          value={settings.privacy?.storeUserAgent}
          onChange={(storeUserAgent) => setPrivacy('storeUserAgent', storeUserAgent)}
        />
        {privacyReset('storeUserAgent')}
        <Check
          label={__('Respect Do Not Track', 'chatflow-forms')}
          value={settings.privacy?.respectDnt ?? true}
          onChange={(respectDnt) => setPrivacy('respectDnt', respectDnt)}
        />
        {privacyReset('respectDnt')}
        <Check
          label={__('Enable per-form automatic retention', 'chatflow-forms')}
          value={settings.privacy?.retentionEnabled}
          onChange={(retentionEnabled) => setPrivacy('retentionEnabled', retentionEnabled)}
        />
        {privacyReset('retentionEnabled')}
        <Field
          label={__('Retention days', 'chatflow-forms')}
          type="number"
          value={settings.privacy?.retentionDays ?? 360}
          onChange={(value) =>
            value === '' ? resetPrivacy('retentionDays') : setPrivacy('retentionDays', Number(value))
          }
        />
        {privacyReset('retentionDays')}
        <Field
          label={__('Partial/abandoned retention days (blank = use global setting)', 'chatflow-forms')}
          type="number"
          value={stored.privacy?.partialRetentionDays ?? ''}
          help={
            inherited.privacy?.partialRetentionDays
              ? sprintf(
                  /* translators: %d: number of days configured in global Settings */
                  __('Global setting: %d days.', 'chatflow-forms'),
                  inherited.privacy.partialRetentionDays,
                )
              : __('Global setting: same as completed submissions.', 'chatflow-forms')
          }
          onChange={(value) =>
            value === ''
              ? resetPrivacy('partialRetentionDays')
              : setPrivacy('partialRetentionDays', Number(value))
          }
        />
      </section>
      <section className="cff-card" data-settings-group="privacy" hidden={section !== 'privacy'}>
        <h2>{__('Spam protection', 'chatflow-forms')}</h2>
        <Check
          label={__('Honeypot', 'chatflow-forms')}
          value={settings.spam?.honeypotEnabled ?? true}
          onChange={(honeypotEnabled) => setSpam('honeypotEnabled', honeypotEnabled)}
        />
        {spamReset('honeypotEnabled')}
        {(
          [
            { key: 'minSeconds', label: __('Minimum completion seconds', 'chatflow-forms'), fallback: 2 },
            {
              key: 'rateLimit',
              label: __('Submit attempts per visitor IP per rate window', 'chatflow-forms'),
              fallback: 10,
            },
            { key: 'rateWindowSeconds', label: __('Rate window seconds', 'chatflow-forms'), fallback: 600 },
          ] as const
        ).map((item) => (
          <Fragment key={item.key}>
            <Field
              label={item.label}
              type="number"
              value={settings.spam?.[item.key] ?? item.fallback}
              onChange={(value) => (value === '' ? resetSpam(item.key) : setSpam(item.key, Number(value)))}
            />
            {spamReset(item.key)}
          </Fragment>
        ))}
        <Select
          label={__('Captcha', 'chatflow-forms')}
          value={stored.spam?.captcha === 'none' ? 'none' : ''}
          choices={[
            {
              value: '',
              label:
                globalCaptcha === undefined
                  ? __('Use global setting', 'chatflow-forms')
                  : sprintf(
                      /* translators: %s: captcha provider configured in global Settings */
                      __('Use global setting (%s)', 'chatflow-forms'),
                      captchaLabel(globalCaptcha),
                    ),
            },
            { value: 'none', label: __('Off for this form', 'chatflow-forms') },
          ]}
          onChange={(captcha) => (captcha === 'none' ? setSpam('captcha', 'none') : resetSpam('captcha'))}
        />
        <Check
          label={__('Use optional Akismet check', 'chatflow-forms')}
          value={settings.spam?.akismetEnabled ?? false}
          onChange={(akismetEnabled) => setSpam('akismetEnabled', akismetEnabled)}
        />
        {spamReset('akismetEnabled')}
        <p>{__('The captcha provider and its credentials are configured in global Settings; a form can only use it or turn it off. Optional checks contact third parties and require a suitable privacy notice.', 'chatflow-forms')}</p>
      </section>
      <section className="cff-card" data-settings-group="notifications" hidden={section !== 'notifications'}>
        <h2>{__('Admin notifications', 'chatflow-forms')}</h2>
        {(notifications.admin ?? []).map((notification) => (
          <EmailCard
            api={api}
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
      <section className="cff-card" data-settings-group="notifications" hidden={section !== 'notifications'}>
        <h2>{__('Autoresponders', 'chatflow-forms')}</h2>
        <Check
          label={__('Send only first matching autoresponder', 'chatflow-forms')}
          value={notifications.firstMatchOnly}
          onChange={(firstMatchOnly) => set('notifications', { ...notifications, firstMatchOnly })}
        />
        {(notifications.autoresponders ?? []).map((notification) => (
          <EmailCard
            api={api}
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
      <section className="cff-card" data-settings-group="integrations" hidden={section !== 'integrations'}>
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
                  label={deliveryEventLabels[event]}
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
      <div hidden={section !== 'integrations'}><ConnectorSettings schema={form.schema} integrations={integrations} onChange={(next) => set('integrations', next)} /></div>
      <section className="cff-card" data-settings-group="advanced" hidden={section !== 'advanced'}>
        <h2>{__('Visitor phrase overrides', 'chatflow-forms')}</h2>
        <JsonEditor
          label={__('Phrase key → translated text', 'chatflow-forms')}
          value={settings.phrases ?? {}}
          onChange={(phrases) => set('phrases', phrases)}
        />
      </section>
      </div>
    </div>
  );
}
