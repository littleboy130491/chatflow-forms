import { expect, test } from '@playwright/test';

test('WordPress administrator can create a draft from a template and publish it', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-chromium', 'Admin acceptance uses the desktop project.');

  // These credentials exist only in disposable, local wp-env.
  await page.goto('/wp-login.php');
  await page.locator('#user_login').fill('admin');
  await page.locator('#user_pass').fill('password');
  await page.locator('#wp-submit').click();
  await expect(page).toHaveURL(/wp-admin/);

  await page.goto('/wp-admin/admin.php?page=cff-forms');
  await expect(page.getByRole('heading', { name: 'ChatFlow Forms' })).toBeVisible();
  await page.getByRole('button', { name: 'New Imajiner survey' }).click();
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog', { name: 'Confirm publish' }).getByRole('button', { name: 'Publish new version' }).click();
  await expect(page.getByText('Live version 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
});
