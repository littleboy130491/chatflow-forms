import type { AnswerMap, JSONValue } from '../contracts';
import { own } from './value';

export function readable(value: JSONValue | undefined): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(readable).join(', ');
  if (typeof value === 'object') return Object.keys(value).sort().map(k => `${k}: ${readable(value[k])}`).join(', ');
  return String(value);
}
export function interpolate(text: string, answers: AnswerMap = {}, meta: AnswerMap = {}): string {
  return text.replace(/\{\{\s*(?:(answer|meta):)?([a-z][a-z0-9_]*)\s*\}\}/g, (_tag, source: string | undefined, key: string) => {
    const values = source === 'meta' ? meta : answers;
    return readable(own(values, key) ? values[key] : undefined);
  });
}
export function interpolateUrl(text: string, answers: AnswerMap = {}, meta: AnswerMap = {}): string {
  return text.replace(/\{\{\s*(?:(answer|meta):)?([a-z][a-z0-9_]*)\s*\}\}/g, (tag: string) => encodeURIComponent(interpolate(tag, answers, meta)).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`));
}
