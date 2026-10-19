/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Select, Notice } from './controls';
import { errorMessage, safeHttpUrl } from './api';
import type { AdminConfig, FormDTO } from './api';
import type { AnswerMap, PublicSchemaEnvelope, ReplayContext } from '../shared/contracts';

export function previewRuntimeUrl(config: Pick<AdminConfig, 'pluginUrl' | 'runtimeUrl'>): string {
  return config.runtimeUrl || `${config.pluginUrl}build/runtime/runtime.js`;
}

export function publicDraft(form: FormDTO, config: AdminConfig): PublicSchemaEnvelope {
  const session = form.settings.sessions ?? {};
  return {
    form: {
      id: form.id || 1,
      title: form.title,
      slug: form.slug,
      version: form.version,
      schema: form.schema,
      appearance: form.settings.appearance ?? config.defaults?.appearance ?? {},
      phrases: form.settings.phrases ?? {},
      session: {
        savePartial: session.savePartial ?? true,
        resumeEnabled: session.resumeEnabled ?? true,
        resumePrompt: session.resumePrompt ?? true,
        resumeDays: session.resumeDays ?? 30,
      },
    },
    features: { ...config.features, engagement: false },
  };
}
export interface PreviewHandle {
  unmount?: () => void;
  destroy?: () => void;
  jumpToStep?: (id: string) => void;
  getState?: () => unknown;
  setAppearance?: (appearance: PublicSchemaEnvelope['form']['appearance']) => void;
}
export async function resolvePreviewMedia(envelope: PublicSchemaEnvelope): Promise<void> {
  const media = (
    window as unknown as {
      wp?: {
        media?: {
          attachment: (id: number) => { fetch: () => PromiseLike<unknown>; get: (key: string) => unknown };
        };
      };
    }
  ).wp?.media;
  if (!media) return;
  const ids = new Set(
    [
      envelope.form.schema.bot.avatar,
      ...envelope.form.schema.steps.flatMap((step) => step.options?.map((option) => option.image) ?? []),
    ].filter((id): id is number => typeof id === 'number' && id > 0),
  );
  const resolved: NonNullable<PublicSchemaEnvelope['form']['media']> = {};
  await Promise.all(
    [...ids].map(async (id) => {
      try {
        const attachment = media.attachment(id);
        await attachment.fetch();
        const url = attachment.get('url'),
          alt = attachment.get('alt');
        if (typeof url === 'string' && safeHttpUrl(url))
          resolved[String(id)] = { url, ...(typeof alt === 'string' ? { alt } : {}) };
      } catch {
        /* Unavailable media remains absent. */
      }
    }),
  );
  envelope.form.media = resolved;
}
interface RuntimeModule {
  mountRuntime: (
    host: HTMLElement,
    options: { form: PublicSchemaEnvelope; preview: true; locale: string; context: ReplayContext; previewAnswers?: AnswerMap; frontend?: 'theme'; themeStyle?: string },
  ) => PreviewHandle | (() => void) | void;
}
export function cleanupPreview(handle: PreviewHandle | (() => void) | void): void {
  if (typeof handle === 'function') handle();
  else if (handle?.unmount) handle.unmount();
  else handle?.destroy?.();
}
export async function mountDraft(
  host: HTMLElement,
  form: FormDTO,
  config: AdminConfig,
  isCurrent: () => boolean = () => true,
): Promise<PreviewHandle | (() => void) | void> {
  const defaultEndingId = form.settings.completion?.defaultEndingId;
  const envelope = publicDraft(form, config);
  await resolvePreviewMedia(envelope);
  return mountPublicPreview(host, envelope, config, defaultEndingId ? { defaultEndingId } : {}, isCurrent);
}
export async function mountPublicPreview(
  host: HTMLElement,
  envelope: PublicSchemaEnvelope,
  config: AdminConfig,
  context: ReplayContext = {},
  isCurrent: () => boolean = () => true,
  extra: { previewAnswers?: AnswerMap } = {},
): Promise<PreviewHandle | (() => void) | void> {
  const url = previewRuntimeUrl(config);
  const runtime = (await import(/* webpackIgnore: true */ url)) as RuntimeModule;
  // Load the theme's frontend (it registers itself with window.ChatFlow) so the preview matches the site.
  const theme = config.themeFrontend ?? {};
  if (theme.script) {
    try { await import(/* webpackIgnore: true */ theme.script); } catch { /* A broken theme script falls back to the built-in chat. */ }
  }
  if (!isCurrent()) return;
  if (typeof runtime.mountRuntime !== 'function')
    throw new Error(__('The runtime preview is unavailable. Rebuild the plugin assets.', 'chatflow-forms'));
  return runtime.mountRuntime(host, {
    form: envelope,
    preview: true,
    locale: config.locale,
    context: { now: new Date().toISOString(), ...context },
    ...(theme.script ? { frontend: 'theme' as const } : {}),
    ...(theme.style ? { themeStyle: theme.style } : {}),
    ...extra,
  });
}
/**
 * Stable identity of what the preview renders. Autosave bookkeeping (IDs,
 * revisions) and map layout are excluded so they never restart a preview, and
 * appearance is applied live to the running preview instead.
 */
