/** @jsxImportSource preact */
import { render, type ComponentType } from 'preact';
import css from './styles.css?inline';
import { ApiClient } from './api';
import { Chat } from './chat';
import { RuntimeController } from './controller';
import { registerField } from './registry';
import { buttonTextColor, safeColor, safeFont, scopedAppearanceCss } from './appearance';
import { phrases } from './i18n';
import { googleFont, systemFont, type GoogleFont } from '../shared/fonts';
import { acquireGoogleFont } from './fonts';
import type { AnswerMap, FieldProps, PublicForm, RuntimeOptions } from './types';
import { captchaToken } from './captcha';
import { frontendApi, type Frontend } from './frontend';
import { safeLink } from './content';
export type { RuntimeOptions, FieldProps, PublicForm } from './types';
export { registerField } from './registry';
export type { Frontend, FrontendApi, FrontendContext, FrontendState } from './frontend';

export interface RuntimeHandle {
  unmount(): void;
  /** Preview only: restyle the running form without restarting its conversation. */
  setAppearance(appearance: Appearance): void;
  prefill(answers: AnswerMap): void;
  getState(): ReturnType<typeof previewState>;
  jumpToStep(id: string): boolean;
  open(): void;
}
type Appearance = NonNullable<PublicForm['form']['appearance']>;
type ThemeColor = 'primary' | 'botBubbleBackground' | 'userBubbleBackground' | 'textColor' | 'headerBackground' | 'headerText' | 'chatBackground' | 'userTextColor';
const classicDefaults: Record<ThemeColor, string | undefined> = { primary: undefined, botBubbleBackground: undefined, userBubbleBackground: undefined, textColor: undefined, headerBackground: '#ffffff', headerText: '#171717', chatBackground: '#ffffff', userTextColor: '#171717' };
const messagingDefaults: Record<ThemeColor, string> = { primary: '#3390ec', botBubbleBackground: '#ffffff', userBubbleBackground: '#e1fec6', textColor: '#000000', headerBackground: '#ffffff', headerText: '#000000', chatBackground: '#dbe6ee', userTextColor: '#000000' };
const darkMessagingDefaults: Record<ThemeColor, string> = { primary: '#5eb5f7', botBubbleBackground: '#182533', userBubbleBackground: '#2b5278', textColor: '#f5f5f5', headerBackground: '#17212b', headerText: '#f5f5f5', chatBackground: '#0e1621', userTextColor: '#ffffff' };
let themeFrontend: Frontend | null = null;
/** Hosts rendered by PHP for a theme frontend that has not registered yet. */
const waiting = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
/** How long a theme frontend may take to register before the built-in chat is used instead. */
export const THEME_FRONTEND_TIMEOUT_MS = 4000;

/** A theme replaces the chat UI; forms rendered with data-frontend="theme" (and previews asking for it) use it. */
export function registerFrontend(frontend: Frontend): () => void {
  if (typeof frontend !== 'function') throw new TypeError('A frontend must be a function');
  themeFrontend = frontend;
  for (const [host, timer] of waiting) { clearTimeout(timer); waiting.delete(host); mountHost(host); }
  return () => { if (themeFrontend === frontend) themeFrontend = null; };
}
const mounted = new Map<HTMLElement, { handle: RuntimeHandle; id: number; controller: RuntimeController }>();
let overlayCounter = 0;
function previewState(controller: RuntimeController) {
  return { phase: controller.state.phase, visited: [...(controller.state.path?.visited ?? [])], currentStepId: controller.state.activeId, variables: { ...controller.state.path?.variables }, progress: controller.state.path?.progress ?? 0, errors: [...(controller.state.path?.errors ?? [])] };
}

