import { describe, expect, it, vi } from 'vitest';
import { AdminApi, ApiError, can, queryString } from '../../../assets/src/builder/api';
import type { AdminConfig, FormDTO } from '../../../assets/src/builder/api';
import {
  blankForm,
  DraftController,
  duplicateStep,
  editable,
  makeOption,
  makeStep,
  publishDiff,
  reorder,
  uniqueKey,
  v1Types,
} from '../../../assets/src/builder/model';
import { exportForm, importForm, parseFormFile } from '../../../assets/src/builder/formIO';
import { displayValue, exportOptions } from '../../../assets/src/submissions/model';
const config: AdminConfig = {
  restUrl: 'https://example.org/wp-json/cff/v1/',
  nonce: 'unit-nonce',
  pluginUrl: 'https://example.org/plugin/',
  screen: 'builder',
  locale: 'en_US',
  features: { fieldTypes: v1Types, uploads: false, xlsx: false },
  capabilities: { manage_forms: true },
};
function stored(): FormDTO {
  return { ...blankForm(), id: 42, draftRevision: 3, version: 1, status: 'publish', slug: 'survey' };
}
function api(handler: (path: string, method: string, body: Record<string, unknown>) => Promise<FormDTO>) {
  const transport = vi.fn(async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const path = String(url).replace(config.restUrl, ''),
      body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    try {
      return new Response(JSON.stringify(await handler(path, init?.method ?? 'GET', body)), { status: 200 });
    } catch (err) {
      if (err instanceof ApiError)
        return new Response(JSON.stringify({ code: err.code, message: err.message, data: err.data }), {
          status: err.status,
        });
      throw err;
    }
  });
  return { client: new AdminApi(config, transport), transport };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
