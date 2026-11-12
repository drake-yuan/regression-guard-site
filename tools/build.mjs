#!/usr/bin/env node
/**
 * Static site build: templates + copy in src/ -> .html in the repository root.
 *
 * Why a build at all: navigation, footer and head metadata (canonical,
 * hreflang, og) must be identical across all 7 pages. Hand-copying them 7 times
 * guarantees one page loses an hreflang link - an error invisible in a browser.
 * The build only does string replacement: no dependencies, no bundling, no
 * minification. Output is directly hostable, and the repository root is the
 * site root, which matches GitHub Pages defaults.
 *
 * Usage: node tools/build.mjs   (or npm run build)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PAGES } from './config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const write = (p, s) => {
  mkdirSync(dirname(join(ROOT, p)), { recursive: true });
  writeFileSync(join(ROOT, p), s);
};

const ui = JSON.parse(read('src/ui.json'));
const layout = read('src/layout.html');
const sprite = read('src/sprite.svg').trim();

/* Canonical absolute URL. Index pages use their directory form (/ and /zh/)
 * so that /index.html and / do not compete as two URLs for the same page. */
const abs = (out) => SITE.baseUrl + (out === 'index.html' ? '' : out.replace(/index\.html$/, ''));

/** Relative path from one built page to another */
function relLink(fromOut, toOut) {
  const fromDir = dirname(fromOut);
  return relative(fromDir === '.' ? '' : fromDir, toOut).split('\\').join('/');
}

const fill = (tpl, vars, where) => {
  const out = tpl.replace(/\{\{([\w.]+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  const left = [...out.matchAll(/\{\{([\w.]+)\}\}/g)].map((m) => m[1]);
  if (left.length) {
    throw new Error(`${where}: undefined placeholder ${[...new Set(left)].join(', ')}`);
  }
  return out;
};

/** Structured data: only assert things visible on the page, so JSON-LD never disagrees with the copy */
function structuredData(page) {
  if (page.jsonld === 'none') return '';
  const org = {
    '@type': 'Organization',
    '@id': abs('') + '#org',
    name: SITE.name,
    url: abs(''),
    sameAs: [SITE.repo],
  };
  const site = {
    '@type': 'WebSite',
    '@id': abs('') + '#site',
    url: abs(''),
    name: SITE.name,
    inLanguage: ['en', 'zh-CN'],
    publisher: { '@id': abs('') + '#org' },
  };
  let graph;
  if (page.jsonld === 'software') {
    graph = [
      org,
      site,
      {
        '@type': 'SoftwareApplication',
        name: SITE.name,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Windows, Linux',
        description: page.desc,
        url: abs(page.out),
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Pro', price: '19', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Team', price: '59', priceCurrency: 'USD' },
        ],
      },
    ];
  } else {
    graph = [
      org,
      site,
      {
        '@type': 'WebPage',
        '@id': abs(page.out) + '#page',
        url: abs(page.out),
        name: page.title,
        description: page.desc,
        inLanguage: page.hreflang,
        isPartOf: { '@id': abs('') + '#site' },
      },
    ];
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

const built = [];
for (const page of PAGES) {
  const depth = page.out.split('/').length - 1;
  const p = '../'.repeat(depth);
  const vars = {
    ...ui[page.lang],
    htmlLang: page.hreflang,
    hreflang: page.hreflang,
    title: page.title,
    desc: page.desc,
    canonical: abs(page.out),
    og: SITE.baseUrl + 'assets/img/og.png',
    altUrl: relLink(page.out, page.alt),
    altLang: page.altLang,
    altUrlAbs: abs(page.alt),
    xDefault: abs('index.html'),
    home: p + 'index.html',
    p,
    sprite,
    repo: SITE.repo,
    issues: SITE.issues,
    earlyAccessUrl: SITE.earlyAccessUrl,
    year: SITE.year,
    robots: page.noindex ? '<meta name="robots" content="noindex,follow">' : '',
    jsonld: structuredData(page),
  };
  // Fill the page body first, then the layout: {{p}} / {{home}} inside the body must resolve too
  vars.body = fill(read('src/pages/' + page.src).trim(), vars, page.src);
  const html = fill(layout, vars, page.out);
  write(page.out, html);
  built.push({ out: page.out, bytes: Buffer.byteLength(html) });
}

/* ---------------- sitemap.xml ---------------- */
const sitemapPages = PAGES.filter((pg) => !pg.noindex);
const urls = sitemapPages
  .map((pg) => {
    // A complete hreflang cluster: self-reference, the other language, and x-default.
    const alternates = [
      `    <xhtml:link rel="alternate" hreflang="${pg.hreflang}" href="${abs(pg.out)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="${pg.altLang}" href="${abs(pg.alt)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('index.html')}"/>`,
    ].join('\n');
    return [
      '  <url>',
      `    <loc>${abs(pg.out)}</loc>`,
      `    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>`,
      `    <changefreq>${pg.out.endsWith('index.html') ? 'weekly' : 'monthly'}</changefreq>`,
      `    <priority>${pg.lang === 'en' && pg.out === 'index.html' ? '1.0' : '0.7'}</priority>`,
      alternates,
      '  </url>',
    ].join('\n');
  })
  .join('\n');
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`,
);

/* ---------------- robots.txt ---------------- */
write(
  'robots.txt',
  `User-agent: *
Allow: /
Disallow: /src/
Disallow: /tools/

Sitemap: ${SITE.baseUrl}sitemap.xml
`,
);

/* ---------------- llms.txt ---------------- */
write(
  'llms.txt',
  `# ${SITE.name}

> ${SITE.tagline}

${SITE.name} is a verification layer for AI-driven software development. It turns approved
business behavior into reusable checks, runs them against the change a coding agent just made,
and returns PASS / FAIL / UNKNOWN with evidence bound to a code version.

## What it is not
- Not an AI test generator: it reuses approved checks first and proposes new ones only where coverage is missing.
- Not a Playwright replacement: Playwright executes; ${SITE.name} decides what to run and what the result proves.
- Not a "no regressions ever" guarantee: UNKNOWN exists precisely because evidence can be insufficient.

## Pages
- ${abs('index.html')} — product overview (English)
- ${abs('zh/index.html')} — product overview (Chinese)
- ${abs('access.html')} — early access request and what the build includes
- ${abs('privacy.html')} — what this site collects (nothing automatically)

## Pricing (indicative, pre-launch)
- Free: 1 project, 1 agent, unlimited change-triggered runs, 3 manual full runs per month
- Pro: $19 / month, 5 projects, unlimited full runs, CI-scheduled runs, 90-day evidence
- Team: $59 / month, unlimited projects, approval trail, evidence export, private runner
- Model usage is bring-your-own-key. Prices are for the product; model cost is billed by your provider.

## Honesty rules used on this site
- Every project name, check id, duration and verdict shown in the UI demo is labeled illustrative.
- No customer logos, no invented benchmark numbers, no claims about integrations that are not
  end-to-end verified yet.
- Verdicts never pass through a model: they are computed from deterministic assertions against
  approved expectations.

## Source
- ${SITE.repo}
`,
);

console.log('built:');
for (const b of built) console.log(`  ${b.out.padEnd(18)} ${(b.bytes / 1024).toFixed(1)} KB`);
console.log('  sitemap.xml, robots.txt, llms.txt');