export function previewKey(form: FormDTO): string {
  const { flowPositions: _layout, ...schema } = form.schema;
  void _layout;
  return JSON.stringify({
    title: form.title,
    schema,
    phrases: form.settings.phrases ?? null,
    sessions: form.settings.sessions ?? null,
    defaultEndingId: form.settings.completion?.defaultEndingId ?? null,
  });
}
export const PREVIEW_DEBOUNCE_MS = 600;
export function Preview({
  form,
  config,
  onClose,
}: {
  form: FormDTO;
  config: AdminConfig;
  onClose: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    handle = useRef<PreviewHandle | (() => void) | void>(),
    latest = useRef(form);
  latest.current = form;
  const key = previewKey(form);
  const [mountedKey, setMountedKey] = useState(key),
    [restarts, setRestarts] = useState(0);
  const [, setReady] = useState(0);
  const [error, setError] = useState(''),
    [mobile, setMobile] = useState(false),
    [debug, setDebug] = useState<unknown>(null);
  useEffect(() => {
    if (key === mountedKey) return;
    const timer = setTimeout(() => setMountedKey(key), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key, mountedKey]);
  useEffect(() => {
    let cancelled = false;
    setError('');
    setDebug(null);
    const current = host.current;
    if (!current) return;
    mountDraft(current, latest.current, config, () => !cancelled)
      .then((result) => {
        if (cancelled) cleanupPreview(result);
        else {
          handle.current = result;
          setReady((value) => value + 1);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
      cleanupPreview(handle.current);
      handle.current = undefined;
    };
  }, [mountedKey, restarts, config]);
  const appearance = JSON.stringify(form.settings.appearance ?? config.defaults?.appearance ?? {});
  useEffect(() => {
    const current = handle.current;
    if (current && typeof current === 'object') current.setAppearance?.(JSON.parse(appearance) as PublicSchemaEnvelope['form']['appearance']);
  }, [appearance]);
  const restart = () => {
    setMountedKey(key);
    setRestarts((value) => value + 1);
  };
  const previewHandle = typeof handle.current === 'object' ? handle.current : undefined;
  return (
    <aside className="cff-preview" role="dialog" aria-label={__('Draft preview', 'chatflow-forms')}>
      <h2>{__('Preview your form', 'chatflow-forms')}</h2>
      <p>{__('Test your draft as a visitor. Responses here are not saved, and notifications are not sent.', 'chatflow-forms')}</p>
      <Button onClick={onClose}>{__('Back to editor', 'chatflow-forms')}</Button>
      <Button variant="secondary" onClick={restart}>
        {__('Restart preview', 'chatflow-forms')}
      </Button>
      <Button onClick={() => setMobile(!mobile)}>
        {mobile ? __('Desktop', 'chatflow-forms') : __('Mobile', 'chatflow-forms')}
      </Button>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      {key !== mountedKey && (
        <p className="cff-preview-pending">{__('Applying your latest changes…', 'chatflow-forms')}</p>
      )}
      <div ref={host} style={{ width: mobile ? 360 : '100%', maxWidth: '100%', minHeight: 480 }} />
      {previewHandle?.jumpToStep && (
        <Select
          label={__('Jump to step (preview only)', 'chatflow-forms')}
          choices={form.schema.steps.map((step) => ({ value: step.id, label: step.label }))}
          value=""
          onChange={(id) => {
            previewHandle.jumpToStep?.(id);
            setDebug(previewHandle.getState?.());
          }}
        />
      )}
      {previewHandle?.getState && (
        <Button onClick={() => setDebug(previewHandle.getState?.())}>
          {__('Inspect logic path and variables', 'chatflow-forms')}
        </Button>
      )}
      {debug !== null && <pre>{JSON.stringify(debug, null, 2)}</pre>}
    </aside>
  );
}
