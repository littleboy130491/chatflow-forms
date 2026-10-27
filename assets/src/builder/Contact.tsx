/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AnswerArea, Area, Button, Field, Select } from './controls';
import { ColorField } from './ThemeEditor';
import { isWhatsapp, parseWhatsapp, whatsappNumber, whatsappUrl } from '../shared/whatsapp';
import { WEEKDAYS, type Weekday } from '../shared/hours';
import type { FormSchema, Step } from './api';

/**
 * Number + message → wa.me link. Merge tags such as {{name}} stay in the message
 * and are replaced with the visitor's answers when the link is opened.
 */
export function WhatsAppLinkBuilder({ url, onChange, steps = [] }: { url: string | undefined; onChange: (url: string) => void; steps?: Step[] }) {
  const parsed = parseWhatsapp(url ?? '');
  const [phone, setPhone] = useState(parsed?.phone ?? '');
  const [message, setMessage] = useState(parsed?.message ?? '');
  useEffect(() => { const next = parseWhatsapp(url ?? ''); if (next) { setPhone(next.phone); setMessage(next.message); } }, [url]);
  const valid = whatsappNumber(phone).length >= 7;
  return <div className="cff-whatsapp-builder">
    <Field label={__('WhatsApp number with country code', 'chatflow-forms')} value={phone} placeholder="6281234567890" onChange={setPhone} />
    <AnswerArea label={__('Pre-filled message', 'chatflow-forms')} value={message} onChange={setMessage} steps={steps} />
    <Button variant="secondary" disabled={!valid} onClick={() => onChange(whatsappUrl(phone, message))}>{__('Use this WhatsApp link', 'chatflow-forms')}</Button>
    {!valid && phone !== '' && <p className="description">{__('Enter the full number including the country code, for example 6281234567890.', 'chatflow-forms')}</p>}
  </div>;
}

/** Optional button under the conversation so visitors can talk to you directly instead of finishing the form. */
type Contact = NonNullable<FormSchema['bot']['contact']>;
type Hours = NonNullable<Contact['hours']>;
const dayLabels = (): Record<Weekday, string> => ({ mon: __('Monday', 'chatflow-forms'), tue: __('Tuesday', 'chatflow-forms'), wed: __('Wednesday', 'chatflow-forms'), thu: __('Thursday', 'chatflow-forms'), fri: __('Friday', 'chatflow-forms'), sat: __('Saturday', 'chatflow-forms'), sun: __('Sunday', 'chatflow-forms') });

/** Weekly hours for the contact button; outside them the button hides or a message shows instead. */
export function HoursEditor({ hours, timezone, onChange }: { hours: Hours | undefined; timezone: string; onChange: (hours: Hours | undefined) => void }) {
  const labels = dayLabels();
  const enabled = hours?.enabled === true;
  const days = hours?.days ?? {};
  const setDay = (day: Weekday, range: { from: string; to: string } | null) => {
    const next = { ...days };
    if (range) next[day] = range; else delete next[day];
    onChange({ ...hours, days: next });
  };
  return <fieldset className="cff-hours">
    <legend>{__('Working hours', 'chatflow-forms')}</legend>
    <label className="cff-inline-check"><input type="checkbox" checked={enabled} onChange={event => onChange(event.currentTarget.checked
      ? { timezone, days: Object.fromEntries((['mon', 'tue', 'wed', 'thu', 'fri'] as Weekday[]).map(day => [day, { from: '09:00', to: '17:00' }])), outside: 'hide', ...hours, enabled: true }
      : { ...hours, enabled: false })} />{__('Only show the button during working hours', 'chatflow-forms')}</label>
    {enabled && <>
      <Field label={__('Time zone (e.g. Asia/Jakarta or +07:00)', 'chatflow-forms')} value={hours?.timezone ?? timezone} onChange={value => onChange({ ...hours, timezone: value.trim() })} />
      <table className="cff-hours-table"><tbody>
        {WEEKDAYS.map(day => {
          const range = days[day];
          return <tr key={day}>
            <th scope="row"><label><input type="checkbox" checked={Boolean(range)} onChange={event => setDay(day, event.currentTarget.checked ? { from: '09:00', to: '17:00' } : null)} />{labels[day]}</label></th>
            <td>{range ? <><input type="time" aria-label={`${labels[day]}: ${__('opens', 'chatflow-forms')}`} value={range.from} onChange={event => setDay(day, { ...range, from: event.currentTarget.value })} /> – <input type="time" aria-label={`${labels[day]}: ${__('closes', 'chatflow-forms')}`} value={range.to} onChange={event => setDay(day, { ...range, to: event.currentTarget.value })} /></> : <span className="description">{__('Closed', 'chatflow-forms')}</span>}</td>
          </tr>;
        })}
      </tbody></table>
      <p className="description">{__('A range that ends before it starts (22:00–02:00) runs past midnight; 00:00–00:00 means all day.', 'chatflow-forms')}</p>
      <Select label={__('Outside working hours', 'chatflow-forms')} value={hours?.outside ?? 'hide'} choices={[{ value: 'hide', label: __('Hide the button', 'chatflow-forms') }, { value: 'message', label: __('Show a message instead', 'chatflow-forms') }]} onChange={outside => onChange({ ...hours, outside: outside === 'message' ? 'message' : 'hide' })} />
      {hours?.outside === 'message' && <Area label={__('Message outside working hours (merge tags allowed)', 'chatflow-forms')} value={hours.message ?? ''} onChange={message => onChange({ ...hours, message })} />}
    </>}
  </fieldset>;
}

