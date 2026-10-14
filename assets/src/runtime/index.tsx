/** @jsxImportSource preact */
import { render, type ComponentType } from 'preact';
import css from './styles.css?inline';
import { ApiClient } from './api';
import { Chat } from './chat';
import { RuntimeController } from './controller';
import { registerField } from './registry';
import { safeColor, safeFont, scopedAppearanceCss } from './appearance';
import { phrases } from './i18n';
import type { AnswerMap, FieldProps, RuntimeOptions } from './types';
export type { RuntimeOptions, FieldProps, PublicForm } from './types';
export { registerField } from './registry';

export interface RuntimeHandle {
  unmount(): void;
  prefill(answers: AnswerMap): void;
  getState(): ReturnType<typeof previewState>;
  open?(): void;
}
const mounted = new Map<HTMLElement, { handle: RuntimeHandle; id: number }>();
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
  const controller = new RuntimeController(config, options.preview ? null : new ApiClient(restUrl!), undefined, (name, detail) => host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })));
  const appearance = () => {
    const value = controller.state.form?.form.appearance;
    if (!value) return;
    const entries = { '--cff-primary': safeColor(value.primary), '--cff-bubble-bot-bg': safeColor(value.botBubbleBackground), '--cff-user-bg': safeColor(value.userBubbleBackground), '--cff-text': safeColor(value.textColor), '--cff-font': value.inheritFont ? 'inherit' : safeFont(value.font), '--cff-radius': Number.isFinite(value.radius) ? `${Math.max(0, Math.min(128, value.radius!))}px` : undefined, '--cff-width': Number.isFinite(value.width) ? `${Math.max(280, Math.min(2000, value.width!))}px` : undefined };
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
  let chatRoot = root;
  let toggle: HTMLButtonElement | null = null;
  let panel: HTMLDivElement | null = null;
  let initialized = false;
  const label = phrases(config.locale);
  const setOpen = (value: boolean) => {
    if (!toggle || !panel) return;
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
      if (!initialized) {
        initialized = true;
        connection();
        void controller.initialize().then(appearance);
      }
      panel.focus({ preventScroll: true });
    } else {
      toggle.focus({ preventScroll: true });
    }
  };
  if (isLauncher) {
    const wrapper = document.createElement('div');
    wrapper.className = isPopup ? 'launcher-root popup-root' : 'launcher-root';    if (host.dataset.position === 'left') wrapper.classList.add('is-left');
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
    chatRoot = panel;
    toggle.addEventListener('click', () => setOpen(panel!.hidden));
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && panel && !panel.hidden) {
        event.preventDefault();
        setOpen(false);
      }
      if (isPopup && event.key === 'Tab' && panel && !panel.hidden) {
        const items = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]')];
        const first = items[0], last = items.at(-1);
        if (!first || !last) { event.preventDefault(); panel.focus(); }
        else if (event.shiftKey && (panel.contains(document.activeElement) ? document.activeElement === first : true)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    });
  }
  render(<Chat controller={controller} onClose={() => { if (isLauncher) setOpen(false); else if (!options.preview) host.hidden = true; }} />, chatRoot);
  const handle: RuntimeHandle = {
    unmount: () => { if (autoTimer) clearTimeout(autoTimer); if (scrollHandler) window.removeEventListener('scroll', scrollHandler); unsubscribe(); colorScheme?.removeEventListener('change', appearance); controller.dispose(); render(null, chatRoot); shadow.replaceChildren(); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('storage', externalChange); mounted.delete(host); },
    prefill: answers => controller.prefillAnswers(answers),
    getState: () => previewState(controller),
    ...(isLauncher ? { open: () => setOpen(true) } : {}),
  };
  mounted.set(host, { handle, id });
  if (isLauncher && !options.preview) {
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
  if (!isLauncher) { connection(); void controller.initialize().then(appearance); }
  return handle;
}

declare global {
  interface Window {
    ChatFlow: { open(formId: string | number): boolean; prefill(answers: AnswerMap, formId?: string | number): void; registerField(type: string, renderer: ComponentType<FieldProps>): () => void };
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
    open: id => {
      autoMount(); const host = [...mounted.keys()].find(h => mounted.get(h)?.id === Number(id));
      if (!host) return false;
      host.hidden = false;
      const handle = mounted.get(host)?.handle;
      if (handle?.open) { handle.open(); return true; }
      host.scrollIntoView?.({ behavior: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      host.shadowRoot?.querySelector<HTMLElement>('input,button,textarea,select')?.focus({ preventScroll: true }); return true;
    },
    prefill: (answers, id) => { for (const { handle, id: formId } of mounted.values()) if (id === undefined || Number(id) === formId) handle.prefill(answers); },
    registerField,
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => autoMount(), { once: true }); else autoMount();
}
