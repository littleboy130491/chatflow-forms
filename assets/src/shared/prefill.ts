import type { AnswerMap, FormSchema } from './contracts';

export function prefillUrl(base: string, values: Record<string, string>, schema: FormSchema): string {
  const url = new URL(base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new TypeError('Invalid share URL');
  for (const step of schema.steps) {
    const value = values[step.key];
    if (!['hidden', 'calculated', 'file_upload', 'consent', 'statement', 'summary', 'media'].includes(step.type) && value && value.length <= 2000)
      url.searchParams.set(`cff_prefill[${step.key}]`, value);
  }
  return url.href;
}
export function readPrefill(search: string, schema: FormSchema): AnswerMap {
  const query = new URLSearchParams(search), values: AnswerMap = {};
  for (const step of schema.steps) {
    if (['hidden', 'calculated', 'file_upload', 'consent', 'statement', 'summary', 'media'].includes(step.type)) continue;
    const value = query.get(`cff_prefill[${step.key}]`);
    if (value === null || value.length > 2000) continue;
    if (step.type === 'yes_no') { if (value === 'true' || value === 'false') values[step.key] = value === 'true'; }
    else if (['number', 'rating', 'scale', 'nps', 'slider'].includes(step.type)) { if (value.trim() && Number.isFinite(Number(value))) values[step.key] = Number(value); }
    else if (step.type === 'multi_choice') values[step.key] = value.split(',').map(item => item.trim()).filter(item => step.options?.some(option => option.value === item));
    else if (step.type !== 'address') values[step.key] = value;
  }
  return values;
}
