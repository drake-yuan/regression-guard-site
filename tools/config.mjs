/**
 * Site configuration: domain, repository URLs and the page inventory live here only.
 * To move to a custom domain, set baseUrl to https://your-domain/ (trailing slash required)
 * and rerun npm run build; canonical, og:url, sitemap and llms.txt update together.
 */

export const SITE = {
  name: 'Regression Guard',
  tagline: 'Verify the change. Protect what matters.',
  baseUrl: 'https://drake-yuan.github.io/regression-guard-site/',
  repo: 'https://github.com/drake-yuan/regression-guard-site',
  issues: 'https://github.com/drake-yuan/regression-guard-site/issues',
  earlyAccessUrl:
    'https://github.com/drake-yuan/regression-guard-site/issues/new?template=early-access.yml',
  year: 2026,
};

/**
 * Page inventory. src is the template (with {{placeholders}}); out is the built path
 * relative to the repository root, which is also the site root.
 * alt / altLang drive reciprocal hreflang links; jsonld selects the structured-data type.
 */
export const PAGES = [
  {
    src: 'index.en.html',
    out: 'index.html',
    lang: 'en',
    hreflang: 'en',
    alt: 'zh/index.html',
    altLang: 'zh-CN',
    title: 'Regression Guard — verify what your AI agent changed, and what it broke',
    desc: 'Regression Guard turns approved business behavior into reusable checks, runs them against the change an AI coding agent just made, and returns PASS, FAIL or UNKNOWN with version-bound evidence. Runs locally.',
    jsonld: 'software',
  },
  {
    src: 'index.zh.html',
    out: 'zh/index.html',
    lang: 'zh',
    hreflang: 'zh-CN',
    alt: 'index.html',
    altLang: 'en',
    title: 'Regression Guard — 证明 AI 改对了，也证明它没改坏',
    desc: 'Regression Guard 把团队已批准的业务行为变成可复用的检查，在 AI 编码代理改完代码后执行，并给出绑定代码版本与证据的 PASS / FAIL / UNKNOWN 结论。全部在本地运行。',
    jsonld: 'software',
  },
  {
    src: 'access.en.html',
    out: 'access.html',
    lang: 'en',
    hreflang: 'en',
    alt: 'zh/access.html',
    altLang: 'zh-CN',
    title: 'Request early access — Regression Guard',
    desc: 'Regression Guard is onboarding in small batches. Here is exactly what the early access build includes, what we ask for, and what we never collect.',
    jsonld: 'webpage',
  },
  {
    src: 'access.zh.html',
    out: 'zh/access.html',
    lang: 'zh',
    hreflang: 'zh-CN',
    alt: 'access.html',
    altLang: 'en',
    title: '申请内测 — Regression Guard',
    desc: 'Regression Guard 正在小批量放号。这一页写清：内测版包含什么、申请要提供什么、我们绝不收集什么。',
    jsonld: 'webpage',
  },
  {
    src: 'privacy.en.html',
    out: 'privacy.html',
    lang: 'en',
    hreflang: 'en',
    alt: 'zh/privacy.html',
    altLang: 'zh-CN',
    title: 'Privacy — Regression Guard',
    desc: 'What this website collects (nothing automatically), what the early access request contains, and why your model key and source code never reach us.',
    jsonld: 'webpage',
  },
  {
    src: 'privacy.zh.html',
    out: 'zh/privacy.html',
    lang: 'zh',
    hreflang: 'zh-CN',
    alt: 'privacy.html',
    altLang: 'en',
    title: '隐私说明 — Regression Guard',
    desc: '这个网站收集什么（不会自动收集任何东西）、内测申请里包含什么、为什么模型 Key 与源码不会经过我们。',
    jsonld: 'webpage',
  },
  {
    src: '404.html',
    out: '404.html',
    lang: 'en',
    hreflang: 'en',
    alt: 'index.html',
    altLang: 'zh-CN',
    title: 'Page not found — Regression Guard',
    desc: 'This page does not exist. The verification report you were looking for is not here.',
    jsonld: 'none',
    noindex: true,
  },
];
