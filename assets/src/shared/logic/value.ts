import type { JSONValue, ValidationIssue } from '../contracts';

export const own = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);
export const map = (): Record<string, JSONValue> => Object.create(null) as Record<string, JSONValue>;
export const issue = (path: string, code: string, message: string, fieldKey?: string): ValidationIssue =>
  fieldKey === undefined ? { path, code, message } : { path, code, message, fieldKey };
export const pointer = (key: string): string => key.replace(/~/g, '~0').replace(/\//g, '~1');
export const empty = (v: unknown): boolean => v === null || v === undefined || v === '' ||
  (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && v !== null && Object.keys(v).length === 0);
export function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aa = a as Record<string, unknown>, bb = b as Record<string, unknown>;
  const keys = Object.keys(aa);
  return keys.length === Object.keys(bb).length && keys.every(k => own(bb, k) && equal(aa[k], bb[k]));
}
export const numeric = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function dateParts(v: unknown): [number, number, number] | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split('-').map(Number) as [number, number, number];
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= (days[m - 1] ?? 0) ? [y, m, d] : null;
}
export function age(v: unknown, now?: string): number | null {
  const born = dateParts(v);
  if (!now || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?Z$/.test(now)) return null;
  const today = dateParts(now.slice(0, 10));
  if (!born || !today || (v as string) > now.slice(0, 10)) return null;
  return today[0] - born[0] - (today[1] * 100 + today[2] < born[1] * 100 + born[2] ? 1 : 0);
}

// A bounded portable subset, deliberately excluding backtracking groups/alternation.
export function regex(pattern: unknown): RegExp | null {
  if (typeof pattern !== 'string' || pattern.length > 512 || /[^\x20-\x7e]/.test(pattern)) return null;
  if (/[()|]/.test(pattern) || /\\(?![dDwWsnrt\\.[\]{}^$*+?\-/])/.test(pattern)) return null;
  if (/(?:[*+?]|\{\d+(?:,\d*)?\})\s*(?:[*+?]|\{)/.test(pattern)) return null;
  const repeats = pattern.match(/[*+]|\{\d+,\}/g) ?? [];
  if (repeats.length > 1 || (repeats.length && !(pattern.startsWith('^') && pattern.endsWith('$')))) return null;
  if ([...pattern.matchAll(/\{(\d+)(?:,(\d+))?\}/g)].some(m => Number(m[1]) > 1000 || Number(m[2] ?? 0) > 1000)) return null;
  try { return new RegExp(pattern.replace(/\\s/g, '[ \\t\\r\\n\\f\\v]').replace(/\\S/g, '[^ \\t\\r\\n\\f\\v]'), 'u'); }
  catch { return null; }
}
export const matches = (v: unknown, pattern: unknown): boolean => typeof v === 'string' &&
  [...v].length <= 4096 && (regex(pattern)?.test(v) ?? false);
