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

test('sharing after a title edit during first publish uses the actual published identity', async ({ page }) => {
  await page.goto('/wp-admin/admin.php?page=cff-builder&blank=1');
  await page.getByRole('textbox', { name: 'Form name', exact: true }).fill('QA publish race');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page).toHaveURL(/formId=\d+/);

  let release!: () => void;
  let published!: () => void;
  let slug = '';
  const hold = new Promise<void>(resolve => { release = resolve; });
  const serverPublished = new Promise<void>(resolve => { published = resolve; });
  await page.route('**/admin/forms/*/publish', async route => {
    const response = await route.fetch();
    slug = (await response.json()).slug;
    published();
    await hold;
    await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog', { name: 'Publish form?', exact: true }).getByRole('button', { name: 'Publish new version', exact: true }).click();
  try {
    await serverPublished;
    await page.getByRole('textbox', { name: 'Form name', exact: true }).fill('QA newer unpublished title');
  } finally {
    release();
  }
  await expect(page.getByText('Form published', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Form name', exact: true })).toHaveValue('QA newer unpublished title');
  await page.getByRole('button', { name: 'Share and embed', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open form', exact: true })).toHaveAttribute('href', new RegExp(`/chat/${slug}/$`));
  await expect(page.getByText('Publish your form to get a shareable link', { exact: true })).toHaveCount(0);
});
