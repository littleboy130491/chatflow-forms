// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const style = document.createElement('style');
style.textContent = readFileSync('assets/src/builder/style.css', 'utf8') + '\n' + readFileSync('assets/src/submissions/style.css', 'utf8');
document.head.append(style);
afterEach(() => document.body.replaceChildren());

it('keeps inbox and global settings grids after shared builder styles are loaded', () => {
  document.body.innerHTML = '<div class="cff-settings-grid cff-inbox-filters"></div><div class="cff-settings-grid cff-global-settings"></div><div class="cff-advanced-filters"><div class="cff-settings-grid"></div></div>';
  for (const selector of ['.cff-inbox-filters', '.cff-global-settings', '.cff-advanced-filters .cff-settings-grid']) {
    expect(getComputedStyle(document.querySelector(selector)!).display, selector).toBe('grid');
  }
});
