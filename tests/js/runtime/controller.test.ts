// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeController } from '../../../assets/src/runtime/controller';
import { ApiClient } from '../../../assets/src/runtime/api';
import { SessionStorage } from '../../../assets/src/runtime/persistence';
import { form, session } from './helpers';
import type { AnswerMap } from '../../../assets/src/runtime/types';

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
    return response(remote);
  });
  return { fetcher, api: new ApiClient('/cff/v1/', fetcher, async () => {}), setRemote: (answers: AnswerMap, revision: number) => { remote = session(answers, revision); }, deny: (mode: typeof deny) => { deny = mode; } };
}
describe('replay-driven visitor controller', () => {
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
