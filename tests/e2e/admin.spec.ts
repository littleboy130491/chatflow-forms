import { expect, test } from '@playwright/test';

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
  const survey = page.locator('.cff-template-card').filter({ has: page.getByRole('heading', { name: 'Survei Website Imajiner' }) });
  await expect(survey).toBeVisible();
  await survey.getByRole('button', { name: 'Use template' }).click();
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog', { name: 'Confirm publish' }).getByRole('button', { name: 'Publish new version' }).click();
  await expect(page.getByText('Live version 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
});
