import { expect, test } from '@playwright/test';

test('long internal field labels wrap inside the flow instead of overflowing', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Desktop grid layout regression.');
  await page.goto('/wp-login.php');
  await page.waitForLoadState('networkidle');
  await page.locator('#user_login').fill(process.env.CFF_E2E_ADMIN_USER ?? 'admin');
  await page.locator('#user_pass').fill(process.env.CFF_E2E_ADMIN_PASSWORD ?? 'password');
  await page.locator('#wp-submit').click();
  await expect(page).toHaveURL(/wp-admin/);
  await page.goto('/wp-admin/admin.php?page=cff-builder&blank=1');
  await page.getByRole('button', { name: 'Short text', exact: true }).click();
  await page.locator('.cff-inspector details > summary').filter({ hasText: /^Advanced$/ }).click();
  const label = 'Pertanyaan dengan label internal yang cukup panjang untuk menguji tata letak editor dan keterbacaan di layar desktop';
  await page.getByRole('textbox', { name: 'Label', exact: true }).fill(label);
  const field = page.locator('.cff-flow article.is-selected');
  await expect(field.getByRole('button', { name: new RegExp('^Pertanyaan dengan label internal') })).toBeVisible();
  await expect.poll(() => field.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(page.locator('.cff-builder-grid')).toHaveCSS('align-items', 'start');
  await expect(page.locator('.cff-palette')).toHaveCSS('overflow-y', 'auto');
});
