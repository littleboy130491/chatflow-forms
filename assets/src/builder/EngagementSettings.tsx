/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Check, Field, Select } from './controls';
import type { FormDTO, FormSettings } from './api';

export function pageIds(value: string): number[] {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 500 || parts.some((part) => !/^[1-9]\d*$/.test(part) || !Number.isSafeInteger(Number(part)))) return [];
  return [...new Set(parts.map(Number))];
}
export function EngagementSettings({form,onChange}: {form:FormDTO; onChange:(form:FormDTO)=>void}) {
  const display = form.settings.display ?? {}, launcher = display.launcher ?? {};
  const patch = (value: Partial<NonNullable<FormSettings['display']>>) => onChange({...form,settings:{...form.settings,display:{...display,...value}}});
  const launch = (value: Partial<NonNullable<NonNullable<FormSettings['display']>['launcher']>>) => patch({launcher:{...launcher,...value}});
  return <section className="cff-card"><h2>{__('Display and site-wide launcher rules','chatflow-forms')}</h2>
    <Select label={__('Default embed mode','chatflow-forms')} value={display.mode ?? 'inline'} choices={['inline','fullpage','launcher','popup'].map((value)=>({value,label:value}))}
      onChange={(mode)=>patch({mode:mode as NonNullable<NonNullable<FormSettings['display']>['mode']>})} />
    <Check label={__('Enable site-wide launcher','chatflow-forms')} value={launcher.enabled ?? false} onChange={(enabled)=>launch({enabled})} />
    <Select label={__('Launcher position','chatflow-forms')} value={launcher.position ?? 'right'} choices={['left','right'].map((value)=>({value,label:value}))} onChange={(position)=>launch({position:position as 'left'|'right'})} />
    <Field label={__('Auto-open after seconds (blank = off)','chatflow-forms')} type="number" value={launcher.autoOpenSeconds ?? ''} onChange={(value)=>launch({autoOpenSeconds:value === '' ? null : Number(value)})} />
    <Field label={__('Open after scroll percentage (blank = off)','chatflow-forms')} type="number" value={launcher.scrollPercent ?? ''} onChange={(value)=>launch({scrollPercent:value === '' ? null : Number(value)})} />
    {(['includePageIds','excludePageIds'] as const).map((key)=><Field key={key} label={key === 'includePageIds' ? __('Include page IDs (comma-separated; blank = all)','chatflow-forms') : __('Exclude page IDs (exclusions win)','chatflow-forms')} value={(launcher[key] ?? []).join(',')}
      onChange={(value)=>{const ids=pageIds(value);if (!value.trim() || ids.length) launch({[key]:ids});}} />)}
    <p>{__('Rules apply to published settings; review and publish before they affect visitors. Inline embeds remain explicit. Automatic opening must respect consent and reduced motion.','chatflow-forms')}</p>
  </section>;
}
