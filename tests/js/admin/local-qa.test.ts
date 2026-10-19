import { describe, expect, it } from 'vitest';
import { createLocalQaGuard, prepareLocalLogin, guardLocalRoute, shouldSkipLocalQa } from '../../e2e/local-qa';

const base = 'http://127.0.0.1:8891';
const guard = () => createLocalQaGuard({ CFF_E2E: '1', CFF_E2E_BASE_URL: base });

describe('local-only admin QA authorization', () => {
  it('requires exact explicit opt-in before any work', () => {
    for (const CFF_E2E of [undefined, '', 'true', '0', '01']) {
      expect(() => createLocalQaGuard({ CFF_E2E, CFF_E2E_BASE_URL: base })).toThrow(/CFF_E2E=1/);
    }
  });
  it('rejects remote, credentialed and non-HTTP bases', () => {
    for (const url of ['https://example.com', 'http://localhost.example.com', 'http://user:pass@localhost', 'ftp://localhost', 'file:///tmp/qa', 'http://[::1]']) {
      expect(() => createLocalQaGuard({ CFF_E2E: '1', CFF_E2E_BASE_URL: url })).toThrow();
    }
  });
  it('permits HTTP(S) localhost and 127.0.0.1 only on the chosen exact origin', () => {
    for (const url of [base, 'https://localhost:9443']) {
      const g = createLocalQaGuard({ CFF_E2E: '1', CFF_E2E_BASE_URL: url });
      expect(g.assertUrl('/wp-login.php')).toBe(url + '/wp-login.php');
      expect(g.assertUrl(url + '/chat/qa/')).toBe(url + '/chat/qa/');
    }
    for (const url of ['http://localhost:8891', 'http://127.0.0.1:8892', 'https://127.0.0.1:8891', '//evil.example/login', 'http://u:p@127.0.0.1:8891', 'blob:http://127.0.0.1:8891/qa']) {
      expect(() => guard().assertUrl(url)).toThrow();
    }
  });
});


describe('credential read ordering', () => {
  it('rejects the actual redirected login origin before reading credentials', async () => {
    const actions: string[] = [];
    const page = {
      goto: async () => { actions.push('navigate'); },
      waitForLoadState: async () => { actions.push('settle'); },
      url: () => 'https://evil.example/wp-login.php',
    };
    await expect(prepareLocalLogin(guard(), page, () => { actions.push('read-private-auth'); return {}; })).rejects.toThrow(/local origin/);
    expect(actions).toEqual(['navigate', 'settle']);
  });
  it('reads credentials only after the actual local login page has settled', async () => {
    const actions: string[] = [];
    const auth = { username: 'test-only', password: 'not-a-real-secret' };
    const page = {
      goto: async (url: string) => { actions.push(url); },
      waitForLoadState: async () => { actions.push('settle'); },
      url: () => base + '/wp-login.php?redirect_to=wp-admin',
    };
    expect(await prepareLocalLogin(guard(), page, () => { actions.push('read-private-auth'); return auth; })).toBe(auth);
    expect(actions).toEqual([base + '/wp-login.php', 'settle', 'read-private-auth']);
  });
});


const fixture = () => ({ formId: 38, slug: 'qa-admin-functions-embed-20261019-123448', formTitle: 'QA admin-functions embed 20261019-123448', publicUrl: base + '/chat/qa/', pages: { block: base + '/qa-block/' } });
describe('fixture boundary and identity', () => {
  it('validates every public and embed URL before use', () => {
    expect(guard().validateFixture(fixture()).formId).toBe(38);
    expect(() => guard().validateFixture({ ...fixture(), publicUrl: 'https://evil.example/chat/' })).toThrow();
    expect(() => guard().validateFixture({ ...fixture(), pages: { block: base + '/ok/', php: 'http://localhost:8891/foreign-origin' } })).toThrow();
    expect(() => guard().validateFixture({ ...fixture(), formId: '38&blank=1' })).toThrow();
  });
  it('allows mutation only of the exact expected QA-named form', () => {
    const f = guard().validateFixture(fixture());
    expect(() => guard().assertFixtureForm(f, fixture().formTitle)).not.toThrow();
    for (const title of ['Customer survey', 'QA admin-functions embed other', 'QA admin-functions embed 20261019-123449']) {
      expect(() => guard().assertFixtureForm(f, title)).toThrow();
    }
    expect(() => guard().validateFixture({ ...fixture(), formTitle: 'Customer survey' })).toThrow();
  });
  it('supports the existing timestamp-slug manifest with an equally exact derived title', () => {
    const legacy = { ...fixture(), formTitle: undefined };
    const f = guard().validateFixture(legacy);
    expect(f.formTitle).toBe('QA admin-functions embed 20261019-123448');
    expect(() => guard().assertFixtureForm(f, f.formTitle)).not.toThrow();
    expect(() => guard().validateFixture({ ...legacy, slug: 'customer-survey' })).toThrow();
  });
});


describe('request and redirect firewall', () => {
  function route(url: string, location?: string) {
    const actions: string[] = [];
    return {
      actions,
      request: () => ({ url: () => url }),
      fetch: async (options: { maxRedirects: number }) => {
        actions.push(`fetch:${options.maxRedirects}`);
        return { url: () => url, headers: () => location ? { location } : {}, status: () => location ? 302 : 200 };
      },
      fulfill: async () => { actions.push('fulfill'); },
      abort: async () => { actions.push('abort'); },
    };
  }
  it('aborts cross-origin navigation before any request is sent', async () => {
    const r = route('https://evil.example/');
    await expect(guardLocalRoute(guard(), r)).rejects.toThrow();
    expect(r.actions).toEqual(['abort']);
  });
  it('does not follow cross-origin redirects (including login and public pages)', async () => {
    for (const path of ['/wp-login.php', '/wp-admin/', '/chat/qa/']) {
      const r = route(base + path, 'https://evil.example/receiver');
      await expect(guardLocalRoute(guard(), r)).rejects.toThrow();
      expect(r.actions).toEqual(['fetch:0', 'abort']);
    }
  });
  it('permits same-origin redirects and normal responses without auto-following', async () => {
    for (const location of [undefined, '/wp-admin/', base + '/chat/qa/']) {
      const r = route(base + '/wp-login.php', location);
      await guardLocalRoute(guard(), r);
      expect(r.actions).toEqual(['fetch:0', 'fulfill']);
    }
  });
});

describe('optional fixture suite availability', () => {
  it('skips without opt-in or either optional artifact, without reading credentials', () => {
    expect(shouldSkipLocalQa(undefined, () => { throw new Error('must not probe'); })).toBe(true);
    expect(shouldSkipLocalQa('true', () => { throw new Error('must not probe'); })).toBe(true);
    expect(shouldSkipLocalQa('1', () => false)).toBe(true);
    expect(shouldSkipLocalQa('1', () => true)).toBe(false);
  });
});
