import type { AnswerMap, PublicForm, ReplayContext } from './types';
export interface SavedSession {
  formId: number; version: number; sessionId: string; resumeToken: string; expiresAt: string;
  revision: number; answers: AnswerMap; acknowledged: string[]; dirty: boolean; stepTimings: Record<string, number>;
  form?: PublicForm; context?: ReplayContext;
}
export class SessionStorage {
  constructor(private readonly store: Storage | undefined = safeLocalStorage(), private readonly doc: Pick<Document, 'cookie'> | undefined = globalThis.document, private readonly secure = globalThis.location?.protocol === 'https:', private readonly now = () => Date.now()) {}
  key(formId: number, version: number): string { return `cff:session:${formId}:${version}`; }
  read(formId: number): SavedSession | null {
    try {
      if (!this.store) return null;
      let latest: SavedSession | null = null;
      for (let i = this.store.length - 1; i >= 0; i--) {
        const key = this.store.key(i); if (!key?.startsWith(`cff:session:${formId}:`)) continue;
        const entry: unknown = JSON.parse(this.store.getItem(key) ?? 'null');
        if (!isSavedSession(entry) || entry.formId !== formId || Date.parse(entry.expiresAt) <= this.now()) { this.store.removeItem(key); continue; }
        if (!latest || entry.version > latest.version) latest = entry;
      }
      return latest;
    } catch { return null; }
  }
  credential(formId: number): string | null {
    const saved = this.read(formId); if (saved) return saved.resumeToken;
    try {
      const cookie = this.doc?.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(`cff_s_${formId}=`));
      const token = cookie ? decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)) : null;
      if (!token || !/^r1\.[A-Za-z0-9_-]+\.\d+\.[A-Za-z0-9_-]+$/.test(token)) return null;
      if (Number(token.split('.')[2]) * 1000 <= this.now()) { this.clear(formId); return null; }
      return token;
    } catch { return null; }
  }
  write(saved: SavedSession): boolean {
    if (Date.parse(saved.expiresAt) <= this.now()) { this.clear(saved.formId); return false; }
    let persisted = false;
    try { this.store?.setItem(this.key(saved.formId, saved.version), JSON.stringify(saved)); persisted = Boolean(this.store); } catch { /* Disabled or full storage. */ }
    try { if (this.doc) this.doc.cookie = `cff_s_${saved.formId}=${encodeURIComponent(saved.resumeToken)}; Path=/; Max-Age=${Math.max(0, Math.floor((Date.parse(saved.expiresAt) - this.now()) / 1000))}; SameSite=Lax${this.secure ? '; Secure' : ''}`; } catch { /* Server also sets this cookie. */ }
    return persisted;
  }
  clear(formId: number): void {
    try { if (this.store) for (let i = this.store.length - 1; i >= 0; i--) { const key = this.store.key(i); if (key?.startsWith(`cff:session:${formId}:`)) this.store.removeItem(key); } } catch { /* Storage disabled. */ }
    try { if (this.doc) this.doc.cookie = `cff_s_${formId}=; Path=/; Max-Age=0; SameSite=Lax${this.secure ? '; Secure' : ''}`; } catch { /* Cookies disabled. */ }
  }
}
export function safeLocalStorage(): Storage | undefined { try { return globalThis.localStorage; } catch { return undefined; } }
function isSavedSession(value: unknown): value is SavedSession {
  if (!value || typeof value !== 'object') return false; const v = value as SavedSession;
  return Number.isSafeInteger(v.formId) && Number.isSafeInteger(v.version) && typeof v.sessionId === 'string' && typeof v.resumeToken === 'string' && /^r1\.[A-Za-z0-9_-]+\.\d+\.[A-Za-z0-9_-]+$/.test(v.resumeToken) && typeof v.expiresAt === 'string' && Number.isFinite(Date.parse(v.expiresAt)) && Number.isSafeInteger(v.revision) && !!v.answers && typeof v.answers === 'object' && !Array.isArray(v.answers) && Array.isArray(v.acknowledged) && v.acknowledged.every(id => typeof id === 'string') && typeof v.dirty === 'boolean' && !!v.stepTimings && typeof v.stepTimings === 'object';
}
