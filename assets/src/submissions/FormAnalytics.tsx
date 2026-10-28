/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export interface FormAnalyticsReport {
  from: string; to: string; timezone: string; views: number; starts: number; completions: number;
  completionRate: number | null; averageDurationMs: number;
  steps: {id: string; label: string; views: number; answers: number; dropOff: number; back: number; abandon: number}[];
  distributions: {key: string; label: string; options: {value: string; label: string; count: number}[]; unknownCount: number}[];
  sources: {label: string; count: number}[]; devices: {label: string; count: number}[];
  variants: {id: string; starts: number; completions: number}[];
}
/** One form's question-by-question funnel, A/B variants and answer breakdowns. */
export function FormFunnel({ report }: { report: FormAnalyticsReport }) {
  const variants = report.variants.filter(row => row.id);
  return <>
    <section className="cff-card"><h2>{__('Where visitors stop', 'chatflow-forms')}</h2>
      <p className="description">{__('Visitors who saw and answered each question. “Stopped here” is seen minus answered; branches can skip questions, so it is a guide rather than proof of abandonment.', 'chatflow-forms')}</p>
      <table className="widefat striped"><thead><tr>{[__('Question','chatflow-forms'),__('Saw it','chatflow-forms'),__('Answered','chatflow-forms'),__('Stopped here','chatflow-forms'),__('Went back','chatflow-forms'),__('Closed the chat','chatflow-forms')].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{report.steps.map((step) => <tr key={step.id}><th scope="row">{step.label}</th>{[step.views,step.answers,step.dropOff,step.back,step.abandon].map((n,i) => <td key={i}>{n}</td>)}</tr>)}</tbody></table>
    </section>
    {report.distributions.length > 0 && <section className="cff-card"><h2>{__('How people answered', 'chatflow-forms')}</h2>
      <p className="description">{__('Completed responses only. Multiple-choice answers can count more than once per response.', 'chatflow-forms')}</p>
      {report.distributions.map((distribution) => {
        const max = Math.max(1, ...distribution.options.map(option => option.count));
        return <section key={distribution.key}><h3>{distribution.label}</h3>
          {distribution.options.map((option) => <div key={option.value} className="cff-analytics-row">
            <div><span>{option.label}</span><strong>{option.count}</strong></div>
            <div className="cff-analytics-track"><span style={{ width: `${100 * option.count / max}%` }} /></div>
          </div>)}
          {distribution.unknownCount > 0 && <p className="description">{__('Removed / unknown options', 'chatflow-forms')}: {distribution.unknownCount}</p>}
        </section>;
      })}
    </section>}
    {variants.length > 0 && <section className="cff-card"><h2>{__('A/B test variants', 'chatflow-forms')}</h2>
      <table className="widefat striped"><thead><tr><th scope="col">{__('Variant', 'chatflow-forms')}</th><th scope="col">{__('Starts', 'chatflow-forms')}</th><th scope="col">{__('Completions', 'chatflow-forms')}</th></tr></thead><tbody>
        {variants.map(row => <tr key={row.id}><th scope="row">{row.id}</th><td>{row.starts}</td><td>{row.completions}</td></tr>)}
      </tbody></table>
    </section>}
  </>;
}
