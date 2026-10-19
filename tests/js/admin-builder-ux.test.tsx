// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot } from '@wordpress/element';
import { afterEach, expect, it, vi } from 'vitest';
import { Inspector } from '../../assets/src/builder/Inspector';
import { blankForm } from '../../assets/src/builder/model';
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
    variant?: string;
    isDestructive?: boolean;
    [key: string]: unknown;
  }
  const field = (p: Props, tag: string) =>
    h(
      'label',
      {},
      p.label,
      h(tag, {
        value: p.value ?? '',
        onChange: (event: { target: { value: string } }) => p.onChange?.(event.target.value),
      }),
    );
  return {
    Button: ({ children, ...props }: Props) => {
      const rest: Record<string, unknown> = { ...props };
      delete rest.variant;
      delete rest.isDestructive;
      return h('button', rest, children);
    },
    Notice: (p: Props) => h('div', { role: 'alert' }, p.children),
    TextControl: (p: Props) => field(p, 'input'),
    TextareaControl: (p: Props) => field(p, 'textarea'),
    ToggleControl: (p: Props) =>
      h(
        'label',
        {},
        p.label,
        h('input', {
          type: 'checkbox',
          checked: p.checked ?? false,
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
          { value: p.value, onChange: (event: { target: { value: string } }) => p.onChange?.(event.target.value) },
          p.options?.map((item) => h('option', { key: item.value, value: item.value }, item.label)),
        ),
      ),
  };
});

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
async function render(node: ReactNode) { host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(node)); }
afterEach(async () => { if(root) await act(async () => root.unmount()); host?.remove(); vi.restoreAllMocks(); });
it('keeps technical options in Advanced and hides input controls for statements', async () => {
 const form = blankForm(); const step = form.schema.steps[0]!;
 await render(<Inspector step={step} schema={form.schema} onChange={vi.fn()} />);
 expect(host.textContent).not.toContain('Placeholder');
 expect(host.textContent).not.toContain('Required');
 expect(host.textContent).not.toContain('Keyboard hint');
 expect([...host.querySelectorAll('summary')].some(s => s.textContent === 'Advanced')).toBe(true);
 expect(host.querySelector('label')?.textContent).not.toBe('Field key');
});

import { mountBuilder } from '../../assets/src/builder/index';
import type { AdminConfig } from '../../assets/src/builder/api';
import { v1Types } from '../../assets/src/builder/model';
const config: AdminConfig = { restUrl: 'https://example.org/wp-json/cff/v1/', nonce: 'test', pluginUrl: '/plugin/', adminUrl: 'https://example.org/wp-admin/admin.php', screen: 'builder', locale: 'en_US', capabilities: { manage_forms: true }, features: { fieldTypes: v1Types, uploads: false, xlsx: false } };
async function builder() {
 window.history.replaceState(null, '', '/?blank=1');
 host = document.createElement('div'); document.body.append(host);
 await act(async () => mountBuilder(host, config));
}
function button(text: string) { const b = [...host.querySelectorAll('button')].find(b => b.textContent === text); if (!b) throw Error(`Missing button ${text}`); return b; }
it('uses summary cards, grouped palette and an explicit responsive edit surface', async () => {
 await builder();
 const card = host.querySelector('article')!;
 expect(card.querySelector('input:not([type=checkbox]),textarea')).toBeNull();
 expect(card.querySelector('input[type=checkbox]')?.getAttribute('role')).not.toBe('switch');
 expect(host.querySelectorAll('.cff-palette-group')).toHaveLength(4);
 expect(button('Add field')).toBeTruthy();
 await act(async () => button('Short text').click());
 expect(host.querySelector('.cff-inspector-panel')?.classList.contains('is-open')).toBe(true);
 await act(async () => button('Back to flow').click());
 expect(host.querySelector('.cff-inspector-panel')?.classList.contains('is-open')).toBe(false);
 const search = [...host.querySelectorAll('label')].find(l => l.textContent?.includes('Search fields'))!.querySelector('input')!;
 await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; setter.call(search, 'email'); search.dispatchEvent(new Event('change', { bubbles: true })); search.dispatchEvent(new Event('input', { bubbles: true })); });
});

import { Share } from '../../assets/src/builder/Share';
import { toDataURL } from 'qrcode';
vi.mock('qrcode', () => ({ toDataURL: vi.fn(async () => 'data:image/png;base64,test') }));
it('does not expose public URLs or generate QR codes for unpublished forms', async () => {
 vi.mocked(toDataURL).mockClear();
 await render(<Share form={{ ...blankForm(), id: 9 }} config={config} />);
 expect(host.textContent).toContain('Publish your form to get a shareable link');
 expect(host.querySelector('a')).toBeNull();
 expect(toDataURL).not.toHaveBeenCalled();
});
it('separates Link, Embed and QR modes and copies the published link', async () => {
 const writeText = vi.fn(async () => undefined);
 Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
 const form = { ...blankForm(), id: 9, version: 1, slug: 'contact' };
 await render(<Share form={form} config={{ ...config, siteUrl: 'https://example.org/', fullpageBase: 'chat' }} />);
 expect(host.querySelector('img')).toBeNull();
 await act(async () => button('Copy link').click());
 expect(writeText).toHaveBeenCalledWith('https://example.org/chat/contact/');
 expect(host.textContent).toContain('Copied');
 await act(async () => button('Embed').click());
 expect(host.textContent).toContain('[chatflow id="9" mode="inline"]');
 expect(button('Copy shortcode')).toBeTruthy();
 await act(async () => button('QR code').click());
 expect(host.querySelector('img')).not.toBeNull();
 expect(toDataURL).toHaveBeenCalledWith('https://example.org/chat/contact/', expect.anything());
});

