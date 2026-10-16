/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AdminApi, errorMessage } from '../builder/api';
import { Button, Field, Notice, Select } from '../builder/controls';

export interface FormAnalyticsReport {
  from: string; to: string; timezone: string; views: number; starts: number; completions: number;
  completionRate: number | null; averageDurationMs: number;
  steps: {id: string; label: string; views: number; answers: number; dropOff: number; back: number; abandon: number}[];
  distributions: {key: string; label: string; options: {value: string; label: string; count: number}[]; unknownCount: number}[];
  sources: {label: string; count: number}[]; devices: {label: string; count: number}[];
  variants: {id: string; starts: number; completions: number}[];
}
/** Per-form step funnel, experiment variants and answer distributions from anonymous events. */
export function FormAnalytics({ api }: {api: AdminApi}) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(today), [formId, setFormId] = useState('');
  const [forms, setForms] = useState<{id: number; title: string}[]>([]), [search, setSearch] = useState('');
  const [page, setPage] = useState(1), [pages, setPages] = useState(0);
  const [report, setReport] = useState<FormAnalyticsReport | null>(null), [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    api.request<{items: typeof forms; pages: number}>(`admin/analytics/forms?page=${page}&search=${encodeURIComponent(search)}`, 'GET', undefined, abort.signal)
      .then((result) => {setForms(result.items); setPages(result.pages);})
      .catch((err) => {if (!abort.signal.aborted) setError(errorMessage(err));});
    return () => abort.abort();
  }, [api, page, search]);
  return <section className="cff-form-analytics">
    <h2>{__('Form funnel and experiments', 'chatflow-forms')}</h2>
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
    <section className="cff-card">
      <Field label={__('Find a form', 'chatflow-forms')} value={search} onChange={(next) => {setSearch(next); setPage(1);}} />
      <Select label={__('Form', 'chatflow-forms')} value={formId} choices={[{value:'', label:__('Choose a form', 'chatflow-forms')}, ...forms.map((form) => ({value:String(form.id), label:form.title}))]} onChange={(id) => {setFormId(id); setReport(null);}} />
      <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>{__('Previous forms', 'chatflow-forms')}</Button>
      <Button disabled={page >= pages} onClick={() => setPage(page + 1)}>{__('Next forms', 'chatflow-forms')}</Button>
      <Field type="date" label={__('From', 'chatflow-forms')} value={from} onChange={setFrom} />
      <Field type="date" label={__('To (inclusive)', 'chatflow-forms')} value={to} onChange={setTo} />
      <Button variant="primary" disabled={busy || !formId || !from || !to} onClick={async () => {
        setBusy(true); setError(''); setReport(null);
        try { setReport(await api.request<FormAnalyticsReport>(`admin/analytics/form?formId=${formId}&from=${from}&to=${to}`)); }
        catch(err) {setError(errorMessage(err));} finally {setBusy(false);}
      }}>{__('Load analytics', 'chatflow-forms')}</Button>
    </section>
    {busy && <p role="status">{__('Loading analytics…', 'chatflow-forms')}</p>}
    {report && <>
      <section className="cff-card"><h2>{__('Funnel', 'chatflow-forms')}</h2>
        <p>{report.from} – {report.to} ({report.timezone})</p>
        <dl>{[
          [__('Recorded views', 'chatflow-forms'), report.views], [__('Server starts', 'chatflow-forms'), report.starts],
          [__('Server completions', 'chatflow-forms'), report.completions], [__('Period completion/start ratio', 'chatflow-forms'), report.completionRate === null ? '—' : `${report.completionRate}%`],
          [__('Average completion seconds', 'chatflow-forms'), Math.round(report.averageDurationMs / 1000)],
        ].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p>{__('Starts and completions are independent period totals, not a cohort conversion rate; resumed sessions can make the ratio exceed 100%. Opt-out, consent, DNT/GPC and retention can reduce recorded views.', 'chatflow-forms')}</p>
      </section>
      <section className="cff-card"><h2>{__('Step engagement and drop-off', 'chatflow-forms')}</h2>
        <p>{__('Distinct sessions per step. Drop-off = viewed minus answered (floor zero), not proof of abandonment; branches, opt-out and retained history affect counts. Labels use the current draft.', 'chatflow-forms')}</p>
        <table className="widefat striped"><thead><tr>{[__('Step','chatflow-forms'),__('Viewed','chatflow-forms'),__('Answered','chatflow-forms'),__('Drop-off','chatflow-forms'),__('Back','chatflow-forms'),__('Abandon','chatflow-forms')].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{report.steps.map((step) => <tr key={step.id}><th scope="row">{step.label}</th>{[step.views,step.answers,step.dropOff,step.back,step.abandon].map((n,i) => <td key={i}>{n}</td>)}</tr>)}</tbody></table>
      </section>
      <section className="cff-card"><h2>{__('Experiment variants', 'chatflow-forms')}</h2>
        <p>{__('Starts are grouped by assigned session variant. Completions count only those sessions completed during the selected period; these are not conversion rates.', 'chatflow-forms')}</p>
        <table className="widefat striped"><thead><tr><th scope="col">{__('Variant', 'chatflow-forms')}</th><th scope="col">{__('Starts', 'chatflow-forms')}</th><th scope="col">{__('Completions', 'chatflow-forms')}</th></tr></thead><tbody>
          {report.variants.filter(row => row.id).map(row => <tr key={row.id}><th scope="row">{row.id}</th><td>{row.starts}</td><td>{row.completions}</td></tr>)}
        </tbody></table>
      </section>
      <section className="cff-card"><h2>{__('Answer distributions', 'chatflow-forms')}</h2><p>{__('Completed submissions only. Current option labels; removed options grouped without exposing Other text. Multi-choice can count more than once per submission.', 'chatflow-forms')}</p>
        {report.distributions.map((distribution) => <section key={distribution.key}><h3>{distribution.label}</h3><ul>{distribution.options.map((option) => <li key={option.value}>{option.label}: {option.count}</li>)}<li>{__('Removed / unknown options', 'chatflow-forms')}: {distribution.unknownCount}</li></ul></section>)}
      </section>
      {[{label:__('Sources','chatflow-forms'), data:report.sources}, {label:__('Devices','chatflow-forms'), data:report.devices}].map(({label,data}) => <section key={label} className="cff-card"><h2>{label}</h2><p>{__('Non-spam/non-trash submissions created in the range. Sources use UTM source, then referrer hostname; no URLs or query strings returned.', 'chatflow-forms')}</p><ul>{data.map((row) => <li key={row.label}>{row.label}: {row.count}</li>)}</ul></section>)}
    </>}
  </section>;
}