const iconChoices = (): { value: NonNullable<Contact['icon']>; label: string }[] => [
  { value: 'auto', label: __('Automatic (from the link)', 'chatflow-forms') },
  { value: 'whatsapp', label: __('WhatsApp', 'chatflow-forms') },
  { value: 'chat', label: __('Chat bubble', 'chatflow-forms') },
  { value: 'phone', label: __('Phone', 'chatflow-forms') },
  { value: 'email', label: __('Email', 'chatflow-forms') },
  { value: 'none', label: __('No icon', 'chatflow-forms') },
];

/** Optional button under the conversation so visitors can talk to you directly instead of finishing the form. */
export function ContactLinkEditor({ schema, timezone = 'UTC', onChange }: { schema: FormSchema; timezone?: string | undefined; onChange: (schema: FormSchema) => void }) {
  const contact = schema.bot.contact;
  const [open, setOpen] = useState(Boolean(contact?.url));
  // Merge a change into the stored link; empty values fall back to the defaults, and no URL removes the button.
  const set = (patch: { [K in keyof Contact]?: Contact[K] | undefined } | null) => {
    const bot = { ...schema.bot };
    const next: { [K in keyof Contact]?: Contact[K] | undefined } = patch ? { ...contact, ...patch } : {};
    for (const key of Object.keys(next) as (keyof Contact)[]) if (next[key] === undefined || next[key] === '' || (key === 'icon' && next[key] === 'auto')) delete next[key];
    if (next.url) bot.contact = next as Contact; else delete bot.contact;
    onChange({ ...schema, bot });
  };
  const whatsapp = isWhatsapp(contact?.url ?? '');
  return <section className="cff-contact-link">
    <h3>{__('Direct contact link', 'chatflow-forms')}</h3>
    <p className="description">{__('Shows a button below the conversation, so visitors can contact you directly (for example on WhatsApp) at any point instead of finishing the form.', 'chatflow-forms')}</p>
    <label className="cff-inline-check"><input type="checkbox" checked={open} onChange={event => { setOpen(event.currentTarget.checked); if (!event.currentTarget.checked) set(null); }} />{__('Show a contact button below the conversation', 'chatflow-forms')}</label>
    {open && <>
      <WhatsAppLinkBuilder url={contact?.url} steps={schema.steps} onChange={url => set({ url })} />
      <p className="description">{__('This opens an external contact link, not a live-agent inbox. Answers are saved only if partial saving is enabled; contacting you does not submit the form.', 'chatflow-forms')}</p>
      <Field label={__('Link (WhatsApp, https, tel: or mailto:; merge tags allowed)', 'chatflow-forms')} value={contact?.url ?? ''} placeholder="https://wa.me/6281234567890" onChange={url => set({ url: url.trim() })} />
      <Field label={__('Button text (blank = “Chat on WhatsApp” or “Contact us”)', 'chatflow-forms')} value={contact?.label ?? ''} onChange={label => set({ label })} />
      <Select label={__('Icon', 'chatflow-forms')} value={contact?.icon ?? 'auto'} choices={iconChoices()} onChange={icon => set({ icon: icon as Contact['icon'] })} />
      <div className="cff-color-grid">
        <ColorField label={__('Button colour', 'chatflow-forms')} value={contact?.color} fallback={whatsapp ? '#25d366' : '#3390ec'} onChange={color => set({ color })} />
        <ColorField label={__('Button text colour', 'chatflow-forms')} value={contact?.textColor} fallback="#ffffff" onChange={textColor => set({ textColor })} />
      </div>
      <HoursEditor hours={contact?.hours} timezone={timezone} onChange={hours => set({ hours })} />
      {contact?.url && <p className="cff-contact-sample" aria-hidden="true"><span style={{ background: contact.color ?? (whatsapp ? '#25d366' : '#3390ec'), color: contact.textColor ?? '#ffffff' }}>{contact.label || (whatsapp ? __('Chat on WhatsApp', 'chatflow-forms') : __('Contact us', 'chatflow-forms'))}</span></p>}
    </>}
  </section>;
}
