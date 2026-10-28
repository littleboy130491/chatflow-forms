/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { FormSettings } from './api';
import { contrastRatio } from './contrast';
import { messagingDarkColors, messagingDefaults } from './ThemeEditor';
import { buttonTextColor, safeColor } from '../runtime/appearance';

type Pair = [string, string, string];
type Look = NonNullable<FormSettings['appearance']>;
function classicPairs(appearance: Look, dark: boolean): Pair[] {
  const text = appearance.textColor ?? (dark ? '#f5f5f5' : '#171717');
  return [[__('Bot text', 'chatflow-forms'), text, appearance.botBubbleBackground ?? (dark ? '#292929' : '#f1f1f1')], [__('User text', 'chatflow-forms'), text, appearance.userBubbleBackground ?? (dark ? '#3a3a3a' : '#e5e5e5')], [__('Button text', 'chatflow-forms'), dark ? '#171717' : '#ffffff', appearance.primary ?? (dark ? '#e5e5e5' : '#171717')]];
}
/** Explicit safe colors override the defaults in both modes, just as in the visitor runtime. */
function messagingPairs(appearance: Look, dark: boolean): Pair[] {
  const defaults = dark ? messagingDarkColors : messagingDefaults;
  const c = { ...defaults, ...Object.fromEntries(Object.entries(appearance).filter(([key, value]) => Object.prototype.hasOwnProperty.call(defaults, key) && typeof value === 'string' && safeColor(value))) } as typeof messagingDefaults;
  return [
    [__('Header text', 'chatflow-forms'), c.headerText, c.headerBackground],
    [__('Bot text', 'chatflow-forms'), c.textColor, c.botBubbleBackground],
    [__('Visitor text', 'chatflow-forms'), c.userTextColor, c.userBubbleBackground],
    [__('Button text', 'chatflow-forms'), buttonTextColor(c.primary), c.primary],
  ];
}
/** One line when every pair passes; failures listed up front; full ratios on request. */
export function Contrast({ appearance = {} }: { appearance: FormSettings['appearance'] }) {
  const themes = appearance.theme === 'auto' ? ['light', 'dark'] : [appearance.theme ?? 'light'];
  const rows = themes.flatMap(theme => {
    const dark = theme === 'dark';
    const pairs = appearance.style === 'messaging' ? messagingPairs(appearance, dark) : classicPairs(appearance, dark);
    return pairs.map(([label, foreground, background]) => ({ theme, label, ratio: contrastRatio(foreground, background) }));
  });
  const failing = rows.filter(row => row.ratio !== null && row.ratio < 4.5);
  const unknown = rows.some(row => row.ratio === null);
  const line = (row: typeof rows[number]) => <li key={`${row.theme}-${row.label}`}>{row.theme} · {row.label}: {row.ratio === null ? __('Use hex colors for calculated feedback', 'chatflow-forms') : `${row.ratio.toFixed(2)}:1 · ${row.ratio >= 4.5 ? __('Pass', 'chatflow-forms') : __('Below 4.5:1', 'chatflow-forms')}`}</li>;
  return <section className="cff-contrast">
    <h3>{__('Colour contrast', 'chatflow-forms')}</h3>
    {failing.length === 0 && !unknown && <p className="cff-contrast-ok">{__('All text colours are easy to read (WCAG AA).', 'chatflow-forms')}</p>}
    {failing.length > 0 && <><p className="cff-contrast-warn">{__('Some text may be hard to read. Adjust these colours:', 'chatflow-forms')}</p><ul>{failing.map(line)}</ul></>}
    <details>
      <summary>{__('Show all contrast ratios', 'chatflow-forms')}</summary>
      <ul>{rows.map(line)}</ul>
      <p>{__('Custom CSS, focus indicators and real device behavior require separate visual checks.', 'chatflow-forms')}</p>
    </details>
  </section>;
}
