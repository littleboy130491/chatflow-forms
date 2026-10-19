/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '../builder/controls';
import { can, errorMessage } from '../builder/api';
import type { AdminApi, FormDTO, Page } from '../builder/api';
import { parseFormFile } from '../builder/formIO';
import { Export } from './Export';
import { Purge } from './Purge';
import { Filters } from './Filters';
import type { Filters as FilterValues } from './model';
function PurgeLog({ api }: { api: AdminApi }) {
  const [page, setPage] = useState(1),
    [log, setLog] = useState<Page<{
      id: number;
      user_id: number;
      event: string;
      criteria: string;
      affected_count: number;
      created_at: string;
    }> | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    api
      .request<NonNullable<typeof log>>(
        `admin/purge-log?page=${page}&perPage=20`,
        'GET',
        undefined,
        abort.signal,
      )
      .then(setLog)
      .catch((err) => {
        if (!abort.signal.aborted) setError(errorMessage(err));
      });
    return () => abort.abort();
  }, [api, page]);
  return (
    <section>
      <h2>{__('Purge audit log', 'chatflow-forms')}</h2>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      <table className="widefat">
        <thead>
          <tr>
            <th>{__('Date', 'chatflow-forms')}</th>
            <th>{__('User / event', 'chatflow-forms')}</th>
            <th>{__('Criteria / count', 'chatflow-forms')}</th>
          </tr>
        </thead>
        <tbody>
          {log?.items.map((item) => (
            <tr key={item.id}>
              <td>{item.created_at}</td>
              <td>
                {item.user_id} / {item.event}
              </td>
              <td>
                {item.criteria} / {item.affected_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
        {__('Previous', 'chatflow-forms')}
      </Button>
      <Button disabled={page * 20 >= (log?.total ?? 0)} onClick={() => setPage(page + 1)}>
        {__('Next', 'chatflow-forms')}
      </Button>
    </section>
  );
}
function SystemStatus({ api }: { api: AdminApi }) {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    api
      .request<Record<string, unknown>>('admin/system-status', 'GET', undefined, abort.signal)
      .then(setStatus)
      .catch((err) => {
        if (!abort.signal.aborted) setError(errorMessage(err));
      });
    return () => abort.abort();
  }, [api]);
  return (
    <section>
      <h2>{__('System status', 'chatflow-forms')}</h2>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </section>
  );
}
function ImportForm({ api }: { api: AdminApi }) {
  const [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [created, setCreated] = useState<FormDTO | null>(null);
  return (
    <section className="cff-card">
      <h2>{__('Import form JSON', 'chatflow-forms')}</h2>
      <p>
        {__(
          'Imports create a new draft and are validated by the server. Webhooks exported by ChatFlow have their secrets removed and are disabled.',
          'chatflow-forms',
        )}
      </p>
      <input
        aria-label={__('Form JSON file', 'chatflow-forms')}
        type="file"
        accept="application/json,.json"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Button
        disabled={!file || busy}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          setError('');
          try {
            if (file.size > 1048576) throw new Error(__('Form file exceeds 1 MiB.', 'chatflow-forms'));
            const data = parseFormFile(await file.text());
            setCreated(
              await api.request<FormDTO>('admin/forms', 'POST', {
                title: data.title,
                schema: data.schema,
                settings: data.settings,
              }),
            );
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        {__('Import new draft', 'chatflow-forms')}
      </Button>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
      {created && (
        <a href={`${api.config.adminUrl}?page=cff-builder&formId=${created.id}`}>
          {__('Open imported form', 'chatflow-forms')}
        </a>
      )}
    </section>
  );
}
export function Tools({ api }: { api: AdminApi }) {
  const tabs = [
    { id: 'export', cap: 'export_submissions', label: __('Export CSV', 'chatflow-forms') },
    { id: 'import', cap: 'manage_forms', label: __('Import form', 'chatflow-forms') },
    { id: 'system', cap: 'manage_settings', label: __('System status', 'chatflow-forms') },
    { id: 'log', cap: 'purge_submissions', label: __('Purge log', 'chatflow-forms') },
    { id: 'purge', cap: 'purge_submissions', label: __('Purge data', 'chatflow-forms') },
  ] as const;
  const available = tabs.filter((tab) => can(api.config, tab.cap));
  const [tab, setTab] = useState<string>(api.config.exportId && can(api.config, 'export_submissions') ? 'export' : available[0]?.id ?? ''),
    [filters, setFilters] = useState<FilterValues>({});
  return (
    <main className="cff-admin">
      <h1>{__('ChatFlow tools', 'chatflow-forms')}</h1>
      <nav className="cff-tabs">
        {available.map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? 'primary' : 'secondary'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
      {tab === 'purge' && can(api.config, 'purge_submissions') && <Purge api={api} />}
      {tab === 'log' && can(api.config, 'purge_submissions') && <PurgeLog api={api} />}
      {tab === 'export' && can(api.config, 'export_submissions') && (
        <React.Fragment>
          <Filters api={api} value={filters} onChange={setFilters} />
          <Export api={api} filters={filters} ids={[]} exportId={api.config.exportId} />
        </React.Fragment>
      )}
      {tab === 'import' && can(api.config, 'manage_forms') && <ImportForm api={api} />}
      {tab === 'system' && can(api.config, 'manage_settings') && <SystemStatus api={api} />}
    </main>
  );
}
