import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { createLocalQaGuard, prepareLocalLogin, guardLocalRoute, shouldSkipLocalQa } from './local-qa';
import fs from 'node:fs';
import path from 'node:path';
import { create as createQr } from 'qrcode';

// Native WP fixture; credentials and all traces remain OUTSIDE the repository.
const root = process.env.CFF_ADMIN_QA_DIR ?? '/home/hermes/chatflow-qa/iteration-2';
const base = process.env.CFF_E2E_BASE_URL ?? 'http://127.0.0.1:8891';
const fixturePath = path.join(root, 'admin-embed-fixture.json');
const authPath = process.env.CFF_ADMIN_QA_AUTH ?? path.join(root, 'admin-private.json');
// Optional local fixtures must not break normal repository E2E discovery/runs.
test.skip(shouldSkipLocalQa(process.env.CFF_E2E, () => fs.existsSync(fixturePath) && fs.existsSync(authPath)), 'Requires explicit CFF_E2E=1 and optional local QA fixture/auth files.');
let qa: ReturnType<typeof createLocalQaGuard>;
let validatedFixture: ReturnType<typeof qa.validateFixture>;
const fixture = () => validatedFixture;
let blockedRequests: string[] = [];
let blockedAssets: { origin: string; type: string }[] = [];
async function protectContext(context: BrowserContext) {
  await context.route('**/*', async route => {
    await guardLocalRoute(qa, route).catch(error => {
      const request = route.request(), type = request.resourceType(), origin = new URL(request.url()).origin;
      // WordPress/Elementor may request optional Gravatar images or font stylesheets.
      // They remain blocked; only navigation/API/script attempts fail the safety assertion.
      if (origin !== qa.base && !request.isNavigationRequest() && request.method() === 'GET' && ['image', 'font', 'stylesheet', 'media'].includes(type)) {
        blockedAssets.push({ origin, type });
      } else blockedRequests.push(error instanceof Error ? error.message : 'Blocked QA request');
    });
  });
}
async function localGoto(page: Page, url: string) {
  await page.goto(qa.assertUrl(url));
  qa.assertUrl(page.url());
}
const telemetry: Record<string, any[]> = {};
test.use({ baseURL: base, trace: 'off', screenshot: 'off', serviceWorkers: 'block' });

