/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from '@wordpress/element';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { AdminConfig, FormDTO, FormSettings } from './api';
import { cleanupPreview, mountPublicPreview, publicDraft, type PreviewHandle } from './Preview';
import type { PublicSchemaEnvelope } from '../shared/contracts';

export type Appearance = NonNullable<FormSettings['appearance']>;
type ColorKey = 'primary' | 'headerBackground' | 'headerText' | 'chatBackground' | 'botBubbleBackground' | 'textColor' | 'userBubbleBackground' | 'userTextColor';

/** Defaults the visitor runtime uses for messaging style when a colour is left empty. */
export const messagingDefaults: Record<ColorKey, string> = {
  primary: '#3390ec', headerBackground: '#ffffff', headerText: '#000000', chatBackground: '#dbe6ee',
  botBubbleBackground: '#ffffff', textColor: '#000000', userBubbleBackground: '#e1fec6', userTextColor: '#000000',
};
/** Built-in messaging dark mode colours (mirrors the runtime stylesheet). */
export const messagingDarkColors: Record<ColorKey, string> = {
  primary: '#5eb5f7', headerBackground: '#17212b', headerText: '#f5f5f5', chatBackground: '#0e1621',
  botBubbleBackground: '#182533', textColor: '#f5f5f5', userBubbleBackground: '#2b5278', userTextColor: '#ffffff',
};
const classicDefaults: Record<ColorKey, string> = {
  primary: '#171717', headerBackground: '#ffffff', headerText: '#171717', chatBackground: '#ffffff',
  botBubbleBackground: '#f1f1f1', textColor: '#171717', userBubbleBackground: '#e5e5e5', userTextColor: '#171717',
};

interface Palette { id: string; label: string; theme: 'light' | 'dark'; wallpaper: NonNullable<Appearance['wallpaper']>; colors: Record<ColorKey, string> }
export const palettes = (): Palette[] => [
  { id: 'sky', label: __('Sky', 'chatflow-forms'), theme: 'light', wallpaper: 'doodle', colors: { ...messagingDefaults, primary: '#2271b1' } },
  { id: 'meadow', label: __('Meadow', 'chatflow-forms'), theme: 'light', wallpaper: 'doodle', colors: { primary: '#008069', headerBackground: '#008069', headerText: '#ffffff', chatBackground: '#efe7de', botBubbleBackground: '#ffffff', textColor: '#111b21', userBubbleBackground: '#d9fdd3', userTextColor: '#111b21' } },
  { id: 'lavender', label: __('Lavender', 'chatflow-forms'), theme: 'light', wallpaper: 'gradient', colors: { primary: '#7b5cff', headerBackground: '#ffffff', headerText: '#1e1b3a', chatBackground: '#ece8ff', botBubbleBackground: '#ffffff', textColor: '#1e1b3a', userBubbleBackground: '#7b5cff', userTextColor: '#ffffff' } },
  { id: 'sunset', label: __('Sunset', 'chatflow-forms'), theme: 'light', wallpaper: 'dots', colors: { primary: '#f0602b', headerBackground: '#fff4ec', headerText: '#3a1d0e', chatBackground: '#fde6d5', botBubbleBackground: '#ffffff', textColor: '#3a1d0e', userBubbleBackground: '#f0602b', userTextColor: '#ffffff' } },
  { id: 'graphite', label: __('Graphite', 'chatflow-forms'), theme: 'light', wallpaper: 'none', colors: { primary: '#18181b', headerBackground: '#ffffff', headerText: '#18181b', chatBackground: '#f4f4f5', botBubbleBackground: '#ffffff', textColor: '#18181b', userBubbleBackground: '#18181b', userTextColor: '#ffffff' } },
  { id: 'night', label: __('Night', 'chatflow-forms'), theme: 'dark', wallpaper: 'doodle', colors: { primary: '#5eb5f7', headerBackground: '#17212b', headerText: '#f5f5f5', chatBackground: '#0e1621', botBubbleBackground: '#182533', textColor: '#f5f5f5', userBubbleBackground: '#2b5278', userTextColor: '#ffffff' } },
];

const colorFields = (): { key: ColorKey; label: string }[] => [
  { key: 'primary', label: __('Accent (buttons, links, ticks)', 'chatflow-forms') },
  { key: 'headerBackground', label: __('Header background', 'chatflow-forms') },
  { key: 'headerText', label: __('Header text', 'chatflow-forms') },
  { key: 'chatBackground', label: __('Chat background', 'chatflow-forms') },
  { key: 'botBubbleBackground', label: __('Bot bubble', 'chatflow-forms') },
  { key: 'textColor', label: __('Bot text', 'chatflow-forms') },
  { key: 'userBubbleBackground', label: __('Visitor bubble', 'chatflow-forms') },
  { key: 'userTextColor', label: __('Visitor text', 'chatflow-forms') },
];

