// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminConfig, FormDTO, FormSchema } from '../../../assets/src/builder/api';
import { blankForm, v1Types } from '../../../assets/src/builder/model';
import { builderUrlFor, mountBuilder, themeLabels, typingSpeedLabels } from '../../../assets/src/builder/index';
import { actionText, conditionText } from '../../../assets/src/builder/LogicOverview';
import { shortcode } from '../../../assets/src/builder/Share';
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
const config: AdminConfig = {
  restUrl: 'https://example.org/wp-json/cff/v1/',
  nonce: 'unit-nonce',
  pluginUrl: '/plugin/',
  adminUrl: 'https://example.org/wp-admin/admin.php',
  screen: 'builder',
  locale: 'en_US',
  capabilities: { manage_forms: true },
  features: { fieldTypes: v1Types, uploads: false, xlsx: false },
};
let host: HTMLDivElement;
beforeEach(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.appendChild(host);
});
afterEach(() => {
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});
const button = (label: string) => {
  const found = [...host.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!found) throw new Error(`Missing button ${label}`);
  return found;
};

describe('builder helpers', () => {
  it('replaces a blank-form URL with the saved form ID only once', () => {
    expect(builderUrlFor('https://example.org/wp-admin/admin.php?page=cff-builder&blank=1', 0)).toBeNull();
    expect(builderUrlFor('https://example.org/wp-admin/admin.php?page=cff-builder&blank=1', 9)).toBe(
      'https://example.org/wp-admin/admin.php?page=cff-builder&formId=9',
    );
    expect(builderUrlFor('https://example.org/wp-admin/admin.php?page=cff-builder&formId=9', 9)).toBeNull();
  });
  it('builds the shortcode from the form display mode', () => {
    const form = { ...blankForm(), id: 4 };
    expect(shortcode(form)).toBe('[chatflow id="4" mode="inline"]');
    form.settings.display = { mode: 'launcher', launcher: { position: 'left' } };
    expect(shortcode(form)).toBe('[chatflow id="4" mode="launcher" position="left"]');
    form.settings.display = { mode: 'fullpage', launcher: { position: 'left' } };
    expect(shortcode(form)).toBe('[chatflow id="4" mode="fullpage"]');
  });
  it('labels every typing speed and theme value', () => {
    expect(Object.keys(typingSpeedLabels)).toEqual(['off', 'fast', 'normal', 'slow']);
    expect(Object.keys(themeLabels)).toEqual(['light', 'dark', 'auto']);
  });
  it('summarises rules as readable sentences instead of JSON', () => {
    const form = blankForm();
    const first = form.schema.steps[0]!;
    const second = { ...first, id: 'stp_layanan', key: 'layanan', label: 'Layanan' };
    const schema: FormSchema = { ...form.schema, steps: [first, second] };
    expect(conditionText({ field: first.key, op: 'eq', value: 'Belum pernah' }, schema)).toBe(
      `${first.label} equals “Belum pernah”`,
    );
    expect(
      conditionText({ all: [{ field: first.key, op: 'eq', value: 'a' }, { field: 'layanan', op: 'is_empty' }] }, schema),
    ).toBe(`${first.label} equals “a” and Layanan is empty`);
    expect(conditionText({ any: [] }, schema)).toBe('always');
    expect(actionText({ action: 'jump', to: second.id }, schema)).toBe('Jump to field “Layanan”');
    expect(actionText({ action: 'end', to: schema.endings[0]!.id }, schema)).toContain('End with');
    expect(actionText({ action: 'set_variable', key: 'score_1', operation: 'add', value: 2 }, schema)).toBe(
      'Set variable: score_1 += 2',
    );
  });
});

describe('builder screen', () => {
  it('saves a blank form, updates the URL, manages tabs, publish focus, field deletion and leaving', async () => {
    window.history.replaceState(null, '', '/wp-admin/admin.php?page=cff-builder&blank=1');
    const saved = (body: Partial<FormDTO>): FormDTO => ({ ...blankForm(), ...body, id: 31, draftRevision: 1 });
    const fetch = vi.fn(async (url: string, init?: { body?: unknown }) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as Partial<FormDTO>) : {};
      const json = url.endsWith('admin/forms') ? saved(body) : url.endsWith('/lock') ? { locked: true } : saved(body);
      return new Response(JSON.stringify(json), { status: 200 });
    });
    vi.stubGlobal('fetch', fetch);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => mountBuilder(host, config));
    expect(host.textContent).toContain('Not published yet');
    expect(button('Build').getAttribute('aria-pressed')).toBe('true');
    expect(button('Logic').getAttribute('aria-pressed')).toBe('false');
    // A single remaining field cannot be deleted.
    expect(button('Delete field').disabled).toBe(true);
    await act(async () => button('Short text').click());
    expect(host.querySelectorAll('article.cff-card')).toHaveLength(2);
    await act(async () => button('Delete field').click());
    expect(confirm).toHaveBeenCalled();
    expect(host.querySelectorAll('article.cff-card')).toHaveLength(1);
    await act(async () => button('Save draft').click());
    expect(fetch.mock.calls[0]?.[0]).toBe(config.restUrl + 'admin/forms');
    expect(window.location.search).toBe('?page=cff-builder&formId=31');
    // Publish dialog takes focus and gives it back on Escape.
    await act(async () => button('Publish').click());
    const dialog = host.querySelector<HTMLElement>('[role=dialog]')!;
    expect(document.activeElement).toBe(dialog);
    await act(async () => dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(host.querySelector('[role=dialog]')).toBeNull();
    expect(document.activeElement).toBe(button('Publish'));
    // After confirming "All forms", the unload prompt is suppressed.
    await act(async () => button('Short text').click());
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, href: window.location.href, assign });
    await act(async () => button('All forms').click());
    expect(assign).toHaveBeenCalledWith(expect.stringContaining('page=cff-forms'));
    vi.unstubAllGlobals();
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);
  });
});
