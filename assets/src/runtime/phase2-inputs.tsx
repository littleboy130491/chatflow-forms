/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import type { FieldProps, PublicForm } from './types';
import { safeLink } from './content';

export function AddressInput({ step, value, onAnswer, disabled, phrase, error }: FieldProps) {
  const fields = step.settings?.addressFields ?? ['street', 'city', 'postcode', 'country'];
  const initial = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const [draft, setDraft] = useState<Record<string, string>>(Object.fromEntries(fields.map(key => [key, typeof initial[key] === 'string' ? initial[key] : ''])));
  const autocomplete: Record<string, string> = { street: 'street-address', city: 'address-level2', postcode: 'postal-code', country: 'country-name' };
  return <form onSubmit={event => { event.preventDefault(); onAnswer(draft); }}><fieldset disabled={disabled}><legend>{step.label}</legend>{fields.map(key => <label key={key} for={`input-${step.id}-${key}`}>{phrase(`address_${key}`)}<input id={`input-${step.id}-${key}`} value={draft[key] ?? ''} required={step.required} maxLength={500} autoComplete={autocomplete[key]} onInput={event => setDraft({ ...draft, [key]: event.currentTarget.value })} /></label>)}</fieldset>{error && <p role="alert">{error}</p>}<button disabled={disabled}>{phrase('continue')}</button></form>;
}
export function UploadInput({ step, upload, onAnswer, disabled, phrase, value, error }: FieldProps) {
  const [busy, setBusy] = useState(false); const [failed, setFailed] = useState(false); const [name, setName] = useState('');
  const max = Math.min(52428800, step.validation?.maxBytes ?? 10485760);
  return <div><label for={`input-${step.id}`}>{step.label}</label><input id={`input-${step.id}`} type="file" disabled={disabled || busy || !upload} accept={step.validation?.mimeTypes?.join(',')} onChange={async event => {
    const input = event.currentTarget; const file = input.files?.[0]; if (!file || !upload) return;
    setFailed(false); if (file.size > max || file.size < 1) { setFailed(true); input.value = ''; return; }
    setBusy(true);
    try { const result = await upload(file); setName(result.name); onAnswer(result.uploadId); }
    // Clear the picker so choosing the same file again retries the upload.
    catch { setFailed(true); input.value = ''; }
    finally { setBusy(false); }
  }} /><small>{phrase('uploadLimit')} {Math.round(max / 1048576 * 10) / 10} MB</small>{busy && <p role="status">{phrase('uploading')}</p>}{failed && <p role="alert">{phrase('uploadFailed')}</p>}{error && <p role="alert">{error}</p>}{!upload && <p role="alert">{phrase('unsupported')}</p>}{(name || typeof value === 'string') && <p>{name || phrase('uploadSaved')}</p>}{(!step.required || typeof value === 'string') && <button disabled={disabled || busy || !upload} onClick={() => onAnswer(value ?? null)}>{phrase('continue')}</button>}</div>;
}
export function MediaInput({ step, media, disabled, onAnswer, phrase }: FieldProps & { media?: PublicForm['form']['media'] }) {
  const config = step.settings?.media;
  const url = safeLink((config?.attachmentId ? media?.[config.attachmentId]?.url : config?.url) ?? '');
  const valid = url && /^https?:/.test(url);
  return <div>{valid && (config?.type === 'video' ? <video controls preload="metadata" src={url} aria-label={config.alt ?? step.label} /> : <img src={url} alt={config?.alt ?? step.label} loading="lazy" />)}<button disabled={disabled} onClick={() => onAnswer(null)}>{step.settings?.buttonLabel ?? phrase('continue')}</button></div>;
}