/** Apply a palette: colours, light/dark and the palette's wallpaper, keeping every other choice. */
export function applyPalette(appearance: Appearance, palette: Palette): Appearance {
  return { ...appearance, ...palette.colors, style: 'messaging', theme: palette.theme, wallpaper: palette.wallpaper };
}
const hex = (value: string | undefined) => (value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined);

/** Sample conversation so every themed part (bubbles, tails, answer buttons) is visible while styling. */
export function sampleEnvelope(form: FormDTO, config: AdminConfig): PublicSchemaEnvelope {
  const envelope = publicDraft(form, config);
  envelope.form.schema = {
    ...envelope.form.schema,
    bot: { ...envelope.form.schema.bot, typingSpeed: 'off' },
    steps: [
      { id: 'theme_goal', key: 'theme_goal', type: 'single_choice', label: __('Goal', 'chatflow-forms'), required: true, messages: [__('Hi there! 👋', 'chatflow-forms'), __('What brings you here today?', 'chatflow-forms')], options: [{ id: 'theme_quote', value: 'quote', label: __('Get a quote', 'chatflow-forms') }, { id: 'theme_question', value: 'question', label: __('Ask a question', 'chatflow-forms') }] },
      { id: 'theme_when', key: 'theme_when', type: 'single_choice', label: __('Timing', 'chatflow-forms'), required: true, messages: [__('Great choice. When would you like to start?', 'chatflow-forms')], options: [{ id: 'theme_now', value: 'now', label: __('This week', 'chatflow-forms') }, { id: 'theme_month', value: 'month', label: __('This month', 'chatflow-forms') }, { id: 'theme_later', value: 'later', label: __('Just exploring', 'chatflow-forms') }] },
      { id: 'theme_summary', key: 'theme_summary', type: 'summary', label: __('Summary', 'chatflow-forms'), messages: [] },
    ],
  };
  return envelope;
}

function ThemePreview({ form, config }: { form: FormDTO; config: AdminConfig }) {
  const host = useRef<HTMLDivElement>(null), handle = useRef<PreviewHandle | (() => void) | void>(), latest = useRef(form);
  latest.current = form;
  const [error, setError] = useState('');
  const appearance = JSON.stringify(form.settings.appearance ?? {});
  useEffect(() => {
    let cancelled = false;
    const current = host.current;
    if (!current) return;
    mountPublicPreview(current, sampleEnvelope(latest.current, config), config, {}, () => !cancelled, { previewAnswers: { theme_goal: 'quote' } })
      .then(result => { if (cancelled) cleanupPreview(result); else handle.current = result; })
      .catch(() => { if (!cancelled) setError(__('The live preview is unavailable. Rebuild the plugin assets.', 'chatflow-forms')); });
    return () => { cancelled = true; cleanupPreview(handle.current); handle.current = undefined; };
  }, [config, form.schema.bot.name]);
  // Colour changes restyle the running sample instead of restarting it.
  useEffect(() => {
    const current = handle.current;
    if (current && typeof current === 'object') current.setAppearance?.(JSON.parse(appearance) as Appearance);
  }, [appearance]);
  return <div className="cff-theme-preview" aria-label={__('Live theme preview', 'chatflow-forms')} role="region">
    {error ? <p>{error}</p> : <div ref={host} />}
  </div>;
}

export function ColorField({ label, value, fallback, onChange }: { label: string; value: string | undefined; fallback: string; onChange: (value: string | undefined) => void }) {
  const id = `cff-color-${label.replace(/\W+/g, '-').toLowerCase()}`;
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  return <div className="cff-color-field">
    <label htmlFor={id}>{label}</label>
    <div>
      <input type="color" aria-label={label} value={hex(value) ?? fallback} onChange={event => onChange(event.currentTarget.value)} />
      <input id={id} type="text" value={draft} placeholder={fallback} maxLength={32} spellCheck={false}
        onChange={event => setDraft(event.currentTarget.value)}
        onBlur={() => onChange(draft.trim() || undefined)} />
      {value !== undefined && <button type="button" className="button-link" onClick={() => onChange(undefined)}>{__('Default', 'chatflow-forms')}</button>}
    </div>
  </div>;
}