describe('admin API and immutable identities', () => {
  it('uses browser-native fetch with the global receiver when no transport is injected', async () => {
    const native = vi.fn(function (this: unknown) {
      if (this !== globalThis) throw new TypeError('Illegal invocation');
      return Promise.resolve(new Response(JSON.stringify(stored()), { status: 200 }));
    });
    vi.stubGlobal('fetch', native);
    try {
      await expect(new AdminApi(config).request('admin/forms')).resolves.toMatchObject({ id: 42 });
      expect(native).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('uses logged-in credentials, REST nonce and no-store for admin mutations', async () => {
    const { client, transport } = api(async () => stored());
    await client.request('admin/forms/42', 'PUT', { draftRevision: 3 });
    expect(transport.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-WP-Nonce': 'unit-nonce', 'Content-Type': 'application/json' },
      body: '{"draftRevision":3}',
    });
  });
  it('rejects visitor, traversal and remote paths before transport', async () => {
    const { client, transport } = api(async () => stored());
    for (const path of [
      'sessions',
      'admin/../forms',
      'admin/https://evil.example',
      'admin/%2e%2e/forms',
      'admin/%2fforms',
      'admin/\\forms',
    ])
      await expect(client.request(path)).rejects.toThrow('Invalid admin API path');
    expect(transport).not.toHaveBeenCalled();
  });
  it('retains WordPress conflict metadata', async () => {
    const { client } = api(async () => {
      throw new ApiError('cff_revision_conflict', 'Conflict', 409, { draftRevision: 9 });
    });
    await expect(client.request('admin/forms/42')).rejects.toMatchObject({
      status: 409,
      code: 'cff_revision_conflict',
      data: { draftRevision: 9 },
    });
  });
  it('does not infer grants from the admin nonce or missing capabilities', () => {
    expect(can(config, 'manage_forms')).toBe(true);
    expect(can(config, 'purge_submissions')).toBe(false);
    expect(can({ ...config, capabilities: {} }, 'manage_forms')).toBe(false);
  });
  it('encodes filters without losing false or zero', () => {
    expect(queryString({ isRead: false, page: 0, blank: '', missing: undefined, value: 'a&b' })).toBe(
      'isRead=false&page=0&value=a%26b',
    );
  });
  it('creates only supported v1 types and unique permanent identifiers', () => {
    expect(v1Types).toContain('summary');
    for (const type of ['rating', 'scale', 'nps', 'slider']) expect(v1Types).toContain(type);
    expect(v1Types).not.toContain('file_upload');
    const a = makeStep('single_choice', []),
      b = makeStep('single_choice', [a]);
    expect(a.id).not.toBe(b.id);
    expect(a.key).not.toBe(b.key);
    expect(a.options?.[0]?.id).not.toBe(makeOption('option_1').id);
    expect(uniqueKey('123 $$$', [])).toBe('field');
  });
  it('duplicates choice IDs once and preserves identities during reordering', () => {
    const a = makeStep('single_choice', []),
      b = makeStep('short_text', [a]),
      copy = duplicateStep(a, [a, b]);
    expect(copy.id).not.toBe(a.id);
    expect(copy.key).not.toBe(a.key);
    expect(copy.options?.[0]?.id).not.toBe(a.options?.[0]?.id);
    expect(copy.options?.[0]?.value).toBe(a.options?.[0]?.value);
    const moved = reorder([a, b], a.id, b.id);
    expect(moved).toEqual([b, a]);
    expect(moved[1]).toBe(a);
    expect(reorder(moved, 'missing', a.id)).toBe(moved);
  });
  it('shows an actual stable-ID publish diff', () => {
    const old = stored().schema,
      a = makeStep('email', []),
      draft = { ...old, steps: [{ ...old.steps[0]!, label: 'Changed' }, a] as FormDTO['schema']['steps'] };
    expect(publishDiff(old, draft)).toEqual({ added: 1, removed: 0, changed: 1 });
  });
});
describe('draft mutation serialization and conflict recovery', () => {
  it('creates a new form before any ID-based mutation', async () => {
    const form = blankForm(),
      { client, transport } = api(
        async (_path, _method, body) => ({ ...form, ...body, id: 42, draftRevision: 1 }) as FormDTO,
      ),
      controller = new DraftController(client, form);
    expect(controller.dirty()).toBe(true);
    await controller.save();
    expect(transport.mock.calls[0]?.[0]).toBe(config.restUrl + 'admin/forms');
    expect(transport.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(controller.state.form.id).toBe(42);
    expect(controller.dirty()).toBe(false);
  });
  it('does not erase edits typed during an in-flight save', async () => {
    const saved = deferred<FormDTO>(),
      form = stored(),
      { client } = api(async () => saved.promise),
      controller = new DraftController(client, form);
    controller.edit((f) => ({ ...f, title: 'First' }));
    const pending = controller.save();
    controller.edit((f) => ({ ...f, title: 'Second' }));
    saved.resolve({ ...form, title: 'First', draftRevision: 4 });
    await pending;
    expect(controller.state.form.title).toBe('Second');
    expect(controller.state.form.draftRevision).toBe(4);
    expect(controller.state.saved).toBe(editable({ ...form, title: 'First', draftRevision: 4 }));
    expect(controller.dirty()).toBe(true);
  });
  it('serializes saves and sends the latest optimistic revision', async () => {
    const first = deferred<FormDTO>(),
      form = stored(),
      calls: Record<string, unknown>[] = [];
    const { client } = api(async (_p, _m, body) => {
      calls.push(body);
      return calls.length === 1 ? first.promise : ({ ...form, ...body, draftRevision: 5 } as FormDTO);
    });
    const controller = new DraftController(client, form);
    controller.edit((f) => ({ ...f, title: 'First' }));
    const one = controller.save();
    controller.edit((f) => ({ ...f, title: 'Second' }));
    const two = controller.save();
    expect(calls).toHaveLength(1);
    first.resolve({ ...form, title: 'First', draftRevision: 4 });
    await Promise.all([one, two]);
    expect(calls[1]).toMatchObject({ title: 'Second', draftRevision: 4 });
    expect(controller.dirty()).toBe(false);
  });
  it('halts autosave at 409 and rebases only after an explicit action', async () => {
    const form = stored();
    let conflict = true;
    const { client, transport } = api(async (_p, method, body) => {
      if (method === 'GET') return { ...form, title: 'Remote', draftRevision: 9 };
      if (conflict) throw new ApiError('cff_revision_conflict', 'Conflict', 409, { draftRevision: 9 });
      return { ...form, ...body, draftRevision: 10 } as FormDTO;
    });
    const controller = new DraftController(client, form);
    controller.edit((f) => ({ ...f, title: 'Local' }));
    await expect(controller.save()).rejects.toMatchObject({ status: 409 });
    await expect(controller.save()).rejects.toMatchObject({ status: 409 });
    expect(transport).toHaveBeenCalledTimes(1);
    await controller.rebaseLocal();
    expect(controller.state.form.title).toBe('Local');
    expect(controller.state.form.draftRevision).toBe(9);
    expect(controller.state.conflict).toBeNull();
    conflict = false;
    await controller.save();
    expect(controller.dirty()).toBe(false);
  });
  it('reloads the server draft and clears history after explicit recovery', async () => {
    const form = stored(),
      { client } = api(async () => ({ ...form, title: 'Remote', draftRevision: 9 })),
      controller = new DraftController(client, form);
    controller.edit((f) => ({ ...f, title: 'Local' }));
    await controller.reload();
    expect(controller.state.form.title).toBe('Remote');
    expect(controller.state.history).toEqual([]);
    expect(controller.dirty()).toBe(false);
  });
  it('saves before publishing, deduplicates publish clicks and keeps live metadata through undo', async () => {
    const form = stored(),
      paths: string[] = [];
    const { client } = api(async (path, _m, body) => {
      paths.push(path);
      return path.endsWith('/publish')
        ? { ...form, title: 'New', version: 2, draftRevision: 5 }
        : ({ ...form, ...body, draftRevision: 4 } as FormDTO);
    });
    const controller = new DraftController(client, form);
    controller.edit((f) => ({ ...f, title: 'New' }));
    await Promise.all([controller.publish(), controller.publish()]);
    expect(paths).toEqual(['admin/forms/42', 'admin/forms/42/publish']);
    controller.undo();
    expect(controller.state.form).toMatchObject({
      title: form.title,
      version: 2,
      draftRevision: 5,
      status: 'publish',
      id: 42,
      slug: 'survey',
    });
    controller.redo();
    expect(controller.state.form.title).toBe('New');
  });
  it('reserves deleted keys and choice values for the editor lifetime', () => {
    const form = stored(),
      choice = makeStep('single_choice', form.schema.steps);
    form.schema.steps.push(choice);
    const { client } = api(async () => form),
      controller = new DraftController(client, form);
    controller.edit((f) => ({ ...f, schema: { ...f.schema, steps: [f.schema.steps[0]!] } }));
    expect(uniqueKey(choice.key, [], controller.reservedKeys())).not.toBe(choice.key);
    expect(controller.reservedOptionValues(choice.id)).toContain('option_1');
  });
  it('caps undo history and clears redo on an ordinary edit', () => {
    const { client } = api(async () => stored()),
      controller = new DraftController(client, stored());
    for (let i = 0; i < 55; i++) controller.edit((f) => ({ ...f, title: String(i) }));
    expect(controller.state.history).toHaveLength(50);
    controller.undo();
    expect(controller.state.future).toHaveLength(1);
    controller.edit((f) => ({ ...f, title: 'branch' }));
    expect(controller.state.future).toEqual([]);
  });
});
describe('form files and submission helpers', () => {
  it('exports disabled webhooks without secrets and never mutates the stored draft', () => {
    const form = stored();
    form.settings.integrations = {
      webhooks: [
        {
          id: 'hook',
          enabled: true,
          url: 'https://example.org/hook',
          events: ['completed'],
          secret: 'private-signing-value',
        },
      ],
    };
    const file = exportForm(form);
    expect(file.settings.integrations?.webhooks?.[0]).toMatchObject({ enabled: false, secret: '' });
    expect(form.settings.integrations?.webhooks?.[0]?.secret).toBe('private-signing-value');
    expect(parseFormFile(JSON.stringify(file))).toEqual(file);
    expect(file).not.toHaveProperty('id');
  });
  it('imports a valid form as an unpublished draft through the admin API', async () => {
    const original = stored();
    const file = exportForm(original);
    const { client, transport } = api(async (path, method, body) => {
      expect(path).toBe('admin/forms');
      expect(method).toBe('POST');
      expect(body).toEqual({
        title: original.title,
        schema: original.schema,
        settings: file.settings,
      });
      return { ...original, id: 123, status: 'draft', version: 0 };
    });
    const imported = await importForm(JSON.stringify(file), client);
    expect(imported).toMatchObject({ id: 123, status: 'draft', version: 0 });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('disables outbound webhooks and strips their secrets in untrusted files', async () => {
    const original = stored();
    original.settings.integrations = {
      webhooks: [{
        id: 'unsafe', enabled: true, url: 'https://example.org/webhook',
        events: ['completed'], secret: 'sensitive-signing-key',
      }],
    };
    const file = { format: 'chatflow/form', version: 1, title: original.title,
      schema: original.schema, settings: original.settings };
    const { client, transport } = api(async (_path, _method, body) => {
      expect((body.settings as typeof original.settings).integrations?.webhooks?.[0]).toMatchObject({
        secret: '', enabled: false,
      });
      return original;
    });
    await importForm(JSON.stringify(file), client);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(original.settings.integrations?.webhooks?.[0]?.secret).toBe('sensitive-signing-key');
  });
  it('rejects incompatible, oversized and malformed form imports before any API call', async () => {
    for (const text of ['null', '{}', '{', '{"format":"chatflow/form","version":2}'])
      expect(() => parseFormFile(text)).toThrow();
    expect(() => parseFormFile(' '.repeat(1048577))).toThrow('1 MiB');
    const { client, transport } = api(async () => stored());
    for (const json of ['null', '{}', '{', '{"format":"chatflow/form","version":2}'])
      await expect(importForm(json, client)).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
  it('preserves selected IDs, filter parity, columns, label headers and Indonesian delimiter', () => {
    const filters = {
        formId: 42,
        isRead: false,
        fieldKey: 'email',
        operator: 'contains',
        value: '@example.org',
        search: '',
      },
      ids = [2, 3],
      options = exportOptions(filters, ids, ['email', 'phone'], 'labels', ';');
    expect(options).toEqual({
      formId: 42,
      filters: { formId: 42, isRead: false, fieldKey: 'email', operator: 'contains', value: '@example.org' },
      ids: [2, 3],
      columns: ['email', 'phone'],
      headerStyle: 'labels',
      delimiter: ';',
      format: 'csv',
    });
    ids.push(4);
    expect(options.ids).toEqual([2, 3]);
  });
  it('renders answer objects, arrays and booleans as text, not trusted HTML', () => {
    expect(displayValue({ value: 'other', other: '<script>alert(1)</script>' })).toBe(
      'value: other, other: <script>alert(1)</script>',
    );
    expect(displayValue(['a', 'b', true])).toBe('a, b, true');
    expect(displayValue(null)).toBe('');
  });
});
