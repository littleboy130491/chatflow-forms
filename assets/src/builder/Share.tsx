/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { toDataURL } from 'qrcode';
import { prefillUrl } from '../shared/prefill';
import type { AdminConfig, FormDTO } from './api';
import { errorMessage } from './api';
import { Field, Notice } from './controls';

export function Share({ form, config }: { form: FormDTO; config: AdminConfig }) {
  const [values, setValues] = useState<Record<string, string>>({}), [qr, setQr] = useState(''), [error, setError] = useState('');
  const base = `${config.siteUrl ?? location.origin + '/'}${config.fullpageBase ?? 'chat'}/${form.slug}/`;
  const url = useMemo(() => prefillUrl(base, values, form.schema), [base, values, form.schema]);
  useEffect(() => {
    let cancelled = false; setQr(''); setError('');
    void toDataURL(url, { width: 240, margin: 2, errorCorrectionLevel: 'M' }).then(value => { if (!cancelled) setQr(value); }).catch(err => { if (!cancelled) setError(errorMessage(err)); });
    return () => { cancelled = true; };
  }, [url]);
  return <section>
    <h3>{__('Full-page URL and QR code', 'chatflow-forms')}</h3>
    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
    {qr && <p><img src={qr} width={240} height={240} alt={__('Form URL QR code', 'chatflow-forms')} /><br /><a href={qr} download="chatflow-qr.png">{__('Download QR code', 'chatflow-forms')}</a></p>}
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
    <h3>{__('Prefill URL builder', 'chatflow-forms')}</h3>
    <p>{__('Prefill suggests editable answers; it never skips validation or gives consent. URLs can enter history and server logs: do not include personal or secret data.', 'chatflow-forms')}</p>
    {form.schema.steps.filter(step => !['hidden', 'calculated', 'file_upload', 'consent', 'statement', 'summary', 'media', 'address'].includes(step.type)).map(step => <Field key={step.id} label={step.label} value={values[step.key] ?? ''} onChange={value => setValues({ ...values, [step.key]: value })} />)}
    <p>{__('Configure site-wide launcher rules and popup triggers in Settings → Display and engagement.', 'chatflow-forms')}</p>
  </section>;
}
