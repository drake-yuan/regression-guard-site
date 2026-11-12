#!/usr/bin/env node
/**
 * Generates bitmap assets: og.png (1200x630) and apple-touch-icon.png (180x180).
 *
 * Why a script: these are reproducible artifacts, not one-off binary exports
 * whose source is lost. After changing copy, rerun this instead of reopening
 * a design tool.
 *
 * Requires playwright locally; the site itself has no such dependency.
 *   npm i -D playwright && npx playwright install chromium
 *   node tools/assets.mjs
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Allow PLAYWRIGHT_PATH to point at an existing install when this repo has no node_modules */
async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (err) {
    const alt = process.env.PLAYWRIGHT_PATH;
    if (!alt) {
      throw new Error(
        'playwright not found. Run npm i -D playwright, or set PLAYWRIGHT_PATH to playwright/index.mjs',
      );
    }
    return await import(pathToFileURL(alt).href);
  }
}

function pickChromium(mod) {
  // When a CJS package is imported as ESM, its exports hang off default
  const m = mod && mod.chromium ? mod : mod && mod.default;
  if (!m || !m.chromium) throw new Error('Failed to resolve playwright exports: chromium not found');
  return m.chromium;
}
const chromium = pickChromium(await loadPlaywright());

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'assets', 'img');
mkdirSync(OUT, { recursive: true });

const MARK = `
<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
  <defs><linearGradient id="g" x1="8" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
    <stop stop-color="#9BC1FF"/><stop offset="1" stop-color="#5FD8C9"/></linearGradient></defs>
  <rect width="32" height="32" rx="8" fill="#0B1220"/>
  <g fill="none" stroke="url(#g)" stroke-linecap="round">
    <path d="M11.6 8.4v15.2" stroke-width="3.1"/>
    <path d="M11.6 9.9h5.1a3.6 3.6 0 0 1 0 7.2h-5.1" stroke-width="3.1"/>
    <path d="m16.4 17.2 4.6 6.4" stroke-width="3.1"/>
  </g>
</svg>`;

const FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, "Cascadia Mono", Consolas, monospace';