it('explains publishing in visitor language and hands off the live form without changing save/publish ordering', async () => {
 const requests: string[] = [];
 const saved = { ...blankForm(), id: 31, draftRevision: 1 };
 const published = { ...saved, version: 1, slug: 'contact', status: 'published' as const };
 vi.stubGlobal('fetch', vi.fn(async (url: string) => { requests.push(url); return new Response(JSON.stringify(url.endsWith('/publish') || url.endsWith('/published') ? published : saved), { status: 200 }); }));
 await builder();
 await act(async () => button('Share').click());
 expect(host.querySelector('.cff-share-empty')).not.toBeNull();
 expect(host.textContent).not.toContain('/chat//');
 await act(async () => button('Publish').click());
 expect(host.querySelector('[role=dialog] h2')?.textContent).toBe('Publish form?');
 expect(host.querySelector('[role=dialog] details')).not.toBeNull();
 await act(async () => button('Publish new version').click());
 expect(host.textContent).toContain('Form published');
 expect(button('Copy link')).toBeTruthy();
 expect(host.querySelector('a')?.getAttribute('href')).toContain('/chat/contact/');
 expect(requests.findIndex(u => u.endsWith('/admin/forms'))).toBeLessThan(requests.findIndex(u => u.endsWith('/publish')));
 expect(host.textContent).toContain('Live version 1');
 vi.unstubAllGlobals();
});

it('shares the frozen published snapshot after editing the draft during first publication', async () => {
 const saved = { ...blankForm(), id: 31, draftRevision: 1 };
 const published = { ...saved, version: 1, draftRevision: 2, slug: 'contact', status: 'publish', settings: { ...saved.settings, display: { mode: 'popup' as const } } };
 let complete!: (response: Response) => void;
 const pending = new Promise<Response>(resolve => { complete = resolve; });
 vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/publish') ? pending : url.endsWith('/published') ? new Promise<Response>(() => {}) : Promise.resolve(new Response(JSON.stringify(saved)))));
 host = document.createElement('div'); document.body.append(host);
 await act(async () => mountBuilder(host, { ...config, formId: 31 }));
 await act(async () => button('Publish').click());
 await act(async () => button('Publish new version').click());
 const title = [...host.querySelectorAll('label')].find(label => label.textContent === 'Form name')!.querySelector('input')!;
 await act(async () => {
   Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(title, 'New local title');
   title.dispatchEvent(new Event('input', { bubbles: true }));
 });
 expect(title.value).toBe('New local title');
 await act(async () => complete(new Response(JSON.stringify(published))));
 await act(async () => button('Share and embed').click());
 expect(host.querySelector('.cff-share-empty')).toBeNull();
 expect(host.querySelector('.cff-share a')?.getAttribute('href')).toContain('/chat/contact/');
 expect(title.value).toBe('New local title');
 expect(host.textContent).toContain('Unsaved draft');
 await act(async () => button('Embed').click());
 expect(host.querySelector('.cff-share pre')?.textContent).toBe('[chatflow id="31" mode="popup"]');
 vi.unstubAllGlobals();
});

it('loads the complete live snapshot for sharing instead of unpublished draft settings', async () => {
 const draft = { ...blankForm(), id: 32, version: 1, slug: 'contact', draftRevision: 3 };
 const live = { ...draft, settings: { ...draft.settings, display: { mode: 'launcher' as const, launcher: { position: 'left' as const } } } };
 vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith('/published') ? live : draft))));
 host = document.createElement('div'); document.body.append(host);
 await act(async () => mountBuilder(host, { ...config, formId: 32 }));
 await act(async () => button('Share').click());
 await act(async () => button('Embed').click());
 expect(host.querySelector('.cff-share pre')?.textContent).toBe('[chatflow id="32" mode="launcher" position="left"]');
 vi.unstubAllGlobals();
});

