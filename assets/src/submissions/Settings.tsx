/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Area, Button, Check, Field, Notice, Select } from '../builder/controls';
import { errorMessage } from '../builder/api';
import type { AdminApi } from '../builder/api';
export interface GlobalSettings {
  delete_data_on_uninstall: boolean;
  fullpageBase: string;
  defaultTheme: 'light' | 'dark' | 'auto';
  tracking: { enabled: boolean; consentRequired: boolean; days: number };
  privacy: {
    ip: 'none' | 'anonymized' | 'full';
    storeUserAgent: boolean;
    storeMeta: boolean;
    respectDnt: boolean;
  };
  retention: { enabled: boolean; days: number; partialDays?: number | null };
  spam?: { honeypotEnabled: boolean; minSeconds: number; rateLimit: number; rateWindowSeconds: number;
    captcha?: 'none' | 'turnstile' | 'hcaptcha' | 'recaptcha'; siteKey?: string; secretKey?: string;
    minScore?: number; akismetEnabled?: boolean; akismetKey?: string };
  proxy: {
    mode: 'automatic' | 'direct' | 'cloudflare' | 'custom';
    trustedRanges: string[];
    header: 'HTTP_X_FORWARDED_FOR' | 'HTTP_X_REAL_IP' | 'HTTP_CF_CONNECTING_IP';
  };
  email: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
    logoUrl: string;
    brandColor: string;
    footerText: string;
  };
  connectors?: {
    slack: { webhookUrl: string };
    mailchimp: { apiKey: string };
    hubspot: { accessToken: string };
    ga4: { measurementId: string; apiSecret: string };
    meta_capi: { pixelId: string; accessToken: string; testEventCode: string };
  };
  ai?: { provider?: AiProvider; apiKey?: string; openrouterKey?: string; openrouterModel?: string; baseUrl?: string; compatKey?: string; compatModel?: string };
}
type ConnectorCredentials = NonNullable<GlobalSettings['connectors']>;
/** Credential inputs per provider; leave a provider blank to turn it off. */
const credentialFields: { type: keyof ConnectorCredentials; title: string; fields: { key: string; label: string; secret: boolean }[] }[] = [
  { type: 'slack', title: 'Slack', fields: [{ key: 'webhookUrl', label: __('Incoming webhook URL (https://hooks.slack.com/services/…)', 'chatflow-forms'), secret: true }] },
  { type: 'mailchimp', title: 'Mailchimp', fields: [{ key: 'apiKey', label: __('API key (ends with the data centre, e.g. -us21)', 'chatflow-forms'), secret: true }] },
  { type: 'hubspot', title: 'HubSpot', fields: [{ key: 'accessToken', label: __('Private app access token (CRM contacts write scope)', 'chatflow-forms'), secret: true }] },
  { type: 'ga4', title: 'Google Analytics 4', fields: [
    { key: 'measurementId', label: __('Measurement ID (G-…)', 'chatflow-forms'), secret: false },
    { key: 'apiSecret', label: __('Measurement Protocol API secret', 'chatflow-forms'), secret: true },
  ] },
  { type: 'meta_capi', title: 'Meta Conversions API', fields: [
    { key: 'pixelId', label: __('Pixel (dataset) ID', 'chatflow-forms'), secret: false },
    { key: 'accessToken', label: __('Conversions API access token', 'chatflow-forms'), secret: true },
    { key: 'testEventCode', label: __('Test event code (optional, for Events Manager testing)', 'chatflow-forms'), secret: false },
  ] },
];
/** The server never returns stored secrets; it sends this mask, and keeps the secret if the mask comes back. */
export const SECRET_MASK = '********';
type AiProvider = 'anthropic' | 'openrouter' | 'openai';
const secretHelp = (value: string | undefined): { help?: string } =>
  value === SECRET_MASK ? { help: __('Saved. Leave unchanged to keep it, or clear the field to remove it.', 'chatflow-forms') } : {};
