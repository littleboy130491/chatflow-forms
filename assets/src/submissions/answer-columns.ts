import type { SubmissionDTO } from './model';
const fieldKey = /^[a-z][a-z0-9_]{0,63}$/;
export function answerKeys(rows: Pick<SubmissionDTO, 'answers'>[]): string[] {
  return [...new Set(rows.flatMap(row => Object.keys(row.answers).filter(key => fieldKey.test(key))))].slice(0, 500);
}
export function answerColumns(value: unknown, allowed: string[]): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((key): key is string => typeof key === 'string' && fieldKey.test(key) && allowed.includes(key)))].slice(0, 3) : [];
}
export function readAnswerColumns(storage: Storage, key: string): string[] | null {
  try { const value = storage.getItem(key); if (value === null || value.length > 1024) return null; const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string' && fieldKey.test(key)).slice(0, 3) : null; } catch { return null; }
}
