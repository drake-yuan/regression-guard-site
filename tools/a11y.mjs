#!/usr/bin/env node
/**
 * Optional WCAG audit. The site has zero runtime dependencies and no build step,
 * so axe-core is deliberately NOT a required devDependency. Install it only when
 * you want this deeper scan:
 *
 *   npm i -D @axe-core/playwright
 *   npm run serve                 # in another terminal
 *   npm run a11y
 *
 * Without the package this script exits 0 and reports a skip, so CI never breaks
 * on an optional tool. Structural a11y (skip link, focus ring, tab ARIA,
 * aria-expanded, keyboard keys) is always asserted by tools/shots.mjs.
 */
import { pathToFileURL } from 'node:url';

let AxeBuilder;
try {
  const axe = await import('@axe-core/playwright');
  AxeBuilder = axe.default || axe.AxeBuilder || axe;
} catch {
  console.log('axe-core skipped (optional): npm i -D @axe-core/playwright to enable the WCAG audit.');
  process.exit(0);
}

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

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const PAGES = ['/', '/zh/', '/access.html', '/zh/access.html', '/privacy.html', '/zh/privacy.html'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const browser = await chromium.launch();
let blocking = 0;
try {
  for (const path of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(BASE + path, { waitUntil: 'load' });
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    blocking += serious.length;
    console.log(`${path.padEnd(18)} ${serious.length ? 'x' : 'ok'}  ${serious.length} serious/critical, ${results.violations.length} total, ${results.passes.length} passed`);
    for (const v of serious) {
      console.log(`    ${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`);
      console.log(`      ${v.nodes[0] && v.nodes[0].target.join(' ')}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
process.exit(blocking ? 1 : 0);