export function Settings({ api }: { api: AdminApi }) {
  const [smtpDetected, setSmtpDetected] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    void api.request<{smtpDetected:boolean}>('admin/system-status', 'GET', undefined, abort.signal).then(status => setSmtpDetected(status.smtpDetected)).catch(() => { if(!abort.signal.aborted) setSmtpDetected(null); });
    api
      .request<{ settings: GlobalSettings }>('admin/settings', 'GET', undefined, abort.signal)
      .then((result) => setSettings(result.settings))
      .catch((err) => {
        if (!abort.signal.aborted) setError(errorMessage(err));
      });
    return () => abort.abort();
  }, [api]);
  if (!settings) return <p role="status">{error || __('Loading settings…', 'chatflow-forms')}</p>;
  const update = (next: GlobalSettings) => {
    setSettings(next);
    setSaved(false);
  };
  // Each provider keeps its own fields, so switching providers never loses a saved key.
  const setAi = (patch: NonNullable<GlobalSettings['ai']>) => settings && update({ ...settings, ai: { ...settings.ai, ...patch } });
  return (
    <main className="cff-admin">
      <h1>{__('ChatFlow settings', 'chatflow-forms')}</h1>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      {saved && (
        <Notice status="success" isDismissible={false}>
          {__('Settings saved.', 'chatflow-forms')}
        </Notice>
      )}
      <fieldset disabled={busy}>
        <div className="cff-settings-grid">
          <section className="cff-card">
            <h2>{__('Display defaults', 'chatflow-forms')}</h2>
            <Field
              label={__('Fullpage base slug', 'chatflow-forms')}
              value={settings.fullpageBase}
              onChange={(fullpageBase) => update({ ...settings, fullpageBase })}
            />
            <Select
              label={__('Default theme for new forms', 'chatflow-forms')}
              value={settings.defaultTheme}
              choices={[{ value: 'light', label: __('Light', 'chatflow-forms') }, { value: 'dark', label: __('Dark', 'chatflow-forms') }, { value: 'auto', label: __('Auto (follow visitor device)', 'chatflow-forms') }]}
              onChange={(defaultTheme) =>
                update({ ...settings, defaultTheme: defaultTheme as GlobalSettings['defaultTheme'] })
              }
            />
          </section>
          <section className="cff-card">
            <h2>{__('First-touch attribution', 'chatflow-forms')}</h2>
            <Check
              label={__('Enable first-touch tracking', 'chatflow-forms')}
              value={settings.tracking.enabled}
              onChange={(enabled) => update({ ...settings, tracking: { ...settings.tracking, enabled } })}
            />
            <Check
              label={__('Require consent before tracking', 'chatflow-forms')}
              value={settings.tracking.consentRequired}
              onChange={(consentRequired) =>
                update({ ...settings, tracking: { ...settings.tracking, consentRequired } })
              }
            />
            <Field
              label={__('Attribution cookie days', 'chatflow-forms')}
              type="number"
              value={settings.tracking.days}
              onChange={(value) =>
                update({ ...settings, tracking: { ...settings.tracking, days: Number(value) } })
              }
            />
            <p>
              {__(
                'Tracking is off by default. Connect your consent manager before enabling it.',
                'chatflow-forms',
              )}
            </p>
          </section>
          <section className="cff-card">
            <h2>{__('Privacy defaults', 'chatflow-forms')}</h2>
            <Select
              label={__('IP storage', 'chatflow-forms')}
              value={settings.privacy.ip}
              choices={[
                { value: 'none', label: __('Do not store', 'chatflow-forms') },
                { value: 'anonymized', label: __('Anonymized', 'chatflow-forms') },
                { value: 'full', label: __('Full IP', 'chatflow-forms') },
              ]}
              onChange={(ip) =>
                update({
                  ...settings,
                  privacy: { ...settings.privacy, ip: ip as GlobalSettings['privacy']['ip'] },
                })
              }
            />
            {(
              [
                { key: 'storeUserAgent', label: __('Store user agent', 'chatflow-forms') },
                { key: 'storeMeta', label: __('Store permitted metadata', 'chatflow-forms') },
                { key: 'respectDnt', label: __('Respect Do Not Track', 'chatflow-forms') },
              ] as const
            ).map((item) => (
              <Check
                key={item.key}
                label={item.label}
                value={settings.privacy[item.key]}
                onChange={(value) =>
                  update({ ...settings, privacy: { ...settings.privacy, [item.key]: value } })
                }
              />
            ))}
          </section>
          <section className="cff-card">
            <h2>{__('Automatic retention', 'chatflow-forms')}</h2>
            <Check
              label={__('Automatically delete old submissions', 'chatflow-forms')}
              value={settings.retention.enabled}
              onChange={(enabled) => update({ ...settings, retention: { ...settings.retention, enabled } })}
            />
            <Field
              label={__('Retention days', 'chatflow-forms')}
              type="number"
              value={settings.retention.days}
              onChange={(value) =>
                update({ ...settings, retention: { ...settings.retention, days: Number(value) } })
              }
            />
            <p>
              {__('Off by default. Per-form retention settings can override this default.', 'chatflow-forms')}
            </p>
          </section>
          <section className="cff-card">
            <h2>{__('Partial retention and spam defaults', 'chatflow-forms')}</h2>
            <Field
              label={__('Partial retention days (blank = same as completed submissions)', 'chatflow-forms')}
              type="number"
              value={settings.retention.partialDays ?? ''}
              onChange={(value) =>
                update({
                  ...settings,
                  retention: { ...settings.retention, partialDays: value ? Number(value) : null },
                })
              }
            />
            <Check
              label={__('Enable honeypot protection', 'chatflow-forms')}
              value={settings.spam?.honeypotEnabled ?? true}
              onChange={(honeypotEnabled) =>
                update({
                  ...settings,
                  spam: {
                    ...(settings.spam ?? {
                      honeypotEnabled: true,
                      minSeconds: 2,
                      rateLimit: 10,
                      rateWindowSeconds: 600,
                    }),
                    honeypotEnabled,
                  },
                })
              }
            />
            {(
              [
                { key: 'minSeconds', label: __('Minimum completion seconds', 'chatflow-forms') },
                { key: 'rateLimit', label: __('Submit attempts per visitor IP per rate window', 'chatflow-forms') },
                { key: 'rateWindowSeconds', label: __('Rate window seconds', 'chatflow-forms') },
              ] as const
            ).map((item) => (
              <Field
                key={item.key}
                label={item.label}
                type="number"
                value={
                  (settings.spam ?? {
                    honeypotEnabled: true,
                    minSeconds: 2,
                    rateLimit: 10,
                    rateWindowSeconds: 600,
                  })[item.key]
                }
                onChange={(value) =>
                  update({
                    ...settings,
                    spam: {
                      ...(settings.spam ?? {
                        honeypotEnabled: true,
                        minSeconds: 2,
                        rateLimit: 10,
                        rateWindowSeconds: 600,
                      }),
                      [item.key]: Number(value),
                    },
                  })
                }
              />
            ))}
          </section>
          <section className="cff-card">
            <h2>{__('Optional captcha and Akismet credentials', 'chatflow-forms')}</h2>
            <Select label={__('Captcha provider', 'chatflow-forms')} value={settings.spam?.captcha ?? 'none'}
              choices={[{ value: 'none', label: __('None', 'chatflow-forms') }, { value: 'turnstile', label: __('Cloudflare Turnstile', 'chatflow-forms') }, { value: 'hcaptcha', label: __('hCaptcha', 'chatflow-forms') }, { value: 'recaptcha', label: __('Google reCAPTCHA v3', 'chatflow-forms') }]}
              onChange={(captcha) => update({...settings,spam:{...settings.spam!,captcha:captcha as NonNullable<NonNullable<GlobalSettings['spam']>['captcha']>}})} />
            {([
              {key:'siteKey',label:__('Public site key','chatflow-forms')},
              {key:'secretKey',label:__('Private captcha key','chatflow-forms')},
              {key:'akismetKey',label:__('Private Akismet key','chatflow-forms')},
            ] as const).map(({key,label}) => <Field key={key} label={label} type={key === 'siteKey' ? 'text' : 'password'} value={settings.spam?.[key] ?? ''} {...(key !== 'siteKey' ? secretHelp(settings.spam?.[key]) : {})}
              onChange={(value) => update({...settings,spam:{...settings.spam!,[key]:value}})} />)}
            <Field label={__('reCAPTCHA v3 minimum score (0–1)','chatflow-forms')} type="number" value={settings.spam?.minScore ?? 0.5}
              onChange={(value) => update({...settings,spam:{...settings.spam!,minScore:Number(value)}})} />
            <Check label={__('Enable optional Akismet','chatflow-forms')} value={settings.spam?.akismetEnabled ?? false}
              onChange={(akismetEnabled) => update({...settings,spam:{...settings.spam!,akismetEnabled}})} />
            <p>{__('Secrets are stored only in private global settings. Per-form selectors opt in. Third-party checks contact the selected provider; ensure your privacy policy and consent meet its requirements. Missing credentials fail closed.','chatflow-forms')}</p>
          </section>
          <section className="cff-card">
            <h2>{__('AI assist', 'chatflow-forms')}</h2>
            <p>{__('Optional. Form editors can generate a draft form from a description and rephrase bot copy in a chosen tone. Requests run on your server and send only the description or the form’s own copy to the provider, never submissions. Leave the selected provider’s fields blank to turn AI assist off.', 'chatflow-forms')}</p>
            <Select label={__('Provider', 'chatflow-forms')} value={settings.ai?.provider ?? 'anthropic'}
              choices={[
                { value: 'anthropic', label: __('Anthropic (Claude)', 'chatflow-forms') },
                { value: 'openrouter', label: __('OpenRouter', 'chatflow-forms') },
                { value: 'openai', label: __('OpenAI-compatible endpoint', 'chatflow-forms') },
              ]}
              onChange={(provider) => setAi({ provider: provider as AiProvider })} />
            {(settings.ai?.provider ?? 'anthropic') === 'anthropic' && <Field label={__('Anthropic API key (sk-ant-…)', 'chatflow-forms')} type="password" value={settings.ai?.apiKey ?? ''} {...secretHelp(settings.ai?.apiKey)}
              onChange={(value) => setAi({ apiKey: value.trim() })} />}
            {settings.ai?.provider === 'openrouter' && <>
              <Field label={__('OpenRouter API key (sk-or-…)', 'chatflow-forms')} type="password" value={settings.ai?.openrouterKey ?? ''} {...secretHelp(settings.ai?.openrouterKey)}
                onChange={(value) => setAi({ openrouterKey: value.trim() })} />
              <Field label={__('Model (blank = openrouter/auto)', 'chatflow-forms')} value={settings.ai?.openrouterModel ?? ''} placeholder="openai/gpt-4o-mini"
                onChange={(value) => setAi({ openrouterModel: value.trim() })} />
              <p className="description">{__('Use any OpenRouter model ID. Requests only go to providers that support structured JSON output.', 'chatflow-forms')}</p>
            </>}
            {settings.ai?.provider === 'openai' && <>
              <Field label={__('Base URL (https, e.g. https://api.openai.com/v1)', 'chatflow-forms')} type="url" value={settings.ai?.baseUrl ?? ''} placeholder="https://api.openai.com/v1"
                onChange={(value) => setAi({ baseUrl: value.trim() })} />
              <Field label={__('API key (optional for keyless gateways)', 'chatflow-forms')} type="password" value={settings.ai?.compatKey ?? ''} {...secretHelp(settings.ai?.compatKey)}
                onChange={(value) => setAi({ compatKey: value.trim() })} />
              <Field label={__('Model', 'chatflow-forms')} value={settings.ai?.compatModel ?? ''} placeholder="gpt-4o-mini"
                onChange={(value) => setAi({ compatModel: value.trim() })} />
              <p className="description">{__('Works with OpenAI and services that offer the same Chat Completions API, such as Groq, Together, Mistral, DeepSeek or a self-hosted gateway. ChatFlow calls {base URL}/chat/completions and asks for JSON output; models without JSON Schema support fall back to plain JSON mode. Only public https endpoints are allowed.', 'chatflow-forms')}</p>
            </>}
          </section>
          <section className="cff-card">
            <h2>{__('Connector credentials', 'chatflow-forms')}</h2>
            <p>{__('Native connectors send submissions to these services in the background. Leave a provider blank to turn it off; a partly filled provider cannot be saved. Each form chooses which connectors it uses.', 'chatflow-forms')}</p>
            {credentialFields.map(({ type, title, fields }) => (
              <fieldset key={type}>
                <legend>{title}</legend>
                {fields.map(({ key, label, secret }) => (
                  <Field key={key} label={label} type={secret ? 'password' : 'text'}
                    {...(secret ? secretHelp((settings.connectors?.[type] as Record<string, string> | undefined)?.[key]) : {})}
                    value={(settings.connectors?.[type] as Record<string, string> | undefined)?.[key] ?? ''}
                    onChange={(value) => update({ ...settings, connectors: { ...settings.connectors!, [type]: { ...settings.connectors?.[type], [key]: value.trim() } } })} />
                ))}
              </fieldset>
            ))}
          </section>
          <section className="cff-card">
            <h2>{__('Trusted proxy configuration', 'chatflow-forms')}</h2>
            <Notice status="warning" isDismissible={false}>
              {__(
                'Leave direct mode unless the webserver verifies and isolates proxy traffic. Never trust arbitrary forwarding headers.',
                'chatflow-forms',
              )}
            </Notice>
            <Select
              label={__('Proxy mode', 'chatflow-forms')}
              value={settings.proxy.mode}
              choices={['automatic', 'direct', 'cloudflare', 'custom'].map((value) => ({ value, label: value }))}
              onChange={(mode) =>
                update({
                  ...settings,
                  proxy: { ...settings.proxy, mode: mode as GlobalSettings['proxy']['mode'] },
                })
              }
            />
            <Area
              label={__('Trusted CIDR ranges (one per line)', 'chatflow-forms')}
              value={settings.proxy.trustedRanges.join('\n')}
              onChange={(value) =>
                update({
                  ...settings,
                  proxy: {
                    ...settings.proxy,
                    trustedRanges: value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
            <Select
              label={__('Verified proxy header', 'chatflow-forms')}
              value={settings.proxy.header}
              choices={['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CF_CONNECTING_IP'].map((value) => ({
                value,
                label: value,
              }))}
              onChange={(header) =>
                update({
                  ...settings,
                  proxy: { ...settings.proxy, header: header as GlobalSettings['proxy']['header'] },
                })
              }
            />
          </section>
          <section className="cff-card">
            <h2>{__('Global email layout', 'chatflow-forms')}</h2>
            {smtpDetected === false && <Notice status="warning" isDismissible={false}>{__('No recognized SMTP mailer detected. Configure a reliable mailer and test inbox delivery; wp_mail acceptance does not prove delivery.', 'chatflow-forms')}</Notice>}
            {smtpDetected === null && <p>{__('SMTP status is unknown. Verify your mail transport and test inbox delivery.', 'chatflow-forms')}</p>}
            {(
              [
                { key: 'fromName', label: __('From name', 'chatflow-forms') },
                { key: 'fromEmail', label: __('From email', 'chatflow-forms') },
                { key: 'replyTo', label: __('Reply-To', 'chatflow-forms') },
                { key: 'logoUrl', label: __('Logo URL', 'chatflow-forms') },
                { key: 'brandColor', label: __('Brand colour', 'chatflow-forms') },
                { key: 'footerText', label: __('Footer text', 'chatflow-forms') },
              ] as const
            ).map((item) => (
              <Field
                key={item.key}
                label={item.label}
                value={settings.email[item.key]}
                onChange={(value) => update({ ...settings, email: { ...settings.email, [item.key]: value } })}
              />
            ))}
          </section>
          <section className="cff-card">
            <h2>{__('Uninstall data', 'chatflow-forms')}</h2>
            <Check
              label={__('Delete this site’s forms and submissions on plugin uninstall', 'chatflow-forms')}
              value={settings.delete_data_on_uninstall}
              onChange={(delete_data_on_uninstall) => {
                if (
                  !delete_data_on_uninstall ||
                  window.confirm(
                    __(
                      'Uninstall will permanently delete this site’s plugin data. Enable this?',
                      'chatflow-forms',
                    ),
                  )
                )
                  update({ ...settings, delete_data_on_uninstall });
              }}
            />
            <p>
              {__(
                'Deactivation never deletes data. Multisite uses each site’s own setting.',
                'chatflow-forms',
              )}
            </p>
          </section>
        </div>
        <Button
          variant="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              const result = await api.request<{ settings: GlobalSettings }>('admin/settings', 'PUT', {
                settings,
              });
              setSettings(result.settings);
              setSaved(true);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {__('Save settings', 'chatflow-forms')}
        </Button>
      </fieldset>
    </main>
  );
}
