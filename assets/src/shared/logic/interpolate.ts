import type { AnswerMap, JSONValue } from '../contracts';
import { isOtherAnswer, own } from './value';

export function readable(value: JSONValue | undefined): string {
  if (value == null) return '';
  if (isOtherAnswer(value)) return `${value.value}: ${value.other}`;
  if (Array.isArray(value)) return value.map(readable).join(', ');
  if (typeof value === 'object') return Object.keys(value).sort().map(k => `${k}: ${readable(value[k])}`).join(', ');
  return String(value);
}
export function interpolate(text: string, answers: AnswerMap = {}, meta: AnswerMap = {}): string {
  return text.replace(/\{\{([^{}]*)\}\}/g, (_tag, content: string) => {
    const tag = /^[ \t\r\n]*(?:(answer|meta):)?([a-z][a-z0-9_]*)[ \t\r\n]*$/.exec(content);
    if (!tag) return '';
    const values = tag[1] === 'meta' ? meta : answers, key = tag[2]!;
    return readable(own(values, key) ? values[key] : undefined);
  });
}
export function interpolateUrl(text: string, answers: AnswerMap = {}, meta: AnswerMap = {}): string {
  return text.replace(/\{\{[^{}]*\}\}/g, (tag: string) => encodeURIComponent(interpolate(tag, answers, meta)).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`));
}
