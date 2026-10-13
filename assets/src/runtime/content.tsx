/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import type { Step } from './types';
import { interpolate } from '../shared/logic';
import type { AnswerMap } from '../shared/contracts';

export function safeLink(raw: string, base = globalThis.location?.href ?? 'https://localhost/'): string | null {
  try { const url = new URL(raw, base); return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function interpolateLink(template: string, answers: AnswerMap, meta: AnswerMap = {}): string {
  return template.replace(/\{\{[^{}]+\}\}/g, tag => encodeURIComponent(interpolate(tag, answers, meta)));
}
export function reactions(step: Step, value: unknown): string[] {
  const selected = value && typeof value === 'object' && !Array.isArray(value) ? (value as { value?: unknown }).value : value;
  return (step.options ?? []).filter(option => option.reaction && (Array.isArray(selected) ? selected.includes(option.value) : selected === option.value)).map(option => option.reaction!);
}
export function Markdown({ text }: { text: string }) {
  const parts: ComponentChildren[] = [];
  const pattern = /\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    parts.push(text.slice(last, match.index));
    if (match[1] && match[2]) { const href = safeLink(match[2]); parts.push(href ? <a href={href} target="_blank" rel="noopener noreferrer">{match[1]}</a> : match[1]); }
    else if (match[3]) parts.push(<strong>{match[3]}</strong>);
    else if (match[4]) parts.push(<em>{match[4]}</em>);
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}
export function answerLabel(step: Step, value: unknown, phrase: (key: string) => string): string {
  if (value === undefined || value === null || value === '') return phrase('empty');
  if (typeof value === 'boolean') return phrase(value ? 'yes' : 'no');
  if (step.type === 'file_upload') return phrase('uploadSaved');
  if (step.type === 'address' && value && typeof value === 'object' && !Array.isArray(value)) return Object.values(value).filter(v => typeof v === 'string').join(', ');
  const label = (v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const choice = v as { value?: unknown; other?: unknown };
      if (typeof choice.value === 'string' && typeof choice.other === 'string') return `${step.options?.find(option => option.value === choice.value)?.label ?? choice.value}: ${choice.other}`;
    }
    return step.options?.find(option => option.value === v)?.label ?? String(v);
  };
  return Array.isArray(value) ? value.map(label).join(', ') : label(value);
}
