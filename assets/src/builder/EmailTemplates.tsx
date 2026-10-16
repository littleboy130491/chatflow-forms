/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { AdminApi } from './api';
import { errorMessage } from './api';
import { Button, Field, Notice, Select } from './controls';

interface Content { id: string; title: string; subject: string; body: string }
export function EmailTemplates({ api, content, onLoad }: { api: AdminApi; content: {subject: string; body: string}; onLoad: (content: {subject: string; body: string}) => void }) {
  const [items, setItems] = useState<Content[]>([]), [selected, setSelected] = useState(''), [title, setTitle] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { let active = true; void api.request<{items: Content[]}>('admin/notifications/templates').then(result => { if (active) setItems(result.items); }).catch(err => { if (active) setError(errorMessage(err)); }); return () => { active = false; }; }, [api]);
  const mutate = async (method: string, data: unknown) => {
    setBusy(true); setError('');
    try { setItems((await api.request<{items: Content[]}>('admin/notifications/templates', method, data)).items); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  return <fieldset><legend>{__('Reusable email content', 'chatflow-forms')}</legend>
    <Select label={__('Saved template', 'chatflow-forms')} value={selected} choices={[{value: '', label: __('Choose template', 'chatflow-forms')}, ...items.map(item => ({value: item.id, label: item.title}))]} onChange={setSelected} />
    <Button disabled={busy || !selected} onClick={() => { const template = items.find(item => item.id === selected); if (template && window.confirm(__('Replace this email subject and body? Routing and recipients stay unchanged.', 'chatflow-forms'))) onLoad({ subject: template.subject, body: template.body }); }}>{__('Load template', 'chatflow-forms')}</Button>
    <Button isDestructive disabled={busy || !selected} onClick={() => { if (window.confirm(__('Delete saved content template?', 'chatflow-forms'))) void mutate('DELETE', {id: selected}); }}>{__('Delete template', 'chatflow-forms')}</Button>
    <Field label={__('New template name', 'chatflow-forms')} value={title} onChange={setTitle} />
    <Button disabled={busy || !title.trim()} onClick={() => { void mutate('POST', { title, subject: content.subject, body: content.body }); }}>{__('Save email content as template', 'chatflow-forms')}</Button>
    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
  </fieldset>;
}
