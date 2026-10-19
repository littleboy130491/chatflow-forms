/* Offline Chromium geometry regression using ThemeEditor's actual label structure. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
 const source = fs.readFileSync('assets/src/builder/ThemeEditor.tsx', 'utf8');
 const labels = [...source.matchAll(/<label className="cff-range">([\s\S]*?)<\/label>/g)];
 assert.equal(labels.length, 2);
 // Preserve the source DOM, stripping JSX attributes/expressions only.
 const markup = labels.map(([, body]) => {
  const text = body.match(/^\{__\('([^']+)'/)[1];
  assert.match(body, /<input type="range"[\s\S]*\/><output>/);
  assert.ok(!body.includes('<label'));
  return `<label class="cff-range">${text}<input type="range"/><output>720 px</output></label>`;
 }).join('');
 const browser = await chromium.launch({ headless: true });
 try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await page.setContent(`<main class="cff-admin"><section class="cff-card">${markup}</section></main>`);
  await page.addStyleTag({ content: fs.readFileSync('assets/src/builder/style.css', 'utf8') });
  const measurements = await page.locator('.cff-range').evaluateAll(labels => labels.map(label => {
   const rect = e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right}; };
   return { label:rect(label), input:rect(label.querySelector('input')), output:rect(label.querySelector('output')) };
  }));
  console.log(JSON.stringify(measurements));
  for (const m of measurements) {
   assert.ok(m.input.width >= 180, `slider width ${m.input.width} < 180px`);
   assert.ok(Math.abs(m.input.y + m.input.height/2 - m.output.y - m.output.height/2) <= 1, 'output must share slider row');
   assert.ok(m.output.x >= m.input.right && m.output.x - m.input.right <= 16, 'output must be adjacent');
   assert.ok(m.output.width <= 60, 'output must not span label width');
  }
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
