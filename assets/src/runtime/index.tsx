/** @jsxImportSource preact */
import { render, type ComponentType } from 'preact';
import css from './styles.css?inline';
import { ApiClient } from './api';
import { Chat } from './chat';
import { RuntimeController } from './controller';
import { registerField } from './registry';
import { safeColor, safeFont, scopedAppearanceCss } from './appearance';
import { phrases } from './i18n';
import { googleFont, systemFont, type GoogleFont } from '../shared/fonts';
import { acquireGoogleFont } from './fonts';
import type { AnswerMap, FieldProps, RuntimeOptions } from './types';
import { captchaToken } from './captcha';
export type { RuntimeOptions, FieldProps, PublicForm } from './types';
export { registerField } from './registry';

export interface RuntimeHandle {
  unmount(): void;
  prefill(answers: AnswerMap): void;
  getState(): ReturnType<typeof previewState>;
  jumpToStep(id: string): boolean;
  open(): void;
}
const mounted = new Map<HTMLElement, { handle: RuntimeHandle; id: number; controller: RuntimeController }>();
let overlayCounter = 0;
function previewState(controller: RuntimeController) {
  return { phase: controller.state.phase, visited: [...(controller.state.path?.visited ?? [])], currentStepId: controller.state.activeId, variables: { ...controller.state.path?.variables }, progress: controller.state.path?.progress ?? 0, errors: [...(controller.state.path?.errors ?? [])] };
}

