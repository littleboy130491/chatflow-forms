/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { PublicSchemaEnvelope } from '../shared/contracts';
import { AdminApi, can, errorMessage } from '../builder/api';
import type { FormDTO, Page } from '../builder/api';
import { Button, Field, Notice, Select } from '../builder/controls';
import { cleanupPreview, mountPublicPreview } from '../builder/Preview';
export function BlockEditor({
  attributes,
  setAttributes,
}: {
  attributes: { formId: number; mode: string; position: string; height: number; theme: string };
  setAttributes: (attributes: Record<string, unknown>) => void;
}) {
  const config = window.cffBlock,
    host = useRef<HTMLDivElement>(null);
  const [forms, setForms] = useState<FormDTO[]>([]),
    [error, setError] = useState(''),
    [preview, setPreview] = useState(false);
  useEffect(() => {
    if (!config || !can(config, 'manage_forms')) return;
    const abort = new AbortController();
    const api = new AdminApi(config);
    const load = async () => {
      let page = 1,
        items: FormDTO[] = [];
      for (;;) {
        const result = await api.request<Page<FormDTO>>(
          `admin/forms?page=${page}&perPage=100`,
          'GET',
          undefined,
          abort.signal,
        );
        items = [...items, ...result.items];
        if (page * 100 >= result.total || !result.items.length) break;
        page++;
      }
      setForms(items);
    };
    void load().catch((err) => {
      if (!abort.signal.aborted) setError(errorMessage(err));
    });
    return () => abort.abort();
  }, [config]);
  useEffect(() => {
    const current = host.current;
    if (!preview || !current || !attributes.formId || !config) return;
    const abort = new AbortController();
    let handle: Awaited<ReturnType<typeof mountPublicPreview>>;
    const load = async () => {
      const response = await fetch(`${config.restUrl}forms/${attributes.formId}`, {
        signal: abort.signal,
        credentials: 'omit',
      });
      if (!response.ok) throw new Error(__('Publish this form before embedding it.', 'chatflow-forms'));
      const envelope = (await response.json()) as PublicSchemaEnvelope;
      envelope.form.appearance = {
        ...envelope.form.appearance,
        theme: attributes.theme as 'auto' | 'dark' | 'light',
      };
      const result = await mountPublicPreview(current, envelope, config, {}, () => !abort.signal.aborted);
      if (abort.signal.aborted) cleanupPreview(result);
      else handle = result;
    };
    setError('');
    void load().catch((err) => {
      if (!abort.signal.aborted) setError(errorMessage(err));
    });
    return () => {
      abort.abort();
      cleanupPreview(handle);
    };
  }, [attributes.formId, attributes.theme, config, preview]);
  return (
    <Fragment>
      <InspectorControls>
        <PanelBody title={__('ChatFlow Form', 'chatflow-forms')} initialOpen>
          {forms.length > 0 && (
            <Select
              label={__('Choose form', 'chatflow-forms')}
              value={String(attributes.formId)}
              choices={[
                { value: '0', label: __('Select a form', 'chatflow-forms') },
                ...forms.map((form) => ({ value: String(form.id), label: `${form.title} (${form.status})` })),
              ]}
              onChange={(value) => {
                setAttributes({ formId: Number(value) });
                setPreview(false);
              }}
            />
          )}
          <Field
            label={__('Form ID', 'chatflow-forms')}
            type="number"
            value={attributes.formId}
            onChange={(value) => {
              setAttributes({ formId: Number(value) });
              setPreview(false);
            }}
          />
          <Select
            label={__('Display mode', 'chatflow-forms')}
            value={attributes.mode}
            choices={[
              { value: 'inline', label: __('Inline', 'chatflow-forms') },
              { value: 'fullpage', label: __('Fullpage', 'chatflow-forms') },
              { value: 'launcher', label: __('Floating launcher', 'chatflow-forms') },
            ]}
            onChange={(mode) => setAttributes({ mode })}
          />
          {attributes.mode === 'launcher' && <Select
            label={__('Launcher position', 'chatflow-forms')}
            value={attributes.position ?? 'right'}
            choices={[
              { value: 'left', label: __('Left', 'chatflow-forms') },
              { value: 'right', label: __('Right', 'chatflow-forms') },
            ]}
            onChange={(position) => setAttributes({ position })}
          />}
          {attributes.mode !== 'launcher' && <Field
            label={__('Height (200–2000 px)', 'chatflow-forms')}
            type="number"
            value={attributes.height}
            onChange={(value) =>
              setAttributes({ height: Math.max(200, Math.min(2000, Number(value) || 600)) })
            }
          />}
          <Select
            label={__('Theme', 'chatflow-forms')}
            value={attributes.theme}
            choices={['auto', 'light', 'dark'].map((value) => ({ value, label: value }))}
            onChange={(theme) => setAttributes({ theme })}
          />
        </PanelBody>
      </InspectorControls>
      <div {...useBlockProps()}>
        <h3>{__('ChatFlow Form', 'chatflow-forms')}</h3>
        <p>
          {attributes.formId
            ? `${__('Form', 'chatflow-forms')} ${attributes.formId}`
            : __('Choose a form from the block settings.', 'chatflow-forms')}
        </p>
        <Button variant="secondary" disabled={!attributes.formId} onClick={() => setPreview(!preview)}>
          {preview ? __('Close preview', 'chatflow-forms') : __('Preview published form', 'chatflow-forms')}
        </Button>
        {error && (
          <Notice status="error" isDismissible={false}>
            {error}
          </Notice>
        )}
        {preview && <div ref={host} style={{ height: attributes.height, overflow: 'auto' }} />}
      </div>
    </Fragment>
  );
}
