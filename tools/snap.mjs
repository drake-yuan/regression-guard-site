#!/usr/bin/env node
/**
 * Section screenshots of a single page (for visual inspection during development):
 *   node tools/snap.mjs / 1440 hero,demo,pricing
 * Args: path, width, comma-separated anchor ids (use 'top' for the top of the page)
 */
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

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
const [path = '/', width = '1440', ids = 'top'] = process.argv.slice(2);
const SHOTS = join(ROOT, 'shots');
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 } });
await page.goto(BASE + path, { waitUntil: 'load' });
await page.waitForTimeout(800);

for (const id of ids.split(',')) {
  if (id === 'top') {
    await page.evaluate(() => window.scrollTo(0, 0));
  } else {
    await page.evaluate((anchor) => {
      const el = document.getElementById(anchor);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 72);
    }, id);
  }
  await page.waitForTimeout(320);
  const name = `${path.replace(/\W+/g, '') || 'home'}-${width}-${id}.png`;
  await page.screenshot({ path: join(SHOTS, name) });
  console.log('shots/' + name);
}

await browser.close();
