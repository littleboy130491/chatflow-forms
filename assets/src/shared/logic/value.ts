import type { ChoiceOtherAnswer, JSONValue, ValidationIssue } from '../contracts';

export const own = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);
export const map = (): Record<string, JSONValue> => Object.create(null) as Record<string, JSONValue>;
export const issue = (path: string, code: string, message: string, fieldKey?: string): ValidationIssue =>
  fieldKey === undefined ? { path, code, message } : { path, code, message, fieldKey };
export const pointer = (key: string): string => key.replace(/~/g, '~0').replace(/\//g, '~1');
export const isOtherAnswer = (value: unknown): value is ChoiceOtherAnswer => typeof value === 'object' && value !== null && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === 'other,value' && typeof (value as ChoiceOtherAnswer).value === 'string' && typeof (value as ChoiceOtherAnswer).other === 'string';
export const choiceValue = (value: JSONValue | undefined): JSONValue | undefined => isOtherAnswer(value) ? value.value : value;
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

// One variable repetition without groups makes browser matching bounded/linear.
export function portablePattern(pattern: unknown): string | null {
  if (typeof pattern !== 'string' || pattern.length > 512 || /[^\x20-\x7e]|[()|]/.test(pattern)) return null;
  const classes: Record<string, string> = { d: '0-9', w: 'A-Za-z0-9_', s: ' \\t\\r\\n\\f\\x0b' };
  const escape = (c: string, inClass: boolean): string | null => {
    if (classes[c]) return inClass ? classes[c]! : `[${classes[c]}]`;
    if (['D', 'W', 'S'].includes(c)) return inClass ? null : `[^${classes[c.toLowerCase()]}]`;
    if (c === '-' && !inClass) return '-'; // `\-` is only valid inside a class under the u flag.
    return 'nrt\\.[]{}^$*+?-/'.includes(c) ? `\\${c}` : null;
  };
  let compiled = '', atom = false, variableRepeats = 0;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === '\\') {
      const next = pattern[++i]; if (next === undefined) return null;
      const e = escape(next, false); if (e === null) return null;
      compiled += e; atom = true;
    } else if (c === '[') {
      let cls = '[', closed = false;
      for (i++; i < pattern.length; i++) {
        const ch = pattern[i]!;
        if (ch === ']') { closed = true; cls += ']'; break; }
        if (ch === '[') return null;
        if (ch === '\\') { const next = pattern[++i]; if (next === undefined) return null; const e = escape(next, true); if (e === null) return null; cls += e; }
        else cls += ch;
      }
      if (!closed) return null;
      compiled += cls; atom = true;
    } else if (['*', '+', '?', '{'].includes(c)) {
      if (!atom) return null;
      let token = c, flexible = true;
      if (c === '{') {
        const m = /^\{(\d+)(?:,(\d*))?\}/.exec(pattern.slice(i)); if (!m) return null;
        const min = Number(m[1]), max = m[2] === '' ? Infinity : Number(m[2] ?? m[1]);
        if (min > 1000 || max !== Infinity && (max > 1000 || max < min)) return null;
        flexible = min !== max; token = m[0]; i += token.length - 1;
      }
      if (flexible && ++variableRepeats > 1) return null;
      if ((c === '*' || c === '+' || token.endsWith(',}')) && !(pattern.startsWith('^') && pattern.endsWith('$'))) return null;
      compiled += token; atom = false;
    } else if (c === '^' || c === '$') {
      if (c === '^' && i !== 0 || c === '$' && i !== pattern.length - 1) return null;
      compiled += c === '$' ? '$(?![\\s\\S])' : c; atom = false;
    } else if (c === ']' || c === '}') return null;
    else { compiled += c === '.' ? '[^\\n\\r\u2028\u2029]' : c; atom = true; }
  }
  return compiled;
}
export function regex(pattern: unknown): RegExp | null {
  const portable = portablePattern(pattern);
  if (portable === null) return null;
  try { return new RegExp(portable, 'u'); } catch { return null; }
}
export const matches = (v: unknown, pattern: unknown): boolean => typeof v === 'string' &&
  [...v].length <= 4096 && (regex(pattern)?.test(v) ?? false);
