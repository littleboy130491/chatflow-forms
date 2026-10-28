// @vitest-environment jsdom
/** @jsxImportSource preact */
import { createElement, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captchaToken } from '../../../assets/src/runtime/captcha';
import { ApiClient } from '../../../assets/src/runtime/api';
import { UploadInput } from '../../../assets/src/runtime/phase2-inputs';
import { RuntimeController } from '../../../assets/src/runtime/controller';
import { phrases } from '../../../assets/src/runtime/i18n';
import { form, session } from './helpers';
import type { Step } from '../../../assets/src/runtime/types';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); delete window.turnstile; delete window.hcaptcha; delete window.grecaptcha; document.querySelectorAll('script[src]').forEach(script => script.remove()); });
describe('explicit CAPTCHA providers', () => {
  it('loads nothing for disabled or unconfigured protection', async () => {
    const container = document.createElement('div'); expect(await captchaToken({ provider: 'none', siteKey: '' }, container)).toBe('');
    await expect(captchaToken({ provider: 'hcaptcha', siteKey: '' }, container)).rejects.toThrow('captchaUnavailable'); expect(document.head.querySelector('script[src]')).toBeNull();
  });
  it.each(['turnstile', 'hcaptcha'] as const)('uses %s widget callback, cleanup and bounded failure', async provider => {
    vi.useFakeTimers(); let config!: Record<string, unknown>; const widget = { render: vi.fn((_container, options) => { config = options; return 'test-widget'; }), remove: vi.fn() };
    if (provider === 'turnstile') window.turnstile = widget; else window.hcaptcha = widget;
    const container = document.createElement('div'); const token = captchaToken({ provider, siteKey: 'public-test-key' }, container);
    document.head.querySelector<HTMLScriptElement>('script[src]')!.dispatchEvent(new Event('load')); await Promise.resolve();
    expect(widget.render).toHaveBeenCalledWith(container, expect.objectContaining({ sitekey: 'public-test-key', action: 'cff_submit' }));
    (config.callback as (token: string) => void)('test-response'); expect(await token).toBe('test-response'); expect(widget.remove).toHaveBeenCalledWith('test-widget');
    const pending = captchaToken({ provider, siteKey: 'public-test-key' }, container); const rejected = expect(pending).rejects.toThrow('captchaUnavailable'); await Promise.resolve(); vi.advanceTimersByTime(120000); await rejected;
  });
  it('executes recaptcha v3 only with cff_submit and a public key', async () => {
    const execute = vi.fn(async () => 'v3-test-response'); window.grecaptcha = { ready: callback => callback(), execute };
    const token = captchaToken({ provider: 'recaptcha', siteKey: 'public-v3-test-key' }, document.createElement('div'));
    document.head.querySelector<HTMLScriptElement>('script[src]')!.dispatchEvent(new Event('load'));
    expect(await token).toBe('v3-test-response'); expect(execute).toHaveBeenCalledWith('public-v3-test-key', { action: 'cff_submit' });
  });
  it('fails fast when the recaptcha script loads without defining grecaptcha', async () => {
    delete window.grecaptcha;
    const token = captchaToken({ provider: 'recaptcha', siteKey: 'public-v3-missing-key' }, document.createElement('div'));
    document.head.querySelector<HTMLScriptElement>('script[src*="public-v3-missing-key"]')!.dispatchEvent(new Event('load'));
    await expect(token).rejects.toThrow('captchaUnavailable');
  });
});
describe('protected uploads and optional input behavior', () => {
  const step: Step = { id: 'file', key: 'file', type: 'file_upload', label: 'File', messages: [], validation: { maxBytes: 100, mimeTypes: ['text/plain'] } };
  it('uses multipart, headers not URLs, no forced content type and no cached credentials', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{"uploadId":"opaque","name":"test.txt","bytes":4,"mime":"text/plain"}', { status: 201 }));
    const api = new ApiClient('/wp-json/cff/v1/', fetcher); await api.upload(session(), 'file', new File(['text'], 'test.txt', { type: 'text/plain' }));
    const [url, options] = fetcher.mock.calls[0]!; expect(url).not.toContain(session().requestToken); expect(options?.headers).toEqual(expect.objectContaining({ 'X-CFF-Request-Token': session().requestToken })); expect(options?.headers).not.toHaveProperty('Content-Type'); expect(options?.body).toBeInstanceOf(FormData); expect(options?.cache).toBe('no-store'); expect(options?.redirect).toBe('error');
  });
  it('allows skipping an optional upload and reusing an owned resumed required file', async () => {
    const host = document.createElement('div'); const onAnswer = vi.fn(); const props = { step, value: null, phrase: phrases('en'), upload: vi.fn(), onAnswer, disabled: false };
    await act(() => render(createElement(UploadInput, props), host)); await act(() => host.querySelector('button')!.click()); expect(onAnswer).toHaveBeenCalledWith(null);
    await act(() => render(createElement(UploadInput, { ...props, step: { ...step, required: true }, value: 'existing-uuid' }), host)); await act(() => host.querySelector('button')!.click()); expect(onAnswer).toHaveBeenCalledWith('existing-uuid'); render(null, host);
  });
  it('caps browser size before request and submits only server upload ID after success', async () => {
    const host = document.createElement('div'); const upload = vi.fn(async () => ({ uploadId: 'server-uuid', name: 'test.txt', bytes: 4, mime: 'text/plain' })); const onAnswer = vi.fn();
    await act(() => render(createElement(UploadInput, { step, value: null, phrase: phrases('en'), upload, onAnswer, disabled: false }), host)); const input = host.querySelector<HTMLInputElement>('input')!;
    Object.defineProperty(input, 'files', { value: [new File(['a'.repeat(101)], 'test.txt')], configurable: true }); await act(() => { input.dispatchEvent(new Event('change')); }); expect(upload).not.toHaveBeenCalled(); expect(host.querySelector('[role=alert]')).not.toBeNull();
    Object.defineProperty(input, 'files', { value: [new File(['text'], 'test.txt')], configurable: true }); await act(() => { input.dispatchEvent(new Event('change')); }); expect(upload).toHaveBeenCalledOnce(); expect(onAnswer).toHaveBeenCalledWith('server-uuid'); render(null, host);
  });
});
describe('engagement config is versioned and feature-gated', () => {
  it('makes no config/event/provider requests until the integrator enables engagement', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{}', { status: 503 })); const controller = new RuntimeController({ form: form() }, new ApiClient('/wp-json/cff/v1/', fetcher));
    await controller.initialize(); expect(fetcher.mock.calls.some(([url]) => String(url).includes('engagement') || String(url).includes('events'))).toBe(false);
  });
  it('fetches public config with a pinned version and no-store before any session writes', async () => {
    const envelope = form(); envelope.features.engagement = true;
    const fetcher = vi.fn<typeof fetch>(async input => String(input).includes('engagement') ? new Response('{"captcha":{"provider":"none","siteKey":""},"analytics":{"enabled":false,"consentRequired":true,"respectDnt":true}}') : new Response('{}', { status: 503 }));
    const controller = new RuntimeController({ form: envelope }, new ApiClient('/wp-json/cff/v1/', fetcher)); await controller.initialize();
    expect(fetcher.mock.calls[0]![0]).toContain('/forms/42/engagement?version=1'); expect(fetcher.mock.calls[0]![1]?.cache).toBe('no-store'); expect(localStorage.length).toBe(0);
  });
});
