// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from '@wordpress/element';
import { expect, it } from 'vitest';
import { Contrast } from '../../../assets/src/builder/Contrast';
import { contrastRatio } from '../../../assets/src/builder/contrast';
import { ThemeEditor } from '../../../assets/src/builder/ThemeEditor';
import { blankForm } from '../../../assets/src/builder/model';
import type { AdminConfig } from '../../../assets/src/builder/api';

it('explains that explicit messaging colors survive mode changes', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host), form = blankForm();
  form.settings.appearance = { style: 'messaging', theme: 'dark' };
  const config: AdminConfig = { restUrl: 'https://example.test/wp-json/cff/v1/', nonce: 'test', pluginUrl: '/fixture/', adminUrl: '/wp-admin/admin.php', screen: 'builder', locale: 'en_US', capabilities: { manage_forms: true }, features: { fieldTypes: [], uploads: false, xlsx: false } };
  try {
    await act(async () => root.render(<ThemeEditor form={form} config={config} onChange={() => {}} />));
    expect(host.textContent).toContain('Your chosen colours are kept in every mode. Choose the Night palette for a dark colour scheme.');
    expect(host.textContent).not.toContain('Dark mode uses its own built-in colours.');
  } finally { await act(async () => root.unmount()); host.remove(); }
});

it('reports the dark messaging button contrast that the visitor actually sees', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<Contrast appearance={{ style: 'messaging', theme: 'dark' }} />));
    const line = [...host.querySelectorAll('li')].find(li => li.textContent?.includes('Button text'))!;
    expect(line.textContent).toContain(`${contrastRatio('#171717', '#5eb5f7')!.toFixed(2)}:1 · Pass`);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('includes explicit dark form colors in contrast feedback instead of assuming fixed defaults', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<Contrast appearance={{ style: 'messaging', theme: 'dark', primary: '#008069', headerBackground: '#ffffff', headerText: '#000000' }} />));
    const lines = [...host.querySelectorAll('li')];
    expect(lines.find(li => li.textContent?.includes('Button text'))?.textContent).toContain(`${contrastRatio('#ffffff', '#008069')!.toFixed(2)}:1 · Pass`);
    expect(lines.find(li => li.textContent?.includes('Header text'))?.textContent).toContain('21.00:1 · Pass');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
