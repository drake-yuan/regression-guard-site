# Regression Guard — Official Site

Regression Guard reuses human-approved behavioral checks against a specific code version,
executes them deterministically and returns **PASS / FAIL / UNKNOWN** with evidence a
reviewer can act on. UNKNOWN is never reported as a pass.

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

## Product status

Every capability statement on these pages must map to runnable code in
`04-Products/Regression-Guard/` (the product workspace) before it is written as fact.
Check this table before editing any product copy.

| State | Meaning | Examples |
| --- | --- | --- |
| Shipped | Runnable code exists | Deterministic checks in a local Chromium session; PASS / FAIL / UNKNOWN where UNKNOWN is never a pass; version-bound evidence and a single-file HTML report; human approval gate; loopback-only workbench |
| In validation | First-release work, not delivered | Coding-agent hooks; full-regression CLI; a working CI example; scheduled runs; run records that distinguish the trigger source |
| Planned | No date promised | Shared expectation libraries; hosted runners; SSO; built-in scheduling; automatic failure repair |
| Commercial draft | Not purchasable | The `$0 / $19 / $59` tiers and every entitlement listed under them |

**BYOK status.** The current engine makes zero model calls during a normal regression run
and has no API key to configure. Model-assisted drafting is planned, not shipped. When a
bring-your-own-key option ships, usage will be billed by the provider directly; the site
never quotes a per-run cost without measured data, and **verdicts never pass through a
model**.

## Local development

```bash
npm run build          # src/ + tools/config.mjs -> 7 pages + sitemap/robots/llms.txt
npm run serve          # http://127.0.0.1:8787, zero-dependency static server
npm run qa             # static release gate + browser QA (serve must be running)
```

Any edit under `src/` requires a rebuild. The `.html` files in the root are **generated
artifacts**; editing them by hand will be overwritten on the next build.

Publishing is a deliberate, human step — nothing here commits or pushes automatically:

```bash
npm run build && npm run qa
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
| `tools/checks.mjs` | Static release gate: links, anchors, assets, canonical/hreflang, JSON-LD, sitemap, claim guard |
| `tools/shots.mjs` | Browser QA: 7 pages x 5 widths plus keyboard/ARIA interaction assertions |
| `tools/a11y.mjs` | Optional axe-core WCAG audit; skipped when the optional package is absent |
| `tools/serve.mjs` | Local preview server |
| `tools/snap.mjs` | Section screenshots for visual inspection |
| `tools/assets.mjs` | Generates `og.png` and the touch icon |
| `assets/css/site.css` | Single source of truth for styles (dark brand surface + light product surface) |
| `assets/js/site.js` | Dependency-free: sticky nav, mobile menu, tabs, FAQ, active-section highlight |
| `assets/img/` | Product screenshot, social image, icons — brand assets, not MIT |
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
Product strings that are legitimately Chinese (page titles, descriptions, demo data) may live
inside `tools/config.mjs` and `assets/js/site.js`; `tools/checks.mjs` enforces this by scanning
**comments only**.

**Honesty rules.** These are commitments printed on the pages; do not soften them when editing copy:

- **Capability claims are tiered.** Shipped / in validation / planned. Never present in-validation
  or planned work as something an early-access user will receive.
- **No unmeasured numbers.** No setup times, success rates or per-run model costs without
  measured data. `tools/checks.mjs` blacklists the specific over-promises already removed.
- **All demo data is labeled illustrative.** The hero report and the three demo tabs are
  constructed examples, not records of a real run.
- **No customer logo wall.** There are no customers who can be named, so none are shown.
- **Pricing is a draft.** `$0 / $19 / $59` are indicative post-beta tiers. No plan is purchasable,
  no payment happens on this site, and every entitlement is proposed scope.
- **JSON-LD carries no `Offer` until billing exists.** Search engines read `Offer` as a live
  price; the static gate fails the build if one reappears.
- **With BYOK, verdicts never pass through a model.** A self-supplied key may eventually help
  propose expectations; execution and verdict computation are deterministic, and the current
  engine makes zero model calls.
- **Early access uses no signup form.** Requests are public GitHub issues, so the applicant keeps
  a searchable thread. The page states explicitly that source code, repo tokens, model API keys,
  production credentials and customer data are never requested.
- **The site collects nothing automatically.** No analytics, no cookies, no font CDN — verifiable
  request by request in the browser network panel. Hosting logs belong to GitHub.

## QA

```bash
npm run check          # static gate, no browser needed
npx playwright install chromium   # once, for the browser checks
npm run serve          # in another terminal
npm run shots
npm run a11y           # optional, needs npm i -D @axe-core/playwright
```

| Layer | Assertions |
| --- | --- |
| `checks.mjs` | Every internal link and anchor resolves; every `src` / SVG symbol exists; canonical uses the directory form; self + reciprocal + x-default hreflang; JSON-LD parses, has the right type and **no `Offer`**; sitemap hreflang and directory-form URLs; no sub-12px font sizes; English code comments; banned capability/cost claims cannot return |
| `shots.mjs` | 7 pages x 5 widths (1440 / 1080 / 820 / 390 / 320): status 200, zero horizontal overflow, rendered min font >= 12px, zero broken images, zero console errors, zero external requests, zero failed requests; skip link is the first Tab stop; demo tabs enforce a single `aria-selected`, `aria-labelledby`, roving tabindex and Arrow/Home/End keys; FAQ accordion keeps one item open; mobile menu `aria-expanded`, Escape and outside click |
| `a11y.mjs` | Optional axe-core WCAG 2.0/2.1 A+AA scan. Not a required dependency, so the zero-dependency build is preserved; structural a11y is always covered by `shots.mjs` |

Browser checks wait on real conditions (font readiness and CSS animation completion) instead of a
fixed sleep, and always close the browser in a `finally` block. Any violation exits non-zero.
Screenshots land in `shots/` (gitignored).

## License

**Code is MIT** — see `LICENSE`: build tooling, `src/layout.html`, `src/sprite.svg`,
`assets/css/site.css`, `assets/js/site.js`, and the HTML/CSS structure of the generated pages.

**Brand assets are not MIT** and may not be reused to market another product without permission:
the product name and wordmark, `assets/img/workspace.png` (product screenshot), `assets/img/og.png`,
`assets/img/apple-touch-icon.png`, `assets/img/favicon.svg`, and all site/product copy in
`src/pages/*.html`, `src/ui.json` and the generated pages.

This is a public GitHub Pages site, so those assets can still be viewed and downloaded. The
notice above states the license; it is not a technical access restriction.

© 2026 Regression Guard
