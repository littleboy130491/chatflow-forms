/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
import type { FieldProps, Step } from './types';
import { Markdown, safeLink } from './content';
import type { PublicForm } from './types';
import { fieldRenderer } from './registry';
import { AddressInput, MediaInput, UploadInput } from './phase2-inputs';

export function toggleChoice(current: string[], value: string, options: NonNullable<Step['options']>): string[] {
  if (current.includes(value)) return current.filter(v => v !== value);
  if (options.find(option => option.value === value)?.isExclusive) return [value];
  return [...current.filter(v => !options.find(option => option.value === v)?.isExclusive), value];
}

export function normalizePhone(raw: string, country: CountryCode = 'ID'): string {
  const phone = parsePhoneNumberFromString(raw, country);
  return phone?.isValid() ? phone.number : raw.trim();
}

function ChipInput(props: FieldProps & { media?: PublicForm['form']['media'] }) {
  const { step, disabled, onAnswer, phrase } = props;
  const options = step.type === 'yes_no' ? [{ id: 'yes', value: true, label: phrase('yes') }, { id: 'no', value: false, label: phrase('no') }] : step.options ?? [];
  const [selected, setSelected] = useState<string[]>(Array.isArray(props.value) ? props.value : []);
  const initialOther = props.value && typeof props.value === 'object' && !Array.isArray(props.value) ? props.value as { value?: unknown; other?: unknown } : null;
  const [dropdown, setDropdown] = useState(typeof props.value === 'string' ? props.value : typeof initialOther?.value === 'string' ? initialOther.value : '');
  const [otherOption, setOtherOption] = useState(typeof initialOther?.value === 'string' ? initialOther.value : '');
  const [other, setOther] = useState(typeof initialOther?.other === 'string' ? initialOther.other : '');
  const ref = useRef<HTMLDivElement>(null);
  const multi = step.type === 'multi_choice';
  const choose = (value: string | boolean) => {
    if (disabled) return;
    if (multi) setSelected(toggleChoice(selected, String(value), step.options ?? []));
    else if (step.options?.some(option => option.value === value && option.isOther)) setOtherOption(String(value));
    else { setOtherOption(''); onAnswer(value); }
  };
  const otherInput = (option: string) => <div className="other-input"><label for={`other-${step.id}`}>{phrase('other')}</label><input id={`other-${step.id}`} type="text" value={other} maxLength={1000} disabled={disabled} aria-invalid={!!props.error} aria-describedby={`help-${step.id} error-${step.id}`} onInput={event => setOther(event.currentTarget.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (other.trim()) onAnswer({ value: option, other }); } }} /></div>;
  useEffect(() => { if (otherOption) ref.current?.querySelector<HTMLInputElement>(`#other-${step.id}`)?.focus(); }, [otherOption, step.id]);
  const keyboard = (event: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) return;
    const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('.chip') ?? []);
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (/^[1-9]$/.test(event.key) && options[Number(event.key) - 1]) { event.preventDefault(); choose(options[Number(event.key) - 1]!.value); }
    else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  };
  const dropdownOther = step.options?.some(option => option.value === dropdown && option.isOther) === true;
  if (step.settings?.layout === 'dropdown' && !multi && step.type !== 'yes_no') return <form onSubmit={e => { e.preventDefault(); onAnswer(dropdownOther ? { value: dropdown, other } : dropdown); }}>
    <label for={`input-${step.id}`}>{step.label}</label>
    <select id={`input-${step.id}`} disabled={disabled} value={dropdown} onChange={e => setDropdown(e.currentTarget.value)} aria-describedby={`help-${step.id} error-${step.id}`}>
      <option value="">{step.placeholder ?? phrase('continue')}</option>{options.map(option => <option key={option.id} value={String(option.value)}>{option.label}</option>)}
    </select>{dropdownOther && otherInput(dropdown)}<button disabled={disabled || !dropdown || (dropdownOther && !other.trim())}>{step.settings.buttonLabel ?? phrase('continue')}</button>
  </form>;
  return <div ref={ref} role="group" aria-label={step.label} onKeyDown={keyboard} className={step.settings?.layout === 'cards' ? 'chips cards' : 'chips'}>
    {options.map(option => <button className="chip" type="button" key={option.id} disabled={disabled} aria-pressed={multi ? selected.includes(String(option.value)) : (otherOption || props.value) === option.value} onClick={() => choose(option.value)}>
      {'image' in option && typeof option.image === 'number' && props.media?.[option.image] && safeLink(props.media[option.image]!.url)?.startsWith('http') && <img src={safeLink(props.media[option.image]!.url)!} alt={props.media[option.image]!.alt ?? ''} loading="lazy" />}
      {'emoji' in option && typeof option.emoji === 'string' && <span aria-hidden="true">{option.emoji} </span>}{option.label}
    </button>)}
    {!multi && otherOption && <form onSubmit={e => { e.preventDefault(); onAnswer({ value: otherOption, other }); }}>{otherInput(otherOption)}<button disabled={disabled || !other.trim()}>{step.settings?.buttonLabel ?? phrase('continue')}</button></form>}
    {multi && <button className="continue" disabled={disabled} onClick={() => onAnswer(selected)}>{step.settings?.buttonLabel ?? phrase('continue')}</button>}
  </div>;
}

