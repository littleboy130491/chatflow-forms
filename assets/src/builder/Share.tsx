/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { toDataURL } from 'qrcode';
import { prefillUrl } from '../shared/prefill';
import type { AdminConfig, FormDTO } from './api';
import { errorMessage } from './api';
import { Button, Field, Notice } from './controls';

/** Shortcode matching the form's own display settings. */
export function shortcode(form: FormDTO): string {
  const display = form.settings.display ?? {};
  const mode = display.mode ?? 'inline';
  const position =
    (mode === 'launcher' || mode === 'popup') && display.launcher?.position === 'left' ? ' position="left"' : '';
  return `[chatflow id="${form.id}" mode="${mode}"${position}]`;
}
/** A saved draft is not a public form. Never manufacture a URL without a published slug. */
export function publicFormUrl(form: FormDTO, config: AdminConfig): string | null {
  if (!form.id || form.version < 1 || !form.slug) return null;
  return `${(config.siteUrl ?? location.origin).replace(/\/+$/, '')}/${(config.fullpageBase ?? 'chat').replace(/^\/+|\/+$/g, '')}/${encodeURIComponent(form.slug)}/`;
}
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [message, setMessage] = useState('');
  useEffect(() => setMessage(''), [text]);
  return <span className="cff-copy-control"><Button variant="secondary" onClick={async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(__('Copied', 'chatflow-forms'));
    } catch {
      setMessage(__('Copy unavailable. Select and copy the text instead.', 'chatflow-forms'));
    }
  }}>{label}</Button><span role="status">{message}</span></span>;
}
export function PublicLinkActions({ url }: { url: string }) {
  return <div className="cff-share-actions"><a className="button button-secondary" href={url} target="_blank" rel="noopener noreferrer">{__('Open form', 'chatflow-forms')}</a><CopyButton text={url} label={__('Copy link', 'chatflow-forms')} /></div>;
}
const attribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function Share({ form, config }: { form: FormDTO; config: AdminConfig }) {
  const [values, setValues] = useState<Record<string, string>>({}), [qr, setQr] = useState(''), [error, setError] = useState('');
  const [mode, setMode] = useState('link');
  const base = publicFormUrl(form, config);
  const url = useMemo(() => base ? prefillUrl(base, values, form.schema) : '', [base, values, form.schema]);
  useEffect(() => {
    let cancelled = false;
    setQr(''); setError('');
    if (mode === 'qr' && url) {
      void toDataURL(url, { width: 240, margin: 2, errorCorrectionLevel: 'M' }).then(value => { if (!cancelled) setQr(value); }).catch(err => { if (!cancelled) setError(errorMessage(err)); });
    }
    return () => { cancelled = true; };
  }, [url, mode]);
  if (!base) return <section className="cff-share-empty"><h3>{__('Publish your form to get a shareable link', 'chatflow-forms')}</h3><p>{__('Save your draft, then choose Publish. Your link, embeds and QR code will appear here when the form is live.', 'chatflow-forms')}</p></section>;
  const embed = `<cff-chat data-form-id="${form.id}" data-rest-url="${attribute(config.restUrl)}"></cff-chat>`;
  return <section className="cff-share">
    <nav className="cff-tabs" aria-label={__('Sharing options', 'chatflow-forms')}>
      {[
        { value: 'link', label: __('Link', 'chatflow-forms') },
        { value: 'embed', label: __('Embed', 'chatflow-forms') },
        { value: 'qr', label: __('QR code', 'chatflow-forms') },
      ].map(item => <Button key={item.value} variant={mode === item.value ? 'primary' : 'secondary'} aria-pressed={mode === item.value} onClick={() => setMode(item.value)}>{item.label}</Button>)}
    </nav>
    {mode === 'link' && <section>
      <h3>{__('Share a link', 'chatflow-forms')}</h3>
      <p><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></p>
      <PublicLinkActions url={url} />
    </section>}
    {mode === 'embed' && <section>
      <h3>{__('Add to a WordPress page', 'chatflow-forms')}</h3>
      <p>{__('Use the ChatFlow Form block, paste this shortcode into a Shortcode block, or use an Elementor Shortcode widget.', 'chatflow-forms')}</p>
      <pre>{shortcode(form)}</pre><CopyButton text={shortcode(form)} label={__('Copy shortcode', 'chatflow-forms')} />
      <p>{__('Automatic launcher placement and popup triggers are set per form in Settings → Display.', 'chatflow-forms')}</p>
      <details><summary>{__('Advanced custom element', 'chatflow-forms')}</summary>
        <p>{__('Custom elements require the plugin runtime asset. Never include tokens or private settings in HTML.', 'chatflow-forms')}</p>
        <pre>{embed}</pre><CopyButton text={embed} label={__('Copy custom element', 'chatflow-forms')} />
      </details>
    </section>}
    {mode === 'qr' && <section>
      <h3>{__('Share a QR code', 'chatflow-forms')}</h3>
      {qr ? <p><img src={qr} width={240} height={240} alt={__('Form URL QR code', 'chatflow-forms')} /><br /><a href={qr} download="chatflow-qr.png">{__('Download QR code', 'chatflow-forms')}</a></p> : !error && <p role="status">{__('Preparing QR code…', 'chatflow-forms')}</p>}
      <p>{url}</p>
    </section>}
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
    {mode !== 'embed' && <details><summary>{__('Advanced: prefill answers', 'chatflow-forms')}</summary>
      <p>{__('Prefill suggests editable answers; it never skips validation or gives consent. URLs can enter history and server logs: do not include personal or secret data.', 'chatflow-forms')}</p>
      {form.schema.steps.filter(step => !['hidden', 'calculated', 'file_upload', 'consent', 'statement', 'summary', 'media', 'address'].includes(step.type)).map(step => <Field key={step.id} label={step.label} value={values[step.key] ?? ''} onChange={value => setValues({ ...values, [step.key]: value })} />)}
    </details>}
  </section>;
}
