import { chromium } from 'playwright-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://localhost:5180/';
const STEPS = Number(process.argv[2] || 30);

const browser = await chromium.launch({
  executablePath: CHROME, headless: true,
  args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(URL, { waitUntil: 'load' });
await page.click('button.enter');
await page.waitForTimeout(1200);

const hasHook = await page.evaluate(() => typeof window.__museum !== 'undefined');
console.log('hook present:', hasHook);

const samples = [];
for (let i = 0; i < STEPS; i++) {
  // Use teleport (instant build/dispose) so the memory measurement does not
  // depend on headless rAF/timer scheduling. Follow door[0] each step.
  const s = await page.evaluate(() => {
    const next = window.__museum.doors[0];
    window.__museum.teleport(next);
    return {
      live: window.__museum.live,
      room: window.__museum.room,
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : -1,
    };
  });
  if (!s.room) { console.log('no room at step', i); break; }
  console.log(`step ${i}: room=${s.room} live=${s.live} heap=${s.heap}MB`);
  samples.push(s);
}

console.log('steps completed:', samples.length);
console.log('first 3:', JSON.stringify(samples.slice(0, 3)));
console.log('last 3 :', JSON.stringify(samples.slice(-3)));
const lives = samples.map((s) => s.live);
console.log('live room count range:', Math.min(...lives), '..', Math.max(...lives));
const heaps = samples.map((s) => s.heap).filter((h) => h > 0);
if (heaps.length >= 6) {
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const early = avg(heaps.slice(0, 5));
  const late = avg(heaps.slice(-5));
  console.log(`heap MB early≈${early.toFixed(0)} late≈${late.toFixed(0)} growth≈${(late - early).toFixed(0)}`);
}
const unique = new Set(samples.map((s) => s.room)).size;
console.log('unique rooms visited:', unique);
await page.screenshot({ path: '/tmp/museum-roomN.png' });
console.log('errors:', errors.length, errors.slice(0, 2).join(' | '));
await browser.close();
process.exit(errors.length || samples.length < STEPS ? 1 : 0);
