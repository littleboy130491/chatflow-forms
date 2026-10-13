// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createElement, createRoot } from '@wordpress/element';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminApi } from '../../../assets/src/builder/api';
import type { AdminConfig, FormDTO } from '../../../assets/src/builder/api';
import { blankForm, v1Types } from '../../../assets/src/builder/model';
import { JsonEditor } from '../../../assets/src/builder/controls';
import { cleanupPreview, publicDraft, resolvePreviewMedia } from '../../../assets/src/builder/Preview';
import { Purge } from '../../../assets/src/submissions/Purge';
import { Filters } from '../../../assets/src/submissions/Filters';
import { downloadExport } from '../../../assets/src/submissions/Export';
import { useJobProgress } from '../../../assets/src/submissions/useJobProgress';
vi.mock('@wordpress/components', async () => {
  const { createElement: h } = await import('@wordpress/element');
  interface Props {
    label?: string;
    value?: string;
    checked?: boolean;
    onChange?: (value: string | boolean) => void;
    options?: { value: string; label: string }[];
    children?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }
  return {
    Button: (p: Props) => h('button', { disabled: p.disabled, onClick: p.onClick }, p.children),
    Notice: (p: Props) => h('div', { role: 'alert' }, p.children),
    TextControl: (p: Props) =>
      h(
        'label',
        {},
        p.label,
        h('input', {
          value: p.value ?? '',
          onChange: (event: { target: { value: string } }) => p.onChange?.(event.target.value),
        }),
      ),
    TextareaControl: (p: Props) =>
      h(
        'label',
        {},
        p.label,
        h('textarea', {
          value: p.value,
          onChange: (event: { target: { value: string } }) => p.onChange?.(event.target.value),
        }),
      ),
    ToggleControl: (p: Props) =>
      h(
        'label',
        {},
        p.label,
        h('input', {
          type: 'checkbox',
          checked: p.checked,
          onChange: (event: { target: { checked: boolean } }) => p.onChange?.(event.target.checked),
        }),
      ),
    SelectControl: (p: Props) =>
      h(
        'label',
        {},
        p.label,
        h(
          'select',
          {
            value: p.value,
            onChange: (event: { target: { value: string } }) => p.onChange?.(event.target.value),
          },
          p.options?.map((item) => h('option', { key: item.value, value: item.value }, item.label)),
        ),
      ),
  };
});
const config: AdminConfig = {
  restUrl: 'https://example.org/wp-json/cff/v1/',
  nonce: 'unit-nonce',
  pluginUrl: '/plugin/',
  adminUrl: 'https://example.org/wp-admin/admin.php',
  screen: 'builder',
  locale: 'en_US',
  capabilities: { manage_forms: true, purge_submissions: true },
  features: { fieldTypes: v1Types, uploads: false, xlsx: false },
};
let container: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function button(label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!found) throw new Error(`Missing button ${label}`);
  return found;
}
function input(label: string): HTMLInputElement | HTMLTextAreaElement {
  const found = [...container.querySelectorAll('label')]
    .find((item) => item.textContent?.startsWith(label))
    ?.querySelector('input,textarea');
  if (!(found instanceof HTMLInputElement || found instanceof HTMLTextAreaElement))
    throw new Error(`Missing input ${label}`);
  return found;
}
async function change(label: string, value: string) {
  await act(async () => {
    const target = input(label),
      prototype =
        target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(target, value);
    target.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function click(label: string) {
  await act(async () => button(label).click());
}
describe('admin component regression tests (WordPress controls mocked, real owned components)', () => {
  it('leaves state unchanged for invalid JSON and applies valid JSON explicitly', async () => {
    const changed = vi.fn();
    await act(async () =>
      root.render(createElement(JsonEditor, { label: 'Data', value: { x: 1 }, onChange: changed })),
    );
    await change('Data', '{bad');
    await click('Apply JSON');
    expect(changed).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Invalid JSON. Nothing was changed.');
    await change('Data', '{"x":2}');
    await click('Apply JSON');
    expect(changed).toHaveBeenCalledWith({ x: 2 });
  });
  it('keeps private settings, credentials and metadata out of the preview projection', () => {
    const form: FormDTO = blankForm();
    form.settings.integrations = {
      webhooks: [
        {
          id: 'webhook',
          enabled: true,
          url: 'https://example.org/hook',
          events: ['completed'],
          secret: 'private-value',
        },
      ],
    };
    form.settings.notifications = {
      admin: [{ id: 'mail', enabled: true, to: ['admin@example.org'], subject: 'Private', body: 'Private' }],
    };
    const envelope = publicDraft(form, config),
      json = JSON.stringify(envelope);
    expect(envelope.form.session.savePartial).toBe(true);
    expect(json).not.toContain('private-value');
    expect(json).not.toContain('admin@example.org');
    expect(envelope.form).not.toHaveProperty('settings');
    expect(envelope).not.toHaveProperty('nonce');
    expect(envelope).not.toHaveProperty('capabilities');
  });
  it('cleans up runtime handles in all supported forms', () => {
    const unmount = vi.fn(),
      destroy = vi.fn(),
      legacy = vi.fn();
    cleanupPreview({ unmount });
    cleanupPreview({ destroy });
    cleanupPreview(legacy);
    cleanupPreview(undefined);
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(legacy).toHaveBeenCalledTimes(1);
  });
  it('uses only positive preview IDs and explicitly projects requested WordPress media', async () => {
    const form = blankForm();
    form.schema.bot.avatar = 42;
    const attachment = vi.fn(() => ({
      fetch: async () => undefined,
      get: (key: string) => (key === 'url' ? 'https://example.org/avatar.jpg' : 'Avatar'),
    }));
    vi.stubGlobal('wp', { media: { attachment } });
    const envelope = publicDraft(form, config);
    await resolvePreviewMedia(envelope);
    expect(envelope.form.id).toBe(1);
    expect(form.id).toBe(0);
    expect(attachment).toHaveBeenCalledWith(42);
    expect(envelope.form.media).toEqual({ '42': { url: 'https://example.org/avatar.jpg', alt: 'Avatar' } });
  });
  it('only exposes supported purge criteria, defaults to 360 days and invalidates changed previews', async () => {
    const request = vi.fn(async () => ({ count: 7, fileCount: 0, confirmationToken: 'unit-preview' })),
      api = new AdminApi(config);
    api.request = request as unknown as AdminApi['request'];
    await act(async () => root.render(createElement(Purge, { api })));
    expect(container.textContent).not.toContain('Read state');
    expect(container.textContent).not.toContain('Answer field key');
    await click('Preview count');
    expect(request).toHaveBeenCalledWith('admin/purge/preview', 'POST', {
      criteria: { olderThanDays: 360 },
    });
    expect(button('Permanently purge').disabled).toBe(true);
    await change('Type DELETE to confirm', 'delete');
    expect(button('Permanently purge').disabled).toBe(true);
    await change('Type DELETE to confirm', 'DELETE');
    expect(button('Permanently purge').disabled).toBe(false);
    await change('Form ID (blank = all)', '42');
    expect(container.textContent).not.toContain('7 submissions');
    expect(
      [...container.querySelectorAll('button')].some((item) => item.textContent === 'Permanently purge'),
    ).toBe(false);
  });
  it('submits DELETE with the exact preview-bound criteria and token', async () => {
    const api = new AdminApi(config),
      request = vi.fn(async (path: string) =>
        path.endsWith('preview')
          ? { count: 1, fileCount: 0, confirmationToken: 'unit-preview' }
          : { jobId: 'unit-job', status: 'queued' },
      );
    api.request = request as unknown as AdminApi['request'];
    await act(async () => root.render(createElement(Purge, { api })));
    await click('Preview count');
    await change('Type DELETE to confirm', 'DELETE');
    await click('Permanently purge');
    expect(request).toHaveBeenLastCalledWith('admin/purge', 'POST', {
      criteria: { olderThanDays: 360 },
      confirmationToken: 'unit-preview',
      confirmation: 'DELETE',
    });
    expect(container.textContent).toContain('unit-job');
  });
  it('retains richer filters for list/export screens', async () => {
    await act(async () => root.render(createElement(Filters, { value: {}, onChange: vi.fn() })));
    expect(container.textContent).toContain('Read state');
    expect(container.textContent).toContain('Answer field key');
    expect(container.textContent).toContain('UTM campaign');
  });
  it('rejects hostile download destinations before fetch and allows only the actual server handler', async () => {
    const fetcher = vi.fn(async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      expect(String(url)).toContain('admin-post.php');
      expect(init?.redirect).toBe('error');
      return new Response('', { status: 403 });
    });
    vi.stubGlobal('fetch', fetcher);
    const api = new AdminApi(config);
    for (const url of [
      'https://evil.example/wp-admin/admin-post.php?action=cff_download&exportId=1&ticket=t&_wpnonce=n',
      'https://example.org/wp-admin/admin-post.php?action=other&exportId=1&ticket=t&_wpnonce=n',
      'https://example.org/wp-json/cff/v1/admin/forms',
    ])
      await expect(downloadExport(api, url)).rejects.toThrow('Invalid export download');
    expect(fetcher).not.toHaveBeenCalled();
    await expect(
      downloadExport(
        api,
        'https://example.org/wp-admin/admin-post.php?action=cff_download&exportId=1&ticket=t&_wpnonce=n',
      ),
    ).rejects.toThrow('Export expired');
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    });
    expect(fetcher.mock.calls[0]?.[1]).not.toHaveProperty('headers');
  });
  it('polls actual jobs without overlapping requests and stops at completion', async () => {
    vi.useFakeTimers();
    const api = new AdminApi(config),
      request = vi
        .fn()
        .mockResolvedValueOnce({ status: 'running' })
        .mockResolvedValueOnce({ status: 'ready' });
    api.request = request as unknown as AdminApi['request'];
    const result = vi.fn(),
      error = vi.fn();
    function Harness() {
      useJobProgress(api, 'admin/exports/7', 'queued', result, error);
      return null;
    }
    await act(async () => root.render(createElement(Harness)));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(request).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(result).toHaveBeenLastCalledWith({ status: 'ready' });
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(request).toHaveBeenCalledTimes(2);
    expect(error).not.toHaveBeenCalled();
  });
  it('cancels scheduled progress queries when the panel unmounts', async () => {
    vi.useFakeTimers();
    const api = new AdminApi(config),
      request = vi.fn();
    api.request = request as unknown as AdminApi['request'];
    function Harness() {
      useJobProgress(api, 'admin/exports/7', 'queued', vi.fn(), vi.fn());
      return null;
    }
    await act(async () => root.render(createElement(Harness)));
    await act(async () => root.render(null));
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(request).not.toHaveBeenCalled();
  });
});
