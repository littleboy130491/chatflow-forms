/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { Fragment, createRoot, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AdminApi, can, errorMessage, queryString } from '../builder/api';
import type { AdminConfig, Page } from '../builder/api';
import { Button, Notice, Select } from '../builder/controls';
import { Filters } from './Filters';
import { Detail } from './Detail';
import { Settings } from './Settings';
import { Tools } from './Tools';
import { Analytics } from './Analytics';
import { Export } from './Export';
import { displayValue, freezeFilters, statusLabel, responseLabel, readableDate } from './model';
import type { Filters as FilterValues, Status, SubmissionDTO, SubmissionDetail } from './model';
import { decodeTitle } from './FormPicker';
import { answerColumns, answerKeys, readAnswerColumns } from './answer-columns';
import '../builder/style.css';
import './style.css';

function RowCheckbox({ label, value, onChange }: { label: string; value: boolean; onChange: (checked: boolean) => void }) {
  return <input type="checkbox" aria-label={label} checked={value} onChange={event => onChange(event.target.checked)} />;
}
function SubmissionList({ api }: { api: AdminApi }) {
  const [formMetadata, setFormMetadata] = useState<Record<string, { title: string; labels: Record<string, string> }>>({});
  const columnStorageKey = `cff:answer-columns:${api.config.restUrl}`;
  const [preferredColumns, setPreferredColumns] = useState<string[] | null>(() => { try { return readAnswerColumns(localStorage, columnStorageKey); } catch { return null; } });
  const [columnWarning, setColumnWarning] = useState('');
  const [filters, setFilters] = useState<FilterValues>({ status: 'completed' }),
    [applied, setApplied] = useState<FilterValues>({ status: 'completed' }),
    [page, setPage] = useState(1),
    [perPage, setPerPage] = useState(20),
    [list, setList] = useState<Page<SubmissionDTO> | null>(null),
    [selected, setSelected] = useState<number[]>([]),
    [detailId, setDetailId] = useState<number | null>(null),
    [error, setError] = useState(''),
    [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [exporting, setExporting] = useState(false),
    [exportSelected, setExportSelected] = useState(false);
  const allowedKeys = answerKeys(list?.items ?? []);
  // The detail endpoint supplies permission-checked frozen labels without requiring manage_forms.
  // Fetch one representative per form/version on this page, never an additional row per answer.
  // Version snapshots are frozen, so each form/version is fetched once per page load.
  const requestedMetadata = useRef(new Set<string>());
  useEffect(() => {
    const representatives = [...new Map((list?.items ?? []).map(row => [`${row.formId}:${row.formVersion}`, row])).entries()]
      .filter(([key]) => !requestedMetadata.current.has(key));
    representatives.forEach(([key]) => requestedMetadata.current.add(key));
    void Promise.all(representatives.map(async ([key, row]) => {
      try {
        const detail = await api.request<SubmissionDetail>(`admin/submissions/${row.id}`);
        return detail.form ? [key, { title: decodeTitle(detail.form.title), labels: Object.fromEntries(detail.form.schema.steps.map(step => [step.key, step.label || step.key])) }] as const : null;
      } catch { requestedMetadata.current.delete(key); return null; } // Enrichment must not block reading the inbox if a snapshot was removed.
    })).then(entries => { const found = entries.filter(entry => entry !== null); if (found.length) setFormMetadata(current => ({ ...current, ...Object.fromEntries(found) })); });
  }, [api, list]);
  const columnLabel = (key: string) => {
    const pageForms = new Set((list?.items ?? []).map(row => `${row.formId}:${row.formVersion}`));
    const labels = [...new Set(Object.entries(formMetadata).filter(([form]) => pageForms.has(form)).map(([, form]) => form.labels[key]).filter(Boolean))];
    return labels.length ? labels.join(' / ') : key;
  };
  const columns = preferredColumns === null ? allowedKeys.slice(0, 3) : answerColumns(preferredColumns, allowedKeys);
  const selectColumn = (index: number, key: string) => {
    const next = [...columns]; next[index] = key; const safe = answerColumns(next, allowedKeys); setPreferredColumns(safe); setColumnWarning('');
    try { localStorage.setItem(columnStorageKey, JSON.stringify(safe)); } catch { setColumnWarning(__('Column preferences cannot be saved in this browser.', 'chatflow-forms')); }
  };
  const resend = async () => {
    if (!selected.length || !window.confirm(__('Resend all matching emails for the selected completed submissions?', 'chatflow-forms'))) return;
    setBusy(true); setActionError('');
    const requestId = crypto.randomUUID();
    try { for (const id of selected) await api.request(`admin/submissions/${id}/resend`, 'POST', { requestId }); }
    catch (err) { setActionError(errorMessage(err)); } finally { setBusy(false); }
  };
  useEffect(() => {
    const abort = new AbortController();
    setBusy(true);
    setError('');
    api
      .request<Page<SubmissionDTO>>(
        `admin/submissions?${queryString({ ...applied, page, perPage })}`,
        'GET',
        undefined,
        abort.signal,
      )
      .then((result) => {
        setList(result);
        setSelected([]);
      })
      .catch((err) => {
        if (!abort.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => abort.abort();
  }, [api, applied, page, perPage, revision]);
  const bulk = async (changes: { isRead?: boolean; isStarred?: boolean; status?: Status | 'restore' } | 'delete' | 'permanent') => {
    if (!selected.length) return;
    if (changes === 'delete' && !window.confirm(__('Trash all selected submissions?', 'chatflow-forms')))
      return;
    if (changes === 'permanent' && window.prompt(__('Type DELETE to permanently erase selected submissions, files and activity.', 'chatflow-forms')) !== 'DELETE') return;
    setBusy(true);
    setError('');
    setActionError('');
    try {
      await api.request('admin/submissions/bulk', 'POST', changes === 'permanent' ? { ids: selected, permanent: true, confirmation: 'DELETE' } : { ids: selected, changes: changes === 'delete' ? { status: 'trash' } : changes });
      setSelected([]);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
      setRevision((value) => value + 1);
    }
  };
  if (detailId !== null)
    return (
      <Detail
        key={detailId}
        api={api}
        id={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => setRevision((value) => value + 1)}
        previous={list?.items[(list?.items.findIndex(row => row.id === detailId) ?? 0) - 1]?.id}
        next={list?.items[(list?.items.findIndex(row => row.id === detailId) ?? -1) + 1]?.id}
        onNavigate={setDetailId}
      />
    );
  return (
    <main className="cff-admin">
      <h1>{__('Submissions', 'chatflow-forms')}</h1>
      <details className="cff-disclosure"><summary>{__('Columns', 'chatflow-forms')}</summary><fieldset><legend>{__('Answer columns (up to three)', 'chatflow-forms')}</legend>
        {[0, 1, 2].map(index => <Select key={index} label={sprintf(__('Answer column %d', 'chatflow-forms'), index + 1)} value={columns[index] ?? ''} choices={[{value:'',label:__('No column', 'chatflow-forms')}, ...allowedKeys.map(key => ({value:key,label:columnLabel(key)}))]} onChange={key => selectColumn(index, key)} />)}
        <p>{__('Choices come from answer keys on the loaded page. Only key names, not answer values, are saved in this browser.', 'chatflow-forms')}</p>
        {columnWarning && <Notice status="warning" isDismissible={false}>{columnWarning}</Notice>}
      </fieldset></details>
      {actionError && (
        <Notice status="error" isDismissible={false}>
          {actionError}
        </Notice>
      )}
      <nav className="cff-tabs">
        {[
          { value: 'completed', label: __('Completed', 'chatflow-forms') },
          { value: 'partial', label: __('Partial', 'chatflow-forms') },
          { value: 'abandoned', label: __('Abandoned', 'chatflow-forms') },
          { value: 'spam', label: __('Spam', 'chatflow-forms') },
          { value: 'trash', label: __('Trash', 'chatflow-forms') },
        ].map((item) => (
          <Button
            key={item.value}
            variant={applied.status === item.value ? 'primary' : 'secondary'}
            onClick={() => {
              const next = { ...filters, status: item.value as Status };
              setFilters(next);
              setApplied(freezeFilters(next));
              setPage(1);
            }}
          >
            {item.label}
          </Button>
        ))}
      </nav>
      <Filters api={api} value={filters} onChange={setFilters} />
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => {
          setApplied(freezeFilters(filters));
          setPage(1);
        }}
      >
        {__('Apply filters', 'chatflow-forms')}
      </Button>
      <Button
        disabled={busy}
        onClick={() => {
          const next = { status: applied.status ?? 'completed' } as FilterValues;
          setFilters(next);
          setApplied(next);
          setPage(1);
        }}
      >
        {__('Reset filters', 'chatflow-forms')}
      </Button>
      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}
        {can(api.config, 'export_submissions') && (
          <Button onClick={() => { setExportSelected(false); setExporting(!exporting); }}>{__('Export filtered results', 'chatflow-forms')}</Button>
        )}
      {selected.length > 0 && (
      <div className="cff-toolbar">
        {can(api.config, 'edit_submissions') && applied.status === 'completed' && <Button disabled={busy || !selected.length} onClick={() => { void resend(); }}>{__('Resend notifications', 'chatflow-forms')}</Button>}
        {can(api.config, 'edit_submissions') && (
          <Fragment>
            <Button
              disabled={busy || !selected.length}
              onClick={() => {
                void bulk({ isRead: true });
              }}
            >
              {__('Mark read', 'chatflow-forms')}
            </Button>
            <Button
              disabled={busy || !selected.length}
              onClick={() => {
                void bulk({ isRead: false });
              }}
            >
              {__('Mark unread', 'chatflow-forms')}
            </Button>
            <Button
              disabled={busy || !selected.length}
              onClick={() => {
                void bulk({ isStarred: true });
              }}
            >
              {__('Star', 'chatflow-forms')}
            </Button>
            <Button
              disabled={busy || !selected.length}
              onClick={() => {
                void bulk({ isStarred: false });
              }}
            >
              {__('Unstar', 'chatflow-forms')}
            </Button>
            <Button
              disabled={busy || !selected.length}
              onClick={() => {
                void bulk({ status: 'spam' });
              }}
            >
              {__('Mark spam', 'chatflow-forms')}
            </Button>
          </Fragment>
        )}
        {can(api.config, 'delete_submissions') && (
          <Button
            isDestructive
            disabled={busy || !selected.length}
            onClick={() => {
              void bulk('delete');
            }}
          >
            {__('Trash selected', 'chatflow-forms')}
          </Button>
        )}
        {can(api.config, 'export_submissions') && <Button disabled={!selected.length} onClick={() => { setExportSelected(true); setExporting(true); }}>{__('Export selected', 'chatflow-forms')}</Button>}
        {can(api.config, 'delete_submissions') && can(api.config, 'edit_submissions') && applied.status === 'trash' && <Button isDestructive disabled={!selected.length || busy} onClick={() => { void bulk('permanent'); }}>{__('Permanently delete selected', 'chatflow-forms')}</Button>}
        {can(api.config, 'edit_submissions') && ['trash', 'spam'].includes(applied.status ?? '') && <Button disabled={!selected.length || busy} onClick={() => { void bulk({ status: 'restore' }); }}>{__('Restore selected', 'chatflow-forms')}</Button>}
      </div>)}
      {exporting && can(api.config, 'export_submissions') && (
        <Export api={api} filters={applied} ids={exportSelected ? selected : []} />
      )}
      <div className="cff-table-scroll">
        <table className="widefat striped">
          <thead>
            <tr>
              <th>
                <RowCheckbox
                  label={__('Select this page', 'chatflow-forms')}
                  value={Boolean(list?.items.length) && selected.length === list?.items.length}
                  onChange={(checked) =>
                    setSelected(checked ? (list?.items.map((item) => item.id) ?? []) : [])
                  }
                />
              </th>
              <th>{__('Submission', 'chatflow-forms')}</th>
              <th>{__('Date', 'chatflow-forms')}</th>
              {columns.map(key => <th key={key}>{columnLabel(key)}</th>)}
              <th>{__('Source / device', 'chatflow-forms')}</th>
              <th>{__('Read / starred', 'chatflow-forms')}</th>
            </tr>
          </thead>
          <tbody>
            {list?.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <RowCheckbox
                    label={`${__('Select submission', 'chatflow-forms')} ${item.id}`}
                    value={selected.includes(item.id)}
                    onChange={(checked) =>
                      setSelected(checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))
                    }
                  />
                </td>
                <td>
                  <Button variant="link" onClick={() => setDetailId(item.id)}>
                    {responseLabel(item.id)}
                  </Button>
                  <small>
                    {formMetadata[`${item.formId}:${item.formVersion}`]?.title || `${__('Form', 'chatflow-forms')} #${item.formId}`} · v{item.formVersion}
                  </small>
                </td>
                <td>
                  <time dateTime={item.createdAt}>{readableDate(item.createdAt)}</time>
                  <small>
                    {statusLabel(item.status)} · {item.progress}%
                  </small>
                </td>
                {columns.map(key => <td key={key}>{displayValue(item.answers[key]).slice(0, 160) || '—'}</td>)}
                <td>
                  {displayValue(item.meta.utm)}
                  <small>{displayValue(item.meta.device)}</small>
                </td>
                <td>
                  {item.isRead ? __('Read', 'chatflow-forms') : __('Unread', 'chatflow-forms')} ·{' '}
                  {item.isStarred ? __('Starred', 'chatflow-forms') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {busy && <p role="status">{__('Loading…', 'chatflow-forms')}</p>}
      {!busy && list?.total === 0 && <p>{__('No matching submissions.', 'chatflow-forms')}</p>}
      <div className="cff-tabs">
        <Button disabled={busy || page <= 1} onClick={() => setPage(page - 1)}>
          {__('Previous', 'chatflow-forms')}
        </Button>
        <span>
          {page} / {Math.max(1, Math.ceil((list?.total ?? 0) / perPage))} · {list?.total ?? 0}
        </span>
        <Button disabled={busy || page * perPage >= (list?.total ?? 0)} onClick={() => setPage(page + 1)}>
          {__('Next', 'chatflow-forms')}
        </Button>
        <Select
          label={__('Rows per page', 'chatflow-forms')}
          value={String(perPage)}
          choices={[20, 50, 100].map((value) => ({ value: String(value), label: String(value) }))}
          onChange={(value) => {
            setPerPage(Number(value));
            setPage(1);
          }}
        />
      </div>
    </main>
  );
}
function AdminSubmissions({ config }: { config: AdminConfig }) {
  const api = useMemo(() => new AdminApi(config), [config]);
  if (config.screen === 'settings')
    return can(config, 'manage_settings') ? (
      <Settings api={api} />
    ) : (
      <p>{__('You cannot manage settings.', 'chatflow-forms')}</p>
    );
  if (config.tools) return <Tools api={api} />;
  if (config.screen === 'analytics')
    return can(config, 'view_submissions') ? <Analytics api={api} /> : (
      <p>{__('You cannot view analytics.', 'chatflow-forms')}</p>
    );
  return can(config, 'view_submissions') ? (
    <SubmissionList api={api} />
  ) : (
    <p>{__('You cannot view submissions.', 'chatflow-forms')}</p>
  );
}
export function mountSubmissions(root: HTMLElement, config: AdminConfig = window.cffAdmin): void {
  createRoot(root).render(<AdminSubmissions config={config} />);
}
