/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AdminApi, errorMessage, queryString } from '../builder/api';
import { Button, Field, Notice } from '../builder/controls';

interface Breakdown { label: string; count: number }
interface Dropoff extends Breakdown { formId: number; stepId: string }
interface AnalyticsReport {
  from: string; to: string; formId: number;
  counts: { starts: number; completed: number; partial: number; abandoned: number };
  completionRate: number; avgDurationMs: number | null;
  sources: Breakdown[]; devices: Breakdown[]; dropoffs: Dropoff[];
  answers: { fieldKey: string; label: string; options: Breakdown[] }[];
  methodology: string;
}
function BreakdownTable({ title, rows }: { title: string; rows: Breakdown[] }) {
  const max = Math.max(1, ...rows.map((item) => item.count));
  return <section className="cff-card">
    <h2>{title}</h2>
    {rows.length === 0 && <p>{__('No data for this period.', 'chatflow-forms')}</p>}
    {rows.map((row, i) => <div key={i} className="cff-analytics-row">
      <div><span>{row.label}</span><strong>{row.count}</strong></div>
      <div className="cff-analytics-track"><span style={{ width: `${100 * row.count / max}%` }} /></div>
    </div>)}
  </section>;
}
export function Analytics({ api }: { api: AdminApi }) {
  const [formId, setFormId] = useState('0');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filters, setFilters] = useState({ formId: '0', from: '', to: '' });
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError('');
    api.request<AnalyticsReport>(`admin/analytics?${queryString(filters)}`, 'GET', undefined, abort.signal)
      .then(setReport)
      .catch((err) => { if (!abort.signal.aborted) setError(errorMessage(err)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [api, filters]);
  const kpis = report ? [
    { label: __('Starts', 'chatflow-forms'), value: report.counts.starts.toLocaleString() },
    { label: __('Completed', 'chatflow-forms'), value: report.counts.completed.toLocaleString() },
    { label: __('Completion rate', 'chatflow-forms'), value: `${report.completionRate}%` },
    { label: __('Partial', 'chatflow-forms'), value: report.counts.partial.toLocaleString() },
    { label: __('Abandoned', 'chatflow-forms'), value: report.counts.abandoned.toLocaleString() },
    { label: __('Average completion time', 'chatflow-forms'), value: report.avgDurationMs === null ? '—' : `${Math.round(report.avgDurationMs / 1000)} s` },
  ] : [];
  return <main className="cff-admin">
    <h1>{__('Analytics', 'chatflow-forms')}</h1>
    <div className="cff-analytics-filters">
      <Field label={__('Form ID (0 = all)', 'chatflow-forms')} type="number" value={formId} onChange={setFormId} />
      <Field label={__('From (UTC)', 'chatflow-forms')} type="date" value={from} onChange={setFrom} />
      <Field label={__('To (UTC)', 'chatflow-forms')} type="date" value={to} onChange={setTo} />
      <Button disabled={loading} onClick={() => setFilters({ formId: formId || '0', from, to })}>{__('Apply filters', 'chatflow-forms')}</Button>
    </div>
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
    {loading && <p role="status">{__('Loading…', 'chatflow-forms')}</p>}
    {report && !loading && <>
      <p>{report.from} – {report.to}</p>
      <div className="cff-analytics-kpis">{kpis.map((item) => <section className="cff-card" key={item.label}><h2>{item.label}</h2><strong>{item.value}</strong></section>)}</div>
      <div className="cff-settings-grid">
        <BreakdownTable title={__('UTM sources', 'chatflow-forms')} rows={report.sources} />
        <BreakdownTable title={__('Devices', 'chatflow-forms')} rows={report.devices} />
        <BreakdownTable title={__('Step drop-off', 'chatflow-forms')} rows={report.dropoffs.map((row) => ({ label: `#${row.formId}: ${row.label}`, count: row.count }))} />
        {report.answers.map((field) => (
          <BreakdownTable key={field.fieldKey} title={field.label} rows={field.options} />
        ))}
      </div>
      <p className="description">{report.methodology}</p>
    </>}
  </main>;
}
