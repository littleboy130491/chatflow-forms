// @vitest-environment jsdom
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { autoMount, mountRuntime, registerFrontend, THEME_FRONTEND_TIMEOUT_MS } from '../../../assets/src/runtime';
import { markdownHtml, type FrontendContext } from '../../../assets/src/runtime/frontend';
import { form } from './helpers';

let host: HTMLElement;
const unregister: (() => void)[] = [];
beforeEach(() => { host = document.createElement('cff-chat'); host.dataset.formId = '42'; host.dataset.restUrl = '/wp-json/cff/v1/'; document.body.append(host); localStorage.clear(); });
afterEach(() => { while (unregister.length) unregister.pop()!(); host.remove(); vi.useRealTimers(); vi.restoreAllMocks(); });
const embed = (target: HTMLElement) => { const script = document.createElement('script'); script.type = 'application/json'; script.dataset.cffSchema = ''; script.textContent = JSON.stringify(form()); target.append(script); };

describe('theme frontends', () => {
  it('renders a registered frontend with the headless api, and cleans up on unmount', async () => {
    const cleanup = vi.fn();
    let context!: FrontendContext;
    unregister.push(registerFrontend(ctx => { context = ctx; ctx.root.textContent = 'custom'; return cleanup; }));
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true, frontend: 'theme', themeStyle: 'https://example.test/wp-content/themes/child/chatflow/frontend.css' }); });
    expect(context.root.textContent).toBe('custom');
    expect(host.shadowRoot!.querySelector('.chat')).toBeNull();
    expect(host.shadowRoot!.querySelector<HTMLLinkElement>('link[rel=stylesheet]')?.href).toBe('https://example.test/wp-content/themes/child/chatflow/frontend.css');
    await vi.waitFor(() => expect(context.api.getState().phase).toBe('ready'));
    expect(context.api.version).toBe(1);
    // The intro statement is acknowledged, then the name question validates and advances.
    await act(() => context.api.next());
    expect(context.api.getState().activeStep?.id).toBe('name');
    await act(() => context.api.answer('Ada'));
    expect(context.api.getState().answers.name).toBe('Ada');
    expect(context.api.text('Hi {{name}}')).toBe('Hi Ada');
    expect(context.api.link('https://wa.me/1?text={{name}}')).toBe('https://wa.me/1?text=Ada');
    expect(context.api.link('javascript:alert(1)')).toBeNull();
    await act(() => handle!.unmount());
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('waits for a theme frontend that registers after the runtime, then falls back to the built-in chat', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    host.dataset.frontend = 'theme'; embed(host);
    autoMount();
    expect(host.shadowRoot).toBeNull();
    const late = vi.fn((ctx: FrontendContext) => { ctx.root.textContent = 'late theme'; });
    await act(() => { unregister.push(registerFrontend(late)); });
    expect(late).toHaveBeenCalledOnce();
    expect(host.shadowRoot!.textContent).toContain('late theme');

    const other = document.createElement('cff-chat'); other.dataset.formId = '42'; other.dataset.restUrl = '/wp-json/cff/v1/'; other.dataset.frontend = 'theme'; embed(other); document.body.append(other);
    unregister.pop()!();
    autoMount();
    expect(other.shadowRoot).toBeNull();
    await act(() => { vi.advanceTimersByTime(THEME_FRONTEND_TIMEOUT_MS + 10); });
    expect(other.shadowRoot!.querySelector('.chat')).not.toBeNull();
    other.remove();
  });

  it('falls back to the built-in chat when the theme frontend throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    unregister.push(registerFrontend(() => { throw new Error('theme bug'); }));
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true, frontend: 'theme' }); });
    expect(host.shadowRoot!.querySelector('.chat')).not.toBeNull();
    expect(error).toHaveBeenCalled();
    await act(() => handle!.unmount());
  });

  it('ignores non-http theme stylesheets and keeps the built-in chat when no frontend is asked for', async () => {
    unregister.push(registerFrontend(ctx => { ctx.root.textContent = 'custom'; }));
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true, themeStyle: 'javascript:alert(1)' }); });
    expect(host.shadowRoot!.querySelector('link')).toBeNull();
    expect(host.shadowRoot!.querySelector('.chat')).not.toBeNull();
    await act(() => handle!.unmount());
    // No configured stylesheet: no link at all (an empty URL must not resolve to the page itself).
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true }); });
    expect(host.shadowRoot!.querySelector('link')).toBeNull();
    await act(() => handle!.unmount());
  });
});

describe('api.html', () => {
  it('allows only bold, italic and safe links, escaping everything else', () => {
    expect(markdownHtml('**Hi** <img src=x onerror=alert(1)> *there* [site](https://example.test/a?b=1&c=2)'))
      .toBe('<strong>Hi</strong> &lt;img src=x onerror=alert(1)&gt; <em>there</em> <a href="https://example.test/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">site</a>');
    expect(markdownHtml('[bad](javascript:alert(1))')).toBe('bad)');
    expect(markdownHtml('\\*not bold\\* "q"')).toBe('*not bold* &quot;q&quot;');
  });
});
