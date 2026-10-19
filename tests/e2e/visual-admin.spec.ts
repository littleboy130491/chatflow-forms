import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Read-only, explicit opt-in. Never log auth or use login credentials.
const base = process.env.CFF_VISUAL_BASE;
const state = process.env.CFF_VISUAL_STATE;
test.skip(!base || !state, 'Requires explicit visual QA URL and private storage state');
test.use({ trace: 'off', screenshot: 'off' });
for (const width of [1440, 390]) {
  test(`admin control rhythm at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ storageState: state, viewport: { width, height: width === 390 ? 844 : 1000 } });
    await context.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(`${base}/wp-admin/admin.php?page=cff-settings`);
    expect(page.url()).not.toContain('wp-login');
    await expect(page.locator('.cff-global-settings .cff-card:visible')).toBeVisible();
    if (process.env.CFF_VISUAL_INJECT === '1') {
      for (const name of ['builder', 'submissions']) await page.addStyleTag({ content: fs.readFileSync(path.resolve(`assets/src/${name}/style.css`), 'utf8') });
    }
    const fields = page.locator('.cff-global-settings .cff-card:visible .components-base-control');
    const first = await fields.nth(0).boundingBox();
    const second = await fields.nth(1).boundingBox();
    expect(second!.y - (first!.y + first!.height), 'clear gap between control groups').toBeGreaterThanOrEqual(16);
    const card = page.locator('.cff-global-settings .cff-card:visible');
    expect(parseFloat(await card.evaluate(e => getComputedStyle(e).paddingLeft))).toBeGreaterThanOrEqual(width === 390 ? 16 : 20);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, 'mobile controls must wrap without viewport overflow').toBeLessThanOrEqual(1);
    await page.goto(`${base}/wp-admin/admin.php?page=cff-builder&formId=15`);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const ending = page.locator('fieldset.cff-card').first();
    await expect(ending).toBeVisible();
    if (process.env.CFF_VISUAL_INJECT === '1') {
      await page.addStyleTag({ content: fs.readFileSync(path.resolve('assets/src/builder/style.css'), 'utf8') });
    }
    expect(parseFloat(await ending.locator('legend').evaluate(e => getComputedStyle(e).marginBottom)), 'ending legend separates nested controls').toBeGreaterThanOrEqual(12);
    const summary = ending.locator('summary').first();
    expect(parseFloat(await summary.evaluate(e => getComputedStyle(e).paddingTop)), 'disclosure target has breathing room').toBeGreaterThanOrEqual(8);
    await page.getByRole('button', { name: 'Logic', exact: true }).first().click();
    const captionOverflow = await page.locator('.cff-flow-map').evaluate(e => e.querySelector('p')!.getBoundingClientRect().bottom - e.getBoundingClientRect().bottom);
    expect(captionOverflow, 'flow-map help remains inside its section instead of overlapping scoring').toBeLessThanOrEqual(1);
    await page.goto(`${base}/wp-admin/admin.php?page=cff-analytics`);
    await expect(page.locator('.cff-analytics-filters select')).toBeVisible();
    if (process.env.CFF_VISUAL_INJECT === '1') for (const name of ['builder', 'submissions']) await page.addStyleTag({ content: fs.readFileSync(path.resolve(`assets/src/${name}/style.css`), 'utf8') });
    if (width === 1440) {
      const delta = await page.locator('.cff-analytics-filters').evaluate(e => Math.abs(e.querySelector('select')!.getBoundingClientRect().top - e.querySelector('input[type=date]')!.getBoundingClientRect().top));
      expect(delta, 'form selector and date inputs align despite form-search disclosure').toBeLessThanOrEqual(1);
    }
    await page.goto(`${base}/wp-admin/admin.php?page=cff-submissions`);
    await page.getByRole('button', { name: 'Response #24', exact: true }).click();
    await expect(page.locator('.cff-detail h1')).toBeVisible();
    if (process.env.CFF_VISUAL_INJECT === '1') {
      // Presentation-only equivalent of Detail.tsx's class change; NOT deployed.
      await page.locator('.cff-detail').evaluate(e => e.classList.add('cff-admin'));
      for (const name of ['builder', 'submissions']) await page.addStyleTag({ content: fs.readFileSync(path.resolve(`assets/src/${name}/style.css`), 'utf8') });
    }
    if (width === 1440) {
      const delta = await page.locator('.cff-detail .cff-toolbar').evaluate(e => {
        const button = e.querySelector('button')!.getBoundingClientRect();
        const select = e.querySelector('select')!.getBoundingClientRect();
        return Math.abs(button.bottom - select.bottom);
      });
      expect(delta, 'status and action controls share a baseline').toBeLessThanOrEqual(1);
    } else {
      expect(await page.getByRole('button', { name: 'Back to submissions', exact: true }).evaluate(e => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      await page.goto(`${base}/wp-admin/admin.php?page=cff-builder&formId=15`);
      await page.locator('button[data-step-id="stp_qa_email"]').click();
      if (process.env.CFF_VISUAL_INJECT === '1') await page.addStyleTag({ content: fs.readFileSync(path.resolve('assets/src/builder/style.css'), 'utf8') });
      const back = page.getByRole('button', { name: 'Back to flow', exact: true });
      expect(await back.evaluate(e => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      await back.click();
      await expect(page.locator('.cff-inspector-panel')).not.toBeVisible();
    }
    await context.close();
  });
}
