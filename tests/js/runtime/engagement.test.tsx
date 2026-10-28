// @vitest-environment jsdom
/** @jsxImportSource preact */
import { createElement, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FieldInput } from '../../../assets/src/runtime/inputs';
import { answerLabel } from '../../../assets/src/runtime/content';
import { analyticsPermitted, RuntimeAnalytics } from '../../../assets/src/runtime/engagement';
import { ApiClient } from '../../../assets/src/runtime/api';
import { phrases } from '../../../assets/src/runtime/i18n';
import { mountRuntime } from '../../../assets/src/runtime';
import { form } from './helpers';
import type { Session, Step } from '../../../assets/src/runtime/types';

let host: HTMLElement;
beforeEach(() => {
  host = document.createElement('div'); host.dataset.formId = '123'; document.body.append(host);
  HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new Event('close')); };
});
afterEach(() => { render(null, host); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
const field = (type: Step['type'], other: Partial<Step> = {}): Step => ({ id: 'f', key: 'f', type, label: 'Question', messages: [], ...other });
async function input(step: Step, value: unknown = null) {
  const onAnswer = vi.fn(); await act(() => render(createElement(FieldInput, { step, value, onAnswer, phrase: phrases('en'), disabled: false }), host)); return onAnswer;
}
describe('lazy launcher lifecycle', () => {
  it('makes no session/start-token requests before first open', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 503 })); vi.stubGlobal('fetch', fetcher);
    const handle = mountRuntime(host, { mode: 'launcher', restUrl: '/wp-json/cff/v1/', form: form() }); await Promise.resolve(); expect(fetcher).not.toHaveBeenCalled(); handle.unmount();
  });
  it('opens from a same-page data-cff-open control for this form only', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    const handle = mountRuntime(host, { mode: 'launcher', restUrl: '/wp-json/cff/v1/', form: form() });
    const id = String(form().form.id);
    const panel = host.shadowRoot!.querySelector<HTMLElement>('.launcher-panel')!;
    const other = document.createElement('button'); other.dataset.cffOpen = id + '0'; document.body.append(other);
    other.click(); expect(panel.hidden).toBe(true);
    const control = document.createElement('button'); control.dataset.cffOpen = id; control.innerHTML = '<span>Open</span>'; document.body.append(control);
    control.querySelector('span')!.click(); expect(panel.hidden).toBe(false);
    handle.unmount(); other.remove(); control.remove();
  });
});
describe('Phase2 real field inputs', () => {
  it.each(['rating', 'scale', 'nps'] as const)('selects numeric %s without string coercion', async type => { const answer = await input(field(type)); const buttons = host.querySelectorAll<HTMLButtonElement>('.chip'); await act(() => buttons[buttons.length - 1]!.click()); expect(answer).toHaveBeenCalledWith(type === 'rating' ? 5 : 10); });
  it('uses native slider bounds and submits a number', async () => { const answer = await input(field('slider', { validation: { min: 0, max: 5, step: 0.5 } })); const slider = host.querySelector<HTMLInputElement>('input')!; expect(slider.type).toBe('range'); await act(() => { slider.value = '2.5'; slider.dispatchEvent(new Event('input', { bubbles: true })); }); await act(() => { host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }); expect(answer).toHaveBeenCalledWith(2.5); });
  it('collects only configured address fields with autocomplete and renders a readable summary', async () => { const step = field('address', { settings: { addressFields: ['city', 'postcode'] } }); const answer = await input(step); expect(host.querySelectorAll('input')).toHaveLength(2); await act(() => { const city = host.querySelector<HTMLInputElement>('[autocomplete=address-level2]')!; city.value = 'Jakarta'; city.dispatchEvent(new Event('input', { bubbles: true })); }); await act(() => { host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }); expect(answer).toHaveBeenCalledWith({ city: 'Jakarta', postcode: '' }); expect(answerLabel(step, { city: 'Jakarta', postcode: '12345' }, phrases('en'))).toBe('Jakarta, 12345'); });
  it('rejects unsafe media URLs and continues a display field with null', async () => { const answer = await input(field('media', { settings: { media: { type: 'image', url: 'javascript:alert(1)' } } })); expect(host.querySelector('img')).toBeNull(); await act(() => host.querySelector('button')!.click()); expect(answer).toHaveBeenCalledWith(null); });
  it('formats date and number answers in the visitor locale without changing the stored value', () => {
    expect(answerLabel(field('date'), '2000-01-31', phrases('en'), 'en-US')).toBe('Jan 31, 2000');
    expect(answerLabel(field('date'), '2000-01-31', phrases('id'), 'id-ID')).toBe(new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' }).format(Date.UTC(2000, 0, 31)));
    expect(answerLabel(field('number'), 1234567.5, phrases('en'), 'en-US')).toBe('1,234,567.5');
    expect(answerLabel(field('date'), 'not-a-date', phrases('en'), 'en-US')).toBe('not-a-date');
    expect(answerLabel(field('number'), 12, phrases('en'), 'not a locale!')).toBe('12');
  });
  it('does not upload before integration enables an upload callback', async () => { await input(field('file_upload')); expect(host.querySelector<HTMLInputElement>('input')!.disabled).toBe(true); expect(answerLabel(field('file_upload'), 'private-id', phrases('en'))).not.toContain('private-id'); });
});
describe('anonymous event privacy and caps', () => {
  const config = { enabled: true, consentRequired: true, respectDnt: true };
  it('requires consent and obeys explicit opt-out, DNT and GPC', () => {
    expect(analyticsPermitted(config, false, false)).toBe(false); expect(analyticsPermitted(config, true, true)).toBe(false);
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true }); expect(analyticsPermitted(config, true, false)).toBe(false);
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true }); Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true }); expect(analyticsPermitted(config, true, false)).toBe(false);
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: false, configurable: true });
  });
  it('caps 200 events in batches of 10, with credential only in header and no answers', async () => {
    const fetcher = vi.fn(async () => new Response('{"stored":10}', { status: 200 })); const api = new ApiClient('/wp-json/cff/v1/', fetcher);
    const collector = new RuntimeAnalytics(api, config, () => true, () => false);
    for (let i = 0; i < 250; i++) collector.add({ event: 'view', stepId: 'step' });
    await collector.flush({ sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', requestToken: 'sensitive' } as Session);
    expect(fetcher).toHaveBeenCalledTimes(20);
    for (const [url, options] of fetcher.mock.calls as unknown as [string, { body: string; headers: Record<string, string> }][]) { expect(url).not.toContain('sensitive'); expect(JSON.parse(options.body).events).toHaveLength(10); expect(options.body).not.toContain('sensitive'); expect(options.headers).toEqual(expect.objectContaining({ 'X-CFF-Request-Token': 'sensitive' })); }
  });
});
