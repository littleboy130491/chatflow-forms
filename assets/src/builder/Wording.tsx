/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Field, Select } from './controls';
import { english, indonesian } from '../runtime/phrase-catalog';

const visitorPhrases = { en: english, id: indonesian };
import type { FormSettings } from './api';

type Language = NonNullable<FormSettings['language']>;

/**
 * Form language plus per-phrase overrides. Each built-in phrase shows its default as the
 * placeholder, so admins edit wording without knowing the internal phrase keys.
 */
export function WordingEditor({ settings, siteLocale = 'en', onChange }: { settings: FormSettings; siteLocale?: string | undefined; onChange: (settings: FormSettings) => void }) {
  const [search, setSearch] = useState('');
  const language: Language = settings.language ?? 'site';
  const overrides = settings.phrases ?? {};
  const indonesian = language === 'id' || (language === 'site' && /^id(?:[-_]|$)/i.test(siteLocale));
  const defaults: Record<string, string> = indonesian ? visitorPhrases.id : visitorPhrases.en;
  const keys = Object.keys(visitorPhrases.en);
  const query = search.trim().toLowerCase();
  const matches = (key: string) => !query || [defaults[key], visitorPhrases.en[key], overrides[key]].some(text => text?.toLowerCase().includes(query));
  // Changed phrases first, so the admin sees what is customised without scrolling.
  const shown = keys.filter(matches).sort((a, b) => Number(b in overrides) - Number(a in overrides));
  const unknown = Object.keys(overrides).filter(key => !keys.includes(key));
  const setPhrase = (key: string, value: string) => {
    const next = { ...overrides };
    if (value.trim()) next[key] = value;
    else delete next[key];
    onChange({ ...settings, phrases: next });
  };
  return (
    <div className="cff-wording">
      <Select
        label={__('Form language', 'chatflow-forms')}
        value={language}
        choices={[
          { value: 'site', label: __('Same as the page (site language)', 'chatflow-forms') },
          { value: 'en', label: __('English', 'chatflow-forms') },
          { value: 'id', label: __('Bahasa Indonesia', 'chatflow-forms') },
        ]}
        onChange={(value) => onChange({ ...settings, language: value as Language })}
      />
      <p className="description">
        {__('Sets the language of the buttons, hints and messages the chat shows on its own (Continue, Skip, Start over, error messages). Your questions and endings are written on the Build tab.', 'chatflow-forms')}
      </p>
      <h3>{__('Change the wording', 'chatflow-forms')}</h3>
      <p className="description">
        {sprintf(
          /* translators: %d: number of customised phrases */
          __('Leave a box empty to use the default shown in it. %d phrases changed.', 'chatflow-forms'),
          Object.keys(overrides).length,
        )}
      </p>
      <Field label={__('Find a phrase', 'chatflow-forms')} value={search} onChange={setSearch} />
      <div className="cff-wording-list">
        {shown.map((key) => (
          <Field
            key={key}
            label={defaults[key] ?? visitorPhrases.en[key] ?? key}
            value={overrides[key] ?? ''}
            placeholder={defaults[key] ?? visitorPhrases.en[key] ?? ''}
            onChange={(value) => setPhrase(key, value)}
          />
        ))}
        {shown.length === 0 && <p role="status">{__('No phrase matches that search.', 'chatflow-forms')}</p>}
        {unknown.map((key) => (
          <Field key={key} label={sprintf(__('Custom phrase “%s”', 'chatflow-forms'), key)} value={overrides[key] ?? ''} onChange={(value) => setPhrase(key, value)} />
        ))}
      </div>
    </div>
  );
}
