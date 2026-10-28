/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '../builder/controls';
import { can, errorMessage } from '../builder/api';
import type { AdminApi, Page } from '../builder/api';
import { readableDate } from './model';
import { Export } from './Export';
import { Purge } from './Purge';
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
    setError('');
    api
      .request<NonNullable<typeof log>>(
        `admin/purge-log?page=${page}&perPage=20`,
        'GET',
        undefined,
        abort.signal,
      )
      .then((result) => { setLog(result); setError(''); })
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
              <td><time dateTime={item.created_at}>{readableDate(item.created_at, api.config.timezone)}</time></td>
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
/** Readable checks with a fix for anything that needs attention, instead of raw JSON. */
function StatusChecklist({ status }: { status: Record<string, unknown> }) {
  const types = Array.isArray(status.fieldTypes) ? status.fieldTypes.length : 0;
  const checks: { label: string; ok: boolean; value: string; fix?: string }[] = [
    {
      label: __('HTTPS', 'chatflow-forms'),
      ok: status.https === true,
      value: status.https === true ? __('On', 'chatflow-forms') : __('Off', 'chatflow-forms'),
      fix: __('Visitors see a "connection is not secure" warning in the chat. Turn on HTTPS for this site before collecting personal data.', 'chatflow-forms'),
    },
    {
      label: __('Private file storage (uploads and exports)', 'chatflow-forms'),
      ok: status.privateStorage === true,
      value: status.privateStorage === true ? __('Ready', 'chatflow-forms') : __('Not configured', 'chatflow-forms'),
      fix: __('File uploads and CSV exports need a writable folder outside the public web root. Add define( \'CFF_PRIVATE_DIR\', \'/path/outside/web/root\' ); to wp-config.php.', 'chatflow-forms'),
    },
    {
      label: __('Email delivery plugin', 'chatflow-forms'),
      ok: status.smtpDetected === true,
      value: status.smtpDetected === true ? __('Detected', 'chatflow-forms') : __('Not detected', 'chatflow-forms'),
      fix: __('Notifications use WordPress mail, which often lands in spam. An SMTP plugin (for example WP Mail SMTP or FluentSMTP) makes delivery reliable.', 'chatflow-forms'),
    },
    {
      label: __('Background jobs', 'chatflow-forms'),
      ok: status.scheduler === 'action-scheduler',
      value: status.scheduler === 'action-scheduler' ? 'Action Scheduler' : 'WP-Cron',
      fix: __('WP-Cron only runs when someone visits the site, so emails and exports can be delayed on quiet sites. A real server cron job fixes this.', 'chatflow-forms'),
    },
  ];
  const info: [string, string][] = [
    [__('PHP version', 'chatflow-forms'), String(status.php ?? '')],
    [__('WordPress version', 'chatflow-forms'), String(status.wordpress ?? '')],
    [__('Your IP address as ChatFlow sees it', 'chatflow-forms'), String(status.ip ?? '')],
    [__('Field types available', 'chatflow-forms'), String(types)],
  ];
  return (
    <div className="cff-system-status">
      <ul className="cff-status-checks">
        {checks.map((check) => (
          <li key={check.label} className={check.ok ? 'is-ok' : 'is-warning'}>
            <strong>{check.label}</strong>: {check.value}
            {!check.ok && check.fix && <p>{check.fix}</p>}
          </li>
        ))}
      </ul>
      <dl className="cff-status-info">
        {info.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    </div>
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
      {status && <StatusChecklist status={status} />}
    </section>
  );
}
export function Tools({ api }: { api: AdminApi }) {
  // Export lives in Submissions and import on the new-form screen; Tools keeps maintenance only.
  const tabs = [
    { id: 'system', cap: 'manage_settings', label: __('System status', 'chatflow-forms') },
    { id: 'purge', cap: 'purge_submissions', label: __('Purge data', 'chatflow-forms') },
    { id: 'log', cap: 'purge_submissions', label: __('Purge log', 'chatflow-forms') },
  ] as const;
  const available = tabs.filter((tab) => can(api.config, tab.cap));
  const [tab, setTab] = useState<string>(available[0]?.id ?? '');
  // "Export ready" emails link here with ?exportId=…; show that export so it can be downloaded.
  const exportLink = api.config.exportId && can(api.config, 'export_submissions');
  return (
    <main className="cff-admin cff-tools-page">
      <div className="cff-page-head">
        <div>
          <h1>{__('ChatFlow tools', 'chatflow-forms')}</h1>
          <p>{__('Maintenance and data cleanup. Export responses from Submissions; import a form from Forms → Create form.', 'chatflow-forms')}</p>
        </div>
      </div>
      {exportLink && <Export api={api} filters={{}} ids={[]} exportId={api.config.exportId} />}
      {available.length > 1 && (
        <nav className="cff-tabs" aria-label={__('Tool sections', 'chatflow-forms')}>
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
      )}
      {tab === 'purge' && can(api.config, 'purge_submissions') && <Purge api={api} />}
      {tab === 'log' && can(api.config, 'purge_submissions') && <PurgeLog api={api} />}
      {tab === 'system' && can(api.config, 'manage_settings') && <SystemStatus api={api} />}
    </main>
  );
}
