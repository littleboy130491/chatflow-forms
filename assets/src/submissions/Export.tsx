/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Field, Notice, Select } from '../builder/controls';
import { errorMessage } from '../builder/api';
import type { AdminApi } from '../builder/api';
import { exportOptions } from './model';
import type { Filters, ExportJob } from './model';
import { useJobProgress } from './useJobProgress';
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
  link.download = 'chatflow-submissions.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
export function Export({ api, filters, ids }: { api: AdminApi; filters: Filters; ids: number[] }) {
  const [columns, setColumns] = useState(''),
    [headerStyle, setHeader] = useState<'labels' | 'keys'>('labels'),
    [delimiter, setDelimiter] = useState<',' | ';'>(','),
    [job, setJob] = useState<ExportJob | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const refresh = useJobProgress<ExportJob>(
    api,
    job ? `admin/exports/${job.exportId}` : null,
    job?.status,
    setJob,
    (err) => setError(errorMessage(err)),
  );
  return (
    <section className="cff-card">
      <h2>{__('Export CSV', 'chatflow-forms')}</h2>
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
        disabled={busy}
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
                  filters,
                  ids,
                  columns
                    .split(',')
                    .map((key) => key.trim())
                    .filter(Boolean),
                  headerStyle,
                  delimiter,
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
