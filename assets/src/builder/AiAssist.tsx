/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Area, Button, Notice, Select } from './controls';
import { errorMessage } from './api';
import type { AdminApi, FormDTO, FormSchema } from './api';

export interface CopyItem { id: string; text: string }
export const tones = ['friendly', 'professional', 'playful', 'concise', 'formal'] as const;

/** The form copy the assistant may rewrite: step labels, bot messages and ending messages. */
export function copyItems(schema: FormSchema): CopyItem[] {
  const items: CopyItem[] = [];
  for (const step of schema.steps) {
    if (step.label.trim()) items.push({ id: `step:${step.id}:label`, text: step.label });
    (step.messages ?? []).forEach((text, i) => { if (text.trim()) items.push({ id: `step:${step.id}:message:${i}`, text }); });
  }
  for (const ending of schema.endings) {
    (ending.messages ?? []).forEach((text, i) => { if (text.trim()) items.push({ id: `ending:${ending.id}:message:${i}`, text }); });
  }
  return items.slice(0, 200);
}

/** Apply accepted rewrites by ID; unknown IDs are ignored and nothing else changes. */
export function applyRewrites(schema: FormSchema, items: CopyItem[]): FormSchema {
  const byId = new Map(items.map((item) => [item.id, item.text]));
  const messages = (prefix: string, list: string[] | undefined) => list?.map((text, i) => byId.get(`${prefix}:message:${i}`) ?? text);
  return {
    ...schema,
    steps: schema.steps.map((step) => {
      const next = { ...step, label: byId.get(`step:${step.id}:label`) ?? step.label };
      const rewritten = messages(`step:${step.id}`, step.messages);
      return rewritten ? { ...next, messages: rewritten } : next;
    }) as FormSchema['steps'],
    endings: schema.endings.map((ending) => {
      const rewritten = messages(`ending:${ending.id}`, ending.messages);
      return rewritten ? { ...ending, messages: rewritten } : ending;
    }) as FormSchema['endings'],
  };
}

/** Prompt → unpublished draft. The server validates the result before saving it. */
export function AiGenerate({ api, onOpen }: { api: AdminApi; onOpen: (form: FormDTO) => void }) {
  const [prompt, setPrompt] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  return (
    <section className="cff-ai-generate" aria-label={__('Generate a form with AI', 'chatflow-forms')}>
      <h3>{__('Generate a form with AI', 'chatflow-forms')}</h3>
      <Area label={__('Describe the form you need (audience, questions, language)', 'chatflow-forms')} value={prompt} onChange={setPrompt} />
      <p className="description">{__('Your description is sent to Anthropic’s Claude API. The result is an unpublished draft for you to review.', 'chatflow-forms')}</p>
      {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
      <Button
        variant="secondary"
        disabled={busy || !prompt.trim()}
        onClick={async () => {
          setBusy(true); setError('');
          try { onOpen(await api.request<FormDTO>('admin/ai/generate', 'POST', { prompt, locale: api.config.locale })); }
          catch (err) { setError(errorMessage(err)); }
          finally { setBusy(false); }
        }}
      >
        {busy ? __('Generating draft…', 'chatflow-forms') : __('Generate draft', 'chatflow-forms')}
      </Button>
    </section>
  );
}

/** Rewrite bot copy in a tone; the previous copy stays one click away. */
export function AiRephrase({ api, schema, onChange }: { api: AdminApi; schema: FormSchema; onChange: (next: FormSchema) => void }) {
  const [tone, setTone] = useState<(typeof tones)[number]>('friendly'), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [status, setStatus] = useState(''), [previous, setPrevious] = useState<FormSchema | null>(null);
  const labels: Record<(typeof tones)[number], string> = {
    friendly: __('Friendly', 'chatflow-forms'),
    professional: __('Professional', 'chatflow-forms'),
    playful: __('Playful', 'chatflow-forms'),
    concise: __('Concise', 'chatflow-forms'),
    formal: __('Formal', 'chatflow-forms'),
  };
  return (
    <section className="cff-card cff-ai-rephrase">
      <h2>{__('Rephrase bot copy with AI', 'chatflow-forms')}</h2>
      <Select label={__('Tone', 'chatflow-forms')} value={tone} choices={tones.map((value) => ({ value, label: labels[value] }))} onChange={(value) => setTone(value as (typeof tones)[number])} />
      <p className="description">{__('Question labels, bot messages and endings are sent to Anthropic’s Claude API. Merge tags are kept; review the result before publishing.', 'chatflow-forms')}</p>
      {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
      {status && <p role="status">{status}</p>}
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          const items = copyItems(schema);
          if (!items.length) return;
          setBusy(true); setError(''); setStatus('');
          try {
            const result = await api.request<{ items: CopyItem[] }>('admin/ai/rephrase', 'POST', { tone, items });
            setPrevious(schema);
            onChange(applyRewrites(schema, result.items));
            setStatus(sprintf(__('Rewrote %1$d of %2$d texts.', 'chatflow-forms'), result.items.length, items.length));
          } catch (err) { setError(errorMessage(err)); }
          finally { setBusy(false); }
        }}
      >
        {busy ? __('Rephrasing…', 'chatflow-forms') : __('Rephrase', 'chatflow-forms')}
      </Button>
      {previous && (
        <Button onClick={() => { onChange(previous); setPrevious(null); setStatus(__('Previous copy restored.', 'chatflow-forms')); }}>
          {__('Undo rephrase', 'chatflow-forms')}
        </Button>
      )}
    </section>
  );
}
