/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Field, Notice, Select } from '../builder/controls';
import { can, errorMessage, type AdminApi } from '../builder/api';

/** Decode WordPress titles as text only, never as trusted markup. */
export function decodeTitle(title: string): string {
  const element = document.createElement('textarea');
  element.innerHTML = title;
  return element.value;
}
export function FormPicker({ api, value, onChange }: { api: AdminApi; value: string; onChange: (value: string) => void }) {
  const [forms, setForms] = useState<{ id: number; title: string }[]>([]);
  const [search, setSearch] = useState(''), [page, setPage] = useState(1), [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<{ id: number; title: string } | undefined>();
  const [query, setQuery] = useState('');
  // Wait for a pause in typing before querying the forms endpoint.
  useEffect(() => {
    if (query === search) return;
    const timer = setTimeout(() => { setSearch(query); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    const path = can(api.config, 'view_submissions') ? `admin/analytics/forms?page=${page}&search=${encodeURIComponent(search)}` : `admin/export-forms?page=${page}&perPage=50`;
    void api.request<{ items: typeof forms; pages?: number; total?: number }>(path, 'GET', undefined, abort.signal)
      .then(result => { setForms(result.items); setPages(result.pages ?? Math.ceil((result.total ?? 0) / 50)); })
      .catch(err => { if (!abort.signal.aborted) setError(errorMessage(err)); });
    return () => abort.abort();
  }, [api, page, search]);
  const choices = [...forms];
  if (selected && !choices.some(form => form.id === selected.id)) choices.push(selected);
  if (value && !choices.some(form => String(form.id) === value)) choices.push({ id: Number(value), title: `${__('Form', 'chatflow-forms')} #${value}` });
  return <div className="cff-form-picker">
    <Select label={__('Form', 'chatflow-forms')} value={value} choices={[{ value: '', label: __('All forms', 'chatflow-forms') }, ...choices.map(form => ({ value: String(form.id), label: decodeTitle(form.title) }))]} onChange={next => { setSelected(choices.find(form => String(form.id) === next)); onChange(next); }} />
    <details className="cff-form-search"><summary>{__('Find more forms', 'chatflow-forms')}</summary>
      {can(api.config, 'view_submissions') && <Field label={__('Find a form', 'chatflow-forms')} value={query} onChange={setQuery} />}
      <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>{__('Previous forms', 'chatflow-forms')}</Button>
      <Button disabled={page >= pages} onClick={() => setPage(page + 1)}>{__('Next forms', 'chatflow-forms')}</Button>
    </details>
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
  </div>;
}
