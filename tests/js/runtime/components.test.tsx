// @vitest-environment jsdom
/** @jsxImportSource preact */
import { render, createElement } from 'preact';
import { act } from 'preact/test-utils';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FieldInput, normalizePhone, toggleChoice } from '../../../assets/src/runtime/inputs';
import { interpolateLink, interpolateMarkdown, Markdown, markdownText, reactions, safeLink } from '../../../assets/src/runtime/content';
import { phrases } from '../../../assets/src/runtime/i18n';
import { mountRuntime } from '../../../assets/src/runtime';
import { ApiClient } from '../../../assets/src/runtime/api';
import { RuntimeController } from '../../../assets/src/runtime/controller';
import { revealedMessageCount, typingDelay } from '../../../assets/src/runtime/chat';
import { safeColor, safeFont, scopedAppearanceCss } from '../../../assets/src/runtime/appearance';
import { form } from './helpers';
import type { Step } from '../../../assets/src/runtime/types';

let host: HTMLDivElement;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); localStorage.clear(); });
afterEach(() => { render(null, host); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
// Preact schedules after-paint work with a 100 ms fallback timer that calls cancelAnimationFrame;
// let it run before jsdom tears down its globals so it cannot throw after the file ends.
afterAll(() => new Promise<void>(resolve => { setTimeout(resolve, 150); }));
const field = (type: Step['type'], props: Partial<Step> = {}): Step => ({ id: 'field', key: 'field', label: 'Accessible label', messages: [], type, ...props });
const choice = field('single_choice', { options: [{ id: 'a', value: 'a', label: 'A' }, { id: 'b', value: 'b', label: 'B' }, { id: 'other', value: 'other', label: 'Other', isOther: true }] });
async function mountInput(step: Step, value?: unknown, disabled = false) {
  const onAnswer = vi.fn();
  await act(() => render(createElement(FieldInput, { step, value, disabled, onAnswer, phrase: phrases('en') }), host));
  return onAnswer;
}
function input(selector: string, value: string) { const element = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!; element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })); }
function submit() { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
describe('Phase 1 inputs and accessible keyboard interaction', () => {
  it.each(['short_text', 'long_text', 'email', 'phone', 'number', 'date'] as const)('renders and submits %s with an accessible label', async type => {
    const onAnswer = await mountInput(field(type));
    const tag = type === 'long_text' ? 'textarea' : 'input';
    const values = { short_text: 'Ada', long_text: 'One\nTwo', email: 'ada@example.test', phone: '081234567890', number: '12.5', date: '2000-01-01' };
    expect(host.querySelector('label[for="input-field"]')?.textContent).toBe('Accessible label');
    await act(() => input(tag, values[type])); await act(submit);
    expect(onAnswer).toHaveBeenCalledWith(type === 'number' ? 12.5 : type === 'phone' ? '+6281234567890' : values[type]);
  });
  it('supports newlines with Shift+Enter and submits long text with Enter', async () => {
    const onAnswer = await mountInput(field('long_text'));
    await act(() => input('textarea', 'Two lines'));
    host.querySelector('textarea')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true })); expect(onAnswer).not.toHaveBeenCalled();
    await act(() => { host.querySelector('textarea')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); });
    expect(onAnswer).toHaveBeenCalledWith('Two lines');
  });
  it('selects chips with arrow/Home/End/numeric shortcuts and announces pressed state', async () => {
    const onAnswer = await mountInput(choice, 'b');
    const buttons = host.querySelectorAll<HTMLButtonElement>('.chip'); buttons[0]!.focus();
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })); expect(document.activeElement).toBe(buttons[1]);
    buttons[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })); expect(document.activeElement).toBe(buttons[0]);
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })); expect(document.activeElement).toBe(buttons[2]);
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true, cancelable: true })); expect(onAnswer).toHaveBeenCalledWith('b'); expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');
  });
  it('collects Other text only for configured single-choice Other options', async () => {
    const onAnswer = await mountInput(choice);
    await act(() => host.querySelectorAll<HTMLButtonElement>('.chip')[2]!.click()); expect(onAnswer).not.toHaveBeenCalled();
    await act(() => input('#other-field', 'Custom response'));
    await act(submit); expect(onAnswer).toHaveBeenCalledWith({ value: 'other', other: 'Custom response' });
  });
  it('renders dropdowns, image cards, booleans and consent without inventing values', async () => {
    let onAnswer = await mountInput({ ...choice, settings: { layout: 'dropdown' } });
    await act(() => { const select = host.querySelector('select')!; select.value = 'b'; select.dispatchEvent(new Event('change', { bubbles: true })); }); await act(submit); expect(onAnswer).toHaveBeenCalledWith('b');
    await act(() => render(null, host)); onAnswer = await mountInput(field('yes_no')); host.querySelectorAll<HTMLButtonElement>('button')[1]!.click(); expect(onAnswer).toHaveBeenCalledWith(false);
    await act(() => render(null, host)); onAnswer = await mountInput(field('consent', { settings: { consentText: 'I agree', privacyUrl: 'javascript:alert(1)' } }));
    expect(host.querySelector('a')).toBeNull(); await act(() => { const checkbox = host.querySelector('input')!; checkbox.checked = true; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }); await act(submit); expect(onAnswer).toHaveBeenCalledWith(true);
  });
  it('enforces exclusive multi-choice selection and does not mutate inputs', async () => {
    const options = [...choice.options!, { id: 'none', value: 'none', label: 'None', isExclusive: true }];
    const selected = ['a']; expect(toggleChoice(selected, 'none', options)).toEqual(['none']); expect(selected).toEqual(['a']); expect(toggleChoice(['none'], 'b', options)).toEqual(['b']); expect(toggleChoice(['b'], 'b', options)).toEqual([]);
    const onAnswer = await mountInput(field('multi_choice', { options }));
    await act(() => host.querySelectorAll<HTMLButtonElement>('.chip')[0]!.click()); await act(() => host.querySelectorAll<HTMLButtonElement>('.chip')[3]!.click()); host.querySelector<HTMLButtonElement>('.continue')!.click(); expect(onAnswer).toHaveBeenCalledWith(['none']);
  });
  it.each([
    ['rating', 1, 5, 3],
    ['scale', 1, 10, 7],
    ['nps', 0, 10, 0],
  ] as const)('renders accessible %s buttons that submit numeric scores', async (type, min, max, chosen) => {
    const onAnswer = await mountInput(field(type));
    const group = host.querySelector('[role=group]')!;
    expect(group.getAttribute('aria-label')).toBe('Accessible label');
    const buttons = group.querySelectorAll<HTMLButtonElement>('button');
    expect(buttons).toHaveLength(max - min + 1);
    await act(() => buttons[chosen - min]!.click());
    expect(onAnswer).toHaveBeenCalledWith(chosen);
    expect(typeof onAnswer.mock.calls[0]?.[0]).toBe('number');
    await act(() => render(null, host));
    const blocked = await mountInput(field(type), undefined, true);
    host.querySelector('button')!.click();
    expect(blocked).not.toHaveBeenCalled();
  });
  it('lets visitors confirm a configured slider position with its unit', async () => {
    const onAnswer = await mountInput(field('slider', { validation: { min: 10, max: 20, step: 2 }, settings: { unit: 'points' } }));
    const slider = host.querySelector<HTMLInputElement>('input[type="range"]')!;
    expect(slider.min).toBe('10'); expect(slider.max).toBe('20'); expect(slider.step).toBe('2');
    expect(host.querySelector('output')?.textContent).toBe('10 points');
    expect(onAnswer).not.toHaveBeenCalled();
    await act(() => input('input[type="range"]', '16'));
    await act(submit);
    expect(onAnswer).toHaveBeenCalledWith(16);
  });
  it('does not accept a disabled choice or silently enable unavailable uploads', async () => {
    const onAnswer = await mountInput(choice, undefined, true); host.querySelector('button')!.click(); expect(onAnswer).not.toHaveBeenCalled();
    await act(() => render(null, host)); await mountInput(field('file_upload')); expect(host.querySelector('[role=alert]')?.textContent).toContain('not available'); expect(host.querySelector<HTMLInputElement>('input')?.disabled).toBe(true);
  });
});
describe('safe content, translations and motion', () => {
  it('URL-encodes merge tags and renders configured choice reactions only for selected values', () => {
    expect(interpolateLink('https://example.test/?q={{name}}', { name: 'Ada & X=1' })).toBe('https://example.test/?q=Ada%20%26%20X%3D1');
    const step = { ...choice, options: [{ ...choice.options![0]!, reaction: 'Good {{name}}!' }] }; expect(reactions(step, 'a')).toEqual(['Good {{name}}!']); expect(reactions(step, { value: 'a', other: 'Other' })).toEqual(['Good {{name}}!']); expect(reactions(step, ['a'])).toEqual(['Good {{name}}!']); expect(reactions(step, 'b')).toEqual([]);
  });
  it('allows static appearance styling without CSS imports/images/answer selectors or resource-bearing colors', () => {
    expect(scopedAppearanceCss('.bubble { color: #123456; padding: 12px; background-image: none }')).toContain('padding:12px');
    for (const css of ['@import "https://evil.test";', '.bubble{background:url(https://evil.test)}', 'input[value="PII"]{color:red}', '.bubble{color:var(--secret)}', '.bubble{color:\\72 ed}']) expect(scopedAppearanceCss(css)).toBe('');
    expect(safeColor('image-set("https://evil.test")')).toBeUndefined(); expect(safeColor('#123456')).toBe('rgb(18, 52, 86)'); expect(safeFont('system-ui, sans-serif')).toBe('system-ui, sans-serif'); expect(safeFont('url(https://evil.test)')).toBeUndefined();
  });
  it('escapes HTML and rejects unsafe protocols/credentials while keeping safe markdown and WhatsApp links', async () => {
    await act(() => render(createElement(Markdown, { text: '<img src=x onerror=alert(1)> **Bold** [bad](javascript:alert) [WhatsApp](https://wa.me/6281234567890)' }), host));
    expect(host.querySelector('img')).toBeNull(); expect(host.textContent).toContain('<img'); expect(host.querySelector('strong')?.textContent).toBe('Bold'); expect(host.querySelectorAll('a')).toHaveLength(1); expect(host.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(safeLink('data:text/html,x')).toBeNull(); expect(safeLink('https://user:pass@example.test')).toBeNull(); expect(safeLink('mailto:help@example.test')).toBe('mailto:help@example.test');
  });
  it('bundles Indonesian, accepts phrase overrides and bounds/skips typing animation', () => {
    expect(phrases('id-ID')('continue')).toBe('Lanjut'); expect(phrases('id', { continue: 'Terus' })('continue')).toBe('Terus');
    expect(typingDelay(1000)).toBe(1200); expect(typingDelay(2)).toBe(400); expect(typingDelay(200, 'normal', true)).toBe(0); expect(typingDelay(200, 'off')).toBe(0);
    expect(normalizePhone('081234567890')).toBe('+6281234567890');
  });
});
describe('Shadow DOM mount and global API', () => {
  it('does not expose the next question with the previous step typing reveal', () => {
    const previous = { stepId: 'step_intro', count: 3 };
    expect(revealedMessageCount(previous, 'step_name')).toBe(0);
    expect(revealedMessageCount(previous, 'step_intro')).toBe(3);
    expect(revealedMessageCount({ stepId: 'step_name', count: 0 }, 'step_name')).toBe(0);
  });
  it('tracks a real launcher impression on first open, never on closed mounts or repeat opens', async () => {
    const view = vi.spyOn(ApiClient.prototype, 'view').mockResolvedValue({ recorded: true });
    vi.spyOn(RuntimeController.prototype, 'initialize').mockImplementation(async function (this: RuntimeController) {
      this.state.form = form();
      this.state.phase = 'ready';
    });
    const url = new URL('/wp-json/cff/v1/', window.location.href).href;
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), mode: 'launcher', restUrl: url }); });
    expect(view).not.toHaveBeenCalled();
    await act(() => handle!.open?.());
    await vi.waitFor(() => expect(view).toHaveBeenCalledWith(42, form().form.version));
    await act(() => { host.shadowRoot!.querySelector<HTMLButtonElement>('.launcher-toggle')!.click(); });
    await act(() => handle!.open?.());
    expect(view).toHaveBeenCalledTimes(1);
    await act(() => handle!.unmount());
  });
  it('mounts a real preview synchronously, isolates CSS, supports prefill/debug and unmount without IO', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const writes = vi.spyOn(Storage.prototype, 'setItem'); const clears = vi.spyOn(Storage.prototype, 'removeItem');
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true }); });
    await vi.waitFor(() => expect(host.shadowRoot?.textContent).toContain('Hello'));
    expect(host.shadowRoot?.querySelector('style')).not.toBeNull(); expect(document.head.querySelector('style')).toBeNull(); expect(handle!.getState().currentStepId).toBe('intro');
    // The intro statement has no button: it continues by itself after its messages.
    expect(host.shadowRoot!.querySelector('.active button')).toBeNull();
    handle!.prefill({ name: 'Prefilled' });
    await vi.waitFor(() => expect(host.shadowRoot!.querySelector<HTMLInputElement>('.active input')?.value).toBe('Prefilled'));
    expect(host.shadowRoot?.querySelector('[aria-live=polite]')).not.toBeNull(); expect(fetcher).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled(); expect(clears).not.toHaveBeenCalled();
    await act(() => handle!.unmount()); expect(host.shadowRoot?.childElementCount).toBe(0);
  });
  it('rejects unknown display modes and insecure cross-origin REST endpoints', () => {
    expect(() => mountRuntime(host, { form: form(), preview: true, mode: 'unknown' as 'inline' })).toThrow('Unsupported display mode');
    expect(() => mountRuntime(host, { formId: 42, restUrl: 'https://third-party.test/wp-json/cff/v1/' })).toThrow('cff_unsafe_endpoint');
  });
  it('keeps launcher collapsed until clicked and supports Escape, focus and programmatic open', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true, mode: 'launcher', locale: 'id' }); });
    const shadow = host.shadowRoot!;
    const panel = shadow.querySelector<HTMLDivElement>('.launcher-panel')!;
    const toggle = shadow.querySelector<HTMLButtonElement>('.launcher-toggle')!;
    expect(panel.hidden).toBe(true);
    expect(toggle.textContent).toBe('Buka chat');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fetcher).not.toHaveBeenCalled();
    await act(() => toggle.click());
    expect(panel.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await vi.waitFor(() => expect(shadow.textContent).toContain('Hello'));
    await act(() => { panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(panel.hidden).toBe(true);
    expect(shadow.activeElement).toBe(toggle);
    expect(window.ChatFlow.open(42)).toBe(true);
    expect(panel.hidden).toBe(false);
    await act(() => handle!.unmount());
    expect(shadow.childElementCount).toBe(0);
  });
  it('opens popup by API and closes with backdrop and Escape', async () => {
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true, mode: 'popup' }); });
    const shadow = host.shadowRoot!;
    const modal = shadow.querySelector<HTMLDivElement>('.launcher-panel')!;
    const backdrop = shadow.querySelector<HTMLElement>('.popup-backdrop')!;
    expect(modal.hidden).toBe(true);
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(window.ChatFlow.open(42)).toBe(true);
    expect(modal.hidden).toBe(false);
    await act(() => backdrop.click());
    expect(modal.hidden).toBe(true);
    await act(() => handle!.unmount());
  });
  it('provides a guarded custom-field registration and open/prefill API', async () => {
    expect(window.ChatFlow.open(9999)).toBe(false);
    const disposer = window.ChatFlow.registerField('custom_test', () => createElement('p', {}, 'Custom'));
    expect(() => window.ChatFlow.registerField('custom_test', () => null)).toThrow(); disposer();
    let handle: ReturnType<typeof mountRuntime>; await act(() => { handle = mountRuntime(host, { form: form(), preview: true, mode: 'fullpage' }); });
    window.ChatFlow.prefill({ name: 'Global' }, 42); host.hidden = true; expect(window.ChatFlow.open(42)).toBe(true); expect(host.hidden).toBe(false); expect(host.shadowRoot?.querySelector('.fullpage')).not.toBeNull();
    await act(() => handle!.unmount());
  });
});
describe('markdown merge tags', () => {
  it('renders answers as literal text, never as links or emphasis', async () => {
    const text = interpolateMarkdown('Hi **{{name}}**, see [docs](https://example.test/a)', { name: '[click](https://evil.test) *x* a\\b' });
    await act(() => render(createElement(Markdown, { text }), host));
    const links = [...host.querySelectorAll('a')];
    expect(links.map(link => link.href)).toEqual(['https://example.test/a']);
    expect(host.querySelector('strong')!.textContent).toBe('[click](https://evil.test) *x* a\\b');
    expect(host.querySelector('em')).toBeNull();
    expect(markdownText(text)).toBe('Hi [click](https://evil.test) *x* a\\b, see docs');
  });
});
describe('focus and registration guards', () => {
  it('traps popup Tab focus without landing on the honeypot and closes on Escape from outside', async () => {
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), restUrl: '/wp-json/cff/v1/', mode: 'popup' }); });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    const shadow = host.shadowRoot!;
    const panel = shadow.querySelector<HTMLDivElement>('.launcher-panel')!;
    await act(() => { window.ChatFlow.open(42); });
    const honeypot = shadow.querySelector<HTMLInputElement>('.honeypot input');
    const buttons = [...panel.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
    buttons.at(-1)?.focus();
    shadow.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true }));
    expect(shadow.activeElement).not.toBe(honeypot);
    expect(panel.contains(shadow.activeElement)).toBe(true);
    buttons[0]?.focus();
    shadow.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, composed: true }));
    expect(shadow.activeElement).not.toBe(honeypot);
    expect(panel.contains(shadow.activeElement)).toBe(true);
    (shadow.activeElement as HTMLElement | null)?.blur();
    await act(() => { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(panel.hidden).toBe(true);
    await act(() => handle!.unmount());
  });
  it('refuses to replace built-in field renderers', () => {
    expect(() => window.ChatFlow.registerField('consent', () => null)).toThrow();
    expect(() => window.ChatFlow.registerField('short_text', () => null)).toThrow();
  });
  it('focuses the phone number input rather than the country select', async () => {
    const steps: [Step, ...Step[]] = [{ id: 'phone', key: 'phone', type: 'phone', label: 'Phone', messages: [] }];
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(steps), preview: true }); });
    await vi.waitFor(() => expect((host.shadowRoot!.activeElement as HTMLInputElement | null)?.type).toBe('tel'));
    await act(() => handle!.unmount());
  });
});
describe('messaging theme', () => {
  it('renders the messaging style with theme defaults and restyles a preview live', async () => {
    const envelope = form(); envelope.form.appearance = { style: 'messaging', wallpaper: 'dots', bubbleTails: false };
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: envelope, preview: true }); });
    const shadow = host.shadowRoot!;
    await vi.waitFor(() => expect(shadow.querySelector('.chat')).not.toBeNull());
    const chat = shadow.querySelector<HTMLElement>('.chat')!;
    expect(chat.dataset.style).toBe('messaging');
    expect(chat.dataset.wallpaper).toBe('dots');
    expect(chat.dataset.choices).toBe('keyboard');
    expect(chat.dataset.tails).toBe('off');
    expect(shadow.querySelector('.avatar')?.textContent).toBe('I');
    // Theme variables live on the shadow root's container element.
    const vars = (name: string) => ([...shadow.children].find(element => element.tagName === 'DIV') as HTMLElement).style.getPropertyValue(name);
    expect(vars('--cff-primary')).toBe('#3390ec');
    expect(vars('--cff-chat-bg')).not.toBe('');
    await act(() => handle!.setAppearance({ style: 'messaging', primary: '#008069', choiceStyle: 'chips' }));
    expect(chat.dataset.choices).toBe('chips');
    expect(vars('--cff-primary')).toBe('rgb(0, 128, 105)');
    await act(() => handle!.setAppearance({ style: 'classic' }));
    expect(shadow.querySelector('.chat')!.hasAttribute('data-style')).toBe(false);
    await act(() => handle!.unmount());
  });
  it('ignores live appearance changes outside previews and shows sample answers only in previews', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), restUrl: '/wp-json/cff/v1/', previewAnswers: { name: 'Injected' } }); });
    await act(() => handle!.setAppearance({ style: 'messaging' }));
    expect(host.shadowRoot!.querySelector('.chat')?.hasAttribute('data-style') ?? false).toBe(false);
    expect(host.shadowRoot!.textContent).not.toContain('Injected');
    await act(() => handle!.unmount());
    const steps: [Step, ...Step[]] = [{ id: 'name', key: 'name', type: 'short_text', label: 'Name', messages: ['Name?'] }, { id: 'mail', key: 'mail', type: 'email', label: 'Email', messages: ['Email?'] }];
    await act(() => { handle = mountRuntime(host, { form: form(steps), preview: true, previewAnswers: { name: 'Ada' } }); });
    await vi.waitFor(() => expect(host.shadowRoot!.querySelector('.bubble.user')?.textContent).toContain('Ada'));
    await act(() => handle!.unmount());
  });
});
describe('launcher chrome', () => {
  it('styles the closed launcher from an embedded form without loading fonts, closes with the header button and has no status footer', async () => {
    const envelope = form(); envelope.form.appearance = { style: 'messaging', googleFont: 'Inter' };
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: envelope, preview: true, mode: 'launcher' }); });
    const shadow = host.shadowRoot!;
    const root = [...shadow.children].find(element => element.tagName === 'DIV') as HTMLElement;
    expect(root.dataset.style).toBe('messaging');
    expect(document.head.querySelector('link[href*="fonts.googleapis.com"]')).toBeNull();
    const toggle = shadow.querySelector<HTMLButtonElement>('.launcher-toggle')!;
    await act(() => toggle.click());
    expect(toggle.hidden).toBe(true);
    await vi.waitFor(() => expect(shadow.querySelector('.close-chat')).not.toBeNull());
    expect(shadow.querySelector('footer')).toBeNull();
    await act(() => shadow.querySelector<HTMLButtonElement>('.close-chat')!.click());
    expect(shadow.querySelector<HTMLElement>('.launcher-panel')!.hidden).toBe(true);
    expect(toggle.hidden).toBe(false);
    expect(shadow.activeElement).toBe(toggle);
    await act(() => handle!.unmount());
  });
});
describe('statement steps', () => {
  it('continue by themselves unless the builder asks to wait for a button', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const steps: [Step, ...Step[]] = [
      { id: 'hello', key: 'hello', type: 'statement', label: 'Hello', messages: ['Welcome'], settings: { autoContinue: false, buttonLabel: 'Start' } },
      { id: 'name', key: 'name', type: 'short_text', label: 'Name', messages: ['Name?'] },
    ];
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(steps), preview: true }); });
    await act(() => { vi.advanceTimersByTime(2000); });
    expect(handle!.getState().currentStepId).toBe('hello');
    const start = [...host.shadowRoot!.querySelectorAll<HTMLButtonElement>('.active button')].find(button => button.textContent === 'Start')!;
    await act(async () => { start.click(); await Promise.resolve(); });
    expect(handle!.getState().currentStepId).toBe('name');
    await act(() => handle!.unmount());
    vi.useRealTimers();
  });
});
describe('direct contact link', () => {
  it('shows a WhatsApp button in the header with answers merged into the message', async () => {
    const envelope = form([{ id: 'name', key: 'name', type: 'short_text', label: 'Name', messages: ['Name?'] }, { id: 'more', key: 'more', type: 'short_text', label: 'More', messages: ['More?'] }]);
    envelope.form.schema.bot.contact = { url: 'https://wa.me/6281234567890?text=Hi%20{{name}}' };
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: envelope, preview: true, previewAnswers: { name: 'Ada & Co' } }); });
    const link = await vi.waitFor(() => { const found = host.shadowRoot!.querySelector<HTMLAnchorElement>('header a.contact-link'); expect(found).not.toBeNull(); return found!; });
    expect(link.classList.contains('is-whatsapp')).toBe(true);
    expect(link.textContent).toBe('WhatsApp');
    expect(link.href).toBe('https://wa.me/6281234567890?text=Hi%20Ada%20%26%20Co');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    await act(() => handle!.unmount());
    envelope.form.schema.bot.contact = { url: 'javascript:alert(1)', label: 'Bad' };
    await act(() => { handle = mountRuntime(host, { form: envelope, preview: true }); });
    expect(host.shadowRoot!.querySelector('header a.contact-link')).toBeNull();
    await act(() => handle!.unmount());
  });
});
