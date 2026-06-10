import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const out = [];
const log = (...a) => out.push(a.join(' '));
try {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(8000);
  page.on('pageerror', (e) => log('PAGEERR', e.message));
  await page.goto('http://localhost:5180/', { waitUntil: 'load' });
  await page.click('button.enter');
  await page.waitForTimeout(1200);

  for (let i = 0; i < 5; i++) {
    const before = await page.evaluate(() => ({ room: window.__museum.room, doors: window.__museum.doors }));
    log(`step ${i} before: room=${before.room} doors=${JSON.stringify(before.doors)}`);
    const target = before.doors[0];
    const res = await page.evaluate(async (id) => {
      const r = await Promise.race([
        window.__museum.go(id).then(() => 'resolved'),
        new Promise((res) => setTimeout(() => res('timeout'), 4000)),
      ]);
      return r;
    }, target);
    const after = await page.evaluate(() => window.__museum.room);
    log(`step ${i} go(${target}) -> ${res}; room now ${after}`);
  }
  await browser.close();
} catch (e) {
  log('THROW', e.message);
}
writeFileSync('/tmp/probe.json', out.join('\n'));
