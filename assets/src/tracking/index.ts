import { safeLocalStorage } from '../runtime/persistence';
import type { ClientMeta } from '../shared/contracts';
export type { ClientMeta } from '../shared/contracts';
export const firstTouchKey = 'cff_ft';
export interface TrackingOptions { enabled?: boolean; consentRequired?: boolean; consentGranted?: boolean; days?: number }
interface FirstTouch extends ClientMeta { expiresAt: number }
const utmKeys = ['source', 'medium', 'campaign', 'term', 'content'] as const;
const clickKeys = ['gclid', 'fbclid', 'msclkid', 'ttclid'] as const;
export function safePageUrl(raw: string): string {
  try { const url = new URL(raw); if (!['http:', 'https:'].includes(url.protocol)) return ''; return `${url.origin}${url.pathname}`.slice(0, 2048); } catch { return ''; }
}
export function captureFirstTouch(options: TrackingOptions = {}, storage = safeLocalStorage(), environment = { href: globalThis.location?.href ?? '', referrer: globalThis.document?.referrer ?? '' }, now = Date.now()): ClientMeta {
  if (!options.enabled || (options.consentRequired && !options.consentGranted)) { clearFirstTouch(storage); return {}; }
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
export function collectMeta(options: TrackingOptions = {}): ClientMeta {
  if (!options.enabled || (options.consentRequired && !options.consentGranted)) { clearFirstTouch(); return {}; }
  return { ...captureFirstTouch(options), pageUrl: safePageUrl(globalThis.location?.href ?? ''), referrer: safePageUrl(globalThis.document?.referrer ?? ''), locale: globalThis.navigator?.language?.slice(0, 35) ?? '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: globalThis.screen ? `${screen.width}x${screen.height}` : '' };
}
export function clearFirstTouch(storage = safeLocalStorage()): void { try { storage?.removeItem(firstTouchKey); } catch { /* Storage disabled. */ } }
declare global { interface Window { cffTracking?: TrackingOptions } }
if (typeof window !== 'undefined' && window.cffTracking?.enabled) captureFirstTouch(window.cffTracking);
