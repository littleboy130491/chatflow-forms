import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/wp-login.php');
  await page.waitForLoadState('networkidle');
  await page.locator('#user_login').fill(process.env.CFF_E2E_ADMIN_USER ?? 'admin');
  await page.locator('#user_pass').fill(process.env.CFF_E2E_ADMIN_PASSWORD ?? 'password');
  // Browser autofill can overwrite the username after focusing the password field.
  await page.locator('#user_login').fill(process.env.CFF_E2E_ADMIN_USER ?? 'admin');
  await page.locator('#wp-submit').click();
  await expect(page).toHaveURL(/wp-admin/);
}

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return;
  const body = await page.locator('body').innerText().catch(() => '[page unavailable]');
  const shadows = await page.locator('cff-chat').evaluateAll(elements =>
    elements.map(element => element.shadowRoot?.textContent?.slice(0, 1800) ?? '[no shadow root]'),
  ).catch(() => []);
  console.log('E2E failure URL:', page.url());
  console.log('E2E visible body:', body.slice(0, 1800));
  console.log('E2E chat shadows:', JSON.stringify(shadows));
  await info.attach('failure-dom.txt', { body: `URL: ${page.url()}\nBODY:\n${body}\nCHATS:\n${JSON.stringify(shadows, null, 2)}`, contentType: 'text/plain' });
});

test('Forms screen prioritizes the list and opens the creation chooser on demand', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Admin acceptance uses the desktop project.');
  await login(page);
  await page.goto('/wp-admin/admin.php?page=cff-forms');
  await expect(page.getByRole('heading', { name: 'ChatFlow Forms' })).toBeVisible();
  await expect(page.locator('.wp-list-table')).toBeVisible();
  await expect(page.locator('#cff-form-start')).toHaveCount(0);
  await expect(page.locator('.cff-template-grid')).toHaveCount(0);
  await page.getByRole('link', { name: 'Create form', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create a form', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New blank form', exact: true })).toBeVisible();
});

test('Forms list renders a literal shortcode without escaped quote characters', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Admin acceptance uses the desktop project.');
  await login(page);
  await page.goto('/wp-admin/admin.php?page=cff-builder&blank=1');
  await page.getByRole('textbox', { name: 'Form name', exact: true }).fill('QA shortcode fixture');
  // Drafts autosave; Ctrl+S saves immediately.
  await page.keyboard.press('Control+s');
  await expect(page).toHaveURL(/formId=\d+/);
  const id = new URL(page.url()).searchParams.get('formId');
  await page.goto('/wp-admin/admin.php?page=cff-forms');
  await expect(page.locator('.wp-list-table code').filter({ hasText: `[chatflow id="${id}" mode="inline"]` })).toBeVisible();
});

test('WordPress administrator can create a draft from a template and publish it', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Admin acceptance uses the desktop project.');
  await login(page);
  await page.goto('/wp-admin/admin.php?page=cff-forms');
  await page.getByRole('link', { name: 'Create form', exact: true }).click();
  const survey = page.locator('.cff-template-card').filter({ has: page.getByRole('heading', { name: 'Survei Website Imajiner' }) });
  await expect(survey).toBeVisible();
  await survey.getByRole('button', { name: 'Use template' }).click();
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Publish (new version|form)/ }).click();
  await expect(page.locator('.cff-save-state.is-live')).toContainText('Live version 1');
  await expect(page.getByRole('button', { name: 'Share and embed', exact: true })).toBeVisible();
});