async function login(page: Page) {
  const auth = await prepareLocalLogin(qa, page, () => JSON.parse(fs.readFileSync(authPath, 'utf8')));
  await page.locator('#user_login').fill(auth.username);
  await page.locator('#user_pass').fill(auth.password);
  // WordPress login autofocus can otherwise clear the first field on initial load.
  await page.locator('#user_login').fill(auth.username);
  await page.locator('#wp-submit').click();
  await expect(page).toHaveURL(/wp-admin/);
}
async function blank(page: Page) {
  await login(page);
  await localGoto(page, '/wp-admin/admin.php?page=cff-builder&blank=1');
  await page.getByRole('textbox', { name: 'Form name', exact: true }).fill(`QA admin-functions ${Date.now()}`);
  // Drafts autosave; Ctrl+S saves immediately.
  await page.keyboard.press('Control+s');
  await expect(page).toHaveURL(/formId=\d+/);
}
async function save(page: Page) {
  await page.keyboard.press('Control+s');
  await expect(page.locator('.cff-save-state').first()).toContainText('Draft saved');
}
async function shot(page: Page, name: string) {
  // Capture settled visitor bubbles rather than their short entrance fade.
  await page.waitForTimeout(350);
  fs.mkdirSync(path.join(root, 'admin-screenshots'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'admin-screenshots', name + '.png'), fullPage: true });
}
async function ready(page: Page) {
  await expect(page.locator('cff-chat').getByRole('textbox', { name: 'QA name', exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Test explicitly exercises desktop and mobile viewports without duplicate admin writes.');
  // Fail closed before reading credentials or making any browser request.
  qa = createLocalQaGuard({ CFF_E2E: process.env.CFF_E2E, CFF_E2E_BASE_URL: process.env.CFF_E2E_BASE_URL });
  validatedFixture = qa.validateFixture(JSON.parse(fs.readFileSync(fixturePath, 'utf8')));
  blockedRequests = [];
  blockedAssets = [];
  await protectContext(page.context());
  telemetry[info.title] = [];
  page.on('pageerror', e => telemetry[info.title].push({ type: 'pageerror', message: e.message }));
  page.on('console', m => { if (m.type() === 'error') telemetry[info.title].push({ type: 'consoleerror', message: m.text() }); });
  page.on('requestfailed', r => telemetry[info.title].push({ type: 'requestfailed', url: r.url(), message: r.failure()?.errorText }));
  page.on('response', r => { if (r.status() >= 400) telemetry[info.title].push({ type: 'http', status: r.status(), url: r.url() }); });
});
test.afterEach(async ({ page }, info) => {
  if (info.status === 'skipped') return;
  if (info.status !== 'passed') await shot(page, 'failure-' + info.title.match(/\[([^\]]+)/)?.[1]?.replaceAll('.', '-') ).catch(() => {});
  const ids = info.title.match(/\[([^\]]+)\]/)?.[1].split(',') ?? [];
  const entries = ids.map(id => ({ id, status: info.status === 'passed' && !blockedRequests.length ? 'pass' : 'fail', evidence_level: 'browser', test: info.title, evidence: ['tests/e2e/admin-functions-coverage.spec.ts', path.join(root, 'admin-screenshots')], error: info.error?.message ?? (blockedRequests.length ? 'Local-only QA request firewall violations' : undefined), telemetry: telemetry[info.title], blockedOptionalAssets: blockedAssets }));
  const output = path.join(root, 'admin-functions-results.json');
  const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')).results : [];
  const current = previous.filter((item: any) => !ids.includes(item.id));
  current.push(...entries);
  fs.writeFileSync(output, JSON.stringify({ base, results: current }, null, 2));
  expect(blockedRequests, 'Local-only QA request firewall violations').toEqual([]);
});

test('[forms.blank] actual blank creation persists a uniquely named draft', async ({ page }) => {
  await blank(page);
  const url = page.url(), name = await page.getByRole('textbox', { name: 'Form name', exact: true }).inputValue();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Form name', exact: true })).toHaveValue(name);
  await expect(page.locator('[data-step-id]')).toHaveCount(1);
  await shot(page, 'blank-desktop');
  expect(page.url()).toBe(url);
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Publish (new version|form)/ }).click();
  await expect(page.getByText('Live version 1', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Share and embed', exact: true }).click();
  qa.assertUrl((await page.getByRole('link', { name: 'Open form', exact: true }).getAttribute('href'))!);
  const opened = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open form', exact: true }).click();
  const publicPage = await opened; await publicPage.waitForLoadState('domcontentloaded');
  qa.assertUrl(publicPage.url());
  await expect(publicPage.locator('cff-chat')).toHaveCount(1);
  await publicPage.close();
});

test('[forms.autosave_history_reorder_group] keyboard reorder undo redo duplicate delete grouping and autosave', async ({ page }) => {
  await blank(page);
  await page.getByRole('button', { name: 'Short text', exact: true }).click();
  await expect(page.locator('[data-step-id]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('[data-step-id]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.locator('[data-step-id]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Duplicate field', exact: true }).last().click();
  await expect(page.locator('[data-step-id]')).toHaveCount(3);
  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Delete field', exact: true }).last().click();
  await expect(page.locator('[data-step-id]')).toHaveCount(2);
  const before = await page.locator('[data-step-id]').evaluateAll(es => es.map(e => e.getAttribute('data-step-id')));
  const handle = page.getByRole('button', { name: /Drag/ }).first();
  await handle.focus(); await page.keyboard.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  // dnd-kit installs its document keyboard listener in a deferred task after lift;
  // aria-pressed changes first. Wait for the lift announcement and settled layout.
  await expect(page.getByRole('status').last()).toContainText(`was moved over droppable area ${before[0]}`);
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('status').last()).toContainText(`was moved over droppable area ${before[1]}`);
  await page.keyboard.press('Space');
  await expect.poll(() => page.locator('[data-step-id]').evaluateAll(es => es.map(e => e.getAttribute('data-step-id')))).toEqual([...before].reverse());
  await page.getByRole('checkbox', { name: 'Select field', exact: true }).first().check();
  await page.getByRole('button', { name: 'Group selected', exact: true }).click();
  await page.getByRole('textbox', { name: 'Group title', exact: true }).fill('QA keyboard group');
  // Deliberately do not click Save: verify debounced autosave survives navigation.
  await expect(page.getByText(/All changes saved|Draft saved/).first()).toBeVisible({ timeout: 15000 });
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Group title', exact: true })).toHaveValue('QA keyboard group');
  await expect(page.locator('[data-step-id]')).toHaveCount(2);
  await shot(page, 'history-group-reorder-desktop');
});

test('[display.wordpress_block,display.elementor_widget,display.theme_php_custom_element] registered real embed integrations render and accept keyboard input desktop mobile', async ({ page }) => {
  const f = fixture(); expect(f.blockRegistered).toBe(true); expect(f.elementorRegistered).toBe(true);
  expect(f.elementorClass).toBe('ChatFlow\\Integrations\\Elementor\\FormWidget');
  for (const [kind, url] of Object.entries(f.pages)) {
    for (const [label, size] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } })) {
      await page.context().clearCookies(); await localGoto(page, base); await page.evaluate(() => localStorage.clear());
      await page.setViewportSize(size); await localGoto(page, url); await ready(page);
      if (kind === 'elementor') await expect(page.locator('.elementor-widget-chatflow-form cff-chat')).toHaveCount(1);
      await page.locator('cff-chat').getByRole('textbox', { name: 'QA name', exact: true }).fill('QA keyboard visitor');
      await page.locator('cff-chat').getByRole('textbox', { name: 'QA name', exact: true }).press('Enter');
      await expect(page.locator('cff-chat').getByText('Consent must not be prefilled.', { exact: true }).first()).toBeVisible();
      await shot(page, `embed-${kind}-${label}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('[display.fullpage] actual public fullpage loads desktop mobile and exposes usable keyboard focus', async ({ page }) => {
  for (const size of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.context().clearCookies(); await localGoto(page, base); await page.evaluate(() => localStorage.clear()); await page.setViewportSize(size);
    await localGoto(page, fixture().publicUrl); await ready(page);
    await expect(page.locator('cff-chat')).toHaveAttribute('data-mode', 'fullpage');
    await page.locator('cff-chat').getByRole('textbox', { name: 'QA name', exact: true }).focus();
    await expect(page.locator('cff-chat').getByRole('textbox', { name: 'QA name', exact: true })).toBeFocused();
    await shot(page, `fullpage-${size.width}`);
  }
});

test('[forms.share_link_embed_qr_prefill] published share link shortcode custom element QR and whitelist resist hidden/consent prefill', async ({ page }) => {
  const f = fixture(); await login(page); await localGoto(page, `/wp-admin/admin.php?page=cff-builder&formId=${f.formId}`);
  const formName = page.getByRole('textbox', { name: 'Form name', exact: true });
  await expect(formName).toHaveValue(f.formTitle);
  qa.assertFixtureForm(f, await formName.inputValue());
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open form', exact: true })).toHaveAttribute('href', f.publicUrl);
  await page.getByText('Advanced: prefill answers', { exact: true }).click();
  await page.getByRole('textbox', { name: 'QA name', exact: true }).fill('Public QA');
  await expect(page.getByRole('textbox', { name: 'Locked campaign', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'QA consent', exact: true })).toHaveCount(0);
  const url = await page.getByRole('link', { name: 'Open form', exact: true }).getAttribute('href');
  qa.assertUrl(url!);
  expect(new URL(url!).searchParams.get('cff_prefill[qa_name]')).toBe('Public QA');
  await page.getByRole('button', { name: 'Embed', exact: true }).click();
  await expect(page.locator('pre').first()).toHaveText(`[chatflow id="${f.formId}" mode="inline"]`);
  await page.getByText('Advanced custom element', { exact: true }).click();
  await expect(page.locator('pre').last()).toContainText(`<cff-chat data-form-id="${f.formId}"`);
  await expect(page.getByText('Custom elements require the plugin runtime asset.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'QR code', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Form URL QR code' })).toBeVisible();
  const qr = createQr(url!, { errorCorrectionLevel: 'M' });
  const raster = await page.getByRole('img', { name: 'Form URL QR code' }).evaluate((img: HTMLImageElement, size) => {
    const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0); const values: number[] = [];
    const scale = canvas.width / (size + 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) values.push(ctx.getImageData(Math.floor((x + 2.5) * scale), Math.floor((y + 2.5) * scale), 1, 1).data[0] < 128 ? 1 : 0);
    return values;
  }, qr.modules.size);
  expect(raster).toEqual(Array.from(qr.modules.data));
  await shot(page, 'share-qr-desktop');
  // Use a clean anonymous context and observe the actual server session response.
  const visitor = await page.context().browser()!.newContext({ serviceWorkers: 'block' });
  await protectContext(visitor);
  const publicPage = await visitor.newPage();
  const events = telemetry[test.info().title];
  publicPage.on('pageerror', e => events.push({ type: 'pageerror', message: e.message }));
  publicPage.on('requestfailed', r => events.push({ type: 'requestfailed', url: r.url(), message: r.failure()?.errorText }));
  publicPage.on('response', r => { if (r.status() >= 400) events.push({ type: 'http', status: r.status(), url: r.url() }); });
  const malicious = new URL(url!); malicious.searchParams.set('cff_prefill[qa_locked]', 'attacker'); malicious.searchParams.set('cff_prefill[qa_consent]', 'true');
  const response = publicPage.waitForResponse(r => /\/sessions(?:\?|$)/.test(r.url()) && r.request().method() === 'POST');
  await localGoto(publicPage, malicious.href); await ready(publicPage);
  await expect(publicPage.locator('cff-chat').getByRole('textbox', { name: 'QA name', exact: true })).toHaveValue('Public QA');
  const session = await (await response).json();
  fs.writeFileSync(path.join(root, 'admin-prefill-session.json'), JSON.stringify(session, null, 2));
  expect(JSON.stringify(session)).not.toContain('attacker');
  expect(JSON.stringify(session)).toContain('trusted-campaign');
  await publicPage.locator('cff-chat').getByRole('textbox', { name: 'QA name', exact: true }).press('Enter');
  await expect(publicPage.locator('cff-chat').getByRole('checkbox')).not.toBeChecked();
  await shot(publicPage, 'prefill-consent-public'); await visitor.close();
});

test('[design.themes_light_dark] both styles light dark device palette persist with live preview', async ({ page }) => {
  await blank(page); await page.getByRole('button', { name: 'Design', exact: true }).click();
  for (const style of ['Classic', 'Messaging']) {
    await page.getByRole('button', { name: new RegExp('^' + style) }).click();
    if (style === 'Messaging') {
      // Unconfigured messaging colors use the built-in dark defaults.
      await page.getByRole('button', { name: 'Dark', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Live theme preview' }).locator('.chat header')).toHaveCSS('background-color', 'rgb(23, 33, 43)');
      await page.getByRole('button', { name: 'Meadow', exact: true }).click();
    }
    for (const theme of ['Light', 'Dark', 'Follow device']) {
      await page.getByRole('button', { name: theme, exact: true }).click();
      await expect(page.getByRole('button', { name: theme, exact: true })).toHaveAttribute('aria-pressed','true');
      const preview = page.getByRole('region', { name: 'Live theme preview' });
      await expect(preview.getByRole('progressbar', { name: 'Progress' })).toBeVisible();
      if (theme === 'Dark') await expect(preview.locator('.chat')).toHaveClass(/dark/);
      if (theme === 'Light') await expect(preview.locator('.chat')).not.toHaveClass(/dark/);
      if (style === 'Messaging') {
        await expect(preview.locator('.chat')).toHaveAttribute('data-style', 'messaging');
        if (theme === 'Dark') {
          // Explicit palette colors stay configured; changing mode must not erase them.
          await expect(preview.locator('.chat header')).toHaveCSS('background-color', 'rgb(0, 128, 105)');
          await expect(preview.locator('.conversation')).toHaveCSS('background-color', 'rgb(239, 231, 222)');
        }
      }
      await save(page); await page.reload();
      await page.getByRole('button', { name: 'Design', exact: true }).click();
      await expect(page.getByRole('button', { name: theme, exact: true })).toHaveAttribute('aria-pressed','true');
      await expect(page.getByRole('button', { name: new RegExp('^' + style) })).toHaveAttribute('aria-pressed','true');
      if (style === 'Messaging') await expect(page.locator('.cff-color-grid input[type="text"]').first()).toHaveValue('#008069');
      await shot(page, `design-${style}-${theme.replaceAll(' ','-')}`);
    }
  }
  await save(page); await page.reload(); await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Messaging/ })).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button', { name: 'Follow device', exact: true })).toHaveAttribute('aria-pressed','true');
  // The Night palette intentionally changes all colors as well as the mode.
  await page.getByRole('button', { name: 'Night', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('region', { name: 'Live theme preview' }).locator('.chat header')).toHaveCSS('background-color', 'rgb(23, 33, 43)');
  await save(page); await page.reload(); await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('region', { name: 'Live theme preview' }).locator('.chat header')).toHaveCSS('background-color', 'rgb(23, 33, 43)');
});

test('[design.typography_contact_link] local typography and WhatsApp contact persist without opening external link', async ({ page }) => {
  await blank(page); await page.getByRole('button', { name: 'Design', exact: true }).click();
  await page.getByRole('textbox', { name: 'Font stack', exact: true }).fill('Georgia, serif');
  await page.getByRole('checkbox', { name: 'Show a contact button below the conversation', exact: true }).check();
  await page.getByRole('textbox', { name: 'Link (WhatsApp, https, tel: or mailto:; merge tags allowed)', exact: true }).fill('https://wa.me/15555550123');
  await save(page); await page.reload(); await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Font stack', exact: true })).toHaveValue('Georgia, serif');
  await expect(page.getByRole('textbox', { name: 'Link (WhatsApp, https, tel: or mailto:; merge tags allowed)', exact: true })).toHaveValue('https://wa.me/15555550123');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Draft preview', exact: true }).getByRole('link').filter({ hasText: /WhatsApp|Contact|Chat/i }).first()).toHaveAttribute('href', /wa.me\/15555550123/);
  await expect(page.getByRole('dialog', { name: 'Draft preview' }).locator('.chat')).toHaveCSS('font-family', 'Georgia, serif');
  await shot(page, 'typography-contact-preview');
});

test('[design.contrast_accessibility] contrast feedback reports real pair ratios and low contrast without hiding keyboard focus', async ({ page }) => {
  await blank(page);
  await page.getByRole('button', { name: 'Short text', exact: true }).click();
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Contrast feedback (WCAG AA normal text)' })).toBeVisible();
  await expect(page.getByText(/light · Bot text: .*:1 · Pass/)).toBeVisible();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.getByText(/dark · Bot text: .*:1 · Pass/)).toBeVisible();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  // Color controls expose a text input in addition to the native color picker.
  await page.locator('#cff-color-bot-bubble').fill('#ffffff');
  await page.locator('#cff-color-bot-bubble').press('Tab');
  await page.locator('#cff-color-bot-text').fill('#ffffff');
  await page.locator('#cff-color-bot-text').press('Tab');
  await expect(page.getByText('light · Bot text: 1.00:1 · Below 4.5:1', { exact: true })).toBeVisible();
  await shot(page, 'contrast-feedback');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Draft preview' });
  const continueButton = preview.getByRole('button', { name: 'Continue', exact: true });
  await preview.getByRole('textbox').focus();
  await page.keyboard.press('Tab'); await expect(continueButton).toBeFocused();
  expect(await continueButton.evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
  await shot(page, 'contrast-keyboard-focus-preview');
});
