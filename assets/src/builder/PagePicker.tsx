/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Field } from './controls';
import { errorMessage } from './api';
import type { AdminApi } from './api';

interface PageItem { id: number; title: string; type: string }

/** Choose posts or pages by title; stores their IDs. Replaces typing comma-separated IDs. */
export function PagePicker({ api, label, help, value, onChange }: { api: AdminApi; label: string; help: string; value: number[]; onChange: (ids: number[]) => void }) {
  const [titles, setTitles] = useState<Record<number, PageItem>>({});
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PageItem[]>([]);
  const [searched, setSearched] = useState('');
  const [error, setError] = useState('');
  const missing = value.filter((id) => !titles[id]);
  useEffect(() => {
    if (!missing.length) return;
    const abort = new AbortController();
    api.request<{ items: PageItem[] }>(`admin/pages?include=${missing.join(',')}`, 'GET', undefined, abort.signal)
      .then((result) => setTitles((current) => ({ ...current, ...Object.fromEntries(result.items.map((item) => [item.id, item])) })))
      .catch((err) => { if (!abort.signal.aborted) setError(errorMessage(err)); });
    return () => abort.abort();
  }, [api, missing.join(',')]);
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const abort = new AbortController();
    const timer = setTimeout(() => {
      api.request<{ items: PageItem[] }>(`admin/pages?search=${encodeURIComponent(search.trim())}`, 'GET', undefined, abort.signal)
        .then((result) => { setResults(result.items); setSearched(search.trim()); setTitles((current) => ({ ...current, ...Object.fromEntries(result.items.map((item) => [item.id, item])) })); })
        .catch((err) => { if (!abort.signal.aborted) setError(errorMessage(err)); });
    }, 250);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [api, search]);
  return (
    <fieldset className="cff-page-picker">
      <legend>{label}</legend>
      <p className="description">{help}</p>
      {value.length > 0 && (
        <ul className="cff-page-chips">
          {value.map((id) => (
            <li key={id}>
              {/* An ID that no longer resolves is still shown so it can be removed. */}
              <span>{titles[id]?.title || sprintf(__('Page #%d', 'chatflow-forms'), id)}</span>
              <Button variant="link" aria-label={sprintf(__('Remove %s', 'chatflow-forms'), titles[id]?.title || `#${id}`)} onClick={() => onChange(value.filter((item) => item !== id))}>×</Button>
            </li>
          ))}
        </ul>
      )}
      <Field label={__('Search pages and posts', 'chatflow-forms')} value={search} onChange={setSearch} />
      {results.length > 0 && (
        <ul className="cff-page-results">
          {results.filter((item) => !value.includes(item.id)).map((item) => (
            <li key={item.id}>
              <Button variant="secondary" disabled={value.length >= 100} onClick={() => { onChange([...value, item.id]); setSearch(''); }}>
                {sprintf(/* translators: 1: page title, 2: post type */ __('Add “%1$s” (%2$s)', 'chatflow-forms'), item.title || `#${item.id}`, item.type)}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {search.trim() !== '' && searched === search.trim() && results.length === 0 && <p role="status" className="description">{__('No published pages match.', 'chatflow-forms')}</p>}
      {error && <p role="alert" className="description">{error}</p>}
    </fieldset>
  );
}
