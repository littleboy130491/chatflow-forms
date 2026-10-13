// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStorage, type SavedSession } from '../../../assets/src/runtime/persistence';
import { captureFirstTouch, clearFirstTouch, collectMeta, firstTouchKey, safePageUrl } from '../../../assets/src/tracking';

const now = Date.parse('2026-10-13T00:00:00Z');
const saved: SavedSession = { formId: 42, version: 1, sessionId: '12345678-1234-4234-8234-123456789abc', revision: 1, answers: { name: 'Ada' }, acknowledged: ['intro'], dirty: true, stepTimings: {}, resumeToken: `r1.test_random.${Math.floor(now / 1000) + 86400}.test_signature`, expiresAt: new Date(now + 86400000).toISOString() };
beforeEach(() => { localStorage.clear(); document.cookie = 'cff_s_42=; Path=/; Max-Age=0'; });
describe('durable persistence', () => {
  it('mirrors answers to versioned localStorage but keeps only durable credentials in cookies', () => {
    const cookie = { cookie: '' }; const store = new SessionStorage(localStorage, cookie, true, () => now);
    expect(store.write(saved)).toBe(true); expect(store.read(42)).toEqual(saved);
    expect(cookie.cookie).toMatch(/^cff_s_42=r1\./); expect(cookie.cookie).toContain('Path=/; Max-Age=86400; SameSite=Lax; Secure');
    expect(cookie.cookie).not.toMatch(/Ada|requestToken|answers|sessionId/);
    expect(store.credential(42)).toBe(saved.resumeToken);
    store.clear(42); expect(store.read(42)).toBeNull(); expect(cookie.cookie).toContain('Max-Age=0');
  });
  it('resumes from the cookie when local answers are gone and rejects expired/malformed data', () => {
    const cookie = { cookie: `cff_s_42=${encodeURIComponent(saved.resumeToken)}` }; const store = new SessionStorage(localStorage, cookie, true, () => now);
    expect(store.credential(42)).toBe(saved.resumeToken);
    localStorage.setItem(store.key(42, 1), JSON.stringify({ ...saved, expiresAt: new Date(now - 1).toISOString() })); expect(store.read(42)).toBeNull(); expect(localStorage.length).toBe(0);
    cookie.cookie = `cff_s_42=r1.random.1.signature`; expect(store.credential(42)).toBeNull();
    localStorage.setItem(store.key(42, 1), '{broken'); expect(store.read(42)).toBeNull();
  });
  it('fails safely when localStorage/cookie access is denied without changing unrelated keys', () => {
    const throwing = { get length(): number { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, getItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); }, key() { throw new Error('denied'); }, clear() {} };
    const cookie = { get cookie(): string { throw new Error('denied'); }, set cookie(_value: string) { throw new Error('denied'); } };
    const denied = new SessionStorage(throwing, cookie, true, () => now);
    expect(denied.write(saved)).toBe(false); expect(denied.read(42)).toBeNull(); expect(denied.credential(42)).toBeNull(); expect(() => denied.clear(42)).not.toThrow();
    localStorage.setItem('unrelated', 'keep'); new SessionStorage(localStorage, { cookie: '' }, false, () => now).clear(42); expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});
describe('consent-aware first-touch attribution', () => {
  const landing = { href: 'https://example.test/landing?utm_source=original&utm_campaign=offer&gclid=test#secret', referrer: 'https://search.test/?secret=abc' };
  it('is off by default and requires consent when configured', () => {
    expect(captureFirstTouch({}, localStorage, landing, now)).toEqual({});
    expect(captureFirstTouch({ enabled: true, consentRequired: true }, localStorage, landing, now)).toEqual({}); expect(localStorage.length).toBe(0); expect(collectMeta({ enabled: false })).toEqual({});
  });
  it('preserves first touch across navigation and renews only after expiry', () => {
    const options = { enabled: true, consentRequired: true, consentGranted: true, days: 1 };
    const touch = captureFirstTouch(options, localStorage, landing, now);
    expect(touch).toEqual({ landingPage: 'https://example.test/landing', landingReferrer: 'https://search.test/', utm: { source: 'original', campaign: 'offer' }, clickIds: { gclid: 'test' } });
    const next = { href: 'https://example.test/form?utm_source=new', referrer: landing.href };
    expect(captureFirstTouch(options, localStorage, next, now + 100)).toEqual(touch);
    expect(captureFirstTouch(options, localStorage, next, now + 86400001).utm).toEqual({ source: 'new' });
  });
  it('caps fields/expiry, strips query/hash/credentials and ignores unsafe protocols', () => {
    const meta = captureFirstTouch({ enabled: true, days: 999 }, localStorage, { href: `https://example.test/?utm_source=${'a'.repeat(500)}`, referrer: 'javascript:alert(1)' }, now);
    expect(meta.utm?.source).toHaveLength(255); expect(meta.landingReferrer).toBe('');
    expect(JSON.parse(localStorage.getItem(firstTouchKey) ?? '{}').expiresAt).toBe(now + 90 * 86400000);
    expect(safePageUrl('https://user:password@example.test/path?credential=secret#hash')).toBe('https://example.test/path'); expect(safePageUrl('data:text/html,secret')).toBe('');
    clearFirstTouch(localStorage); expect(localStorage.getItem(firstTouchKey)).toBeNull();
  });
  it('removes prior attribution after revocation and respects Do Not Track by default', () => {
    captureFirstTouch({ enabled: true }, localStorage, landing, now); expect(localStorage.getItem(firstTouchKey)).not.toBeNull();
    captureFirstTouch({ enabled: true, consentRequired: true, consentGranted: false }, localStorage, landing, now); expect(localStorage.getItem(firstTouchKey)).toBeNull();
    vi.stubGlobal('navigator', { doNotTrack: '1' });
    expect(captureFirstTouch({ enabled: true }, localStorage, landing, now)).toEqual({}); expect(captureFirstTouch({ enabled: true, respectDnt: false }, localStorage, landing, now).utm?.source).toBe('original'); vi.unstubAllGlobals();
  });
  it('reprojects stored attribution instead of forwarding injected/private metadata', () => {
    localStorage.setItem(firstTouchKey, JSON.stringify({ expiresAt: now + 86400000, landingPage: 'https://localhost/start?token=secret', ip: 'private', requestToken: 'private', utm: { source: 'a'.repeat(300), extra: 'private' }, clickIds: { gclid: 'click', secret: 'private' } }));
    const meta = captureFirstTouch({ enabled: true }, localStorage, landing, now); expect(meta.landingPage).toBe('https://localhost/start'); expect(meta.utm?.source?.length).toBe(255); expect(meta).not.toHaveProperty('ip'); expect(meta).not.toHaveProperty('requestToken'); expect(meta.utm).not.toHaveProperty('extra'); expect(meta.clickIds).not.toHaveProperty('secret');
  });
});
