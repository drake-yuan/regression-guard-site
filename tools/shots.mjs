#!/usr/bin/env node
/**
 * Screenshots and wide/narrow viewport checks (needs playwright; not a site runtime dependency).
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node tools/shots.mjs                 # defaults to http://127.0.0.1:8787
 *   BASE=http://127.0.0.1:8787 node tools/shots.mjs
 *
 * Output: shots/<page>-<width>.png plus a report on horizontal overflow, console errors and minimum font size.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const alt = process.env.PLAYWRIGHT_PATH;
    if (!alt) throw new Error('playwright not found: run npm i -D playwright, or set PLAYWRIGHT_PATH');
    return await import(pathToFileURL(alt).href);
  }
}
const mod = await loadPlaywright();
const chromium = (mod.chromium ? mod : mod.default).chromium;

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const SHOTS = join(ROOT, 'shots');
mkdirSync(SHOTS, { recursive: true });

const PAGES = [
  ['/', 'en'],
  ['/zh/', 'zh'],
  ['/access.html', 'en-access'],
  ['/zh/access.html', 'zh-access'],
  ['/privacy.html', 'en-privacy'],
  ['/404.html', '404'],
];
const WIDTHS = [1440, 1080, 820, 390];

const browser = await chromium.launch();
const report = [];

for (const [path, tag] of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    const external = [];
    page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) external.push(r.url()); });

    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(650);

    const stats = await page.evaluate(() => {
      let minFs = 99;
      const sizes = new Set();
      document.querySelectorAll('body *').forEach((el) => {
        if (!el.children.length && el.textContent.trim()) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const fs = parseFloat(cs.fontSize);
          sizes.add(fs);
          if (fs < minFs) minFs = fs;
        }
      });
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        docHeight: document.documentElement.scrollHeight,
        minFs,
        sizes: [...sizes].sort((a, b) => a - b),
        title: document.title,
        h1: document.querySelector('h1') ? document.querySelector('h1').textContent.trim().slice(0, 60) : null,
      };
    });

    if (width === 1440 || width === 390) {
      await page.screenshot({ path: join(SHOTS, `${tag}-${width}.png`), fullPage: width === 1440 });
    }
    report.push({ path, tag, width, ...stats, errors, external: [...new Set(external)] });
    await page.close();
  }
}

await browser.close();

let fail = 0;
for (const r of report) {
  const bad = [];
  if (r.overflow > 0) bad.push(`overflow ${r.overflow}px`);
  if (r.minFs < 12) bad.push(`min font ${r.minFs}px`);
  if (r.errors.length) bad.push(`${r.errors.length} console errors`);
  if (r.external.length) bad.push(`${r.external.length} external requests`);
  if (bad.length) fail++;
  console.log(
    `${r.path.padEnd(18)} ${String(r.width).padStart(4)}  ` +
    `h=${String(r.docHeight).padStart(5)}  min=${r.minFs}  ${bad.length ? '✗ ' + bad.join(' / ') : '✓'}`,
  );
  if (r.errors.length) console.log('    errors:', r.errors.slice(0, 3).join(' | '));
  if (r.external.length) console.log('    external:', r.external.slice(0, 3).join(' | '));
}
console.log(fail ? `\n${fail} check(s) failed` : '\nAll checks passed');
process.exit(fail ? 1 : 0);
