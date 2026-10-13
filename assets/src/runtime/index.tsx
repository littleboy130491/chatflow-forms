/** @jsxImportSource preact */
import { render, type ComponentType } from 'preact';
import css from './styles.css?inline';
import { ApiClient } from './api';
import { Chat } from './chat';
import { RuntimeController } from './controller';
import { registerField } from './registry';
import { safeColor, safeFont, scopedAppearanceCss } from './appearance';
import { googleFont, systemFont, type GoogleFont } from '../shared/fonts';
import { acquireGoogleFont } from './fonts';
import type { AnswerMap, FieldProps, RuntimeOptions } from './types';
import { createOverlay } from './overlay';
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
  const mode = options.mode ?? (['fullpage', 'launcher', 'popup'].includes(host.dataset.mode ?? '') ? host.dataset.mode as NonNullable<RuntimeOptions['mode']> : 'inline');
  const config: RuntimeOptions = { ...options, formId: id, locale: options.locale ?? host.dataset.locale ?? document.documentElement.lang ?? 'en', mode };
  const captchaRoot = document.createElement('div'); captchaRoot.className = 'captcha';
  config.captcha ??= config => captchaToken(config, captchaRoot);
  const controller = new RuntimeController(config, options.preview ? null : new ApiClient(restUrl!), undefined, (name, detail) => host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })));
  let initialized = false;
  let selectedFont: GoogleFont | undefined;
  let releaseFont: () => void = () => {};
  const initialize = () => { if (initialized) return; initialized = true; connection(); void controller.initialize().then(appearance); };
  const overlay = !options.preview && (mode === 'launcher' || mode === 'popup') ? createOverlay(shadow, host, mode, options.launcher ?? {}, () => { initialize(); }, config.locale ?? 'en', () => controller.close()) : null;
  if (overlay) { root.remove(); overlay.content.append(root); }
  root.after(captchaRoot);
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
  render(<Chat controller={controller} onClose={() => { if (overlay) overlay.close(); else if (!options.preview) { controller.close(); host.hidden = true; } }} />, root);
  const handle: RuntimeHandle = {
    unmount: () => { unsubscribe(); releaseFont(); colorScheme?.removeEventListener('change', appearance); controller.dispose(); render(null, root); overlay?.dispose(); shadow.replaceChildren(); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('storage', externalChange); mounted.delete(host); },
    open: () => { if (overlay) overlay.open(); else { host.hidden = false; initialize(); host.scrollIntoView?.({ behavior: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); host.shadowRoot?.querySelector<HTMLElement>('input,button,textarea,select')?.focus({ preventScroll: true }); } },
    prefill: answers => controller.prefillAnswers(answers),
    getState: () => previewState(controller),
    jumpToStep: id => controller.jumpToStep(id),
  };
  mounted.set(host, { handle, id, controller });
  if (!overlay) initialize();
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
    try { if (host.dataset.launcher) config.launcher = JSON.parse(host.dataset.launcher) as NonNullable<RuntimeOptions['launcher']>; } catch { /* Ignore malformed optional appearance. */ }
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
