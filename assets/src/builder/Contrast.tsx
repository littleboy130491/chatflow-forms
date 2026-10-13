/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { FormSettings } from './api';
import { contrastRatio } from './contrast';

export function Contrast({ appearance = {} }: { appearance: FormSettings['appearance'] }) {
  const themes = appearance.theme === 'auto' ? ['light', 'dark'] : [appearance.theme ?? 'light'];
  return <section><h3>{__('Contrast feedback (WCAG AA normal text)', 'chatflow-forms')}</h3>
    {themes.map(theme => {
      const dark = theme === 'dark', text = appearance.textColor ?? (dark ? '#f5f5f5' : '#171717');
      const pairs = [[__('Bot text', 'chatflow-forms'), text, appearance.botBubbleBackground ?? (dark ? '#292929' : '#f1f1f1')], [__('User text', 'chatflow-forms'), text, appearance.userBubbleBackground ?? (dark ? '#3a3a3a' : '#e5e5e5')], [__('Button text', 'chatflow-forms'), dark ? '#171717' : '#ffffff', appearance.primary ?? (dark ? '#e5e5e5' : '#171717')]];
      return <ul key={theme}>{pairs.map(([label, foreground, background]) => { const ratio = contrastRatio(foreground!, background!); return <li key={label}>{theme} · {label}: {ratio === null ? __('Use hex colors for calculated feedback', 'chatflow-forms') : `${ratio.toFixed(2)}:1 · ${ratio >= 4.5 ? __('Pass', 'chatflow-forms') : __('Below 4.5:1', 'chatflow-forms')}`}</li>; })}</ul>;
    })}
    <p>{__('Custom CSS, focus indicators and real device behavior require separate visual checks.', 'chatflow-forms')}</p>
  </section>;
}
