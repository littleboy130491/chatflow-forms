import type { AnswerMap, Completion, PublicForm, Session } from './types';
import type { ClientMeta } from '../tracking';

export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status: number, public readonly retryAfter = 0, public readonly issues: { fieldKey?: string; code?: string; message?: string }[] = []) { super(code); }
}
export function uuid(): string {
  if ('randomUUID' in globalThis.crypto) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 15) | 64; bytes[8] = (bytes[8]! & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export class ApiClient {
  private readonly base: URL;
  constructor(restUrl: string, private readonly fetcher: typeof fetch = fetch, private readonly pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms))) {
    this.base = new URL(restUrl, globalThis.location?.href ?? 'https://localhost/');
    if (!['https:', 'http:'].includes(this.base.protocol) || this.base.username || this.base.password || this.base.hash) throw new ApiError('cff_unsafe_endpoint', 0);
    if ([...this.base.searchParams.keys()].some(key => key !== 'rest_route')) throw new ApiError('cff_unsafe_endpoint', 0);
    if (globalThis.location && this.base.origin !== location.origin) throw new ApiError('cff_unsafe_endpoint', 0);
    if (!this.base.searchParams.has('rest_route') && !this.base.pathname.endsWith('/')) this.base.pathname += '/';
  }
  private url(path: string, version?: number): string {
    const url = new URL(this.base);
    if (url.searchParams.has('rest_route')) url.searchParams.set('rest_route', url.searchParams.get('rest_route')!.replace(/\/$/, '') + '/' + path);
    else url.pathname += path;
    if (version !== undefined) url.searchParams.set('version', String(version));
    return url.href;
  }
  async request<T>(path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}, cache: 'default' | 'no-store' = 'no-store', version?: number): Promise<T> {
    const encoded = body === undefined ? undefined : JSON.stringify(body);
    for (let attempt = 0; attempt < 3; attempt++) {
      const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 15000);
      let response: Response;
      try {
        response = await this.fetcher(this.url(path, version), { method, headers: { Accept: 'application/json', ...(encoded ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(encoded ? { body: encoded } : {}), credentials: 'same-origin', cache, redirect: 'error', signal: abort.signal });
      } catch {
        clearTimeout(timer);
        if (attempt === 2 || globalThis.navigator?.onLine === false) throw new ApiError('cff_network', 0);
        await this.pause(500 * 2 ** attempt); continue;
      }
      clearTimeout(timer);
      let data: unknown;
      try { data = await response.json(); } catch { throw new ApiError('cff_invalid_response', response.status); }
      if (response.ok) return data as T;
      const error = (data && typeof data === 'object' ? data : {}) as { code?: string; data?: { retryAfter?: number; errors?: ApiError['issues'] } };
      const retryAfter = Math.max(0, Number(error.data?.retryAfter ?? response.headers.get('Retry-After') ?? 0) || 0);
      const code = typeof error.code === 'string' ? error.code : 'cff_request_failed';
      const retryable = response.status >= 500 || response.status === 429 || code === 'cff_request_pending' || code === 'cff_idempotency_pending';
      if (retryable && attempt < 2 && retryAfter <= 30) { await this.pause(Math.max(retryAfter * 1000, 500 * 2 ** attempt)); continue; }
      throw new ApiError(code, response.status, retryAfter, Array.isArray(error.data?.errors) ? error.data.errors : []);
    }
    throw new ApiError('cff_network', 0);
  }
  form(id: number, version?: number): Promise<PublicForm> { return this.request(`forms/${id}`, 'GET', undefined, {}, 'default', version); }
  startToken(id: number, version: number): Promise<{ startToken: string; expiresAt: string; version: number }> { return this.request(`forms/${id}/start-token`, 'POST', { version }); }
  start(formId: number, version: number, meta: ClientMeta, prefill: AnswerMap, token: string, key: string): Promise<Session> { return this.request('sessions', 'POST', { formId, version, meta, prefill }, { 'X-CFF-Start-Token': token, 'Idempotency-Key': key }); }
  resume(formId: number, token: string): Promise<Session> { return this.request('sessions/resume', 'POST', { formId }, { 'X-CFF-Resume-Token': token }); }
  get(session: Session): Promise<Session> {
    if (!/^[a-f0-9-]{36}$/i.test(session.sessionId)) throw new ApiError('cff_invalid_session', 0);
    return this.request(`sessions/${session.sessionId}`, 'GET', undefined, { 'X-CFF-Request-Token': session.requestToken });
  }
  mutate<T = Session>(session: Session, method: 'PATCH' | 'DELETE' | 'POST', body: unknown, key: string): Promise<T> {
    if (!/^[a-f0-9-]{36}$/i.test(session.sessionId)) throw new ApiError('cff_invalid_session', 0);
    return this.request(`sessions/${session.sessionId}${method === 'POST' ? '/submit' : ''}`, method, body, { 'X-CFF-Request-Token': session.requestToken, 'Idempotency-Key': key });
  }
  submit(session: Session, body: unknown, key: string): Promise<Completion> { return this.mutate(session, 'POST', body, key); }
}
