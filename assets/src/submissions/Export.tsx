/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Field, Notice, Select } from '../builder/controls';
import { errorMessage } from '../builder/api';
import type { AdminApi, Page } from '../builder/api';
import { exportOptions } from './model';
import type { Filters, ExportJob } from './model';
import { useJobProgress } from './useJobProgress';
import { exportDates, type DatePreset } from './export-dates';
export async function downloadExport(api: AdminApi, url: string): Promise<void> {
  const target = new URL(url, location.href),
    admin = new URL(api.config.adminUrl ?? '/wp-admin/admin.php', location.href),
    expected = new URL('admin-post.php', admin);
  if (
    target.origin !== expected.origin ||
    target.pathname !== expected.pathname ||
    target.searchParams.get('action') !== 'cff_download' ||
    !/^\d+$/.test(target.searchParams.get('exportId') ?? '') ||
    !target.searchParams.has('ticket') ||
    !target.searchParams.has('_wpnonce')
  )
    throw new Error(__('Invalid export download destination.', 'chatflow-forms'));
  const response = await fetch(target.href, {
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
  });
  if (!response.ok)
    throw new Error(__('Export expired or download denied. Request a new export.', 'chatflow-forms'));
  const blob = await response.blob(),
    objectUrl = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = objectUrl;
  link.download = response.headers.get('Content-Type')?.includes('spreadsheetml')
    ? 'chatflow-submissions.xlsx' : 'chatflow-submissions.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
export function Export({ api, filters, ids, exportId }: { api: AdminApi; filters: Filters; ids: number[]; exportId?: number | undefined }) {
  const [formId, setFormId] = useState(filters.formId ?? 0), [forms, setForms] = useState<{id:number;title:string}[]>([]), [formPage, setFormPage] = useState(1), [formTotal, setFormTotal] = useState(0), [preset, setPreset] = useState<DatePreset>('active');
  const [columns, setColumns] = useState(''),
    [headerStyle, setHeader] = useState<'labels' | 'keys'>('labels'),
    [delimiter, setDelimiter] = useState<',' | ';'>(','),
    [format, setFormat] = useState<'csv' | 'xlsx'>('csv'),
    [job, setJob] = useState<ExportJob | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => { if (filters.formId) setFormId(filters.formId); }, [filters.formId]);
  useEffect(() => { const abort = new AbortController(); void api.request<Page<{id:number;title:string}>>(`admin/export-forms?page=${formPage}&perPage=50`, 'GET', undefined, abort.signal).then(page => { setForms(previous => { const selected = previous.find(form => form.id === formId); return selected && !page.items.some(form => form.id === selected.id) ? [...page.items,selected] : page.items; }); setFormTotal(page.total); }).catch(error => {if(!abort.signal.aborted) setError(errorMessage(error));}); return () => abort.abort(); }, [api, formId, formPage]);
  useEffect(() => { if (!formId || forms.some(form => form.id === formId)) return; const abort = new AbortController(); void api.request<Page<{id:number;title:string}>>(`admin/export-forms?id=${formId}`, 'GET', undefined, abort.signal).then(page => { const selected = page.items[0]; if (selected) setForms(previous => previous.some(form => form.id === selected.id) ? previous : [...previous, selected]); }).catch(error => {if(!abort.signal.aborted) setError(errorMessage(error));}); return () => abort.abort(); }, [api, formId, forms]);
  useEffect(() => { if (!exportId) return; const abort = new AbortController(); void api.request<ExportJob>(`admin/exports/${exportId}`, 'GET', undefined, abort.signal).then(setJob).catch(error => {if(!abort.signal.aborted) setError(errorMessage(error));}); return () => abort.abort(); }, [api,exportId]);
  const refresh = useJobProgress<ExportJob>(
    api,
    job ? `admin/exports/${job.exportId}` : null,
    job?.status,
    setJob,
    (err) => setError(errorMessage(err)),
  );
  return (
    <section className="cff-card">
      <h2>{__('Export submissions', 'chatflow-forms')}</h2>
      <Select label={__('Required form — one form per file', 'chatflow-forms')} value={String(formId || '')} choices={[{value:'',label:__('Select a form', 'chatflow-forms')}, ...forms.map(form => ({value:String(form.id),label:form.title}))]} onChange={value => setFormId(Number(value) || 0)} />
      <Button disabled={formPage<=1} onClick={() => setFormPage(value=>value-1)}>{__('Previous forms', 'chatflow-forms')}</Button><Button disabled={formPage*50>=formTotal} onClick={() => setFormPage(value=>value+1)}>{__('More forms', 'chatflow-forms')}</Button>
      <p>{__('A form is required so columns remain consistent. Active filters and selected rows are intersected with that form; no cross-form export is implied.', 'chatflow-forms')}</p>
      {filters.formId && filters.formId !== formId && <Notice status="warning" isDismissible={false}>{__('The export form must match the active form filter. Change the filter or select its form before exporting.', 'chatflow-forms')}</Notice>}
      <Select label={__('Export date range (UTC)', 'chatflow-forms')} value={preset} choices={[{value:'active',label:__('Active/custom date filters', 'chatflow-forms')}, {value:'7',label:__('Last 7 days', 'chatflow-forms')}, {value:'30',label:__('Last 30 days', 'chatflow-forms')}, {value:'90',label:__('Last 90 days', 'chatflow-forms')}, {value:'month',label:__('This month', 'chatflow-forms')}]} onChange={value => setPreset(value as DatePreset)} />
      <Select label={__('Format', 'chatflow-forms')} value={format}
        choices={[{ value: 'csv', label: 'CSV' }, ...(('xlsx' in api.config.features && api.config.features.xlsx) ? [{value: 'xlsx', label: 'XLSX'}] : [])]}
        onChange={(next) => setFormat(next as 'csv' | 'xlsx')} />
      <p>
        {ids.length
          ? __('Exports only selected rows and the active filters.', 'chatflow-forms')
          : __('Exports every matching row using the active filters, not just this page.', 'chatflow-forms')}
      </p>
      <Field
        label={__('Column keys (comma-separated; blank = all)', 'chatflow-forms')}
        value={columns}
        onChange={setColumns}
      />
      <Select
        label={__('Headers', 'chatflow-forms')}
        value={headerStyle}
        choices={[
          { value: 'labels', label: __('Field labels', 'chatflow-forms') },
          { value: 'keys', label: __('Machine keys', 'chatflow-forms') },
        ]}
        onChange={(next) => setHeader(next as 'labels' | 'keys')}
      />
      <Select
        label={__('Delimiter', 'chatflow-forms')}
        value={delimiter}
        choices={[
          { value: ',', label: __('Comma', 'chatflow-forms') },
          { value: ';', label: __('Semicolon', 'chatflow-forms') },
        ]}
        onChange={(next) => setDelimiter(next as ',' | ';')}
      />
      <Button
        disabled={busy || !forms.some(form => form.id === formId) || Boolean(filters.formId && filters.formId !== formId)}
        variant="primary"
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            setJob(
              await api.request<ExportJob>(
                'admin/submissions/export',
                'POST',
                exportOptions(
                  { ...filters, ...exportDates(preset), formId },
                  ids,
                  columns
                    .split(',')
                    .map((key) => key.trim())
                    .filter(Boolean),
                  headerStyle,
                  delimiter,
                  format,
                ),
              ),
            );
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        {__('Create private export', 'chatflow-forms')}
      </Button>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      {job && (
        <p role="status">
          {job.status} · {job.expiresAt ?? ''}
        </p>
      )}
      {job && ['queued', 'running'].includes(job.status) && (
        <Button onClick={refresh}>{__('Refresh progress', 'chatflow-forms')}</Button>
      )}
      {job?.status === 'ready' && job.downloadUrl && (
        <Button
          onClick={() => {
            void downloadExport(api, job.downloadUrl!).catch((err) => setError(errorMessage(err)));
          }}
        >
          {__('Download (authenticated, expiring)', 'chatflow-forms')}
        </Button>
      )}
      <p>
        {__(
          'Formula-like cells are escaped by the server. Exports contain personal data; store them securely.',
          'chatflow-forms',
        )}
      </p>
    </section>
  );
}