function Segmented<T extends string>({ label, value, choices, onChange }: { label: string; value: T; choices: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="cff-segmented"><legend>{label}</legend><div>
    {choices.map(choice => <button type="button" key={choice.value} aria-pressed={value === choice.value} onClick={() => onChange(choice.value)}>{choice.label}</button>)}
  </div></fieldset>;
}

/** Visual theme editor for the visitor chat; changes show in the live sample immediately. */
export function ThemeEditor({ form, config, onChange }: { form: FormDTO; config: AdminConfig; onChange: (appearance: Appearance) => void }) {
  const appearance: Appearance = form.settings.appearance ?? {};
  const messaging = appearance.style === 'messaging';
  const defaults = messaging ? messagingDefaults : classicDefaults;
  const set = (patch: Partial<Appearance>) => {
    const next: Appearance = { ...appearance, ...patch };
    for (const key of Object.keys(patch) as (keyof Appearance)[]) if (patch[key] === undefined) delete next[key];
    onChange(next);
  };
  return <section className="cff-card cff-theme">
    <div className="cff-theme-controls">
      <h2>{__('Chat theme', 'chatflow-forms')}</h2>
      <fieldset className="cff-style-cards"><legend>{__('Style', 'chatflow-forms')}</legend><div>
        {([
          ['messaging', __('Messaging', 'chatflow-forms'), __('Modern messenger look: wallpaper, bubbles with tails and keyboard-style answer buttons.', 'chatflow-forms')],
          ['classic', __('Classic', 'chatflow-forms'), __('Plain, compact bubbles that blend into any page.', 'chatflow-forms')],
        ] as const).map(([value, label, help]) => <button type="button" key={value} aria-pressed={(appearance.style ?? 'classic') === value} onClick={() => set({ style: value })}>
          <span className={`cff-style-thumb is-${value}`} aria-hidden="true"><i /><i /><i /></span>
          <strong>{label}</strong><small>{help}</small>
        </button>)}
      </div></fieldset>
      {messaging && <fieldset className="cff-palettes"><legend>{__('Palette', 'chatflow-forms')}</legend><div>
        {palettes().map(palette => <button type="button" key={palette.id} onClick={() => onChange(applyPalette(appearance, palette))} aria-label={palette.label}>
          <span className="cff-palette-swatch" aria-hidden="true" style={{ background: palette.colors.chatBackground }}>
            <i style={{ background: palette.colors.headerBackground, borderColor: palette.colors.primary }} />
            <i style={{ background: palette.colors.botBubbleBackground }} />
            <i style={{ background: palette.colors.userBubbleBackground }} />
          </span>{palette.label}
        </button>)}
      </div></fieldset>}
      <Segmented label={__('Light or dark', 'chatflow-forms')} value={appearance.theme ?? 'light'} onChange={theme => set({ theme })}
        choices={[{ value: 'light', label: __('Light', 'chatflow-forms') }, { value: 'dark', label: __('Dark', 'chatflow-forms') }, { value: 'auto', label: __('Follow device', 'chatflow-forms') }]} />
      <h3>{__('Colours', 'chatflow-forms')}</h3>
      {appearance.theme === 'dark' || appearance.theme === 'auto' ? <p className="description">{__('Dark mode uses its own built-in colours.', 'chatflow-forms')}</p> : null}
      <div className="cff-color-grid">
        {colorFields().filter(field => messaging || !['headerBackground', 'headerText', 'chatBackground', 'userTextColor'].includes(field.key)).map(field =>
          <ColorField key={field.key} label={field.label} value={appearance[field.key]} fallback={defaults[field.key]} onChange={value => set({ [field.key]: value })} />)}
      </div>
      {messaging && <>
        <Segmented label={__('Wallpaper', 'chatflow-forms')} value={appearance.wallpaper ?? 'doodle'} onChange={wallpaper => set({ wallpaper })}
          choices={[{ value: 'doodle', label: __('Doodles', 'chatflow-forms') }, { value: 'dots', label: __('Dots', 'chatflow-forms') }, { value: 'gradient', label: __('Gradient', 'chatflow-forms') }, { value: 'none', label: __('Plain', 'chatflow-forms') }]} />
        <Segmented label={__('Answer buttons', 'chatflow-forms')} value={appearance.choiceStyle ?? 'keyboard'} onChange={choiceStyle => set({ choiceStyle })}
          choices={[{ value: 'keyboard', label: __('Keyboard grid', 'chatflow-forms') }, { value: 'chips', label: __('Pills', 'chatflow-forms') }]} />
        <label className="cff-inline-check"><input type="checkbox" checked={appearance.bubbleTails !== false} onChange={event => set({ bubbleTails: event.currentTarget.checked })} />{__('Bubble tails', 'chatflow-forms')}</label>
      </>}
      <h3>{__('Shape', 'chatflow-forms')}</h3>
      <label className="cff-range">{__('Corner radius', 'chatflow-forms')}<input type="range" min={0} max={32} value={appearance.radius ?? (messaging ? 14 : 12)} onChange={event => set({ radius: Number(event.currentTarget.value) })} /><output>{appearance.radius ?? (messaging ? 14 : 12)} px</output></label>
      <label className="cff-range">{__('Chat width', 'chatflow-forms')}<input type="range" min={320} max={1200} step={10} value={appearance.width ?? 720} onChange={event => set({ width: Number(event.currentTarget.value) })} /><output>{appearance.width ?? 720} px</output></label>
    </div>
    <div className="cff-theme-side"><h3>{__('Live preview', 'chatflow-forms')}</h3><ThemePreview form={form} config={config} /><p className="description">{__('Sample conversation. Your real questions appear in Preview.', 'chatflow-forms')}</p></div>
  </section>;
}
