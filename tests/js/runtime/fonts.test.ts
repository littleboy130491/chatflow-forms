// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { googleFont, googleFontUrl } from '../../../assets/src/shared/fonts';
import { acquireGoogleFont, googleFontCss } from '../../../assets/src/runtime/fonts';
import { mountRuntime } from '../../../assets/src/runtime';
import { form } from './helpers';

const css = `/* latin */ @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v1/font.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131; }`;
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });
describe('bounded opt-in fonts', () => {
  const fixtures = JSON.parse(readFileSync('tests/fixtures/fonts.json', 'utf8')) as { name: string; appearance: Record<string, unknown>; valid: boolean }[];
  const settings = JSON.parse(readFileSync('schema/settings.schema.json', 'utf8'));
  const schema = JSON.parse(readFileSync('schema/form.schema.json', 'utf8'));
  const ajv = new Ajv({ strict: true, allErrors: true, allowUnionTypes: true }); addFormats(ajv);
  const validate = ajv.compile(settings);
  it('mirrors the appearance schema in PHP/TS documents', () => expect(schema.$defs.appearance).toEqual(settings.$defs.appearance));
  it.each(fixtures)('$name schema boundary', fixture => expect(validate({ appearance: fixture.appearance })).toBe(fixture.valid));
  it('uses only static CSS2 families/weights/display without user text or arbitrary URL parameters', () => {
    for (const font of ['Inter', 'Roboto', 'Open Sans'] as const) {
      const url = new URL(googleFontUrl(font));
      expect(url.origin + url.pathname).toBe('https://fonts.googleapis.com/css2');
      expect([...url.searchParams]).toEqual([['family', `${font}:wght@400;600`], ['display', 'swap']]);
    }
    expect(googleFont('https://evil.test')).toBeUndefined(); expect(googleFont('system')).toBeUndefined();
  });
  it('allows only font-face definitions, same family and fixed HTTPS font origins', () => {
    expect(googleFontCss(css, 'Inter')).toContain('font-family:"Inter"');
    for (const malicious of [css + 'body{color:red}', css + '@import url(https://evil.test);', css.replace('fonts.gstatic.com', 'fonts.gstatic.com.evil.test'), css.replace('https:', 'http:'), css.replace('font.woff2', 'font.woff2?secret=1'), css.replace("'Inter'", "'Roboto'"), css.replace('font-display: swap;', 'font-display: swap; color: red;'), css.replace('U+0000-00FF, U+0131', 'url(https://evil.test)'), 'x'.repeat(65537)]) expect(() => googleFontCss(malicious, 'Inter')).toThrow();
  });
  it('deduplicates requests/style ownership, sends no credentials/referrer, and cleans up last owner', async () => {
    const transport = vi.fn().mockResolvedValue(new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8' } })); vi.stubGlobal('fetch', transport);
    const release = acquireGoogleFont(document, 'Inter'), release2 = acquireGoogleFont(document, 'Inter'); await tick();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' });
    expect(document.head.querySelectorAll('[data-cff-google-font]')).toHaveLength(1);
    release(); release(); expect(document.head.querySelectorAll('[data-cff-google-font]')).toHaveLength(1);
    release2(); expect(document.head.querySelectorAll('[data-cff-google-font]')).toHaveLength(0);
  });
  it.each([new Response(css + '@import url(https://evil.test);', { headers: { 'content-type': 'text/css' } }), new Response('x'.repeat(65537), { headers: { 'content-type': 'text/css' } }), new Response(css, { headers: { 'content-type': 'text/html' } }), new Response('', { status: 503 })])('rejects invalid/oversized/provider responses without injecting CSS', async response => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response)); const release = acquireGoogleFont(document, 'Inter'); await tick();
    expect(document.head.querySelectorAll('[data-cff-google-font]')).toHaveLength(0); release();
  });
  it('does not install styles after an unmount while fetching', async () => {
    let finish!: (response: Response) => void; vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise<Response>(resolve => { finish = resolve; })));
    const release = acquireGoogleFont(document, 'Inter'); release(); finish(new Response(css, { headers: { 'content-type': 'text/css' } })); await tick();
    expect(document.head.querySelectorAll('[data-cff-google-font]')).toHaveLength(0);
  });
  it('uses the same real Shadow runtime in previews, deduplicates across mounts, with system/inherited defaults offline', async () => {
    const transport = vi.fn().mockResolvedValue(new Response(css, { headers: { 'content-type': 'text/css' } })); vi.stubGlobal('fetch', transport);
    const host = () => { const element = document.createElement('div'); document.body.append(element); return element; };
    const local = form(); const plain = mountRuntime(host(), { form: local, preview: true }); await tick(); expect(transport).not.toHaveBeenCalled(); plain.unmount();
    local.form.appearance = { googleFont: 'Inter', inheritFont: true }; const inherited = mountRuntime(host(), { form: local, preview: true }); await tick(); expect(transport).not.toHaveBeenCalled(); inherited.unmount();
    local.form.appearance = { googleFont: 'Inter' }; const first = host(), second = host();
    const a = mountRuntime(first, { form: local, preview: true }), b = mountRuntime(second, { form: local, preview: true }); await tick();
    expect(transport).toHaveBeenCalledTimes(1); expect(first.shadowRoot?.children[2]?.getAttribute('style')).toContain('--cff-font: "Inter"');
    a.unmount(); expect(document.head.querySelectorAll('[data-cff-google-font]')).toHaveLength(1); b.unmount(); expect(document.head.querySelectorAll('[data-cff-google-font]')).toHaveLength(0);
  });
});
