import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';

// Exercise the real source directly in Chromium: no built bundle or WordPress fixture needed.
const source = transpileModule(readFileSync('assets/src/runtime/appearance.ts', 'utf8'), {
  compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2020 },
}).outputText;

for (const [background, expected] of [
  ['color(srgb 1 1 1)', '#171717'],
  ['oklch(100% 0 0)', '#171717'],
  ['lab(100% 0 0)', '#171717'],
  ['color(display-p3 1 1 0)', '#171717'],
  ['color(srgb 0 0 0)', '#ffffff'],
  ['oklch(0% 0 0)', '#ffffff'],
  ['oklch(90% 0.1 100)', '#171717'],
  ['oklch(25% 0.05 250)', '#ffffff'],
  ['#ffff00', '#171717'],
  ['rgb(19, 87, 36)', '#ffffff'],
  ['rgb(100% 100% 100%)', '#171717'],
  ['hsl(60 100% 50%)', '#171717'],
  ['white', '#171717'],
  ['navy', '#ffffff'],
]) {
  test(`readable foreground for opaque ${background}`, async ({ page }) => {
    await page.setContent('<!doctype html><html><body></body></html>');
    const result = await page.evaluate(({ source, background }) => {
      const appearance = {} as {
        safeColor(value: string): string | undefined;
        buttonTextColor(value: string): string;
      };
      new Function('exports', source)(appearance);
      const accepted = appearance.safeColor(background);
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      context.fillStyle = background; context.fillRect(0, 0, 1, 1);
      const channels = [...context.getImageData(0, 0, 1, 1).data];
      const ink = appearance.buttonTextColor(background);
      const button = document.createElement('button');
      button.style.backgroundColor = accepted!; button.style.color = ink;
      document.body.append(button);
      const computed = getComputedStyle(button);
      return { accepted, channels, ink, background: computed.backgroundColor, foreground: computed.color };
    }, { source, background });
    console.log(JSON.stringify({ input: background, ...result }));
    expect(result.accepted).toBeTruthy(); // Modern colours must not be blindly rejected.
    expect(result.channels[3]).toBe(255);
    expect(result.ink).toBe(expected);
    expect(result.foreground).toBe(expected === '#171717' ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)');
  });
}
