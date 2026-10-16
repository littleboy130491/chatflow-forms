// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeController } from '../../../assets/src/runtime/controller';
import { ApiClient } from '../../../assets/src/runtime/api';
import { SessionStorage } from '../../../assets/src/runtime/persistence';
import { form, session } from './helpers';
import type { AnswerMap } from '../../../assets/src/runtime/types';
import type { FormSchema } from '../../../assets/src/shared/contracts';
import { applyVariant } from '../../../assets/src/shared/logic/power';
import powerFixture from '../../fixtures/logic/power-variant-order.json';

beforeEach(() => { localStorage.clear(); document.cookie = 'cff_s_42=; Path=/; Max-Age=0'; });
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
function server() {
  let remote = session(); let deny: 'none' | 'network' | 'conflict' = 'none';
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    if (deny === 'network') throw new TypeError('offline');
    const path = String(input); const body = init?.body ? JSON.parse(String(init.body)) as { answers?: AnswerMap; revision?: number } : {};
    if (path.endsWith('/start-token')) return response({ version: 1, startToken: 'test-start', expiresAt: '2099-01-01T00:00:00Z' });
    if (path.endsWith('/sessions')) { remote = session(); return response(remote); }
    if (path.endsWith('/sessions/resume')) return response(remote);
    if (path.endsWith('/forms/42')) return response(form());
    if (path.endsWith('/submit')) return response({ submission: { uuid: 'public-submission', status: 'completed' }, ending: { id: 'thanks', type: 'message', messages: ['Thanks'], buttons: [] } });
    if (init?.method === 'DELETE') return response({ closed: true });
    if (init?.method === 'PATCH') {
      if (deny === 'conflict') return response({ code: 'cff_revision_conflict', data: { revision: remote.revision } }, 409);
      remote = { ...remote, revision: remote.revision + 1, answers: body.answers ?? {} };
    }
    const envelope = { ...remote }; delete envelope.resumeToken; delete envelope.resumeExpiresAt;
    return response(envelope);
  });
  return { fetcher, api: new ApiClient('/cff/v1/', fetcher, async () => {}), setRemote: (answers: AnswerMap, revision: number) => { remote = session(answers, revision); }, deny: (mode: typeof deny) => { deny = mode; } };
}
describe('replay-driven visitor controller', () => {
  it('keeps the credential from a magic link so a reload resumes the same session', async () => {
    const network = server();
    const storage = new SessionStorage(localStorage);
    network.fetcher.mockImplementationOnce(async () => response(form()));
    history.replaceState(null, '', '/page#cff-magic=' + 'a'.repeat(43));
    const magic = vi.spyOn(network.api, 'magicResume').mockResolvedValue(session({ name: 'Ada' }, 3));
    const controller = new RuntimeController({ formId: 42 }, network.api, storage);
    await controller.initialize();
    expect(magic).toHaveBeenCalledOnce();
    expect(location.hash).toBe('');
    expect(storage.credential(42)).toBe(session().resumeToken);
  });
  it('keeps the visitor on review after a failed captcha and submits on retry', async () => {
    const network = server(); const base = network.fetcher.getMockImplementation()!;
    network.fetcher.mockImplementation(async (input, init) => String(input).includes('/engagement') ? response({ captcha: { provider: 'turnstile', siteKey: 'public-key' }, analytics: { enabled: false, consentRequired: true, respectDnt: true } }) : base(input, init));
    const envelope = form(); envelope.features.engagement = true;
    const captcha = vi.fn().mockRejectedValueOnce(new Error('captchaUnavailable')).mockResolvedValueOnce('captcha-token');
    const controller = new RuntimeController({ form: envelope, captcha }, network.api, new SessionStorage(localStorage));
    await controller.initialize(); await controller.answer(null); await controller.answer('Ada'); await controller.answer(null);
    await controller.submit();
    expect(controller.state.phase).toBe('ready'); expect(controller.state.error).toBe('captchaFailed');
    await controller.retry();
    expect(controller.state.phase).toBe('done');
    const submitted = network.fetcher.mock.calls.find(([url]) => String(url).endsWith('/submit'));
    expect(JSON.parse(String(submitted?.[1]?.body))).toMatchObject({ captchaToken: 'captcha-token' });
  });
  it('drops timings of steps left behind by an edited branch so saves keep working', async () => {
    const network = server();
    const branching = form([
      { id: 'route', key: 'route', type: 'yes_no', label: 'Route', messages: ['Route?'], logic: [{ if: { field: 'route', op: 'eq', value: false }, then: { action: 'jump', to: 'other' } }] },
      { id: 'name', key: 'name', type: 'short_text', label: 'Name', messages: ['Name?'], logic: [{ if: { all: [] }, then: { action: 'jump', to: 'review' } }] },
      { id: 'other', key: 'other', type: 'short_text', label: 'Other', messages: ['Other?'] },
      { id: 'review', key: 'review', type: 'summary', label: 'Review', messages: ['Check'] },
    ]);
    const controller = new RuntimeController({ form: branching }, network.api, new SessionStorage(localStorage));
    await controller.initialize();
    await controller.answer(true); await controller.answer('Ada');
    controller.edit('route'); await controller.answer(false);
    await controller.flush();
    const patches = network.fetcher.mock.calls.filter(([, init]) => init?.method === 'PATCH');
    const last = JSON.parse(String(patches.at(-1)?.[1]?.body)) as { stepTimings: Record<string, number> };
    expect(Object.keys(last.stepTimings)).not.toContain('name');
    expect(Object.keys(last.stepTimings)).toContain('route');
  });
  it('recomputes the shared score/outcome fixture on edit and submits without supplying computed answers', async () => {
    const original = powerFixture.schema as unknown as FormSchema;
    const schema = applyVariant(original, original.experiments![0]!.variants[1]!);
    const envelope = form(); envelope.form.schema = schema;
    const controller = new RuntimeController({ form: envelope, preview: true }, null);
    await controller.initialize();
    expect(controller.state.activeId).toBe('age');
    await controller.answer(20); await controller.answer(4);
    expect(controller.state.answers.bonus).toBe(13);
    expect(controller.state.path?.variables.score).toBe(5);
    expect(controller.state.path?.endingId).toBe('vip');
    await controller.answer(null);
    expect(controller.state.activeId).toBe('review');
    controller.edit('bonus');
    expect(controller.state.activeId).toBe('review');
    controller.edit('amount'); await controller.answer(1);
    expect(controller.state.answers.bonus).toBe(4);
    expect(controller.state.path?.variables.score).toBe(2);
    await controller.answer(null); await controller.answer(null);
    await controller.submit();
    expect(controller.state.phase).toBe('done');
    expect(controller.state.completion?.ending.id).toBe('done');
  });
  it('renders the server-frozen variant order and copy instead of the cached public schema', async () => {
    const publicForm = form([
      { id: 'intro', key: 'intro', type: 'statement', label: 'Intro', messages: ['Welcome'] },
      { id: 'first', key: 'first', type: 'short_text', label: 'First', messages: ['First?'] },
      { id: 'second', key: 'second', type: 'short_text', label: 'Second', messages: ['Second?'] },
      { id: 'review', key: 'review', type: 'summary', label: 'Review', messages: ['Review'] },
    ]);
    const schema = { ...publicForm.form.schema, steps: [
      publicForm.form.schema.steps[0]!,
      { ...publicForm.form.schema.steps[2]!, messages: ['Variant second?'] },
      publicForm.form.schema.steps[1]!, publicForm.form.schema.steps[3]!,
    ] } as typeof publicForm.form.schema;
    const assigned = { ...session(), schema, variantId: 'order:b' };
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async input => {
      if (String(input).endsWith('/start-token')) return response({ version: 1, startToken: 'test-start', expiresAt: '2099-01-01T00:00:00Z' });
      return response(assigned);
    });
    const controller = new RuntimeController({ form: publicForm }, new ApiClient('/cff/v1/', fetcher));
    await controller.initialize();
    expect(controller.state.form?.form.schema.steps.map(s => s.id)).toEqual(['intro', 'second', 'first', 'review']);
    expect(controller.state.form?.form.schema.steps[1]?.messages).toEqual(['Variant second?']);
    await controller.answer(null);
    expect(controller.state.activeId).toBe('second');
    expect(controller.state.path?.visited).toContain('second');
  });
  it('clears expired resume data without rewriting credentials from the stale in-memory session', async () => {
    const network = server(); const controller = new RuntimeController({ form: form() }, network.api);
    await controller.initialize(); await controller.answer(null); expect(localStorage.length).toBe(1);
    network.fetcher.mockImplementation(async () => response({ code: 'cff_invalid_credential' }, 401)); await controller.answer('Ada');
    expect(controller.state.error).toBe('expired'); expect(localStorage.length).toBe(0); expect(document.cookie).not.toContain('cff_s_42');
  });
  it('passes all v1 answer types and summary through the actual shared replay', async () => {
    const inputs: [import('../../../assets/src/runtime/types').Step['type'], import('../../../assets/src/runtime/types').AnswerMap[string]][] = [
      ['short_text', 'Ada'], ['long_text', 'Line one\nLine two'], ['email', 'ada@example.test'], ['phone', '+6281234567890'], ['number', 12], ['date', '2000-01-01'], ['single_choice', 'a'], ['multi_choice', ['a']], ['yes_no', false], ['consent', true],
    ];
    const steps = inputs.map(([type], i) => ({ id: `step-${i}`, key: `field_${i}`, type, messages: [], label: type, required: true, ...(['single_choice', 'multi_choice'].includes(type) ? { options: [{ id: `option-${i}`, value: 'a', label: 'A' }] } : {}) }));
    const envelope = form([{ id: 'hidden', key: 'hidden', type: 'hidden', label: 'Hidden', messages: [], settings: { source: 'default' }, defaultValue: 'trusted' }, ...steps, { id: 'review', key: 'review', type: 'summary', label: 'Review', messages: [] }]);
    const controller = new RuntimeController({ form: envelope, preview: true }, null); await controller.initialize();
    for (const [, value] of inputs) { await controller.answer(value); expect(controller.state.fieldError).toBeNull(); }
    expect(controller.state.activeId).toBe('review'); expect(controller.state.answers.hidden).toBe('trusted'); expect(controller.state.path?.progress).toBe(100);
    await controller.answer(null); await controller.submit(); expect(controller.state.phase).toBe('done');
  });
  it('validates, sanitizes and replays the canonical Other object through actual shared logic', async () => {
    const envelope = form([{ id: 'choice', key: 'choice', type: 'single_choice', required: true, label: 'Choice', messages: [], options: [{ id: 'normal', value: 'normal', label: 'Normal' }, { id: 'other', value: 'other', label: 'Other', isOther: true }] }, { id: 'summary', key: 'summary', type: 'summary', label: 'Summary', messages: [] }]);
    const controller = new RuntimeController({ form: envelope, preview: true }, null); await controller.initialize();
    await controller.answer({ value: 'normal', other: 'Injected' }); expect(controller.state.activeId).toBe('choice'); expect(controller.state.fieldError).toBe('invalid');
    await controller.answer({ value: 'other', other: '' }); expect(controller.state.activeId).toBe('choice'); expect(controller.state.fieldError).toBe('invalid');
    await controller.answer({ value: 'other', other: '<b>Custom response</b>' }); expect(controller.state.fieldError).toBeNull(); expect(controller.state.answers.choice).toEqual({ value: 'other', other: 'Custom response' }); expect(controller.state.activeId).toBe('summary');
    await controller.answer(null); await controller.submit(); expect(controller.state.phase).toBe('done');
  });
  it('keeps durable resume credentials after PATCH envelopes omit them, including later offline edits', async () => {
    const network = server(); const controller = new RuntimeController({ form: form() }, network.api);
    await controller.initialize(); await controller.answer(null); await controller.answer('Ada');
    expect(JSON.parse(localStorage.getItem('cff:session:42:1') ?? '{}').answers).toEqual({ name: 'Ada' });
    controller.edit('name'); controller.setOffline(true); await controller.answer('Local edit');
    const saved = JSON.parse(localStorage.getItem('cff:session:42:1') ?? '{}'); expect(saved.answers).toEqual({ name: 'Local edit' }); expect(saved.resumeToken).toBe(session().resumeToken); expect(saved.revision).toBe(2);
  });
  it('does not create a session after unmount while a start-token request is still in flight', async () => {
    let release!: (response: Response) => void;
    const pending = new Promise<Response>(resolve => { release = resolve; });
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => pending);
    const controller = new RuntimeController({ form: form() }, new ApiClient('/cff/v1/', fetcher));
    const initialized = controller.initialize(); await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1)); controller.dispose(); release(response({ version: 1, startToken: 'test-start' })); await initialized;
    expect(fetcher).toHaveBeenCalledTimes(1); expect(localStorage.length).toBe(0);
  });
  it('never PATCHes when partial saving is disabled, but submits confirmed answers', async () => {
    const network = server(); const envelope = form(); envelope.form.session.savePartial = false;
    const controller = new RuntimeController({ form: envelope }, network.api);
    await controller.initialize(); await controller.answer(null); await controller.answer('Ada'); await controller.answer(null); await controller.flush();
    expect(network.fetcher.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false); await controller.submit(); expect(controller.state.phase).toBe('done');
    expect(JSON.parse(String(network.fetcher.mock.calls.at(-1)?.[1]?.body)).answers).toEqual({ name: 'Ada' });
  });
  it('renews expired/rejected request tokens without changing the mutation body or key', async () => {
    const remote = session(); remote.requestExpiresAt = '2000-01-01T00:00:00Z'; let patches = 0;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      if (String(input).endsWith('/start-token')) return response({ version: 1, startToken: 'test-start' });
      if (String(input).endsWith('/sessions')) return response(remote);
      if (String(input).endsWith('/sessions/resume')) return response({ ...remote, requestExpiresAt: '2099-01-01T00:00:00Z', requestToken: 'renewed' });
      if (init?.method === 'PATCH' && patches++ === 0) return response({ code: 'cff_request_expired' }, 401);
      return response({ ...remote, revision: 2, requestExpiresAt: '2099-01-01T00:00:00Z', answers: { name: 'Ada' } });
    });
    const controller = new RuntimeController({ form: form() }, new ApiClient('/cff/v1/', fetcher));
    await controller.initialize(); await controller.answer(null); await controller.answer('Ada');
    const requests = fetcher.mock.calls.filter(([, init]) => init?.method === 'PATCH');
    expect(requests).toHaveLength(2); expect(requests[0]?.[1]?.headers).toMatchObject({ 'X-CFF-Request-Token': 'renewed' }); expect(requests[0]?.[1]?.body).toBe(requests[1]?.[1]?.body); expect(requests[0]?.[1]?.headers).toEqual(requests[1]?.[1]?.headers);
  });
  it('previews statements, inputs, summary and endings without API/storage/events', async () => {
    const network = server(); const storage = new SessionStorage(); const writes = vi.spyOn(storage, 'write'); const clear = vi.spyOn(storage, 'clear'); const emit = vi.fn();
    const controller = new RuntimeController({ form: form(), preview: true, prefill: { name: 'Prefilled' } }, network.api, storage, emit);
    await controller.initialize(); expect(controller.state.activeId).toBe('intro');
    await controller.answer(null); expect(controller.state.activeId).toBe('name'); expect(controller.inputValue(controller.activeStep!)).toBe('Prefilled');
    await controller.answer(''); expect(controller.state.fieldError).toBe('required');
    await controller.answer(' Ada '); expect(controller.state.activeId).toBe('review'); expect(controller.state.answers).toEqual({ name: 'Ada' });
    await controller.answer(null); expect(controller.state.activeId).toBeNull(); await controller.submit(); expect(controller.state.phase).toBe('done');
    await controller.restart(); expect(controller.state.activeId).toBe('intro');
    expect(network.fetcher).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled(); expect(clear).not.toHaveBeenCalled(); expect(emit).not.toHaveBeenCalled();
  });
  it('rewinds through branches, prunes unreachable answers, protects hidden values and detects loops', async () => {
    const envelope = form([
      { id: 'hidden', key: 'server', type: 'hidden', messages: [], label: 'Hidden' },
      { id: 'choice', key: 'choice', type: 'yes_no', messages: [], label: 'Choice', required: true, logic: [{ if: { field: 'choice', op: 'eq', value: false }, then: { action: 'jump', to: 'review' } }] },
      { id: 'detail', key: 'detail', type: 'long_text', messages: [], label: 'Detail', required: true },
      { id: 'review', key: 'review', type: 'summary', messages: [], label: 'Review' },
    ]);
    const controller = new RuntimeController({ form: envelope, preview: true, context: { hidden: { server: 'trusted' } } }, null);
    await controller.initialize(); await controller.answer(true); await controller.answer('kept'); expect(controller.state.answers).toEqual({ server: 'trusted', choice: true, detail: 'kept' });
    controller.back(); expect(controller.state.activeId).toBe('detail'); controller.edit('choice'); await controller.answer(false);
    expect(controller.state.answers).toEqual({ server: 'trusted', choice: false }); expect(controller.state.path?.visited).not.toContain('detail');
    controller.edit('hidden'); expect(controller.state.activeId).toBe('review');
    const loop = form([{ id: 'cycle', key: 'cycle', type: 'statement', messages: [], label: 'Cycle', logic: [{ if: { all: [] }, then: { action: 'jump', to: 'cycle' } }] }]);
    const invalid = new RuntimeController({ form: loop, preview: true }, null); await invalid.initialize(); expect(invalid.state.phase).toBe('error'); expect(invalid.state.path?.errors.some(e => e.code === 'cff_logic_loop')).toBe(true);
  });
  it('starts, saves, completes, clears persistence and emits only public identifiers', async () => {
    const network = server(); const emit = vi.fn(); const controller = new RuntimeController({ form: form(), formId: 42 }, network.api, undefined, emit);
    await controller.initialize(); await controller.answer(null); await controller.answer('Ada'); await controller.answer(null); await controller.submit();
    expect(controller.state.phase).toBe('done'); expect(localStorage.length).toBe(0);
    expect(network.fetcher.mock.calls.map(([, init]) => init?.method)).toEqual(['POST', 'POST', 'PATCH', 'POST']);
    expect(JSON.stringify(emit.mock.calls)).not.toMatch(/Ada|test-request|signature|answers/); expect(emit.mock.calls.map(([name]) => name)).toContain('cff:complete');
  });
  it('continues pinned versions and presents a prompt rather than reinterpreting old answers', async () => {
    const latest = form(); latest.form.version = 2;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async input => response(String(input).includes('?version=1') ? form() : session({ name: 'Saved' }, 2)));
    const storage = new SessionStorage(); const saved = session({ name: 'Saved' }, 2);
    storage.write({ formId: 42, version: 1, sessionId: saved.sessionId, revision: 2, answers: saved.answers, resumeToken: saved.resumeToken!, expiresAt: saved.resumeExpiresAt!, acknowledged: ['intro'], dirty: false, stepTimings: {} });
    const controller = new RuntimeController({ form: latest }, new ApiClient('/cff/v1/', fetcher));
    await controller.initialize(); expect(controller.state.phase).toBe('resume'); expect(controller.state.newerVersion).toBe(true); expect(controller.state.form?.form.version).toBe(1); expect(controller.state.answers).toEqual({ name: 'Saved' }); expect(String(fetcher.mock.calls[1]?.[0])).toContain('?version=1');
  });
  it('retains offline edits, surfaces revision conflicts and saves chosen local answers against the new revision', async () => {
    const network = server(); const controller = new RuntimeController({ form: form() }, network.api);
    await controller.initialize(); await controller.answer(null); controller.setOffline(true); await controller.answer('Local');
    expect(controller.state.dirty).toBe(true); expect(JSON.parse(localStorage.getItem('cff:session:42:1') ?? '{}').answers).toEqual({ name: 'Local' }); expect(network.fetcher).toHaveBeenCalledTimes(2);
    network.deny('conflict'); controller.setOffline(false); await vi.waitFor(() => expect(controller.state.conflict).toBe(true));
    network.setRemote({ name: 'Remote' }, 5); network.deny('none'); await controller.resolveConflict(true);
    expect(controller.state.conflict).toBe(false); expect(controller.state.dirty).toBe(false); expect(controller.state.answers).toEqual({ name: 'Local' });
    const patch = network.fetcher.mock.calls.filter(([, init]) => init?.method === 'PATCH').at(-1);
    expect(JSON.parse(String(patch?.[1]?.body)).revision).toBe(5);
  });
  it('restores cached offline answers and authenticates before flushing after reconnection', async () => {
    const network = server(); const first = new RuntimeController({ form: form() }, network.api);
    await first.initialize(); await first.answer(null); first.setOffline(true); await first.answer('Offline'); first.dispose();
    network.deny('network'); const controller = new RuntimeController({ formId: 42 }, network.api); await controller.initialize();
    expect(controller.state.phase).toBe('resume'); expect(controller.state.offline).toBe(true); await controller.continueSaved(); expect(controller.state.answers).toEqual({ name: 'Offline' });
    network.deny('none'); controller.setOffline(false); await vi.waitFor(() => expect(controller.state.dirty).toBe(false)); expect(controller.state.answers).toEqual({ name: 'Offline' });
  });
  it('uses the same submit key/body after an uncertain result and blocks duplicate start-over', async () => {
    const network = server(); const controller = new RuntimeController({ form: form() }, network.api);
    await controller.initialize(); await controller.answer(null); await controller.answer('Ada'); await controller.answer(null);
    network.deny('network'); await controller.submit(''); expect(controller.state.error).toBe('submissionPending');
    const failed = network.fetcher.mock.calls.filter(([url]) => String(url).endsWith('/submit'));
    await controller.restart(); controller.prefillAnswers({ name: 'Changed' }); controller.edit('name');
    network.deny('none'); await controller.retry(); const successful = network.fetcher.mock.calls.filter(([url]) => String(url).endsWith('/submit')).at(-1);
    expect(successful?.[1]?.body).toBe(failed[0]?.[1]?.body); expect(successful?.[1]?.headers).toEqual(failed[0]?.[1]?.headers); expect(controller.state.phase).toBe('done');
  });
  it('start-over closes the old session and obtains a fresh start token/session', async () => {
    const network = server(); const controller = new RuntimeController({ form: form() }, network.api);
    await controller.initialize(); await controller.answer(null); await controller.answer('Ada'); await controller.restart();
    expect(controller.state.answers).toEqual({}); expect(controller.state.activeId).toBe('intro');
    const operations = network.fetcher.mock.calls.map(([url, init]) => `${init?.method} ${new URL(String(url)).pathname}`);
    expect(operations.slice(-4)).toEqual([`DELETE /cff/v1/sessions/${session().sessionId}`, 'GET /cff/v1/forms/42', 'POST /cff/v1/forms/42/start-token', 'POST /cff/v1/sessions']);
  });
});
