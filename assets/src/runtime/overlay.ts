import { phrases } from './i18n';

export interface LauncherOptions { position?: 'left' | 'right'; autoOpenSeconds?: number | null; scrollPercent?: number | null }

/** Native modal top layer keeps theme stacking contexts and focus outside the dialog inert. */
export function createOverlay(shadow: ShadowRoot, host: HTMLElement, mode: 'launcher' | 'popup', options: LauncherOptions, onOpen: () => void, locale: string, onClose?: () => void) {
  const phrase = phrases(locale);
  const dialog = document.createElement('dialog'); dialog.className = `overlay ${mode}`;
  dialog.setAttribute('aria-label', host.dataset.title ?? 'ChatFlow');
  const close = document.createElement('button'); close.className = 'overlay-close'; close.type = 'button'; close.textContent = phrase('close');
  const content = document.createElement('div'); content.className = 'overlay-content';
  dialog.append(close, content); shadow.append(dialog);
  const launcher = mode === 'launcher' ? document.createElement('button') : null;
  if (launcher) { launcher.type = 'button'; launcher.className = `launcher ${options.position === 'left' ? 'left' : 'right'}`; launcher.textContent = phrase('openChat'); launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-expanded', 'false'); shadow.append(launcher); }
  if (options.position === 'left') dialog.classList.add('left');
  let previous: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let autoOpened = false;
  function restore() { launcher?.setAttribute('aria-expanded', 'false'); if (previous?.isConnected) previous.focus({ preventScroll: true }); }
  function hide() { if (dialog.open) { dialog.close(); onClose?.(); } restore(); }
  function open() {
    if (dialog.open) return;
    const active = shadow.activeElement ?? document.activeElement;
    previous = active instanceof HTMLElement ? active : null;
    // Browsers without modal dialog support must not emulate an insecure focus boundary.
    if (typeof dialog.showModal !== 'function') return;
    dialog.showModal(); launcher?.setAttribute('aria-expanded', 'true'); close.focus({ preventScroll: true }); onOpen();
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); hide(); }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]')].filter(el => !el.hidden && !el.closest('[hidden]') && el.tabIndex >= 0);
    const first = focusable[0] ?? close; const last = focusable[focusable.length - 1] ?? close;
    const active = shadow.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (active === last || !dialog.contains(active))) { event.preventDefault(); first.focus(); }
  }
  function automatic() { if (autoOpened) return; autoOpened = true; open(); window.removeEventListener('scroll', scroll); }
  function scroll() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const percent = height <= 0 ? 100 : window.scrollY / height * 100;
    if (percent >= (options.scrollPercent ?? 101)) automatic();
  }
  const trigger = (event: MouseEvent) => {
    const button = (event.target instanceof Element ? event.target.closest('[data-cff-open]') : null) as HTMLElement | null;
    if (button?.dataset.cffOpen === host.dataset.formId) { event.preventDefault(); open(); }
  };
  close.addEventListener('click', hide); launcher?.addEventListener('click', open);
  dialog.addEventListener('keydown', keydown); dialog.addEventListener('close', restore);
  dialog.addEventListener('cancel', event => { event.preventDefault(); hide(); });
  document.addEventListener('click', trigger);
  if (typeof options.autoOpenSeconds === 'number' && Number.isFinite(options.autoOpenSeconds) && options.autoOpenSeconds >= 0) timer = setTimeout(automatic, Math.min(86400, options.autoOpenSeconds) * 1000);
  if (typeof options.scrollPercent === 'number' && options.scrollPercent >= 0 && options.scrollPercent <= 100) { window.addEventListener('scroll', scroll, { passive: true }); queueMicrotask(scroll); }
  return { content, open, close: hide, dispose() { if (timer) clearTimeout(timer); window.removeEventListener('scroll', scroll); document.removeEventListener('click', trigger); hide(); dialog.remove(); launcher?.remove(); } };
}
