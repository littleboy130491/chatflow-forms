/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AdminApi, errorMessage, queryString } from '../builder/api';
import { Button, Field, Notice } from '../builder/controls';
import { FormFunnel, type FormAnalyticsReport } from './FormAnalytics';
import { defaultRange } from './analytics-dates';
import { FormPicker, decodeTitle } from './FormPicker';

interface Breakdown { label: string; count: number }
interface Dropoff extends Breakdown { formId: number; stepId: string }
interface AnalyticsReport {
  from: string; to: string; formId: number;
  counts: { views: number; starts: number; completed: number; partial: number; abandoned: number };
  completionRate: number; viewStartRate: number | null; avgDurationMs: number | null;
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
      <div><span>{decodeTitle(row.label)}</span><strong>{row.count}</strong></div>
      <div className="cff-analytics-track"><span style={{ width: `${100 * row.count / max}%` }} /></div>
    </div>)}
  </section>;
}
export function Analytics({ api }: { api: AdminApi }) {
  // One report, one form picker, one date range, all in the site time zone.
  const timezone = api.config.timezone || 'UTC';
  const [initial] = useState(() => defaultRange(timezone));
  const [formId, setFormId] = useState('0');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [filters, setFilters] = useState({ formId: '0', ...initial });
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [formReport, setFormReport] = useState<FormAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError(''); setReport(null); setFormReport(null);
    const single = filters.formId !== '0';
    Promise.all([
      api.request<AnalyticsReport>(`admin/analytics?${queryString(filters)}`, 'GET', undefined, abort.signal),
      single ? api.request<FormAnalyticsReport>(`admin/analytics/form?${queryString(filters)}`, 'GET', undefined, abort.signal) : Promise.resolve(null),
    ])
      .then(([overview, details]) => { setReport(overview); setFormReport(details); })
      // Never leave the previous range's numbers under the new dates.
      .catch((err) => { if (!abort.signal.aborted) setError(errorMessage(err)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [api, filters]);
  const apply = () => {
    if (!from || !to) {
      setError(__('Choose both dates.', 'chatflow-forms'));
      return;
    }
    if (from > to) {
      setError(__('The start date must be before the end date.', 'chatflow-forms'));
      return;
    }
    if (Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1 > 367) {
      setError(__('Choose a date range of 367 days or less.', 'chatflow-forms'));
      return;
    }
    setFilters({ formId: formId || '0', from, to });
  };
  const kpis = report ? [
    { label: __('Views', 'chatflow-forms'), value: report.counts.views.toLocaleString() },
    { label: __('Started', 'chatflow-forms'), value: report.counts.starts.toLocaleString() },
    { label: __('Completed', 'chatflow-forms'), value: report.counts.completed.toLocaleString() },
    { label: __('Completion rate', 'chatflow-forms'), value: `${report.completionRate}%` },
    { label: __('Unfinished (partial)', 'chatflow-forms'), value: report.counts.partial.toLocaleString() },
    { label: __('Abandoned', 'chatflow-forms'), value: report.counts.abandoned.toLocaleString() },
    { label: __('Average time to complete', 'chatflow-forms'), value: report.avgDurationMs === null ? '—' : `${Math.round(report.avgDurationMs / 1000)} s` },
  ] : [];
  return <main className="cff-admin cff-analytics-page">
    <div className="cff-page-head">
      <div>
        <h1>{__('Analytics', 'chatflow-forms')}</h1>
        <p>{sprintf(/* translators: %s: site time zone */ __('Dates use your site time zone (%s).', 'chatflow-forms'), timezone)}</p>
      </div>
    </div>
    <div className="cff-analytics-filters" aria-label={__('Analytics filters', 'chatflow-forms')}>
      <FormPicker api={api} value={formId === '0' ? '' : formId} onChange={next => setFormId(next || '0')} />
      <Field label={__('From', 'chatflow-forms')} type="date" value={from} onChange={setFrom} />
      <Field label={__('To', 'chatflow-forms')} type="date" value={to} onChange={setTo} />
      <Button variant="primary" disabled={loading} onClick={apply}>{__('Show report', 'chatflow-forms')}</Button>
    </div>
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
    {loading && <p role="status">{__('Loading…', 'chatflow-forms')}</p>}
    {report && !loading && <>
      <div className="cff-analytics-kpis">{kpis.map((item) => <section className="cff-card" key={item.label}><h2>{item.label}</h2><strong>{item.value}</strong></section>)}</div>
      {formReport && <FormFunnel report={formReport} />}
      <div className="cff-settings-grid">
        <BreakdownTable title={__('Where visitors came from', 'chatflow-forms')} rows={report.sources} />
        <BreakdownTable title={__('Devices', 'chatflow-forms')} rows={report.devices} />
        {!formReport && <BreakdownTable title={__('Questions where visitors stopped most', 'chatflow-forms')} rows={report.dropoffs.map((row) => ({ label: `#${row.formId}: ${row.label}`, count: row.count }))} />}
      </div>
      {!formReport && <p className="description">{__('Choose a form above to see its question-by-question funnel and answer breakdowns.', 'chatflow-forms')}</p>}
      <details className="cff-analytics-method"><summary>{__('How these numbers are counted', 'chatflow-forms')}</summary><p>{report.methodology}</p></details>
    </>}
  </main>;
}
