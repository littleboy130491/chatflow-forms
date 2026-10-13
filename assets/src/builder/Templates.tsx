/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AdminApi, errorMessage } from './api';
import type { FormDTO } from './api';
import { Button, Notice } from './controls';
import { parseFormFile } from './formIO';

export function Templates({api, onOpen}: {api: AdminApi; onOpen: (form: FormDTO) => void}) {
  const [templates, setTemplates] = useState<{slug: string; title: string; description: string}[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    api.request<{items: typeof templates}>('admin/templates/gallery', 'GET', undefined, abort.signal).then((r) => setTemplates(r.items)).catch((err) => {if (!abort.signal.aborted) setError(errorMessage(err));});
    return () => abort.abort();
  }, [api]);
  return <section className="cff-card"><h2>{__('Template gallery and import', 'chatflow-forms')}</h2>
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
    {templates.map((template) => <article key={template.slug}><h3>{template.title}</h3><p>{template.description}</p>
      <Button disabled={busy} onClick={async () => {setBusy(true);setError(''); try {onOpen(await api.request<FormDTO>(`admin/templates/gallery/${template.slug}`, 'POST', {}));} catch(err) {setError(errorMessage(err));} finally {setBusy(false);}}}>{__('Create draft', 'chatflow-forms')}</Button>
    </article>)}
    <label>{__('Import ChatFlow JSON (maximum 1 MiB)', 'chatflow-forms')}<input type="file" accept=".json,application/json" disabled={busy} onChange={async (event) => {
      const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
      if (!file) return;
      setBusy(true); setError('');
      try {if (file.size > 1048576) throw new Error(__('Form file exceeds 1 MiB.', 'chatflow-forms'));
        const parsed = parseFormFile(await file.text()); onOpen(await api.request<FormDTO>('admin/form-files/import', 'POST', parsed));
      } catch(err) {setError(errorMessage(err));} finally {setBusy(false);}
    }} /></label>
    <p>{__('Import creates a new server-validated draft. Webhooks are disabled and credentials removed. Review all destinations and publish explicitly.', 'chatflow-forms')}</p>
  </section>;
}
