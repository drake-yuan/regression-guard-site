# Regression Guard — Official Site

Regression Guard is a verification layer for AI-generated code. After an agent makes a change,
it states what the change **should** accomplish and what it **must not** break, executes that
against the target code version deterministically, and returns PASS / FAIL / UNKNOWN with
evidence a reviewer can act on.

**Live site: <https://drake-yuan.github.io/regression-guard-site/>**

This repository *is* the site: static HTML, one stylesheet, one dependency-free script.
No bundler, no runtime framework, no third-party requests.

## Hosting

| Platform | URL | Status |
| --- | --- | --- |
| GitHub Pages | `https://drake-yuan.github.io/regression-guard-site/` | **Canonical address**; published from the `main` branch root |
| Other mirrors | — | Not enabled. If one is added, the URL above stays the only public address |

There is no `gh-pages` branch. Build output lands in the repository root, so `main` is the
deployed content — there is no source/published pair that can drift out of sync.

## Local development

```bash
npm run build          # src/ + tools/config.mjs -> 7 pages + sitemap/robots/llms.txt
npm run serve          # http://127.0.0.1:8787, zero-dependency static server
```

Any edit under `src/` requires a rebuild. The `.html` files in the root are **generated
artifacts**; editing them by hand will be overwritten on the next build.

Publishing is two steps:

```bash
npm run build
git add -A && git commit -m "build: publish site" && git push
```

GitHub Pages takes 20–40 seconds to deploy; the first request may return an empty body or a
previous version.

## Layout

| Path | Purpose |
| --- | --- |
| `src/layout.html` | Shared shell: head, sticky nav, footer, icon-sprite mount point |
| `src/pages/*.html` | Page bodies (EN + ZH for `index` / `access` / `privacy`, plus `404`) |
| `src/ui.json` | Nav, footer and skip-link strings in both languages |
| `src/sprite.svg` | 25 stroked icon symbols, referenced as `<use href="#mi-*">` |
| `tools/config.mjs` | Single config source: domain, repository URLs, page inventory, hreflang, JSON-LD types |
| `tools/build.mjs` | Build script, dependency-free |
| `tools/serve.mjs` | Local preview server |
| `tools/shots.mjs` | QA: 6 pages x 4 widths; asserts overflow, min font size, console errors, external requests |
| `tools/snap.mjs` | Section screenshots for visual inspection |
| `tools/assets.mjs` | Generates `og.png` and the touch icon |
| `assets/css/site.css` | Single source of truth for styles (dark brand surface + light product surface) |
| `assets/js/site.js` | Dependency-free: sticky nav, mobile menu, tabs, FAQ, active-section highlight |
| `assets/img/` | Product screenshot, social image, icons |
| `index.html` `zh/` `access.html` `privacy.html` `404.html` | **Generated** — do not edit |

`src/` and `tools/` are excluded in `robots.txt`, but remain directly fetchable. This is a public
repository; nothing here is secret.

## Adding a page

1. Add an entry to `PAGES` in `tools/config.mjs` (`src` / `out` / `lang` / `title` / `desc` / `jsonld`).
2. Create `src/pages/<name>.<lang>.html`. `{{p}}` is the relative prefix back to the site root;
   `{{home}}` points at the homepage.
3. Run `npm run build`. Sitemap, hreflang, JSON-LD and nav highlighting follow automatically.

An unresolved `{{key}}` in a template throws during the build — a missing placeholder cannot
reach production silently.

## Conventions

**Language policy.** Developer-facing material — README, commit messages, code comments,
issue templates, tool output — is English. Site copy is bilingual: `index.html` / `access.html` /
`privacy.html` are English, `zh/*` are Simplified Chinese, with reciprocal `hreflang` links.
Do not translate product copy into a developer comment or vice versa.

**Honesty rules.** These are commitments printed on the pages; do not soften them when editing copy:

- **All demo data is labeled illustrative.** The hero report and the three demo tabs are
  constructed examples, not records of a real run.
- **No customer logo wall.** The product is in small-batch early access; there are no
  customers who can be named, so none are shown.
- **Pricing is indicative.** `$0 / $19 / $59` describe intended post-beta tiers only. No
  payment happens on this site and there is no auto-renewal.
- **Early access uses no signup form.** Requests are public GitHub issues, so the applicant keeps
  a searchable thread. The page states explicitly that source code, repo tokens, model API keys,
  production credentials and customer data are never requested.
- **The site collects nothing automatically.** No analytics, no cookies, no font CDN — verifiable
  request by request in the browser network panel. Hosting logs belong to GitHub.
- **With BYOK, verdicts never pass through a model.** A self-supplied key can help propose
  expectations; execution and verdict computation remain deterministic.

## QA

```bash
npx playwright install chromium   # once
npm run shots                     # start `npm run serve` first
```

`shots.mjs` checks 6 pages at 4 widths (1440 / 1080 / 820 / 390) and asserts: zero horizontal
overflow, rendered minimum font size >= 12px, zero console errors, zero external requests. Any
violation exits non-zero. Screenshots land in `shots/` (gitignored).

## License

MIT — see `LICENSE`. Page copy, product screenshots and the social image are covered by the same
license.

© 2026 Regression Guard