function TextInput({ step, value, disabled, onAnswer, phrase, error }: FieldProps) {
  const [draft, setDraft] = useState(value === null || value === undefined ? '' : String(value));
  const defaultCountry = (step.settings?.country ?? 'ID') as CountryCode;
  const [country, setCountry] = useState<CountryCode>(getCountries().includes(defaultCountry) ? defaultCountry : 'ID');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const submit = () => onAnswer(step.type === 'number' ? (draft.trim() ? Number(draft) : null) : step.type === 'phone' ? normalizePhone(draft, country) : draft);
  useEffect(() => { if (textarea.current) { textarea.current.style.height = 'auto'; textarea.current.style.height = `${Math.min(240, textarea.current.scrollHeight)}px`; } }, [draft]);
  const type = step.type === 'email' ? 'email' : step.type === 'phone' ? 'tel' : step.type === 'number' ? 'number' : step.type === 'date' ? 'date' : 'text';
  const common = { id: `input-${step.id}`, value: draft, disabled, placeholder: step.placeholder, 'aria-invalid': !!error, 'aria-describedby': `help-${step.id} error-${step.id}`, maxLength: step.validation?.maxLength, autoComplete: step.settings?.autocomplete ?? (step.type === 'email' ? 'email' : step.type === 'phone' ? 'tel-national' : 'off'), onInput: (event: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.currentTarget.value) };
  return <form noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
    <label for={`input-${step.id}`}>{step.label}</label>
    {step.type === 'phone' && <label className="country">{phrase('country')}<select value={country} disabled={disabled} onChange={e => setCountry(e.currentTarget.value as CountryCode)}>{getCountries().map(code => <option value={code} key={code}>{code} +{getCountryCallingCode(code)}</option>)}</select></label>}
    {step.type === 'long_text' ? <>
      <textarea {...common} ref={textarea} rows={3} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(); } }} />
      <small>{phrase('longTextHint')} · {draft.length}{step.validation?.maxLength ? `/${step.validation.maxLength}` : ''} {phrase('characters')}</small>
    </> : <div className="input-row"><input {...common} type={type} inputMode={step.settings?.inputMode ?? (step.type === 'number' ? 'decimal' : step.type === 'email' ? 'email' : step.type === 'phone' ? 'tel' : 'text')} min={step.validation?.min} max={step.validation?.max} step={step.validation?.step ?? (step.type === 'number' ? 'any' : undefined)} />{step.settings?.unit && <span>{step.settings.unit}</span>}</div>}
    <button type="submit" disabled={disabled}>{step.settings?.buttonLabel ?? phrase('continue')}</button>
  </form>;
}

/** Score choices submit a numeric answer, not a string or a display-only label. */
export function ScoreInput({ step, value, disabled, onAnswer }: FieldProps) {
  const min = step.type === 'nps' ? 0 : 1;
  const max = step.type === 'rating' ? 5 : 10;
  const selected = typeof value === 'number' ? value : null;
  const values = Array.from({ length: max - min + 1 }, (_, index) => index + min);
  return <div role="group" aria-label={step.label} className="score-input">
    {values.map(option => <button
      type="button"
      className="chip score-chip"
      key={option}
      disabled={disabled}
      aria-label={`${option} / ${max}`}
      aria-pressed={selected === option}
      onClick={() => onAnswer(option)}
    >{step.type === 'rating' ? <><span aria-hidden="true">★</span> {option}</> : option}</button>)}
  </div>;
}

/** No answer is stored until the visitor explicitly confirms the slider position. */
export function SliderInput({ step, value, disabled, onAnswer, phrase }: FieldProps) {
  const min = typeof step.validation?.min === 'number' ? step.validation.min : 0;
  const max = typeof step.validation?.max === 'number' ? step.validation.max : 100;
  const increment = step.validation?.step ?? 1;
  const [draft, setDraft] = useState(typeof value === 'number' ? value : min);
  return <form onSubmit={event => { event.preventDefault(); onAnswer(draft); }}>
    <label for={`input-${step.id}`}>{step.label}</label>
    <div className="slider-reading"><span>{min}</span><output for={`input-${step.id}`}>{draft}{step.settings?.unit ? ` ${step.settings.unit}` : ''}</output><span>{max}</span></div>
    <input id={`input-${step.id}`} type="range" min={min} max={max} step={increment} value={draft} disabled={disabled}
      onInput={event => setDraft(Number(event.currentTarget.value))} />
    <button type="submit" disabled={disabled}>{step.settings?.buttonLabel ?? phrase('continue')}</button>
  </form>;
}

function ConsentInput({ step, value, disabled, onAnswer, phrase }: FieldProps) {
  const [checked, setChecked] = useState(value === true);
  const privacy = step.settings?.privacyUrl ? safeLink(step.settings.privacyUrl) : null;
  return <form onSubmit={e => { e.preventDefault(); onAnswer(checked); }}>
    <label className="consent"><input type="checkbox" disabled={disabled} checked={checked} onChange={e => setChecked(e.currentTarget.checked)} /><span><Markdown text={step.settings?.consentText ?? step.label} /></span></label>
    {privacy && <a href={privacy} target="_blank" rel="noopener noreferrer">{phrase('privacy')}</a>}
    <button disabled={disabled}>{step.settings?.buttonLabel ?? phrase('continue')}</button>
  </form>;
}
export function FieldInput(props: FieldProps & { media?: PublicForm['form']['media'] }) {
  const type = props.step.type;
  const Registered = fieldRenderer(type);
  if (Registered) return <Registered {...props} />;
  if (type === 'address') return <AddressInput {...props} />;
  if (type === 'media') return <MediaInput {...props} />;
  if (type === 'file_upload') return <UploadInput {...props} />;
  if (['single_choice', 'multi_choice', 'yes_no'].includes(type)) return <ChipInput {...props} />;
  if (['rating', 'scale', 'nps'].includes(type)) return <ScoreInput {...props} />;
  if (type === 'slider') return <SliderInput {...props} />;
  if (type === 'consent') return <ConsentInput {...props} />;
  if (['short_text', 'long_text', 'email', 'phone', 'number', 'date'].includes(type)) return <TextInput {...props} />;
  return <p role="alert">{props.phrase('unsupported')}</p>;
}
