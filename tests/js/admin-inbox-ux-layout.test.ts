// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
const css = readFileSync('assets/src/submissions/style.css', 'utf8');
it('keeps task settings aligned to their content and save controls in reach', () => {
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  const grid=document.createElement('div');grid.className='cff-global-settings';
  const save=document.createElement('div');save.className='cff-settings-save';grid.append(save);document.body.append(grid);
  expect(getComputedStyle(grid).alignItems).toBe('start');
  expect(getComputedStyle(save).position).toBe('sticky');
  grid.remove();style.remove();
});
it('provides a narrow-screen filter layout without minimum-width grid overflow',()=>{
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  const mobile=[...style.sheet!.cssRules].filter((rule):rule is CSSMediaRule=>rule instanceof CSSMediaRule && rule.conditionText.includes('700px'));
  expect(mobile.some(rule=>rule.cssText.includes('.cff-inbox-filters') && rule.cssText.includes('minmax(0, 1fr)'))).toBe(true);
  style.remove();
});
