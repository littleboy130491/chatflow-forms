/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { interpolate } from '../shared/logic';
import { RuntimeController } from './controller';
import { answerLabel, interpolateLink, interpolateMarkdown, Markdown, markdownText, reactions, safeLink } from './content';
import { FieldInput } from './inputs';
import { isWhatsapp } from '../shared/whatsapp';
import { isOpen } from '../shared/hours';
import { safeColor } from './appearance';
import { phrases } from './i18n';
import type { Step } from './types';

export function typingDelay(length: number, speed: 'off' | 'fast' | 'normal' | 'slow' = 'normal', reduced = false): number {
  if (reduced || speed === 'off') return 0;
  return Math.min(1200, Math.max(400, length * (speed === 'fast' ? 10 : speed === 'slow' ? 30 : 20)));
}

/** A new step must not inherit the previous step's completed typing animation. */
export function revealedMessageCount(reveal: { stepId: string | null; count: number }, activeId: string | null): number {
  return reveal.stepId === activeId ? reveal.count : 0;
}

const contactIcons = {
  whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z',
  chat: 'M12 3C6.5 3 2 6.9 2 11.7c0 2.4 1.1 4.6 3 6.2L4.2 22l4.5-2.2c1 .3 2.1.5 3.3.5 5.5 0 10-3.9 10-8.6S17.5 3 12 3z',
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z',
  email: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.3V17h16V7.3zM5.2 7l6.8 4.2L18.8 7z',
} as const;
/** "auto" (or unset) picks the icon from the link: WhatsApp, phone (tel:), email (mailto:) or chat. */
export function contactIconFor(url: string, icon?: 'auto' | 'whatsapp' | 'chat' | 'phone' | 'email' | 'none'): keyof typeof contactIcons | 'none' {
  if (icon && icon !== 'auto') return icon;
  return isWhatsapp(url) ? 'whatsapp' : url.startsWith('tel:') ? 'phone' : url.startsWith('mailto:') ? 'email' : 'chat';
}

/** A statement shows a button only when the builder asks to wait (autoContinue: false); otherwise it continues by itself. */
export function waitsForButton(step: Pick<Step, 'type' | 'settings'>): boolean {
  return step.type !== 'statement' || step.settings?.autoContinue === false;
}

