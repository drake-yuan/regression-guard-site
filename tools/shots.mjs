#!/usr/bin/env node
/**
 * Browser QA: screenshots, viewport checks and interaction assertions.
 * Playwright is a development tool only, never a site runtime dependency.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   npm run serve                      # in another terminal
 *   npm run shots
 *
 * PLAYWRIGHT_PATH points at an existing install when this repository has no
 * node_modules. BASE overrides the preview origin (e.g. the live Pages URL).
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
  ['/zh/privacy.html', 'zh-privacy'],
  ['/404.html', '404'],
];
const WIDTHS = [1440, 1080, 820, 390, 320];

/** Wait on real conditions (fonts + CSS animations) instead of a fixed sleep. */
async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const anims = typeof document.getAnimations === 'function' ? document.getAnimations() : [];
    if (anims.length) {
      await Promise.race([
        Promise.all(anims.map((a) => a.finished.catch(() => {}))),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
    }
  });
}

/**
 * A lazy-loaded image below the fold is legitimately `complete === false`.
 * Scroll each image into view and wait for the real network load instead of
 * treating "not loaded yet" as "broken".
 */
async function verifyImages(page, note) {
  const count = await page.evaluate(() => document.images.length);
  for (let idx = 0; idx < count; idx++) {
    const src = await page.evaluate((i) => {
      const img = document.images[i];
      if (!img) return '';
      img.scrollIntoView({ block: 'center' });
      return img.currentSrc || img.src;
    }, idx);
    try {
      await page.waitForFunction(
        (i) => { const img = document.images[i]; return img && img.complete && img.naturalWidth > 0; },
        idx, { timeout: 4000 },
      );
    } catch {
      note(`image never finished loading: ${src}`);
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function homeInteractions(page, label, out) {
  const note = (msg) => out.push(`${label}: ${msg}`);

  await page.keyboard.press('Tab');
  const firstStop = await page.evaluate(() => document.activeElement && document.activeElement.className);
  if (!String(firstStop).includes('skip-link')) note(`first Tab stop is "${firstStop}", expected skip-link`);

  await verifyImages(page, note);

  const tabCount = await page.locator('.mk-tab').count();
  if (tabCount !== 3) {
    note(`expected 3 demo tabs, found ${tabCount}`);
  } else {
    const selected = await page.locator('.mk-tab[aria-selected="true"]').count();
    if (selected !== 1) note(`aria-selected count is ${selected}, expected exactly 1`);

    await page.locator('#tab-reuse').click();
    if (await page.locator('#tab-reuse').getAttribute('aria-selected') !== 'true') note('click did not select tab-reuse');
    if (await page.locator('#demoPanel').getAttribute('aria-labelledby') !== 'tab-reuse') note('panel aria-labelledby not updated');

    const roving = await page.evaluate(() => [...document.querySelectorAll('.mk-tab')]
      .map((t) => ({ id: t.id, tabIndex: t.tabIndex })));
    if (roving.find((t) => t.id === 'tab-reuse').tabIndex !== 0 ||
        roving.filter((t) => t.tabIndex === -1).length !== 2) note('roving tabindex is broken');

    for (const [key, expected] of [['ArrowRight', 'tab-evidence'], ['Home', 'tab-understand'], ['End', 'tab-evidence']]) {
      await page.keyboard.press(key);
      const got = await page.locator('.mk-tab[aria-selected="true"]').getAttribute('id');
      if (got !== expected) note(`${key} selected ${got}, expected ${expected}`);
    }
  }

  const faq = page.locator('.mk-faq details');
  if (await faq.count() >= 2) {
    await faq.nth(1).locator('summary').click();
    // `toggle` events are async: wait until the accordion converges on one open item,
    // rather than sampling immediately after the click.
    try {
      await page.waitForFunction(() => {
        const items = [...document.querySelectorAll('.mk-faq details')];
        return items[1] && items[1].open && items.filter((d) => d.open).length === 1;
      }, null, { timeout: 2500 });
    } catch {
      const openCount = await page.locator('.mk-faq details[open]').count();
      note(`FAQ accordion did not converge on one open item (${openCount} open)`);
    }
  } else {
    note('FAQ items not found');
  }
}

async function menuInteractions(page, label, out) {
  const note = (msg) => out.push(`${label}: ${msg}`);
  const btn = page.locator('#menuToggle');
  const links = page.locator('#navLinks');

  await btn.click();
  if (await btn.getAttribute('aria-expanded') !== 'true') note('aria-expanded did not become true');
  if (!(await links.evaluate((el) => el.classList.contains('open')))) note('menu panel did not open');
  if (!(await links.isVisible())) note('menu panel is not visible');

  await page.keyboard.press('Escape');
  if (await btn.getAttribute('aria-expanded') !== 'false') note('Escape did not close the menu');

  await btn.click();
  await page.mouse.click(8, 700);
  if (await btn.getAttribute('aria-expanded') !== 'false') note('outside click did not close the menu');
}

const browser = await chromium.launch();
const report = [];
const interactionFailures = [];

try {
  for (const [path, tag] of PAGES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      const external = [];
      page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) external.push(r.url()); });
      const failedRequests = [];
      page.on('requestfailed', (r) => failedRequests.push(r.url()));

      const response = await page.goto(BASE + path, { waitUntil: 'load' });
      await settle(page);

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
        const imgs = [...document.images];
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          docHeight: document.documentElement.scrollHeight,
          minFs,
          sizes: [...sizes].sort((a, b) => a - b),
          brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
          title: document.title,
          h1: document.querySelector('h1') ? document.querySelector('h1').textContent.trim().slice(0, 60) : null,
        };
      });

      if (width === 1440 && (tag === 'en' || tag === 'zh')) {
        await homeInteractions(page, `${tag}@${width}`, interactionFailures);
      }
      if (width === 390 && tag === 'en') {
        await menuInteractions(page, `${tag}@${width}`, interactionFailures);
      }

      if (width === 1440 || width === 390) {
        await page.screenshot({ path: join(SHOTS, `${tag}-${width}.png`), fullPage: width === 1440 });
      }
      report.push({
        path, tag, width, ...stats, status: response ? response.status() : 0,
        errors, external: [...new Set(external)], failedRequests,
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

let fail = 0;
for (const r of report) {
  const bad = [];
  if (r.status !== 200) bad.push(`status ${r.status}`);
  if (r.overflow > 0) bad.push(`overflow ${r.overflow}px`);
  if (r.minFs < 12) bad.push(`min font ${r.minFs}px`);
  if (r.brokenImages) bad.push(`${r.brokenImages} broken images`);
  if (r.errors.length) bad.push(`${r.errors.length} console errors`);
  if (r.external.length) bad.push(`${r.external.length} external requests`);
  if (r.failedRequests.length) bad.push(`${r.failedRequests.length} failed requests`);
  if (bad.length) fail++;
  console.log(
    `${r.path.padEnd(18)} ${String(r.width).padStart(4)}  ` +
    `h=${String(r.docHeight).padStart(5)}  min=${r.minFs}  ${bad.length ? 'x ' + bad.join(' / ') : 'ok'}`,
  );
  if (r.errors.length) console.log('    errors:', r.errors.slice(0, 3).join(' | '));
  if (r.external.length) console.log('    external:', r.external.slice(0, 3).join(' | '));
}

if (interactionFailures.length) {
  console.log('\nInteraction assertions:');
  interactionFailures.forEach((m) => console.log('  x ' + m));
}
const total = fail + interactionFailures.length;
console.log(total ? `\n${total} check(s) failed` : '\nAll browser checks passed');
process.exit(total ? 1 : 0);
