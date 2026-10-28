import { safeLocalStorage } from '../runtime/persistence';
import type { ClientMeta, FormSchema } from '../shared/contracts';
export type { ClientMeta } from '../shared/contracts';
export const firstTouchKey = 'cff_ft';
export interface TrackingOptions { enabled?: boolean; consentRequired?: boolean; consentGranted?: boolean; days?: number; respectDnt?: boolean }
interface FirstTouch extends ClientMeta { expiresAt: number }
function permitted(options: TrackingOptions): boolean {
  const gpc = ( globalThis.navigator as Navigator & { globalPrivacyControl?: boolean } )?.globalPrivacyControl === true;
  return !!options.enabled && !gpc && !(options.consentRequired && !options.consentGranted) && !(options.respectDnt !== false && globalThis.navigator?.doNotTrack === '1');
}
const utmKeys = ['source', 'medium', 'campaign', 'term', 'content'] as const;
const clickKeys = ['gclid', 'fbclid', 'msclkid', 'ttclid'] as const;
const queryKey = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

/** URL query keys the form itself uses (hidden fields and conditions). */
export function urlSourceKeys(schema: FormSchema): string[] {
  const keys = new Set<string>();
  const visit = (condition: unknown): void => {
    if (!condition || typeof condition !== 'object') return;
    const group = condition as { all?: unknown[]; any?: unknown[] };
    if (Array.isArray(group.all)) { group.all.forEach(visit); return; }
    if (Array.isArray(group.any)) { group.any.forEach(visit); return; }
    const predicate = condition as { source?: string; field?: unknown };
    if ((predicate.source ?? 'answer') === 'url' && typeof predicate.field === 'string' && queryKey.test(predicate.field)) keys.add(predicate.field);
  };
  for (const step of schema.steps) {
    if (step.type === 'hidden' && step.settings?.source === 'url') {
      const key = step.settings.sourceKey || step.key;
      if (queryKey.test(key)) keys.add(key);
    }
    for (const rule of [...(step.logic ?? []), ...(step.options ?? []).flatMap(option => option.logic ?? [])]) visit(rule.if);
  }
  for (const outcome of schema.outcomes ?? []) visit(outcome.if);
  return [...keys].slice(0, 100);
}

function trackedUrlParams(keys: readonly string[]): NonNullable<ClientMeta['urlParams']> {
  const query = new URLSearchParams(globalThis.location?.search ?? '');
  const values: Record<string, string> = {};
  for (const key of keys.slice(0, 100)) {
    if (!queryKey.test(key)) continue;
    const value = query.get(key);
    if (value !== null && value.length <= 1000) values[key] = value;
  }
  return values;
}
export function safePageUrl(raw: string): string {
  try { const url = new URL(raw); if (!['http:', 'https:'].includes(url.protocol)) return ''; return `${url.origin}${url.pathname}`.slice(0, 2048); } catch { return ''; }
}
export function captureFirstTouch(options: TrackingOptions = {}, storage = safeLocalStorage(), environment = { href: globalThis.location?.href ?? '', referrer: globalThis.document?.referrer ?? '' }, now = Date.now()): ClientMeta {
  if (!permitted(options)) { clearFirstTouch(storage); return {}; }
  try {
    const saved: unknown = JSON.parse(storage?.getItem(firstTouchKey) ?? 'null');
    if (saved && typeof saved === 'object' && Number((saved as FirstTouch).expiresAt) > now && Number((saved as FirstTouch).expiresAt) <= now + 90 * 86400000) return project(saved as FirstTouch);
  } catch { /* Disabled or invalid storage. */ }
  let url: URL;
  try { url = new URL(environment.href || 'https://localhost/'); } catch { return {}; }
  if (!['http:', 'https:'].includes(url.protocol)) return {};
  const utm: NonNullable<ClientMeta['utm']> = {}; const clickIds: NonNullable<ClientMeta['clickIds']> = {};
  for (const key of utmKeys) { const value = url.searchParams.get(`utm_${key}`); if (value) utm[key] = value.slice(0, 255); }
  for (const key of clickKeys) { const value = url.searchParams.get(key); if (value) clickIds[key] = value.slice(0, 255); }
  const touch: FirstTouch = { landingPage: safePageUrl(environment.href), landingReferrer: safePageUrl(environment.referrer), utm, clickIds, expiresAt: now + Math.min(90, Math.max(1, Number.isFinite(options.days) ? options.days! : 30)) * 86400000 };
  try { storage?.setItem(firstTouchKey, JSON.stringify(touch)); } catch { /* Storage disabled. */ }
  return project(touch);
}
function project(touch: FirstTouch): ClientMeta {
  const utm: NonNullable<ClientMeta['utm']> = {}; const clickIds: NonNullable<ClientMeta['clickIds']> = {};
  for (const key of utmKeys) if (typeof touch.utm?.[key] === 'string') utm[key] = touch.utm[key]!.slice(0, 255);
  for (const key of clickKeys) if (typeof touch.clickIds?.[key] === 'string') clickIds[key] = touch.clickIds[key]!.slice(0, 255);
  return { landingPage: safePageUrl(touch.landingPage ?? ''), landingReferrer: safePageUrl(touch.landingReferrer ?? ''), utm, clickIds };
}
export function collectMeta(options: TrackingOptions = {}, urlKeys: readonly string[] = []): ClientMeta {
  if (!permitted(options)) { clearFirstTouch(); return {}; }
  const urlParams = trackedUrlParams(urlKeys);
  return { ...captureFirstTouch(options), pageTitle: globalThis.document?.title?.slice(0, 500) ?? '', pageUrl: safePageUrl(globalThis.location?.href ?? ''), referrer: safePageUrl(globalThis.document?.referrer ?? ''), ...(Object.keys(urlParams).length ? { urlParams } : {}), locale: globalThis.navigator?.language?.slice(0, 35) ?? '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: globalThis.screen ? `${screen.width}x${screen.height}` : '' };
}
export function clearFirstTouch(storage = safeLocalStorage()): void { try { storage?.removeItem(firstTouchKey); } catch { /* Storage disabled. */ } }
declare global { interface Window { cffTracking?: TrackingOptions } }
if (typeof window !== 'undefined' && window.cffTracking?.enabled) captureFirstTouch(window.cffTracking);
