// @vitest-environment jsdom
/** @jsxImportSource preact */
import { render, createElement } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FieldInput, normalizePhone, toggleChoice } from '../../../assets/src/runtime/inputs';
import { interpolateLink, Markdown, reactions, safeLink } from '../../../assets/src/runtime/content';
import { phrases } from '../../../assets/src/runtime/i18n';
import { mountRuntime } from '../../../assets/src/runtime';
import { typingDelay } from '../../../assets/src/runtime/chat';
import { safeColor, safeFont, scopedAppearanceCss } from '../../../assets/src/runtime/appearance';
import { form } from './helpers';
import type { Step } from '../../../assets/src/runtime/types';

let host: HTMLDivElement;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); localStorage.clear(); });
afterEach(() => { render(null, host); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
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
  it('does not accept a disabled choice or silently render reserved upload types', async () => {
    const onAnswer = await mountInput(choice, undefined, true); host.querySelector('button')!.click(); expect(onAnswer).not.toHaveBeenCalled();
    await act(() => render(null, host)); await mountInput(field('file_upload')); expect(host.querySelector('[role=alert]')?.textContent).toContain('not available'); expect(host.querySelector('input')).toBeNull();
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
  it('mounts a real preview synchronously, isolates CSS, supports prefill/debug and unmount without IO', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const writes = vi.spyOn(Storage.prototype, 'setItem'); const clears = vi.spyOn(Storage.prototype, 'removeItem');
    let handle: ReturnType<typeof mountRuntime>;
    await act(() => { handle = mountRuntime(host, { form: form(), preview: true }); });
    await vi.waitFor(() => expect(host.shadowRoot?.textContent).toContain('Hello'));
    expect(host.shadowRoot?.querySelector('style')).not.toBeNull(); expect(document.head.querySelector('style')).toBeNull(); expect(handle!.getState().currentStepId).toBe('intro');
    handle!.prefill({ name: 'Prefilled' }); await act(() => host.shadowRoot!.querySelector<HTMLButtonElement>('.active button')!.click());
    await vi.waitFor(() => expect(host.shadowRoot!.querySelector<HTMLInputElement>('.active input')?.value).toBe('Prefilled'));
    expect(host.shadowRoot?.querySelector('[aria-live=polite]')).not.toBeNull(); expect(fetcher).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled(); expect(clears).not.toHaveBeenCalled();
    await act(() => handle!.unmount()); expect(host.shadowRoot?.childElementCount).toBe(0);
  });
  it('rejects unimplemented display modes and insecure cross-origin REST endpoints', () => {
    expect(() => mountRuntime(host, { form: form(), preview: true, mode: 'popup' as 'inline' })).toThrow('Unsupported display mode');
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
    await act(() => panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(panel.hidden).toBe(true);
    expect(shadow.activeElement).toBe(toggle);
    expect(window.ChatFlow.open(42)).toBe(true);
    expect(panel.hidden).toBe(false);
    await act(() => handle!.unmount());
    expect(shadow.childElementCount).toBe(0);
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
