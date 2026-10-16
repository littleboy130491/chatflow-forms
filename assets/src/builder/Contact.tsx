/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Area, Button, Field } from './controls';
import { parseWhatsapp, whatsappNumber, whatsappUrl } from '../shared/whatsapp';
import type { FormSchema } from './api';

/**
 * Number + message → wa.me link. Merge tags such as {{name}} stay in the message
 * and are replaced with the visitor's answers when the link is opened.
 */
export function WhatsAppLinkBuilder({ url, onChange }: { url: string | undefined; onChange: (url: string) => void }) {
  const parsed = parseWhatsapp(url ?? '');
  const [phone, setPhone] = useState(parsed?.phone ?? '');
  const [message, setMessage] = useState(parsed?.message ?? '');
  useEffect(() => { const next = parseWhatsapp(url ?? ''); if (next) { setPhone(next.phone); setMessage(next.message); } }, [url]);
  const valid = whatsappNumber(phone).length >= 7;
  return <div className="cff-whatsapp-builder">
    <Field label={__('WhatsApp number with country code', 'chatflow-forms')} value={phone} placeholder="6281234567890" onChange={setPhone} />
    <Area label={__('Pre-filled message (merge tags allowed, e.g. {{name}})', 'chatflow-forms')} value={message} onChange={setMessage} />
    <Button variant="secondary" disabled={!valid} onClick={() => onChange(whatsappUrl(phone, message))}>{__('Use this WhatsApp link', 'chatflow-forms')}</Button>
    {!valid && phone !== '' && <p className="description">{__('Enter the full number including the country code, for example 6281234567890.', 'chatflow-forms')}</p>}
  </div>;
}

/** Optional link in the chat header so visitors can talk to you directly instead of finishing the form. */
export function ContactLinkEditor({ schema, onChange }: { schema: FormSchema; onChange: (schema: FormSchema) => void }) {
  const contact = schema.bot.contact;
  const [open, setOpen] = useState(Boolean(contact?.url));
  const set = (next: { label?: string; url?: string } | null) => {
    const bot = { ...schema.bot };
    if (next && (next.url ?? '') !== '') bot.contact = { url: next.url!, ...(next.label ? { label: next.label } : {}) };
    else delete bot.contact;
    onChange({ ...schema, bot });
  };
  return <section className="cff-contact-link">
    <h3>{__('Direct contact link', 'chatflow-forms')}</h3>
    <p className="description">{__('Shows a button in the chat header, so visitors can contact you directly (for example on WhatsApp) at any point instead of finishing the form.', 'chatflow-forms')}</p>
    <label className="cff-inline-check"><input type="checkbox" checked={open} onChange={event => { setOpen(event.currentTarget.checked); if (!event.currentTarget.checked) set(null); }} />{__('Show a contact button in the chat header', 'chatflow-forms')}</label>
    {open && <>
      <WhatsAppLinkBuilder url={contact?.url} onChange={url => set({ ...contact, url })} />
      <Field label={__('Link (WhatsApp, https, tel: or mailto:; merge tags allowed)', 'chatflow-forms')} value={contact?.url ?? ''} placeholder="https://wa.me/6281234567890" onChange={url => set({ ...contact, url: url.trim() })} />
      <Field label={__('Button label (blank = “WhatsApp” or “Contact us”)', 'chatflow-forms')} value={contact?.label ?? ''} onChange={label => set({ url: contact?.url ?? '', label })} />
    </>}
  </section>;
}
