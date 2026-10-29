import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/wp-login.php');
  await page.waitForLoadState('networkidle');
  await page.locator('#user_login').fill(process.env.CFF_E2E_ADMIN_USER ?? 'admin');
  await page.locator('#user_pass').fill(process.env.CFF_E2E_ADMIN_PASSWORD ?? 'password');
  await page.locator('#wp-submit').click();
  await expect(page).toHaveURL(/wp-admin/);
}

test.beforeEach(async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Admin acceptance uses the desktop project.');
  await login(page);
});

test('undoing an added field cannot leave a missing mobile inspector locking the page', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=cff-builder&blank=1');
  await page.getByRole('button', { name: 'Short text', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.cff-inspector-panel.is-open')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('sharing after renaming a newly published form uses the actual published identity', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=cff-builder&blank=1');
  await page.getByRole('textbox', { name: 'Form name', exact: true }).fill('QA publish race');
  // Drafts autosave; Ctrl+S saves immediately.
  await page.keyboard.press('Control+s');
  await expect(page).toHaveURL(/formId=\d+/);

  let slug = '';
  await page.route('**/admin/forms/*/publish', async route => {
    const response = await route.fetch();
    slug = (await response.json()).slug;
    await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog', { name: 'Publish form?', exact: true }).getByRole('button', { name: 'Publish new version', exact: true }).click();
  await expect(page.getByText('Form published', { exact: true })).toBeVisible();
  expect(slug).not.toBe('');
  // The publish dialog makes the builder inert, so the rename can only follow the publish.
  await page.getByRole('textbox', { name: 'Form name', exact: true }).fill('QA newer unpublished title');
  await expect(page.locator('.cff-save-state.is-unpublished')).toBeVisible();
  await page.getByRole('button', { name: 'Share and embed', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open form', exact: true })).toHaveAttribute('href', new RegExp(`/chat/${slug}/$`));
  await expect(page.getByText('Publish your form to get a shareable link', { exact: true })).toHaveCount(0);
});
