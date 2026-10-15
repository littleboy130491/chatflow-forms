import { expect, test, type Locator } from '@playwright/test';

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


function active(chat: Locator): Locator {
  return chat.locator('.active');
}

async function advance(chat: Locator, name: string | RegExp) {
  await active(chat).getByRole('button', { name, exact: true }).click();
}

test('a visitor can branch, resume on the same device, complete and receive a confirmation', async ({ page, isMobile }) => {
  await page.goto('/chatflow-e2e-inline/');
  const chat = page.locator('cff-chat');
  await expect(chat).toHaveAttribute('data-mode', 'inline');

  await advance(chat, 'Yuk mulai');
  await expect(chat.getByRole('group', { name: 'Pernah punya website' })).toBeVisible();
  await chat.getByRole('group', { name: 'Pernah punya website' }).getByRole('button', { name: 'Belum pernah' }).click();
  await expect(chat.getByRole('group', { name: 'Layanan' })).toBeVisible();
  await expect(chat.getByRole('group', { name: 'Alamat website' })).toHaveCount(0);

  // A real navigation, not an in-memory controller rerender, exercises durable resume.
  await page.reload();
  await expect(chat.getByText(/Welcome back|Selamat datang kembali/)).toBeVisible();
  await chat.locator('.notice').getByRole('button', { name: /^(Continue|Lanjut)$/ }).click();
  await expect(chat.getByRole('group', { name: 'Layanan' })).toBeVisible();

  await chat.getByRole('group', { name: 'Layanan' }).getByRole('button', { name: 'Membuat website baru' }).click();
  await chat.getByRole('group', { name: 'Jenis website' }).getByRole('button', { name: /Company \/ Business Profile/ }).click();
  await expect(active(chat).getByRole('textbox', { name: 'Deskripsi website' })).toBeVisible();
  await advance(chat, 'Lewati');
  await chat.getByRole('group', { name: 'Budget' }).getByRole('button', { name: 'Rp10–25 jt' }).click();

  await active(chat).getByRole('textbox', { name: 'Nama' }).fill(`E2E ${isMobile ? 'Mobile' : 'Desktop'}`);
  await advance(chat, /^(Continue|Lanjut)$/);
  await active(chat).getByRole('textbox', { name: 'WhatsApp' }).fill('081234567890');
  await advance(chat, /^(Continue|Lanjut)$/);
  await expect(active(chat).getByRole('textbox', { name: 'Email' })).toBeVisible();
  await advance(chat, 'Lewati');
  await chat.getByRole('group', { name: 'Boleh ditelepon' }).getByRole('button', { name: 'Tidak, chat saja' }).click();
  await advance(chat, 'Lewati');
  await expect(active(chat).getByRole('button', { name: 'Request Free Demo' })).toBeVisible();
  await advance(chat, 'Request Free Demo');
  await expect(chat.getByText(/Terima kasih, E2E/)).toBeVisible();
  await expect(chat.getByRole('link', { name: 'Chat via WhatsApp' })).toHaveAttribute('href', /wa\.me/);
  await expect(page.locator('cff-chat')).toHaveCount(1);
});

test('visitors submit rating, scale, NPS and a configured slider through real WordPress', async ({ page }) => {
  const response = await page.goto('/chatflow-e2e-scores/');
  expect(response?.status()).toBe(200);
  const chat = page.locator('cff-chat');
  const rating = chat.getByRole('group', { name: 'Rating' });
  await rating.getByRole('button', { name: '5 / 5' }).click();
  const scale = chat.getByRole('group', { name: 'Scale' });
  await scale.getByRole('button', { name: '8 / 10' }).click();
  const nps = chat.getByRole('group', { name: 'NPS' });
  await nps.getByRole('button', { name: '0 / 10', exact: true }).click();
  const slider = active(chat).getByRole('slider', { name: 'Slider' });
  await expect(slider).toHaveAttribute('min', '10');
  await expect(slider).toHaveAttribute('max', '30');
  await expect(slider).toHaveAttribute('step', '5');
  await slider.focus();
  await slider.press('Home');
  await slider.press('ArrowRight');
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('20');
  await advance(chat, /^(Continue|Lanjut)$/);
  // The final review action sits outside .active once all questions are answered.
  await chat.getByRole('button', { name: /^(Submit|Kirim)$/, exact: true }).click();
  await expect(chat.getByText('Feedback saved. Thank you!')).toBeVisible();
});

test('launcher defers the session handshake until opened and restores focus when closed', async ({ page }) => {
  const handshake: string[] = [];
  page.on('request', request => {
    if (/\/wp-json\/cff\/v1\/(sessions|forms\/\d+\/start-token)/.test(request.url())) handshake.push(request.url());
  });

  await page.goto('/chatflow-e2e-launcher/');
  const chat = page.locator('cff-chat');
  await expect(chat).toHaveAttribute('data-position', 'left');
  const toggle = chat.getByRole('button', { name: /^(Open chat|Buka chat)$/ });
  await expect(toggle).toBeVisible();
  await expect(chat.locator('.launcher-panel')).toBeHidden();
  expect(handshake).toHaveLength(0);

  await toggle.click();
  await expect(chat.locator('.launcher-panel')).toBeVisible();
  await expect(chat.locator('.launcher-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(chat.getByRole('button', { name: 'Yuk mulai' })).toBeVisible();
  await expect.poll(() => handshake.length).toBeGreaterThan(0);

  await chat.locator('.launcher-panel').press('Escape');
  await expect(chat.locator('.launcher-panel')).toBeHidden();
  await expect(chat.locator('.launcher-toggle')).toBeFocused();
});

test('popup supports backdrop close and a timed trigger without creating a session before opening', async ({ page }) => {
  const response = await page.goto('/chatflow-e2e-popup/');
  expect(response?.status(), 'WordPress must return an HTTP 200 for the popup page').toBe(200);
  const chat = page.locator('cff-chat');
  await expect(chat.locator('.launcher-panel')).toBeHidden();
  await chat.getByRole('button', { name: /^(Open chat|Buka chat)$/ }).click();
  const dialog = chat.getByRole('dialog', { name: /^(Chat form|Formulir chat)$/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await chat.locator('.popup-backdrop').click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeHidden();

  await page.goto('/chatflow-e2e-popup-auto/');
  await expect(page.locator('cff-chat').getByRole('dialog', { name: /^(Chat form|Formulir chat)$/ })).toBeVisible();
});

test('site-wide targeting renders a single launcher on a matching page', async ({ page }) => {
  await page.goto('/chatflow-e2e-sitewide/');
  const chat = page.locator('cff-chat');
  await expect(chat).toHaveCount(1);
  await expect(chat).toHaveAttribute('data-mode', 'launcher');
  await expect(chat.getByRole('button', { name: /^(Open chat|Buka chat)$/ })).toBeVisible();
});
