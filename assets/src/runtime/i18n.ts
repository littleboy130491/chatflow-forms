import { english, indonesian } from './phrase-catalog';
// Read WordPress i18n through a local type so this module adds no global Window declaration
// (the admin declares window.wp differently).
const wpI18n = () => (globalThis as { wp?: { i18n?: { __: (text: string, domain: string) => string } } }).wp?.i18n;
/** A form's own language wins over the page language unless it is set to follow the site. */
export function formLocale(language: string | undefined, fallback: string): string {
  return language && language !== 'site' ? language : fallback;
}
export function phrases(locale = 'en', overrides: Record<string, string> = {}): (key: string) => string {
  return key => overrides[key] ?? (/^id(?:[-_]|$)/i.test(locale) ? indonesian[key] : undefined) ?? wpI18n()?.__(english[key] ?? key, 'chatflow-forms') ?? english[key] ?? key;
}
