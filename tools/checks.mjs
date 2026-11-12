#!/usr/bin/env node
/**
 * Static release gate. No browser and no dependencies: run it before every push.
 *
 *   npm run check
 *
 * It verifies the built artifacts, not the templates, so a stale build cannot pass.
 * Assertions cover links/anchors, asset references, canonical + hreflang, JSON-LD,
 * sitemap, font-size floor, the language policy for code comments, and a claim guard
 * that stops the specific over-promises we already removed from coming back.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, SITE } from './config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));
const problems = [];
let passed = 0;

function expect(cond, msg) {
  if (cond) passed++;
  else problems.push(msg);
}

function idSet(html) {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

function canonicalFor(out) {
  return SITE.baseUrl + (out === 'index.html' ? '' : out.replace(/index\.html$/, ''));
}

/* ---------------- per-page checks ---------------- */
for (const pg of PAGES) {
  const label = pg.out;
  expect(has(pg.out), `${label}: built file missing (run npm run build)`);
  if (!has(pg.out)) continue;

  const html = read(pg.out);
  const dir = dirname(pg.out);
  const ids = idSet(html);
  expect(!/\{\{[^}]+\}\}/.test(html), `${label}: unresolved template placeholder`);

  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|javascript:|data:)/.test(href)) continue;
    if (/^#/.test(href)) {
      if (href.length > 1) expect(ids.has(href.slice(1)), `${label}: local anchor ${href} has no target id`);
      continue;
    }
    const [file, hash] = href.split('#');
    const target = normalize(join(dir, file));
    if (!has(target)) {
      problems.push(`${label}: link target missing -> ${href}`);
      continue;
    }
    if (hash) expect(idSet(read(target)).has(hash), `${label}: ${href} points to a missing id "${hash}"`);
  }

  for (const m of html.matchAll(/\ssrc="([^"]+)"/g)) {
    const src = m[1];
    if (/^(https?:|data:)/.test(src)) continue;
    expect(has(normalize(join(dir, src))), `${label}: src missing -> ${src}`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  expect(!!canonical, `${label}: no canonical link`);
  if (canonical) {
    expect(canonical[1] === canonicalFor(pg.out), `${label}: canonical is ${canonical[1]}, expected ${canonicalFor(pg.out)}`);
    expect(!/index\.html$/.test(canonical[1]), `${label}: canonical must use the directory form`);
  }

  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);
  expect(hreflangs.includes(pg.hreflang), `${label}: missing self hreflang ${pg.hreflang}`);
  expect(hreflangs.includes(pg.altLang), `${label}: missing reciprocal hreflang ${pg.altLang}`);
  expect(hreflangs.includes('x-default'), `${label}: missing x-default hreflang`);

  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (pg.jsonld === 'none') {
    expect(ld.length === 0, `${label}: noindex page should not emit JSON-LD`);
  } else {
    expect(ld.length === 1, `${label}: expected exactly one JSON-LD block, got ${ld.length}`);
    if (ld.length === 1) {
      let graph;
      try { graph = JSON.parse(ld[0][1])['@graph']; } catch (e) {
        problems.push(`${label}: JSON-LD is not valid JSON (${e.message})`);
      }
      if (graph) {
        const flat = JSON.stringify(graph);
        expect(!/"offers"\s*:/.test(flat) && !/"@type"\s*:\s*"Offer"/.test(flat),
          `${label}: JSON-LD publishes an Offer before any plan is purchasable`);
        const expectedType = pg.jsonld === 'software' ? 'SoftwareApplication' : 'WebPage';
        expect(graph.some((n) => n['@type'] === expectedType), `${label}: JSON-LD missing ${expectedType}`);
      }
    }
  }
}

/* ---------------- claim guard ----------------
 * These phrases were removed because the implementation does not support them.
 * If a future release genuinely ships the capability, update this list deliberately
 * instead of quietly reintroducing the claim in copy.
 */
const BANNED_CLAIMS = [
  'costs cents, not dollars',
  '几美分到几十美分',
  'usually happens in the same session',
  '绝大多数情况下',
  '30-minute setup',
  '30 分钟接入',
  'triggered by a hook after each change',
  '由改动后的 Hook 触发',
  'What the early access build includes',
  '内测版包含什么',
  'the interface estimates it from your actual token usage',
  '界面上按你的实际 token 用量估算',
];
const allPages = PAGES.map((p) => p.out);
for (const page of allPages) {
  const html = read(page);
  for (const claim of BANNED_CLAIMS) {
    expect(!html.includes(claim), `${page}: removed over-promise came back -> "${claim}"`);
  }
}

expect(/verdicts never pass through a model/i.test(read('index.html')), 'index.html: BYOK copy must state that verdicts never pass through a model');
expect(read('zh/index.html').includes('判定不经过模型'), 'zh/index.html: BYOK copy must state that verdicts never pass through a model');
expect(read('index.html').includes('ILLUSTRATIVE'), 'index.html: demo data must be labeled ILLUSTRATIVE');
expect(read('zh/index.html').includes('示例数据，非真实运行结果'), 'zh/index.html: demo data must be labeled as illustrative');

/* ---------------- global artifacts ---------------- */
for (const f of ['sitemap.xml', 'robots.txt', 'llms.txt', '.nojekyll', 'LICENSE', 'README.md']) {
  expect(has(f), `missing artifact ${f}`);
}
if (has('sitemap.xml')) {
  const sm = read('sitemap.xml');
  const indexable = PAGES.filter((p) => !p.noindex).length;
  expect((sm.match(/xhtml:link/g) || []).length >= indexable * 3,
    'sitemap: each indexable URL needs self + reciprocal + x-default hreflang');
  expect(!/index\.html<\/loc>/.test(sm), 'sitemap: loc must use directory-form URLs');
}
if (has('robots.txt')) {
  expect(read('robots.txt').includes('Sitemap:'), 'robots.txt: missing Sitemap directive');
}
for (const img of ['assets/img/workspace.png', 'assets/img/og.png', 'assets/img/apple-touch-icon.png', 'assets/img/favicon.svg']) {
  expect(has(img) && statSync(join(ROOT, img)).size > 0, `missing or empty brand asset ${img}`);
}

/* ---------------- design-system + language guards ---------------- */
const css = read('assets/css/site.css');
const tooSmall = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
  .filter((m) => parseFloat(m[1]) < 12)
  .map((m) => m[0]);
expect(tooSmall.length === 0, `site.css hardcodes sub-12px font sizes: ${tooSmall.join(', ')}`);

const devFiles = readdirSync(join(ROOT, 'tools')).filter((f) => f.endsWith('.mjs')).map((f) => `tools/${f}`);
devFiles.push('assets/css/site.css', 'assets/js/site.js');
for (const f of devFiles) {
  // Product strings (page titles, demo data) may be Chinese in config.mjs / site.js;
  // only comments are held to the English language policy.
  const comments = [...read(f).matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g)].map((m) => m[0]).join('\n');
  expect(!/[\u4e00-\u9fff]/.test(comments), `${f}: code comments must be English`);
}

/* ---------------- report ---------------- */
if (problems.length) {
  for (const p of problems) console.log('  ✗ ' + p);
  console.log(`\n${passed} assertions passed, ${problems.length} FAILED`);
  process.exit(1);
}
console.log(`All ${passed} static assertions passed`);
