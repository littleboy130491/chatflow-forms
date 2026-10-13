/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { interpolate } from '../shared/logic';
import { RuntimeController } from './controller';
import { answerLabel, interpolateLink, Markdown, reactions, safeLink } from './content';
import { FieldInput } from './inputs';
import { phrases } from './i18n';
import type { Step } from './types';

export function typingDelay(length: number, speed: 'off' | 'fast' | 'normal' | 'slow' = 'normal', reduced = false): number {
  if (reduced || speed === 'off') return 0;
  return Math.min(1200, Math.max(400, length * (speed === 'fast' ? 10 : speed === 'slow' ? 30 : 20)));
}

export function Chat({ controller, onClose }: { controller: RuntimeController; onClose?: () => void }) {
  const [, rerender] = useState(0);
  const [shown, setShown] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [magicStatus, setMagicStatus] = useState('');
  const [reduced, setReduced] = useState(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const active = useRef<HTMLDivElement>(null);
  const last = useRef<HTMLDivElement>(null);
  const state = controller.state;
  const form = state.form?.form;
  const locale = controller.options.locale ?? globalThis.document?.documentElement.lang ?? 'en';
  const phrase = phrases(locale, form?.phrases);
  const step = controller.activeStep;
  const messages = step?.messages ?? [];
  const enabled = shown >= messages.length;
  const interpolateText = (text: string) => interpolate(text, state.answers, controller.meta);

  useLayoutEffect(() => controller.subscribe(() => rerender(n => n + 1)), [controller]);
  useEffect(() => {
    const query = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(query?.matches ?? false);
    query?.addEventListener('change', change); return () => query?.removeEventListener('change', change);
  }, []);
  useEffect(() => { setShown(0); }, [state.activeId]);
  useEffect(() => {
    if (state.phase !== 'ready' || shown >= messages.length) return;
    const timer = setTimeout(() => setShown(n => n + 1), typingDelay(messages[shown]?.length ?? 0, form?.schema.bot.typingSpeed, reduced));
    return () => clearTimeout(timer);
  }, [state.activeId, state.phase, shown, messages.length, reduced, form?.schema.bot.typingSpeed]);
  useEffect(() => {
    if (!enabled || state.phase !== 'ready') return;
    const target = active.current?.querySelector<HTMLElement>('input:not([type=hidden]),textarea,select,button');
    target?.focus({ preventScroll: true });
    if (step?.type === 'statement' && step.settings?.autoContinue) {
      const timer = setTimeout(() => { void controller.answer(null); }, reduced ? 0 : 250);
      return () => clearTimeout(timer);
    }
  }, [state.activeId, enabled, state.phase, step?.settings?.autoContinue, reduced, controller]);
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

  const bot = (text: string, key: string | number) => <div className="bubble bot" key={key}><Markdown text={interpolateText(text)} /></div>;
  const summary = () => <section className="summary" aria-label={phrase('summary')}><h2>{phrase('summary')}</h2><dl>
    {(state.path?.visited ?? []).map(id => form?.schema.steps.find(s => s.id === id)).filter((s): s is Step => !!s && !['hidden', 'statement', 'summary', 'media', 'calculated'].includes(s.type) && Object.prototype.hasOwnProperty.call(state.answers, s.key)).map(s => <div key={s.id}><dt>{s.label}</dt><dd>{answerLabel(s, state.answers[s.key], phrase)} <button className="link-button" disabled={state.busy} onClick={() => controller.edit(s.id)} aria-label={`${phrase('edit')}: ${s.label}`}>{phrase('edit')}</button></dd></div>)}
  </dl></section>;
  const restart = <button disabled={state.busy || state.error === 'submissionPending'} onClick={() => setConfirm(true)}>{phrase('startOver')}</button>;
  const error = state.error && <div className="notice" role="alert"><p>{phrase(state.error)}</p>{!state.conflict && <button disabled={state.busy || state.offline} onClick={() => void controller.retry()}>{phrase('retry')}</button>}</div>;
  const media = form?.schema.bot.avatar ? form.media?.[form.schema.bot.avatar] : null;
  const avatar = media ? safeLink(media.url) : null;
  return <section className={`chat ${controller.options.mode === 'fullpage' ? 'fullpage' : ''}`} dir={globalThis.document?.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'} aria-label={form?.title ?? 'ChatFlow'} aria-busy={state.busy}>
    <header><div className="identity">{avatar && /^https?:/.test(avatar) && <img src={avatar} alt={media?.alt ?? phrase('botAvatar')} />}<div><strong>{form?.schema.bot.name ?? 'ChatFlow'}</strong><small><span className="online-dot" aria-hidden="true" />{phrase(state.offline ? 'offline' : 'online')}</small></div></div><nav aria-label={phrase('back')}><button disabled={state.busy || state.phase !== 'ready' || !controller.visibleSteps.some(s => s.id !== state.activeId && Object.prototype.hasOwnProperty.call(state.answers, s.key))} onClick={() => controller.back()}>{phrase('back')}</button>{restart}</nav></header>
    <div className="progress" role="progressbar" aria-label={phrase('progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.phase === 'done' ? 100 : state.path?.progress ?? 0)}><span style={{ width: `${state.phase === 'done' ? 100 : state.path?.progress ?? 0}%` }} /></div>
    {controller.options.preview && <p className="notice">{phrase('preview')}</p>}
    {!controller.options.preview && globalThis.location?.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(location.hostname) && <p className="notice" role="alert">{phrase('insecure')}</p>}
    <main className="conversation">
      {confirm && <section className="notice" role="alertdialog" aria-modal="false" aria-label={phrase('confirmRestart')}><p>{phrase('confirmRestart')}</p><button disabled={state.offline || state.busy} onClick={() => { setConfirm(false); void controller.restart(); }}>{phrase('startOver')}</button><button onClick={() => setConfirm(false)}>{phrase('cancel')}</button></section>}
      {state.phase === 'loading' && <p role="status">{phrase('loading')}</p>}
      {state.phase === 'resume' && <section className="notice"><p>{phrase(state.newerVersion ? 'newerVersion' : 'welcomeBack')}</p><button disabled={state.busy} onClick={() => void controller.continueSaved()}>{phrase(state.newerVersion ? 'continueOld' : 'continue')}</button>{restart}</section>}
      {state.phase !== 'resume' && controller.visibleSteps.map(s => <section key={s.id} className="step" aria-label={s.label}>
        {(s.id === state.activeId && state.phase === 'ready' ? s.messages.slice(0, shown) : s.messages).map((message, index) => bot(message, index))}
        {s.id !== state.activeId && Object.prototype.hasOwnProperty.call(state.answers, s.key) && <button className="bubble user" disabled={state.busy || state.phase !== 'ready'} onClick={() => controller.edit(s.id)} aria-label={`${phrase('edit')}: ${s.label}: ${answerLabel(s, state.answers[s.key], phrase)}`}>{answerLabel(s, state.answers[s.key], phrase)}<small>{phrase('edit')}</small></button>}
        {s.id !== state.activeId && reactions(s, state.answers[s.key]).map((message, index) => bot(message, `reaction-${index}`))}
      </section>)}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{state.phase === 'ready' ? interpolateText(messages[shown - 1] ?? '') : state.phase === 'done' ? phrase('complete') : ''}</div>
      {state.phase === 'ready' && step && <div ref={active} className="active" key={step.id}>
        {!enabled && <div className="typing bubble bot" role="status" aria-label={phrase('typing')}><i /><i /><i /></div>}
        {enabled && <>
          {step.helpText && <p id={`help-${step.id}`} className="help"><Markdown text={interpolateText(step.helpText)} /></p>}
          {state.fieldError && <p id={`error-${step.id}`} className="bubble bot" role="alert">{phrase(state.fieldError)}</p>}
          {step.type === 'summary' && summary()}
          {['statement', 'summary'].includes(step.type) ? <button disabled={state.busy} onClick={async () => { await controller.answer(null); if (step.type === 'summary' && !controller.state.activeId) await controller.submit(honeypot); }}>{step.settings?.buttonLabel ?? phrase(step.type === 'summary' ? 'submit' : 'continue')}</button> : <FieldInput key={`${step.id}:${JSON.stringify(controller.inputValue(step))}`} step={{ ...step, label: interpolateText(step.label), settings: { ...step.settings, ...(step.settings?.consentText ? { consentText: interpolateText(step.settings.consentText) } : {}) } }} value={controller.inputValue(step)} disabled={state.busy || state.conflict || !!state.completion} phrase={phrase} onAnswer={value => void controller.answer(value)} {...(state.form?.features.uploads && !controller.options.preview ? { upload: (file: File) => controller.upload(step, file) } : {})} {...(state.fieldError ? { error: phrase(state.fieldError) } : {})} {...(form?.media ? { media: form.media } : {})} />}
          {controller.canSkip && <button className="link-button" disabled={state.busy || state.conflict} onClick={() => void controller.answer(null)}>{phrase('skip')}</button>}
        </>}
      </div>}
      {state.phase === 'ready' && !step && <div ref={active}>{summary()}<button disabled={state.busy || state.offline || state.conflict} onClick={() => void controller.submit(honeypot)}>{phrase(state.error === 'submissionPending' ? 'retry' : 'submit')}</button></div>}
      {state.phase === 'submitting' && <p role="status">{phrase('loading')}</p>}
      {state.phase === 'done' && state.completion && <section className="ending" aria-label={phrase('complete')}>
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
    {!controller.options.preview && <><label className="honeypot" aria-hidden="true">{phrase('honeypot')}<input type="text" name="cff_website_check" maxLength={255} autoComplete="off" tabIndex={-1} value={honeypot} onInput={e => setHoneypot(e.currentTarget.value)} /></label><footer aria-live="polite">{state.offline ? phrase('offline') : state.storageUnavailable ? phrase('storageUnavailable') : state.dirty ? phrase('unsaved') : phrase('saved')}{form?.session.resumeEnabled && <small>{phrase('sessionStorage')}</small>}
      {form?.session.magicLinks?.enabled && state.phase === 'ready' && <div className="cff-magic">
        <button disabled={state.busy || state.offline || state.conflict} onClick={() => { if (!window.confirm('Send a one-time resume link to the email already provided in this form?')) return; void controller.magicLink('email').then(() => setMagicStatus('If an eligible email was provided, a resume link will be sent.')).catch(() => setMagicStatus('Unable to request a resume link right now.')); }}>Email me a resume link</button>
        {form.session.magicLinks.whatsapp && <button disabled={state.busy || state.offline || state.conflict} onClick={() => { if (!window.confirm('Create a single-use link to share yourself? Anyone with the link can resume your form.')) return; void controller.magicLink('whatsapp').then(async result => {
          if (!result.link) { setMagicStatus('Unable to create a link right now.'); return; }
          try { if (navigator.share) await navigator.share({ text: result.link }); else { await navigator.clipboard.writeText(result.link); setMagicStatus('Link copied. Paste it into WhatsApp yourself.'); } }
          catch { setMagicStatus('Share cancelled or unavailable. Request a new link to retry.'); }
        }).catch(() => setMagicStatus('Unable to create a link right now.')); }}>Share resume link (choose WhatsApp)</button>}
        <small role="status">{magicStatus}</small>
      </div>}</footer></>}
  </section>;
}
