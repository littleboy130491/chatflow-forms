import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, uuid } from '../../../assets/src/runtime/api';
import type { Session } from '../../../assets/src/runtime/types';

const session: Session = { sessionId: '12345678-1234-4234-8234-123456789abc', formId: 42, version: 2, revision: 1, status: 'active', answers: {}, visited: [], currentStepId: null, progress: 0, requestToken: 'request-test', requestExpiresAt: '2099-01-01T00:00:00Z', context: { now: '2026-10-13T00:00:00Z' } };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
describe('session API', () => {
  it('supports WordPress plain-permalink REST endpoints without exposing credentials in route/query', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json(session)); const api = new ApiClient('https://localhost/?rest_route=/cff/v1/', fetcher);
    await api.form(42, 2); await api.submit(session, {}, 'submit-key');
    const first = new URL(String(fetcher.mock.calls[0]?.[0])); expect(first.searchParams.get('rest_route')).toBe('/cff/v1/forms/42'); expect(first.searchParams.get('version')).toBe('2');
    expect(new URL(String(fetcher.mock.calls[1]?.[0])).searchParams.get('rest_route')).toBe(`/cff/v1/sessions/${session.sessionId}/submit`); expect(String(fetcher.mock.calls[1]?.[0])).not.toContain('request-test');
  });
  it('retries non-JSON proxy failures but never parses or displays their raw body', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('<html>private proxy error</html>', { status: 503 })).mockResolvedValueOnce(new Response('busy', { status: 429, headers: { 'Retry-After': '1' } })).mockResolvedValueOnce(json(session));
    const pause = vi.fn().mockResolvedValue(undefined); const api = new ApiClient('https://localhost/api/', fetcher, pause); await api.mutate(session, 'PATCH', {}, 'same-key');
    expect(fetcher).toHaveBeenCalledTimes(3); expect(pause.mock.calls).toEqual([[500], [1000]]); expect(fetcher.mock.calls[0]?.[1]?.body).toBe(fetcher.mock.calls[2]?.[1]?.body);
  });
  it('uses the exact handshake, credential headers, optimistic body and pinned schema query', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json(session));
    const api = new ApiClient('https://localhost/wp-json/cff/v1/', fetcher);
    await api.form(42, 2); await api.startToken(42, 2); await api.start(42, 2, {}, {}, 'start-test', 'create-key'); await api.resume(42, 'resume-test'); await api.get(session);
    await api.mutate(session, 'PATCH', { version: 2, revision: 1, answers: { name: 'A' } }, 'patch-key'); await api.submit(session, { version: 2, revision: 1, answers: {}, honeypot: '' }, 'submit-key'); await api.mutate(session, 'DELETE', { version: 2, revision: 1 }, 'delete-key');
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://localhost/wp-json/cff/v1/forms/42?version=2');
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', body: '{"version":2}' });
    expect(fetcher.mock.calls[2]?.[1]?.headers).toMatchObject({ 'X-CFF-Start-Token': 'start-test', 'Idempotency-Key': 'create-key' });
    expect(fetcher.mock.calls[3]?.[1]?.headers).toMatchObject({ 'X-CFF-Resume-Token': 'resume-test' });
    expect(fetcher.mock.calls[5]?.[1]).toMatchObject({ method: 'PATCH', body: '{"version":2,"revision":1,"answers":{"name":"A"}}', credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    expect(fetcher.mock.calls[6]?.[0]).toBe(`https://localhost/wp-json/cff/v1/sessions/${session.sessionId}/submit`);
    expect(fetcher.mock.calls[7]?.[1]?.method).toBe('DELETE');
    for (const [url] of fetcher.mock.calls) expect(String(url)).not.toMatch(/request-test|resume-test|start-test/);
  });
  it('supports WordPress plain permalinks without leaking tokens into queries', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({}));
    await new ApiClient('https://localhost/?rest_route=/cff/v1/', fetcher).form(42, 2);
    const url = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(url.searchParams.get('rest_route')).toBe('/cff/v1/forms/42'); expect(url.searchParams.get('version')).toBe('2');
  });
  it('retries ambiguous writes with identical bytes and idempotency keys', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('disconnected')).mockResolvedValueOnce(json({ code: 'cff_idempotency_pending', data: { retryAfter: 1 } }, 409)).mockResolvedValueOnce(json({ submission: { status: 'completed' } }));
    const pause = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue();
    await new ApiClient('https://localhost/cff/v1/', fetcher, pause).submit(session, { version: 2, revision: 1, answers: { name: 'Ada' }, honeypot: '' }, 'same-key');
    expect(fetcher).toHaveBeenCalledTimes(3);
    for (const [, init] of fetcher.mock.calls) { expect(init?.body).toBe(fetcher.mock.calls[0]?.[1]?.body); expect(init?.headers).toMatchObject({ 'Idempotency-Key': 'same-key', 'X-CFF-Request-Token': 'request-test' }); }
    expect(pause.mock.calls).toEqual([[500], [1000]]);
  });
  it('bounds retries and never retries deterministic conflicts/validation', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ code: 'cff_revision_conflict', message: 'secret raw message', data: { revision: 2 } }, 409));
    const api = new ApiClient('https://localhost/', fetcher, async () => {});
    await expect(api.submit(session, {}, uuid())).rejects.toMatchObject({ code: 'cff_revision_conflict', status: 409, message: 'cff_revision_conflict' }); expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher.mockClear().mockRejectedValue(new TypeError());
    await expect(api.submit(session, {}, uuid())).rejects.toMatchObject({ code: 'cff_network', status: 0 }); expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('rejects unsafe endpoints and locators and produces UUID keys', () => {
    for (const url of ['javascript:alert(1)', 'https://user:pass@localhost/api/', 'https://localhost/api/#credential', 'https://localhost/api/?token=secret']) expect(() => new ApiClient(url)).toThrow(ApiError);
    const api = new ApiClient('https://localhost/api/');
    expect(() => api.get({ ...session, sessionId: '../token' })).toThrow(ApiError);
    expect(uuid()).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  });
});