function isLauncherMode(config: RuntimeOptions): boolean { return config.mode === 'launcher' || config.mode === 'popup'; }

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
  // A theme stylesheet (chatflow/frontend.css) goes inside the shadow root, after the built-in styles.
  const themeStyleUrl = options.themeStyle ?? host.dataset.themeStyle ?? '';
  const themeStyle = themeStyleUrl ? safeLink(themeStyleUrl) : null;
  if (themeStyle && /^https?:/.test(themeStyle)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = themeStyle; shadow.insertBefore(link, root); }
  const config: RuntimeOptions = { ...options, formId: id, locale: options.locale ?? host.dataset.locale ?? document.documentElement.lang ?? 'en', mode: options.mode ?? (['fullpage', 'launcher', 'popup'].includes(host.dataset.mode ?? '') ? host.dataset.mode as 'fullpage' | 'launcher' | 'popup' : 'inline') };
  const captchaRoot = document.createElement('div'); captchaRoot.className = 'captcha';
  config.captcha ??= config => captchaToken(config, captchaRoot);
  const api = options.preview ? null : new ApiClient(restUrl!);
  const controller = new RuntimeController(config, api, undefined, (name, detail) => host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })));
  let selectedFont: GoogleFont | undefined;
  let releaseFont: () => void = () => {};
  const appearance = (beforeOpen = false) => {
    // Before a lazy launcher first opens, style its button from the embedded form when there is one.
    const value = (controller.state.form ?? config.form)?.form.appearance;
    if (!value) return;
    // Fonts wait until the chat initialises, so a closed launcher never contacts Google Fonts.
    const font = value.inheritFont || beforeOpen ? undefined : googleFont(value.googleFont);
    if (font !== selectedFont) { releaseFont(); selectedFont = font; releaseFont = font ? acquireGoogleFont(host.ownerDocument, font) : () => {}; }
    // Messaging style has its own defaults; explicit theme colours always win.
    const dark = value.theme === 'dark' || (value.theme === 'auto' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
    const base = value.style === 'messaging' ? (dark ? darkMessagingDefaults : messagingDefaults) : classicDefaults;
    const color = (key: keyof typeof base) => safeColor(value[key]) ?? base[key];
    const entries = { '--cff-button-text': value.style === 'messaging' ? buttonTextColor(color('primary')!) : undefined, '--cff-primary': color('primary'), '--cff-bubble-bot-bg': color('botBubbleBackground'), '--cff-user-bg': color('userBubbleBackground'), '--cff-text': color('textColor'), '--cff-header-bg': color('headerBackground'), '--cff-header-text': color('headerText'), '--cff-chat-bg': color('chatBackground'), '--cff-user-text': color('userTextColor'), '--cff-font': value.inheritFont ? 'inherit' : (font ? `"${font}", ${safeFont(value.font) ?? systemFont}` : safeFont(value.font)), '--cff-radius': Number.isFinite(value.radius) ? `${Math.max(0, Math.min(128, value.radius!))}px` : undefined, '--cff-width': Number.isFinite(value.width) ? `${Math.max(280, Math.min(2000, value.width!))}px` : undefined };
    for (const [key, val] of Object.entries(entries)) { if (val) root.style.setProperty(key, val); else root.style.removeProperty(key); }
    root.querySelector('.chat')?.classList.toggle('dark', Boolean(dark));
    if (value.style === 'messaging') root.dataset.style = 'messaging'; else delete root.dataset.style;
    customization.textContent = scopedAppearanceCss(value.customCss);
  };
  const restyle = () => appearance();
  const unsubscribe = controller.subscribe(restyle);
  if (isLauncherMode(config)) appearance(true);
  const colorScheme = globalThis.matchMedia?.('(prefers-color-scheme: dark)'); colorScheme?.addEventListener('change', restyle);
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
  let keyHandler: ((event: KeyboardEvent) => void) | null = null;
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
  let returnFocus: HTMLElement | null = null;
  const setOpen = (value: boolean) => {
    if (!toggle || !panel || value === !panel.hidden) return;
    if (value) {
      const focused = document.activeElement;
      returnFocus = focused instanceof HTMLElement && focused !== document.body && focused !== host ? focused : null;
    }
    if (!value && !panel.hidden) controller.close();
    host.hidden = false;
    panel.hidden = !value;
    if (isPopup) {
      const backdrop = root.querySelector<HTMLElement>('.popup-backdrop');
      if (backdrop) backdrop.hidden = !value;
    }
    if (value) autoOpened = true;
    // Open, the panel's own close button takes over; the launcher button only opens.
    toggle.hidden = value;
    toggle.setAttribute('aria-expanded', String(value));
    if (value) {
      initialize();
      panel.focus({ preventScroll: true });
    } else {
      (returnFocus?.isConnected ? returnFocus : toggle).focus({ preventScroll: true });
    }
  };
  if (isLauncher) {
    const wrapper = document.createElement('div');
    wrapper.className = isPopup ? 'launcher-root popup-root' : 'launcher-root';
    if (host.dataset.position === 'left') wrapper.classList.add('is-left');
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'launcher-toggle';
    toggle.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3C6.5 3 2 6.9 2 11.7c0 2.4 1.1 4.6 3 6.2L4.2 22l4.5-2.2c1 .3 2.1.5 3.3.5 5.5 0 10-3.9 10-8.6S17.5 3 12 3z"/></svg>';
    const toggleLabel = document.createElement('span'); toggleLabel.className = 'sr-only'; toggleLabel.textContent = label('openChat'); toggle.append(toggleLabel);
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
    // Listen on the document so Escape and the popup's Tab trap still work after the focused
    // control unmounts (focus falls back to <body>, outside the shadow tree).
    const onKey = (event: KeyboardEvent) => {
      if (!panel || panel.hidden) return;
      const inside = event.composedPath().includes(panel);
      if (event.key === 'Escape' && (inside || isPopup)) {
        event.preventDefault();
        setOpen(false);
      }
      if (isPopup && event.key === 'Tab') {
        const items = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]')].filter(item => item.tabIndex >= 0 && !item.closest('.honeypot,[hidden],[aria-hidden="true"]'));
        const first = items[0], last = items.at(-1);
        const active = shadow.activeElement;
        if (!first || !last) { event.preventDefault(); panel.focus(); }
        else if (event.shiftKey && (panel.contains(active) ? active === first || active === panel : true)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (active === last || !panel.contains(active))) { event.preventDefault(); first.focus(); }
      }
    };
    root.addEventListener('keydown', onKey);
    keyHandler = event => { if (!event.composedPath().includes(root)) onKey(event); };
    document.addEventListener('keydown', keyHandler);
  }
  if (!isLauncher) root.after(captchaRoot);
  const close = () => { if (isLauncher) setOpen(false); else if (!options.preview) { controller.close(); host.hidden = true; } };
  const wantsTheme = (options.frontend ?? (host.dataset.frontend === 'theme' ? 'theme' : 'default')) === 'theme';
  let cleanupFrontend: (() => void) | void = undefined;
  if (wantsTheme && themeFrontend) {
    try {
      cleanupFrontend = themeFrontend({ api: frontendApi(controller), root: chatRoot, shadowRoot: shadow, host, mode: config.mode ?? 'inline', preview: options.preview === true, close });
    } catch (error) {
      // A broken theme frontend must never leave visitors without a form.
      console.error('ChatFlow: the theme frontend failed; using the built-in chat.', error);
      chatRoot.replaceChildren();
      render(<Chat controller={controller} closable={isLauncher} onClose={close} />, chatRoot);
    }
  } else render(<Chat controller={controller} closable={isLauncher} onClose={close} />, chatRoot);
  const handle: RuntimeHandle = {
    unmount: () => { if (autoTimer) clearTimeout(autoTimer); if (scrollHandler) window.removeEventListener('scroll', scrollHandler); if (openTrigger) document.removeEventListener('click', openTrigger); if (keyHandler) document.removeEventListener('keydown', keyHandler); unsubscribe(); releaseFont(); colorScheme?.removeEventListener('change', restyle); controller.dispose(); if (typeof cleanupFrontend === 'function') { try { cleanupFrontend(); } catch { /* Theme cleanup errors must not block unmount. */ } } render(null, chatRoot); shadow.replaceChildren(); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('storage', externalChange); mounted.delete(host); },
    prefill: answers => controller.prefillAnswers(answers),
    getState: () => previewState(controller),
    jumpToStep: id => controller.jumpToStep(id),
    setAppearance: next => { if (options.preview) controller.setAppearance(next); },
    open: () => {
      if (isLauncher) { setOpen(true); return; }
      host.hidden = false;
      initialize();
      host.scrollIntoView?.({ behavior: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      (host.shadowRoot?.querySelector<HTMLElement>('.active input:not([type=hidden]),.active textarea,.active select,.active button') ?? host.shadowRoot?.querySelector<HTMLElement>('.chat'))?.focus({ preventScroll: true });
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
    ChatFlow: { open(formId: string | number): boolean; prefill(answers: AnswerMap, formId?: string | number): void; registerField(type: string, renderer: ComponentType<FieldProps>): () => void; registerFrontend(frontend: Frontend): () => void; optOutAnalytics(optOut?: boolean): void };
  }
}

function mountHost(host: HTMLElement, frontend?: 'default'): void {
  const config: RuntimeOptions = frontend ? { frontend } : {};
  const inline = host.querySelector<HTMLScriptElement>('script[type="application/json"][data-cff-schema]');
  if (inline) { try { config.form = JSON.parse(inline.textContent ?? '') as NonNullable<RuntimeOptions['form']>; } catch { /* Fetch public schema instead. */ } }
  try { mountRuntime(host, config); } catch { host.textContent = 'ChatFlow: configuration error'; }
}

export function autoMount(root: Pick<Document, 'querySelectorAll'> = document): void {
  for (const host of root.querySelectorAll<HTMLElement>('cff-chat[data-form-id]')) {
    if (mounted.has(host) || waiting.has(host)) continue;
    // The theme's frontend script loads after the runtime; wait for it to register, then fall back.
    if (host.dataset.frontend === 'theme' && !themeFrontend) {
      waiting.set(host, setTimeout(() => { waiting.delete(host); mountHost(host, 'default'); }, THEME_FRONTEND_TIMEOUT_MS));
      continue;
    }
    mountHost(host);
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
    registerFrontend,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => autoMount(), { once: true }); else autoMount();
}