import { EndingsEditor, SettingsEditor } from '../../assets/src/builder/FormSettings';
import { AdminApi } from '../../assets/src/builder/api';
it('groups settings by task without materializing inherited privacy values', async () => {
 const form = blankForm(); const onChange = vi.fn();
 const api = new AdminApi({ ...config, defaults: { privacy: { storeMeta: false, retentionDays: 123 }, spam: { honeypotEnabled: false } } });
 await render(<SettingsEditor form={form} api={api} onChange={onChange} save={async () => form} />);
 const nav = host.querySelector('nav[aria-label="Form settings sections"]');
 expect(nav).not.toBeNull();
 expect([...nav!.querySelectorAll('button')].map(b => b.textContent)).toEqual(['General / Completion', 'Display', 'Notifications', 'Integrations', 'Privacy', 'Advanced']);
 expect(host.querySelector('section[data-settings-group=privacy]')?.hasAttribute('hidden')).toBe(true);
 await act(async () => button('Privacy').click());
 const privacy = host.querySelector('section[data-settings-group=privacy]')!;
 expect(privacy.hasAttribute('hidden')).toBe(false);
 const meta = [...privacy.querySelectorAll('label')].find(l => l.textContent === 'Store tracking metadata')!.querySelector('input')!;
 expect(meta.checked).toBe(false);
 await act(async () => meta.click());
 expect(onChange.mock.lastCall?.[0].privacy).toEqual({ storeMeta: true });
 expect(form.settings.privacy).toBeUndefined();
});

it('reconciles an undone selected field before activating a narrow drawer', async () => {
 let resize = () => {};
 const media = { matches: false, addEventListener: (_: string, callback: () => void) => { resize = callback; }, removeEventListener: vi.fn() };
 Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => media });
 document.body.style.overflow = 'auto';
 await builder();
 await act(async () => button('Short text').click());
 await act(async () => button('Undo').click());
 await act(async () => { media.matches = true; resize(); });
 expect(document.body.style.overflow).toBe('auto');
 expect(host.querySelectorAll('[inert]')).toHaveLength(0);
 expect(host.querySelector('article.is-selected')).not.toBeNull();
 await act(async () => button('Short text').click());
 expect(document.body.style.overflow).toBe('hidden');
 expect(document.activeElement).toBe(button('Back to flow'));
 await act(async () => button('Back to flow').click());
 expect(document.body.style.overflow).toBe('auto');
 document.body.style.overflow = '';
});

it('moves keyboard focus into the narrow-screen inspector and returns to the selected field', async () => {
 Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
 await builder();
 await act(async () => button('Short text').click());
 expect(document.activeElement).toBe(button('Back to flow'));
 await act(async () => button('Back to flow').click());
 expect(document.activeElement?.getAttribute('data-step-id')).toBe(host.querySelector('article.is-selected button[data-step-id]')?.getAttribute('data-step-id'));
});

import { Preview } from '../../assets/src/builder/Preview';
it('leads with the question and places internal labels in Advanced', async () => {
 const form = blankForm();
 await render(<Inspector step={form.schema.steps[0]!} schema={form.schema} onChange={vi.fn()} />);
 const label = [...host.querySelectorAll('label')].find(l => l.textContent === 'Label')!;
 expect(label.closest('details')?.querySelector('summary')?.textContent).toBe('Advanced');
 expect(host.querySelector('label')?.textContent).toContain('Bot message');
});
it('makes the draft preview transition and return action explicit', async () => {
 const onClose = vi.fn();
 await render(<Preview form={blankForm()} config={config} onClose={onClose} />);
 expect(host.querySelector('h2')?.textContent).toBe('Preview your form');
 expect(host.textContent).toContain('Responses here are not saved');
 await act(async () => button('Back to editor').click());
 expect(onClose).toHaveBeenCalledOnce();
});
it('keeps new field labels in sync with the question without changing keys or custom labels', async () => {
 let step = blankForm().schema.steps[0]!;
 const key = step.key, id = step.id;
 const onChange = vi.fn(next => { step = next; });
 const typeMessage = async (text: string) => {
  const input = host.querySelector('textarea')!;
  await act(async () => {
   Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, text);
   input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => root.render(<Inspector step={step} schema={{ ...blankForm().schema, steps: [step] }} onChange={onChange} />));
 };
 await render(<Inspector step={step} schema={{ ...blankForm().schema, steps: [step] }} onChange={onChange} />);
 await typeMessage('Siapa nama Anda?');
 expect(step.label).toBe('Siapa nama Anda?');
 await typeMessage('Siapa nama lengkap Anda?');
 expect(step.label).toBe('Siapa nama lengkap Anda?');
 expect({ key: step.key, id: step.id }).toEqual({ key, id });
 step = { ...step, label: 'Label internal khusus' };
 await act(async () => root.render(<Inspector step={step} schema={{ ...blankForm().schema, steps: [step] }} onChange={onChange} />));
 await typeMessage('Apa panggilan Anda?');
 expect(step.label).toBe('Label internal khusus');
});
it('uses readable ending names while preserving IDs and hiding technical redirect controls', async () => {
 const form = blankForm(), id = form.schema.endings[0]!.id;
 await render(<EndingsEditor form={form} onChange={vi.fn()} />);
 expect(host.querySelector('select option')?.textContent).toBe('Ending 1 · Thank you!');
 expect(host.querySelector('legend')?.textContent).toBe('Ending 1 · Thank you!');
 expect(host.querySelector('select option')?.getAttribute('value')).toBe(id);
 expect([...host.querySelectorAll('label')].some(l => l.textContent?.startsWith('Allowed external redirect hosts'))).toBe(false);
 const technical = [...host.querySelectorAll('details')].find(d => d.querySelector('code')?.textContent === id)!;
 expect(technical).toBeTruthy();
 expect(technical.open).toBe(false);
});
