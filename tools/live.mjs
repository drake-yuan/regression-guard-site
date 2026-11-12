#!/usr/bin/env node
/**
 * Post-deploy verification against the live GitHub Pages origin.
 *
 *   npm run live
 *   BASE=https://... npm run live          # override the origin
 *   PLAYWRIGHT_PATH=... npm run live      # reuse an existing install
 *
 * Unlike tools/shots.mjs (full local rendering + interaction QA), this checks
 * what the deployed origin actually serves: HTTP status, head metadata,
 * structured data, retired claims and a light render pass. Run it after
 * `git push` once the Pages build reports "built".
 *
 * Playwright is a development tool only; the site itself has no runtime deps.
 */
import { pathToFileURL } from 'node:url';

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

const BASE = (process.env.BASE || 'https://drake-yuan.github.io/regression-guard-site').replace(/\/$/, '');
const PAGES = [
  ['/', 'en', '/'],
  ['/zh/', 'zh', '/zh/'],
  ['/access.html', 'en-access', '/access.html'],
  ['/zh/access.html', 'zh-access', '/zh/access.html'],
  ['/privacy.html', 'en-privacy', '/privacy.html'],
  ['/zh/privacy.html', 'zh-privacy', '/zh/privacy.html'],
];
const ASSETS = [
  '/sitemap.xml', '/robots.txt', '/llms.txt', '/site.webmanifest',
  '/assets/css/site.css', '/assets/js/site.js', '/assets/img/og.png',
  '/assets/img/workspace.png', '/assets/img/favicon.svg',
];

// Claims removed from the site. If any of these reappear on the live origin,
// the deploy is stale or an edit slipped past tools/checks.mjs.
// Chinese literals below are assertions against ZH page copy, not developer-facing text.
const RETIRED = [
  'A run costs cents',
  'usually happens',
  '30-minute setup',
  '几美分',
  '绝大多数情况下',
  '30 分钟接入',
  '模型和检查条数',
];
// Positive proof that the current build is the one being served.
const REQUIRED = [
  ['/access.html', 'Being validated'],
  ['/zh/access.html', '正在验证'],
  ['/', 'Proposed scope'],
  ['/zh/', '规划中的定价'],
];

const browser = await chromium.launch();
const failures = [];
const note = (msg) => { failures.push(msg); console.log('  x ' + msg); };

try {
  console.log(`Live origin: ${BASE}`);

  // 1) Static probes: status only, no browser page needed.
  console.log('\nAsset probes:');
  for (const path of ASSETS) {
    const res = await browser.newPage().then(async (p) => {
      const r = await p.request.get(BASE + path, { timeout: 20000 });
      const status = r.status();
      await p.close();
      return status;
    });
    console.log(`  ${String(res).padStart(3)} ${path}`);
    if (res !== 200) note(`${path} returned ${res}, expected 200`);
  }

  const ctx = await browser.newContext();
  const missing = await ctx.request.get(BASE + '/definitely-not-a-page-xyz', { timeout: 20000 });
  console.log(`  ${String(missing.status()).padStart(3)} /definitely-not-a-page-xyz (expect 404)`);
  if (missing.status() !== 404) note(`unknown path returned ${missing.status()}, expected 404`);
  const body404 = await missing.text();
  if (!/never verified/i.test(body404)) note('custom 404 page was not served for an unknown path');
  await ctx.close();

  // 2) Per-page head, structured-data, claims and light render checks.
  for (const width of [1440, 390]) {
    console.log(`\nRender + metadata @ ${width}px:`);
    for (const [path, label, canonicalPath] of PAGES) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [], external = [], failed = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('request', (r) => {
        const u = r.url();
        if (!u.startsWith(BASE) && !/^(data|blob):/.test(u)) external.push(u);
      });
      page.on('requestfailed', (r) => failed.push(r.url()));

      let res;
      try {
        res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) {
        note(`${label}: navigation failed: ${e.message}`);
        await page.close();
        continue;
      }

      const info = await page.evaluate(() => {
        const de = document.documentElement;
        let min = 99;
        document.querySelectorAll('body *').forEach((el) => {
          const t = (el.textContent || '').trim();
          if (!t || el.children.length) return;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs && fs < min) min = fs;
        });
        const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map((s) => { try { return JSON.parse(s.textContent); } catch { return { PARSE_ERROR: true }; } });
        return {
          overflow: de.scrollWidth - de.clientWidth,
          min,
          canonical: document.querySelector('link[rel="canonical"]')?.href || '',
          hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
            .map((l) => l.hreflang).sort(),
          jsonld,
          text: document.body.innerText,
        };
      });

      // Lazy images sit far below the fold on narrow screens; force them in
      // before judging whether an image is broken.
      await page.evaluate(() => {
        [...document.images].forEach((i) => { i.loading = 'eager'; });
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      let imagesOk = false;
      try {
        await page.waitForFunction(
          () => [...document.images].every((i) => i.complete && i.naturalWidth > 0),
          null, { timeout: 8000 },
        );
        imagesOk = true;
      } catch { /* reported below */ }

      const local = [];
      if (res.status() !== 200) local.push(`status ${res.status()}`);
      if (info.overflow > 0) local.push(`overflow ${info.overflow}px`);
      if (info.min < 12) local.push(`min font ${info.min}px`);
      if (errors.length) local.push(`${errors.length} console errors`);
      if (external.length) local.push(`${external.length} external requests`);
      if (failed.length) local.push(`${failed.length} failed requests`);
      if (!imagesOk) local.push('image failed to load');
      if (info.canonical !== BASE + canonicalPath) local.push(`canonical ${info.canonical || '(missing)'}`);
      const wantLangs = ['en', 'x-default', 'zh-CN'].sort();
      if (JSON.stringify(info.hreflang) !== JSON.stringify(wantLangs)) {
        local.push(`hreflang ${info.hreflang.join(',') || '(missing)'}`);
      }
      if (!info.jsonld.length) local.push('JSON-LD missing');
      if (info.jsonld.some((j) => j.PARSE_ERROR || JSON.stringify(j).includes('"Offer"'))) {
        local.push('JSON-LD invalid or contains an Offer');
      }
      // innerText reflects rendered text, including CSS text-transform. The
      // section headings are uppercased in CSS, so compare case-insensitively.
      const haystack = info.text.toLowerCase();
      for (const claim of RETIRED) {
        if (haystack.includes(claim.toLowerCase())) local.push(`retired claim present: "${claim}"`);
      }
      for (const [where, needle] of REQUIRED) {
        if (where === path && !haystack.includes(needle.toLowerCase())) {
          local.push(`missing current copy: "${needle}"`);
        }
      }

      console.log(`  ${local.length ? 'x' : 'ok'} ${label.padEnd(11)} status=${res.status()} overflow=${info.overflow} min=${info.min} err=${errors.length} ext=${external.length}`);
      local.forEach((m) => note(`${label}: ${m}`));
      if (errors.length) console.log('    errors:', errors.slice(0, 2).join(' | '));
      if (external.length) console.log('    external:', external.slice(0, 2).join(' | '));
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log(failures.length ? `\n${failures.length} live check(s) failed` : '\nAll live checks passed');
process.exit(failures.length ? 1 : 0);
