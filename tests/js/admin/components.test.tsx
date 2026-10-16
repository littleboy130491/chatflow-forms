// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createElement, createRoot } from '@wordpress/element';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminApi } from '../../../assets/src/builder/api';
import type { AdminConfig, FormDTO } from '../../../assets/src/builder/api';
import { blankForm, v1Types } from '../../../assets/src/builder/model';
import { FormStart } from '../../../assets/src/builder/index';
import { JsonEditor } from '../../../assets/src/builder/controls';
import { ConnectorSettings } from '../../../assets/src/builder/ConnectorSettings';
import { SettingsEditor } from '../../../assets/src/builder/FormSettings';
import { AiGenerate, applyRewrites, copyItems } from '../../../assets/src/builder/AiAssist';
import type { FormSettings } from '../../../assets/src/builder/api';
import { cleanupPreview, previewKey, publicDraft, resolvePreviewMedia } from '../../../assets/src/builder/Preview';
import { applyPalette, palettes, sampleEnvelope, ThemeEditor } from '../../../assets/src/builder/ThemeEditor';
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
  it('loads starter templates and creates the selected template as an unpublished draft', async () => {
    const api = new AdminApi(config);
    const open = vi.fn();
    const draft = { ...blankForm(), id: 89, status: 'draft' as const };
    const request = vi.fn(async (path: string, method = 'GET') => {
      if (path.startsWith('admin/forms?')) return { items: [], total: 0, page: 1, perPage: 20 };
      if (path === 'admin/templates') return {
        items: [{ id: 'contact-request', title: 'Contact request', description: 'Collect inquiries.', locale: 'en_US' }],
      };
      if (path === 'admin/templates/contact-request' && method === 'POST') return draft;
      throw new Error('Unexpected admin endpoint: ' + path);
    });
    api.request = request as unknown as AdminApi['request'];
    await act(async () => root.render(createElement(FormStart, { api, onOpen: open })));
    await vi.waitFor(() => expect(container.textContent).toContain('Contact request'));
    expect(container.textContent).toContain('Collect inquiries.');
    await click('Use template');
    expect(request).toHaveBeenCalledWith('admin/templates/contact-request', 'POST', {});
    expect(open).toHaveBeenCalledWith(draft);
  });
  it('does not navigate if starter template creation fails', async () => {
    const api = new AdminApi(config);
    const open = vi.fn();
    const request = vi.fn(async (path: string) => {
      if (path.startsWith('admin/forms?')) return { items: [], total: 0, page: 1, perPage: 20 };
      if (path === 'admin/templates') return {
        items: [{ id: 'customer-feedback', title: 'Customer feedback', description: 'Gather feedback.', locale: 'en_US' }],
      };
      throw new Error('Template could not be created.');
    });
    api.request = request as unknown as AdminApi['request'];
    await act(async () => root.render(createElement(FormStart, { api, onOpen: open })));
    await vi.waitFor(() => expect(container.textContent).toContain('Customer feedback'));
    await click('Use template');
    expect(container.querySelector('[role=alert]')?.textContent).toContain('Template could not be created.');
    expect(open).not.toHaveBeenCalled();
  });
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
  it('restarts the preview only for rendered changes, not autosave bookkeeping or map layout', () => {
    const form = blankForm(),
      key = previewKey(form);
    expect(previewKey({ ...form, id: 12, draftRevision: 4, version: 2, slug: 'saved' })).toBe(key);
    expect(previewKey({ ...form, schema: { ...form.schema, flowPositions: [{ id: 'x', x: 1, y: 2 }] } })).toBe(key);
    expect(previewKey({ ...form, settings: { ...form.settings, privacy: { storeMeta: false } } })).toBe(key);
    expect(previewKey({ ...form, schema: { ...form.schema, bot: { ...form.schema.bot, name: 'Bo' } } })).not.toBe(key);
    // Appearance is pushed into the running preview (setAppearance), so it never restarts it.
    expect(previewKey({ ...form, settings: { ...form.settings, appearance: { theme: 'dark' } } })).toBe(key);
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

describe('native connector editor', () => {
  it('adds a provider, offers only consent questions as the gate and drops cleared options', async () => {
    const form = blankForm();
    form.schema.steps = [
      { id: 's1', key: 'email', type: 'email', label: 'Email', messages: [] },
      { id: 's2', key: 'agree', type: 'consent', label: 'Agree', messages: [] },
      { id: 's3', key: 'nama', type: 'short_text', label: 'Name', messages: [] },
    ];
    let latest: NonNullable<FormSettings['integrations']> = {};
    const render = async () => act(async () => root.render(createElement(ConnectorSettings, { schema: form.schema, integrations: latest, onChange: (next: typeof latest) => { latest = next; void render(); } })));
    await render();
    await act(async () => {
      const picker = [...container.querySelectorAll('label')].find((item) => item.textContent?.startsWith('Connector'))!.querySelector('select')!;
      picker.value = 'mailchimp';
      picker.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await click('Add connector');
    expect(latest.connectors?.[0]).toMatchObject({ type: 'mailchimp', enabled: true, events: ['completed'] });
    const consent = [...container.querySelectorAll('label')].find((item) => item.textContent?.startsWith('Consent question (required'))!.querySelector('select')!;
    expect([...consent.options].map((option) => option.value)).toEqual(['', 'agree']);
    await change('Mailchimp audience ID', 'abc123def4');
    expect(latest.connectors?.[0]?.listId).toBe('abc123def4');
    await change('Mailchimp audience ID', '');
    expect(latest.connectors?.[0]).not.toHaveProperty('listId');
    await click('Remove connector');
    expect(latest.connectors).toEqual([]);
  });
});

describe('AI assist', () => {
  it('collects labels, bot messages and endings, and applies only returned rewrites', () => {
    const form = blankForm();
    form.schema.steps = [{ id: 's1', key: 'name', type: 'short_text', label: 'Name', messages: ['Hi {{name}}', ''] }];
    form.schema.endings = [{ id: 'end', type: 'message', messages: ['Thanks'] }];
    const items = copyItems(form.schema);
    expect(items).toEqual([
      { id: 'step:s1:label', text: 'Name' },
      { id: 'step:s1:message:0', text: 'Hi {{name}}' },
      { id: 'ending:end:message:0', text: 'Thanks' },
    ]);
    const next = applyRewrites(form.schema, [{ id: 'step:s1:message:0', text: 'Hey {{name}}!' }, { id: 'unknown', text: 'x' }]);
    expect(next.steps[0]).toMatchObject({ label: 'Name', messages: ['Hey {{name}}!', ''] });
    expect(next.endings[0]!.messages).toEqual(['Thanks']);
    // The original schema is not mutated.
    expect(form.schema.steps[0]!.messages).toEqual(['Hi {{name}}', '']);
  });
  it('generates a draft from a description and reports server errors without opening', async () => {
    const api = new AdminApi(config);
    const open = vi.fn();
    const draft = { ...blankForm(), id: 77, status: 'draft' as const };
    let fail = true;
    const request = vi.fn(async () => { if (fail) throw new Error('Claude declined this request.'); return draft; });
    api.request = request as unknown as AdminApi['request'];
    await act(async () => root.render(createElement(AiGenerate, { api, onOpen: open })));
    await change('Describe the form you need', 'A lead form for a bakery');
    await click('Generate draft');
    expect(request).toHaveBeenCalledWith('admin/ai/generate', 'POST', { prompt: 'A lead form for a bakery', locale: 'en_US' });
    expect(container.querySelector('[role=alert]')?.textContent).toContain('Claude declined');
    expect(open).not.toHaveBeenCalled();
    fail = false;
    await click('Generate draft');
    expect(open).toHaveBeenCalledWith(draft);
  });
});

describe('per-form settings inherit global defaults', () => {
  it('shows inherited values without writing them and offers only inherit/off for captcha', async () => {
    const api = new AdminApi({
      ...config,
      defaults: {
        appearance: { theme: 'dark' },
        privacy: { ipMode: 'none', storeMeta: false, retentionDays: 90 },
        spam: { honeypotEnabled: true, minSeconds: 5, captcha: 'turnstile' },
      },
    });
    const form = blankForm(api.config.defaults);
    expect(form.settings.appearance).toEqual({ theme: 'dark', style: 'messaging' });
    expect(form.settings).not.toHaveProperty('privacy');
    expect(form.settings).not.toHaveProperty('spam');
    let latest: FormSettings = form.settings;
    const render = async () =>
      act(async () =>
        root.render(
          createElement(SettingsEditor, {
            form: { ...form, settings: latest },
            api,
            save: async () => form,
            onChange: (next: FormSettings) => {
              latest = next;
              void render();
            },
          }),
        ),
      );
    await render();
    expect(input('Minimum completion seconds').value).toBe('5');
    expect(input('Retention days').value).toBe('90');
    const captcha = () =>
      [...container.querySelectorAll('label')]
        .find((item) => item.textContent?.startsWith('Captcha'))!
        .querySelector('select')!;
    expect([...captcha().options].map((option) => [option.value, option.textContent])).toEqual([
      ['', 'Use global setting (Cloudflare Turnstile)'],
      ['none', 'Off for this form'],
    ]);
    await change('Minimum completion seconds', '7');
    expect(latest.spam).toEqual({ minSeconds: 7 });
    expect(latest).not.toHaveProperty('privacy');
    await act(async () => {
      const select = captcha();
      select.value = 'none';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(latest.spam).toEqual({ minSeconds: 7, captcha: 'none' });
    await click('Use global default');
    expect(latest.spam).toEqual({ captcha: 'none' });
  });
});
describe('chat theme editor', () => {
  it('applies palettes and individual colours without losing other theme choices', async () => {
    const form = blankForm();
    form.settings.appearance = { style: 'messaging', choiceStyle: 'chips', radius: 20 };
    const changed = vi.fn();
    await act(async () => root.render(createElement(ThemeEditor, { form, config, onChange: changed })));
    await act(async () => (container.querySelector<HTMLButtonElement>('button[aria-label="Night"]')!).click());
    expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ style: 'messaging', theme: 'dark', primary: '#5eb5f7', chatBackground: '#0e1621', choiceStyle: 'chips', radius: 20 }));
    await click('Plain');
    expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ wallpaper: 'none', choiceStyle: 'chips' }));
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('.cff-style-cards button')].find(button => button.querySelector('strong')?.textContent === 'Classic')!.click());
    expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ style: 'classic', radius: 20 }));
  });
  it('builds a sample conversation that shows answered and pending bubbles', () => {
    const envelope = sampleEnvelope(blankForm(), config);
    expect(envelope.form.schema.steps.map(step => step.type)).toEqual(['single_choice', 'single_choice', 'summary']);
    expect(envelope.form.schema.bot.typingSpeed).toBe('off');
    expect(applyPalette({ wallpaper: 'dots', bubbleTails: false }, palettes()[1]!)).toMatchObject({ style: 'messaging', wallpaper: 'doodle', bubbleTails: false, primary: '#008069' });
  });
});