export function mountRuntime(host: HTMLElement, options: RuntimeOptions = {}): RuntimeHandle {
  mounted.get(host)?.handle.unmount();
  const id = options.form?.form.id ?? options.formId ?? Number(host.dataset.formId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new TypeError('Invalid form ID');
  if (options.preview && !options.form) throw new TypeError('Preview requires a public form envelope');
  if (options.mode && !['inline', 'fullpage', 'launcher', 'popup'].includes(options.mode)) throw new TypeError('Unsupported display mode');
  const restUrl = options.restUrl ?? host.dataset.restUrl;
  if (!options.preview && !restUrl) throw new TypeError('Missing REST endpoint');
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  host.querySelector('[data-cff-loading]')?.remove();
  const style = document.createElement('style'); style.textContent = css;
  const customization = document.createElement('style');
  const root = document.createElement('div'); shadow.replaceChildren(style, customization, root);
  const config: RuntimeOptions = { ...options, formId: id, locale: options.locale ?? host.dataset.locale ?? document.documentElement.lang ?? 'en', mode: options.mode ?? (['fullpage', 'launcher', 'popup'].includes(host.dataset.mode ?? '') ? host.dataset.mode as 'fullpage' | 'launcher' | 'popup' : 'inline') };
  const captchaRoot = document.createElement('div'); captchaRoot.className = 'captcha';
  config.captcha ??= config => captchaToken(config, captchaRoot);
  const api = options.preview ? null : new ApiClient(restUrl!);
  const controller = new RuntimeController(config, api, undefined, (name, detail) => host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })));
  let selectedFont: GoogleFont | undefined;
  let releaseFont: () => void = () => {};
  const appearance = () => {
    const value = controller.state.form?.form.appearance;
    if (!value) return;
    const font = value.inheritFont ? undefined : googleFont(value.googleFont);
    if (font !== selectedFont) { releaseFont(); selectedFont = font; releaseFont = font ? acquireGoogleFont(host.ownerDocument, font) : () => {}; }
    const entries = { '--cff-primary': safeColor(value.primary), '--cff-bubble-bot-bg': safeColor(value.botBubbleBackground), '--cff-user-bg': safeColor(value.userBubbleBackground), '--cff-text': safeColor(value.textColor), '--cff-font': value.inheritFont ? 'inherit' : (font ? `"${font}", ${safeFont(value.font) ?? systemFont}` : safeFont(value.font)), '--cff-radius': Number.isFinite(value.radius) ? `${Math.max(0, Math.min(128, value.radius!))}px` : undefined, '--cff-width': Number.isFinite(value.width) ? `${Math.max(280, Math.min(2000, value.width!))}px` : undefined };
    for (const [key, val] of Object.entries(entries)) { if (val) root.style.setProperty(key, val); else root.style.removeProperty(key); }
    const dark = value.theme === 'dark' || (value.theme === 'auto' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
    root.querySelector('.chat')?.classList.toggle('dark', Boolean(dark));
    customization.textContent = scopedAppearanceCss(value.customCss);
  };
  const unsubscribe = controller.subscribe(appearance);
  const colorScheme = globalThis.matchMedia?.('(prefers-color-scheme: dark)'); colorScheme?.addEventListener('change', appearance);
  const connection = () => controller.setOffline(navigator.onLine === false);
  const externalChange = (event: StorageEvent) => { if (event.key?.startsWith(`cff:session:${id}:`)) controller.markConflict(); };
  if (!options.preview) { window.addEventListener('online', connection); window.addEventListener('offline', connection); window.addEventListener('storage', externalChange); }
  const isPopup = config.mode === 'popup';
  const isLauncher = config.mode === 'launcher' || isPopup;
  const overlayId = `cff-overlay-${++overlayCounter}`;
  let autoOpened = false;
  let autoTimer: ReturnType<typeof setTimeout> | null = null;
  let scrollHandler: (() => void) | null = null;
  let openTrigger: ((event: MouseEvent) => void) | null = null;
  let chatRoot = root;
  let toggle: HTMLButtonElement | null = null;
  let panel: HTMLDivElement | null = null;
  let initialized = false;
  let viewReported = false;
  const initialize = () => {
    if (initialized) return;
    initialized = true;
    connection();
    void controller.initialize().then(() => { appearance(); trackView(); });
  };
  const trackView = () => {
    if (options.preview || viewReported || !api || host.hidden || controller.state.phase === 'error') return;
    const version = controller.state.form?.form.version;
    if (!version) return;
    viewReported = true;
    // Analytics is non-blocking and never sends session credentials, answers or visitor metadata.
    void api.view(id, version).catch(() => undefined);
  };
  const label = phrases(config.locale);
  const setOpen = (value: boolean) => {
    if (!toggle || !panel) return;
    if (!value && !panel.hidden) controller.close();
    host.hidden = false;
    panel.hidden = !value;
    if (isPopup) {
      const backdrop = root.querySelector<HTMLElement>('.popup-backdrop');
      if (backdrop) backdrop.hidden = !value;
    }
    if (value) autoOpened = true;
    toggle.textContent = label(value ? 'closeChat' : 'openChat');
    toggle.setAttribute('aria-expanded', String(value));
    if (value) {
      initialize();
      panel.focus({ preventScroll: true });
    } else {
      toggle.focus({ preventScroll: true });
    }
  };
  if (isLauncher) {
    const wrapper = document.createElement('div');
    wrapper.className = isPopup ? 'launcher-root popup-root' : 'launcher-root';
    if (host.dataset.position === 'left') wrapper.classList.add('is-left');
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'launcher-toggle';
    toggle.textContent = label('openChat');
    toggle.setAttribute('aria-controls', overlayId);
    toggle.setAttribute('aria-expanded', 'false');
    panel = document.createElement('div');
    panel.className = 'launcher-panel';
    panel.id = overlayId;
    panel.role = 'dialog';
    panel.setAttribute('aria-label', label('formDialog'));
    if (isPopup) panel.setAttribute('aria-modal', 'true');
    panel.tabIndex = -1;
    panel.hidden = true;
    if (isPopup) {
      const backdrop = document.createElement('div');
      backdrop.className = 'popup-backdrop';
      backdrop.hidden = true;
      backdrop.addEventListener('click', () => setOpen(false));
      wrapper.append(backdrop);
    }
    wrapper.append(panel, toggle);
    root.append(wrapper);
    chatRoot = document.createElement('div');
    panel.append(chatRoot, captchaRoot);
    toggle.addEventListener('click', () => setOpen(panel!.hidden));
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && panel && !panel.hidden) {
        event.preventDefault();
        setOpen(false);
      }
      if (isPopup && event.key === 'Tab' && panel && !panel.hidden) {
        const items = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]')];
        const first = items[0], last = items.at(-1);
        const active = shadow.activeElement;
        if (!first || !last) { event.preventDefault(); panel.focus(); }
        else if (event.shiftKey && (panel.contains(active) ? active === first : true)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (active === last || !panel.contains(active))) { event.preventDefault(); first.focus(); }
      }
    });
  }
  if (!isLauncher) root.after(captchaRoot);
  render(<Chat controller={controller} onClose={() => { if (isLauncher) setOpen(false); else if (!options.preview) { controller.close(); host.hidden = true; } }} />, chatRoot);
  const handle: RuntimeHandle = {
    unmount: () => { if (autoTimer) clearTimeout(autoTimer); if (scrollHandler) window.removeEventListener('scroll', scrollHandler); if (openTrigger) document.removeEventListener('click', openTrigger); unsubscribe(); releaseFont(); colorScheme?.removeEventListener('change', appearance); controller.dispose(); render(null, chatRoot); shadow.replaceChildren(); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('storage', externalChange); mounted.delete(host); },
    prefill: answers => controller.prefillAnswers(answers),
    getState: () => previewState(controller),
    jumpToStep: id => controller.jumpToStep(id),
    open: () => {
      if (isLauncher) { setOpen(true); return; }
      host.hidden = false;
      initialize();
      host.scrollIntoView?.({ behavior: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      host.shadowRoot?.querySelector<HTMLElement>('input,button,textarea,select')?.focus({ preventScroll: true });
    },
  };
  mounted.set(host, { handle, id, controller });
  if (isLauncher && !options.preview) {
    // Same-page controls such as <button data-cff-open="123"> open this launcher or popup.
    openTrigger = event => {
      const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cff-open]') : null;
      if (trigger?.dataset.cffOpen === String(id)) { event.preventDefault(); setOpen(true); }
    };
    document.addEventListener('click', openTrigger);
    const seconds = host.dataset.autoOpen;
    if (seconds !== undefined && seconds !== '' && /^\d+$/.test(seconds)) {
      autoTimer = setTimeout(() => { if (!autoOpened && !host.hidden) setOpen(true); }, Math.min(3600, Number(seconds)) * 1000);
    }
    const percent = host.dataset.scrollPercent;
    if (percent !== undefined && percent !== '' && /^\d+$/.test(percent)) {
      scrollHandler = () => {
        const total = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (!autoOpened && !host.hidden && total > 0 && window.scrollY / total * 100 >= Number(percent)) {
          setOpen(true);
          if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
        }
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }
  }
  if (!isLauncher) initialize();
  return handle;
}

declare global {
  interface Window {
    ChatFlow: { open(formId: string | number): boolean; prefill(answers: AnswerMap, formId?: string | number): void; registerField(type: string, renderer: ComponentType<FieldProps>): () => void; optOutAnalytics(optOut?: boolean): void };
  }
}

export function autoMount(root: Pick<Document, 'querySelectorAll'> = document): void {
  for (const host of root.querySelectorAll<HTMLElement>('cff-chat[data-form-id]')) {
    if (mounted.has(host)) continue;
    const config: RuntimeOptions = {};
    const inline = host.querySelector<HTMLScriptElement>('script[type="application/json"][data-cff-schema]');
    if (inline) { try { config.form = JSON.parse(inline.textContent ?? '') as NonNullable<RuntimeOptions['form']>; } catch { /* Fetch public schema instead. */ } }
    try { mountRuntime(host, config); } catch { host.textContent = 'ChatFlow: configuration error'; }
  }
}
if (typeof window !== 'undefined') {
  window.ChatFlow = {
    optOutAnalytics(optOut = true) { try { localStorage.setItem('cff_analytics_optout', optOut ? '1' : '0'); } catch { /* Storage may be disabled. */ } for (const { controller } of mounted.values()) controller.options.analyticsOptOut = optOut; },
    open: id => {
      autoMount(); const host = [...mounted.keys()].find(h => mounted.get(h)?.id === Number(id));
      if (!host) return false;
      mounted.get(host)!.handle.open(); return true;
    },
    prefill: (answers, id) => { for (const { handle, id: formId } of mounted.values()) if (id === undefined || Number(id) === formId) handle.prefill(answers); },
    registerField,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => autoMount(), { once: true }); else autoMount();
}