const og = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#070C16;color:#F2F6FD;font-family:${FONT};
    overflow:hidden;position:relative}
  .glow{position:absolute;inset:0;background:
    radial-gradient(700px 480px at 6% -16%,rgba(58,116,204,.32),transparent 62%),
    radial-gradient(560px 420px at 98% 4%,rgba(28,140,140,.18),transparent 62%)}
  .grid{position:absolute;inset:0;opacity:.55;background-image:
    linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
    background-size:64px 64px;mask-image:radial-gradient(760px 460px at 26% 0%,#000,transparent 74%)}
  .in{position:relative;padding:60px 64px;height:100%;display:flex;align-items:center;gap:40px}
  .copy{width:664px;flex:0 0 auto}
  .brand{display:flex;align-items:center;gap:13px;font-size:24px;font-weight:800;letter-spacing:-.4px}
  .brand .m{width:40px;height:40px;border-radius:10px;overflow:hidden;box-shadow:0 0 24px rgba(105,173,255,.28)}
  .brand .thin{color:#8AB4FF;font-weight:700}
  h1{margin-top:36px;font-size:46px;line-height:1.14;letter-spacing:-1.7px;font-weight:800}
  h1 .b{color:#8AB4FF}
  p{margin-top:18px;font-size:19px;line-height:1.65;color:#A6B4C9;max-width:600px}
  .row{margin-top:32px;display:flex;align-items:center;gap:10px}
  .chip{display:inline-flex;align-items:center;padding:10px 16px;border-radius:999px;
    font:700 15px/1 ${MONO};letter-spacing:.08em;border:1px solid}
  .pass{color:#5FD8A4;border-color:rgba(95,216,164,.42);background:rgba(95,216,164,.09)}
  .fail{color:#FF8794;border-color:rgba(255,135,148,.42);background:rgba(255,135,148,.09)}
  .unk{color:#F3C784;border-color:rgba(243,199,132,.42);background:rgba(243,199,132,.09)}
  .card{flex:1;min-width:0;border:1px solid rgba(158,182,219,.22);border-radius:14px;
    background:linear-gradient(180deg,#0E1727,#0A121F);box-shadow:0 40px 80px -40px #000;
    overflow:hidden;transform:rotate(.6deg)}
  .bar{display:flex;justify-content:space-between;align-items:center;padding:13px 16px;
    border-bottom:1px solid rgba(158,182,219,.14);font:700 12px/1 ${MONO};letter-spacing:.09em;color:#8FA2BC}
  .bar span{color:#F3C784;border:1px solid rgba(243,199,132,.4);background:rgba(243,199,132,.1);
    padding:5px 8px;border-radius:5px;font-size:11px}
  .exp{display:flex;gap:11px;align-items:flex-start;padding:15px 16px;border-bottom:1px solid rgba(158,182,219,.1)}
  .sym{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;font:800 13px/1 ${MONO};flex:0 0 auto}
  .sym.p{background:rgba(95,216,164,.14);color:#5FD8A4;border:1px solid rgba(95,216,164,.34)}
  .sym.f{background:rgba(255,135,148,.14);color:#FF8794;border:1px solid rgba(255,135,148,.34)}
  .exp b{display:block;font-size:14px;line-height:1.45;color:#E7EEF9;font-weight:700}
  .exp small{display:block;margin-top:4px;font:12px/1.5 ${MONO};color:#8B9DB5}
  .evi{padding:14px 16px;font:12px/1.7 ${MONO};color:#93A6BE;background:rgba(255,255,255,.015)}
  .evi b{color:#FF8794;font-weight:700}
  .foot{display:flex;justify-content:space-between;padding:11px 16px;border-top:1px solid rgba(158,182,219,.12);
    font:11px/1.4 ${MONO};color:#697C94;letter-spacing:.04em}
</style></head><body>
<div class="glow"></div><div class="grid"></div>
<div class="in">
  <div class="copy">
    <div class="brand"><span class="m">${MARK}</span><span>Regression<span class="thin"> Guard</span></span></div>
    <h1>Your agent changed the code.<br><span class="b">Did it break anything?</span></h1>
    <p>Verifies what a change should do — and what must keep working. Locally, with evidence bound to a code version.</p>
    <div class="row"><span class="chip pass">PASS</span><span class="chip fail">FAIL</span><span class="chip unk">UNKNOWN</span></div>
  </div>
  <div class="card">
    <div class="bar">CHANGE VERIFICATION <span>ILLUSTRATIVE</span></div>
    <div class="exp"><span class="sym p">+</span><div><b>Target · Coupon claim works</b><small>claim → feedback → coupon in account</small></div></div>
    <div class="exp"><span class="sym f">!</span><div><b>Protection · Inventory unchanged</b><small>before 12 · after 11</small></div></div>
    <div class="evi">Expected <b>12</b> · observed <b>11</b><br>check #INV-004 · bound to 9f2c1a7</div>
    <div class="foot"><span>local runner</span><span>example data</span></div>
  </div>
</div></body></html>`;

const icon = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0}
  body{width:180px;height:180px;background:#0B1220;display:grid;place-items:center;overflow:hidden}
  .m{width:132px;height:132px}
</style></head><body><div class="m">${MARK}</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(og, { waitUntil: 'load' });
await page.waitForTimeout(120);
await page.screenshot({ path: join(OUT, 'og.png') });

const iconPage = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
await iconPage.setContent(icon, { waitUntil: 'load' });
await iconPage.waitForTimeout(80);
await iconPage.screenshot({ path: join(OUT, 'apple-touch-icon.png'), omitBackground: false });

await browser.close();
console.log('assets written: og.png (1200×630), apple-touch-icon.png (180×180)');
