import { chromium } from 'playwright-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.argv[2] || 'http://localhost:5180/';

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => console.log(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message, '\n', e.stack?.split('\n').slice(0,4).join('\n')); });

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(1500);

const html = await page.evaluate(() => ({
  hasApp: !!document.getElementById('app'),
  overlay: !!document.querySelector('.overlay'),
  museumName: document.querySelector('.museum-name')?.textContent ?? null,
  bodyLen: document.body.innerHTML.length,
}));
console.log('DOM:', JSON.stringify(html));

if (html.museumName) {
  await page.click('button.enter');
  await page.waitForTimeout(2500);
  const room = await page.textContent('#roomlabel').catch(() => null);
  console.log('Room label:', room);
  const diag = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
    return { hasGL: !!gl, w: c?.width };
  });
  console.log('Diag:', JSON.stringify(diag));
}
await page.screenshot({ path: '/tmp/museum.png' });
console.log('--- errors:', errors.length);
await browser.close();
process.exit(errors.length ? 1 : 0);