/** Focus the step's primary control: the text input over a phone country select, and the submit button over a summary's Edit links. */
export function focusActive(root: HTMLElement | null, type?: Step['type']): void {
  if (!root) return;
  const target = !type || type === 'summary' || type === 'statement'
    ? root.querySelector<HTMLElement>(':scope > button:not(.link-button)')
    : root.querySelector<HTMLElement>('input:not([type=hidden]):not([type=file]),textarea') ?? root.querySelector<HTMLElement>('select,input[type=file],button:not(.link-button)');
  (target ?? root.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
}

export function Chat({ controller, onClose, closable = false }: { controller: RuntimeController; onClose?: () => void; closable?: boolean }) {
  const [, rerender] = useState(0);
  const [reveal, setReveal] = useState<{ stepId: string | null; count: number }>({ stepId: null, count: 0 });
  const [confirm, setConfirm] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [magicStatus, setMagicStatus] = useState('');
  const [clock, setClock] = useState(() => Date.now());
  const [reduced, setReduced] = useState(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const active = useRef<HTMLDivElement>(null);
  const last = useRef<HTMLDivElement>(null);
  const ending = useRef<HTMLElement>(null);
  const confirmBox = useRef<HTMLElement>(null);
  const state = controller.state;
  const form = state.form?.form;
  const locale = controller.options.locale ?? globalThis.document?.documentElement.lang ?? 'en';
  const phrase = phrases(locale, form?.phrases);
  const step = controller.activeStep;
  const messages = step?.messages ?? [];
  const shown = revealedMessageCount(reveal, state.activeId);
  const enabled = shown >= messages.length;
  const interpolateText = (text: string) => interpolate(text, state.answers, controller.meta);
  // Copy rendered as Markdown: substituted answers/metadata stay literal text (no injected links).
  const interpolateRich = (text: string) => interpolateMarkdown(text, state.answers, controller.meta);

  useLayoutEffect(() => controller.subscribe(() => rerender(n => n + 1)), [controller]);
  // Opening hours of the contact button are re-checked every minute while the chat is open.
  const scheduled = Boolean(controller.state.form?.form.schema.bot.contact?.hours?.enabled);
  useEffect(() => { if (!scheduled) return; const timer = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(timer); }, [scheduled]);
  useEffect(() => {
    const query = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(query?.matches ?? false);
    query?.addEventListener('change', change); return () => query?.removeEventListener('change', change);
  }, []);
  useEffect(() => { setReveal({ stepId: state.activeId, count: 0 }); }, [state.activeId]);
  useEffect(() => {
    if (state.phase !== 'ready' || shown >= messages.length) return;
    const stepId = state.activeId;
    const timer = setTimeout(() => setReveal(current => current.stepId === stepId ? { ...current, count: current.count + 1 } : current), typingDelay(messages[shown]?.length ?? 0, form?.schema.bot.typingSpeed, reduced));
    return () => clearTimeout(timer);
  }, [state.activeId, state.phase, shown, messages.length, reduced, form?.schema.bot.typingSpeed]);
  useEffect(() => {
    if (!enabled || state.phase !== 'ready') return;
    focusActive(active.current, step?.type);
    if (step?.type === 'statement' && waitsForButton(step) === false) {
      // Statements flow straight on after their messages, like a chat; a short pause lets the last one be read.
      const timer = setTimeout(() => { void controller.answer(null); }, reduced ? 0 : 600);
      return () => clearTimeout(timer);
    }
  }, [state.activeId, enabled, state.phase, state.fieldError, step?.settings?.autoContinue, reduced, controller]);
  useEffect(() => { if (state.phase === 'done') ending.current?.focus({ preventScroll: true }); }, [state.phase]);
  useEffect(() => { if (confirm) confirmBox.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus({ preventScroll: true }); }, [confirm]);
  const cancelRestart = () => { setConfirm(false); requestAnimationFrame(() => focusActive(active.current, step?.type)); };
  useEffect(() => { last.current?.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }); }, [shown, state.activeId, state.error, state.phase, reduced]);
  useEffect(() => {
    const completion = state.completion;
    if (controller.options.preview || state.phase !== 'done' || !completion?.redirectUrl) return;
    const url = safeLink(completion.redirectUrl);
    if (!url || !/^https?:/.test(url)) return;
    const ending = form?.schema.endings.find(e => e.id === completion.ending.id);
    const timer = setTimeout(() => location.assign(url), Math.min(30000, Math.max(0, ending?.delayMs ?? 0)));
    return () => clearTimeout(timer);
  }, [state.completion, state.phase, controller, form]);

  const bot = (text: string, key: string | number) => <div className="bubble bot" key={key}><Markdown text={interpolateRich(text)} /></div>;
  const summary = () => <section className="summary" aria-label={phrase('summary')}><h2>{phrase('summary')}</h2><dl>
    {(state.path?.visited ?? []).map(id => form?.schema.steps.find(s => s.id === id)).filter((s): s is Step => !!s && !['hidden', 'statement', 'summary', 'media', 'calculated'].includes(s.type) && Object.prototype.hasOwnProperty.call(state.answers, s.key)).map(s => <div key={s.id}><dt>{s.label}</dt><dd>{answerLabel(s, state.answers[s.key], phrase)} <button className="link-button" disabled={state.busy} onClick={() => controller.edit(s.id)} aria-label={`${phrase('edit')}: ${s.label}`}>{phrase('edit')}</button></dd></div>)}
  </dl></section>;
  const restart = <button disabled={state.busy || state.error === 'submissionPending'} onClick={() => setConfirm(true)}>{phrase('startOver')}</button>;
  const error = state.error && <div className="notice" role="alert"><p>{phrase(state.error)}</p>{!state.conflict && <button disabled={state.busy || state.offline} onClick={() => void controller.retry()}>{phrase('retry')}</button>}</div>;
  const media = form?.schema.bot.avatar ? form.media?.[form.schema.bot.avatar] : null;
  const avatar = media ? safeLink(media.url) : null;
  const look = form?.appearance ?? {};
  const messaging = look.style === 'messaging';
  const styleAttributes = messaging ? { 'data-style': 'messaging', 'data-wallpaper': look.wallpaper ?? 'doodle', 'data-choices': look.choiceStyle ?? 'keyboard', 'data-tails': look.bubbleTails === false ? 'off' : 'on' } : {};
  const botName = form?.schema.bot.name ?? 'ChatFlow';
  // Optional direct contact (e.g. WhatsApp) below the conversation, for visitors who would rather talk than fill in the form.
  const contactSettings = form?.schema.bot.contact;
  const contactUrl = contactSettings?.url ? safeLink(interpolateLink(contactSettings.url, state.answers, controller.meta)) : null;
  const contactIcon = contactUrl ? contactIconFor(contactUrl, contactSettings?.icon) : 'none';
  const contactLabel = contactSettings?.label || phrase(contactUrl && isWhatsapp(contactUrl) ? 'whatsapp' : 'contactUs');
  const contactBackground = safeColor(contactSettings?.color), contactText = safeColor(contactSettings?.textColor);
  const contactOpen = isOpen(contactSettings?.hours, new Date(clock));
  const contactClosedMessage = !contactOpen && contactSettings?.hours?.outside === 'message' && contactSettings.hours.message ? interpolateText(contactSettings.hours.message) : '';
  const contact = contactUrl && contactOpen && <a className={`contact-link${isWhatsapp(contactUrl) ? ' is-whatsapp' : ''}`} href={contactUrl} target="_blank" rel="noopener noreferrer" aria-label={`${contactLabel} (${phrase('opensNewTab')})`} onClick={() => controller.contactClicked()}
    style={{ ...(contactBackground ? { background: contactBackground, borderColor: contactBackground } : {}), ...(contactText ? { color: contactText } : {}) }}>
    {contactIcon !== 'none' && <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d={contactIcons[contactIcon]} /></svg>}
    <span>{contactLabel}</span>
  </a>;
  return <section className={`chat ${controller.options.mode === 'fullpage' ? 'fullpage' : ''}`} {...styleAttributes} dir={globalThis.document?.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'} aria-label={form?.title ?? 'ChatFlow'} aria-busy={state.busy}>
    <header><div className="identity">{avatar && /^https?:/.test(avatar) ? <img src={avatar} alt={media?.alt ?? phrase('botAvatar')} /> : <span className="avatar" aria-hidden="true">{[...botName.trim()][0] ?? ''}</span>}<div><strong>{botName}</strong><small><span className="online-dot" aria-hidden="true" />{phrase(state.offline ? 'offline' : 'online')}</small></div></div><nav aria-label={phrase('back')}><button disabled={state.busy || state.phase !== 'ready' || !controller.visibleSteps.some(s => s.id !== state.activeId && Object.prototype.hasOwnProperty.call(state.answers, s.key))} onClick={() => controller.back()}>{phrase('back')}</button>{restart}</nav>{closable && <button type="button" className="close-chat" aria-label={phrase('closeChat')} onClick={onClose}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none" /></svg></button>}</header>
    <div className="progress" role="progressbar" aria-label={phrase('progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.phase === 'done' ? 100 : state.path?.progress ?? 0)}><span style={{ width: `${state.phase === 'done' ? 100 : state.path?.progress ?? 0}%` }} /></div>
    {controller.options.preview && <p className="notice">{phrase('preview')}</p>}
    {!controller.options.preview && globalThis.location?.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(location.hostname) && <p className="notice" role="alert">{phrase('insecure')}</p>}
    <main className="conversation">
      {confirm && <section ref={confirmBox} className="notice" role="alertdialog" aria-modal="false" aria-label={phrase('confirmRestart')} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); cancelRestart(); } }}><p>{phrase('confirmRestart')}</p><button disabled={state.offline || state.busy} onClick={() => { setConfirm(false); void controller.restart(); }}>{phrase('startOver')}</button><button onClick={cancelRestart}>{phrase('cancel')}</button></section>}
      {state.phase === 'loading' && <p role="status">{phrase('loading')}</p>}
      {state.phase === 'resume' && <section className="notice"><p>{phrase(state.newerVersion ? 'newerVersion' : 'welcomeBack')}</p><button disabled={state.busy} onClick={() => void controller.continueSaved()}>{phrase(state.newerVersion ? 'continueOld' : 'continue')}</button>{restart}</section>}
      {state.phase !== 'resume' && controller.visibleSteps.map(s => <section key={s.id} className="step" aria-label={s.label}>
        {(s.id === state.activeId && state.phase === 'ready' ? s.messages.slice(0, shown) : s.messages).map((message, index) => bot(message, index))}
        {s.id !== state.activeId && Object.prototype.hasOwnProperty.call(state.answers, s.key) && <button className="bubble user" disabled={state.busy || state.phase !== 'ready'} onClick={() => controller.edit(s.id)} aria-label={`${phrase('edit')}: ${s.label}: ${answerLabel(s, state.answers[s.key], phrase)}`}>{answerLabel(s, state.answers[s.key], phrase)}<small>{phrase('edit')}</small></button>}
        {s.id !== state.activeId && reactions(s, state.answers[s.key]).map((message, index) => bot(message, `reaction-${index}`))}
      </section>)}
      <div className="sr-only" aria-live="polite" aria-atomic="false">{state.phase === 'ready' ? messages.slice(0, shown).map((message, index) => <p key={`${state.activeId}-${index}`}>{markdownText(interpolateRich(message))}</p>) : state.phase === 'done' ? <p>{phrase('complete')}</p> : null}</div>
      {state.phase === 'ready' && step && <div ref={active} className={`active${messages.length ? ' has-prompt' : ''}`} key={step.id}>
        {!enabled && <div className="typing bubble bot" role="status" aria-label={phrase('typing')}><i /><i /><i /></div>}
        {enabled && <>
          {step.helpText && <p id={`help-${step.id}`} className="help"><Markdown text={interpolateRich(step.helpText)} /></p>}
          {state.fieldError && <p id={`error-${step.id}`} className="field-error" role="alert">{phrase(state.fieldError)}</p>}
          {step.type === 'summary' && summary()}
          {step.type === 'statement' && !waitsForButton(step) ? null : ['statement', 'summary'].includes(step.type) ? <button disabled={state.busy} onClick={async () => { await controller.answer(null); if (step.type === 'summary' && !controller.state.activeId) await controller.submit(honeypot); }}>{step.settings?.buttonLabel ?? phrase(step.type === 'summary' ? 'submit' : 'continue')}</button> : <FieldInput key={`${step.id}:${JSON.stringify(controller.inputValue(step))}`} step={{ ...step, label: interpolateText(step.label), settings: { ...step.settings, ...(step.settings?.consentText ? { consentText: interpolateRich(step.settings.consentText) } : {}) } }} value={controller.inputValue(step)} disabled={state.busy || state.conflict || !!state.completion} phrase={phrase} onAnswer={async value => { await controller.answer(value); if (controller.state.fieldError) focusActive(active.current, step.type); }} {...(state.form?.features.uploads && !controller.options.preview ? { upload: (file: File) => controller.upload(step, file) } : {})} {...(state.fieldError ? { error: phrase(state.fieldError) } : {})} {...(form?.media ? { media: form.media } : {})} />}
          {controller.canSkip && <button className="link-button" disabled={state.busy || state.conflict} onClick={() => void controller.answer(null)}>{phrase('skip')}</button>}
        </>}
      </div>}
      {state.phase === 'ready' && !step && <div ref={active}>{summary()}<button disabled={state.busy || state.offline || state.conflict} onClick={() => void controller.submit(honeypot)}>{phrase(state.error === 'submissionPending' ? 'retry' : 'submit')}</button></div>}
      {state.phase === 'submitting' && <p role="status">{phrase('loading')}</p>}
      {state.phase === 'done' && state.completion && <section ref={ending} tabIndex={-1} className="ending" aria-label={phrase('complete')}>
        {state.completion.ending.messages.map((message, index) => bot(message, index))}
        {state.completion.redirectUrl && !controller.options.preview && <p role="status">{phrase('redirecting')}</p>}
        {state.completion.ending.buttons.map(button => {
          const url = button.url ? safeLink(interpolateLink(button.url, state.answers, controller.meta)) : null;
          return button.action === 'restart' ? <button key={button.id} onClick={() => setConfirm(true)}>{interpolateText(button.label)}</button> : button.action === 'close' ? <button key={button.id} onClick={onClose}>{interpolateText(button.label)}</button> : button.action === 'link' && url ? <a className="button" key={button.id} href={url} target="_blank" rel="noopener noreferrer">{interpolateText(button.label)}</a> : null;
        })}
      </section>}
      {state.conflict && <section className="notice" role="alert"><p>{phrase('conflict')}</p><button disabled={state.busy || state.offline} onClick={() => void controller.resolveConflict(false)}>{phrase('useServer')}</button><button disabled={state.busy || state.offline} onClick={() => void controller.resolveConflict(true)}>{phrase('useLocal')}</button></section>}
      {error}
      <div ref={last} />
    </main>
    {(contact || contactClosedMessage) && <div className="contact-bar">{contact || <p className="contact-closed">{contactClosedMessage}</p>}</div>}
    {!controller.options.preview && <><label className="honeypot" aria-hidden="true">{phrase('honeypot')}<input type="text" name="cff_website_check" maxLength={255} autoComplete="off" tabIndex={-1} value={honeypot} onInput={e => setHoneypot(e.currentTarget.value)} /></label><span className="sr-only" role="status">{state.offline ? phrase('offline') : state.storageUnavailable ? phrase('storageUnavailable') : ''}</span>{(state.offline || state.storageUnavailable || (form?.session.magicLinks?.enabled && state.phase === 'ready')) && <footer>{(state.offline || state.storageUnavailable) && <p className="status-notice">{phrase(state.offline ? 'offline' : 'storageUnavailable')}</p>}
      {form?.session.magicLinks?.enabled && state.phase === 'ready' && <div className="cff-magic">
        <button disabled={state.busy || state.offline || state.conflict} onClick={() => { if (!window.confirm(phrase('magicEmailConfirm'))) return; void controller.magicLink('email').then(() => setMagicStatus(phrase('magicEmailAccepted'))).catch(() => setMagicStatus(phrase('magicEmailError'))); }}>{phrase('magicEmail')}</button>
        {form.session.magicLinks.whatsapp && <button disabled={state.busy || state.offline || state.conflict} onClick={() => { if (!window.confirm(phrase('magicShareConfirm'))) return; void controller.magicLink('whatsapp').then(async result => {
          if (!result.link) { setMagicStatus(phrase('magicShareError')); return; }
          try { if (navigator.share) await navigator.share({ text: result.link }); else { await navigator.clipboard.writeText(result.link); setMagicStatus(phrase('magicCopied')); } }
          catch { setMagicStatus(phrase('magicCancelled')); }
        }).catch(() => setMagicStatus(phrase('magicShareError'))); }}>{phrase('magicShare')}</button>}
        <small role="status">{magicStatus}</small>
      </div>}</footer>}</>}
  </section>;
}
