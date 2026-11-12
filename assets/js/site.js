/* ==========================================================================
   Regression Guard - site interactions (no dependencies, no build, one file)

   1) Sticky nav darkens after 8px of scroll
   2) Mobile menu (aria-expanded / Esc / outside click / link click closes it)
   3) Product demo tabs (click + arrow keys + Home/End, roving tabindex)
   4) FAQ accordion (only one panel open at a time)
   5) Active-section nav highlight (IntersectionObserver, silently skipped
      when unsupported)

   Demo copy (RG_DEMO) lives here rather than in the templates: the markup in
   the templates is a static fallback for JS-disabled browsers, while the
   runtime source of truth is this file. Keeping both in one place avoids two
   half-updated copies.
   ========================================================================== */


var RG_DEMO = {
  "en": {
    "understand": {
      "eyebrow": "Change intelligence",
      "title": "Understand what the agent intended.",
      "description": "Regression Guard reads the change context and separates the new behavior that should work from existing behavior that must remain unaffected.",
      "outputTitle": "CHANGE ANALYSIS",
      "foot": "Illustrative data · proposed expectations are not automatically approved",
      "points": [
        "Read the developer request and the agent's change summary.",
        "Inspect changed files and the relevant project context.",
        "Separate target expectations from protection expectations."
      ],
      "output": "<span class=\"c-mut\">Change:</span>\n<span class=\"c-blue\">feat: add coupon claim flow</span>\n\n<span class=\"c-mut\">Target expectation</span>\n<span class=\"c-green\">+</span> Eligible customer can claim a coupon.\n<span class=\"c-green\">+</span> Claimed coupon appears in the account.\n\n<span class=\"c-mut\">Protection expectation</span>\n<span class=\"c-amber\">!</span> Inventory must remain unchanged.\n<span class=\"c-amber\">!</span> Existing checkout still works.\n\n<span class=\"c-mut\">Approval state:</span>\n<span class=\"c-amber\">Needs review for new expectations</span>"
    },
    "reuse": {
      "eyebrow": "Check asset reuse",
      "title": "Reuse what the project already knows.",
      "description": "Approved checks are selected before new ones are generated. A change should not force the team to rediscover the same critical behavior.",
      "outputTitle": "SELECTED CHECK SET",
      "foot": "Illustrative data · selection must be validated against the actual project",
      "points": [
        "Find checks linked to the affected expectations.",
        "Prioritise approved assets over newly generated checks.",
        "Propose new checks only where coverage is insufficient."
      ],
      "output": "<span class=\"c-mut\">Selected existing assets</span>\n\n<span class=\"c-green\">+</span> coupon.claim.success\n<span class=\"c-green\">+</span> account.coupon.list\n<span class=\"c-green\">+</span> inventory.unchanged\n\n<span class=\"c-mut\">Additional coverage</span>\n<span class=\"c-amber\">+</span> coupon.claim.ineligible\n\n<span class=\"c-mut\">Asset provenance:</span>\n<span class=\"c-blue\">approved expectation + check version</span>\n\n<span class=\"c-mut\">Selection status:</span>\n<span class=\"c-green\">Ready for verification</span>"
    },
    "evidence": {
      "eyebrow": "Trusted verdict",
      "title": "Make every verdict explainable.",
      "description": "The result is not whether a browser script finished. It is whether the required approved expectations were supported by sufficient evidence.",
      "outputTitle": "VERIFICATION RESULT",
      "foot": "Illustrative data · example result, not an actual execution",
      "points": [
        "Bind results to the exact code and check versions.",
        "Show the expected value beside the observed value.",
        "Return UNKNOWN whenever the evidence is insufficient."
      ],
      "output": "<span class=\"c-mut\">Run:</span>\n<span class=\"c-blue\">run_2026_001</span>\n\n<span class=\"c-mut\">Target expectation</span>\n<span class=\"c-green\">PASS</span> Coupon successfully claimed.\n\n<span class=\"c-mut\">Protection expectation</span>\n<span class=\"c-red\">FAIL</span> Inventory changed unexpectedly.\n\n<span class=\"c-mut\">Expected:</span> 12\n<span class=\"c-mut\">Observed:</span> <span class=\"c-red\">11</span>\n\n<span class=\"c-mut\">Final verdict:</span>\n<span class=\"c-red\">FAIL</span>\n\n<span class=\"c-mut\">Evidence:</span>\n<span class=\"c-blue\">assertion + observed value + run version</span>"
    }
  },
  "zh": {
    "understand": {
      "eyebrow": "变更理解",
      "title": "先搞清楚 Agent 到底想改什么。",
      "description": "读取变更上下文，把「这次应该做到什么」和「那些不许被弄坏的既有行为」分开。",
      "outputTitle": "变更分析",
      "foot": "示例数据 · 系统提出的预期不会自动变成「已批准」",
      "points": [
        "读取开发者诉求与 Agent 的变更摘要。",
        "检查改动文件与相关项目上下文。",
        "把目标预期和保护预期分开列出。"
      ],
      "output": "<span class=\"c-mut\">变更：</span>\n<span class=\"c-blue\">feat: 新增优惠券领取流程</span>\n\n<span class=\"c-mut\">目标预期</span>\n<span class=\"c-green\">+</span> 顾客能领取符合条件的优惠券。\n<span class=\"c-green\">+</span> 领取后券出现在账户中。\n\n<span class=\"c-mut\">保护预期</span>\n<span class=\"c-amber\">!</span> 库存必须保持不变。\n<span class=\"c-amber\">!</span> 既有结算流程仍然可用。\n\n<span class=\"c-mut\">批准状态：</span>\n<span class=\"c-amber\">新增预期需要人工确认</span>"
    },
    "reuse": {
      "eyebrow": "检查资产复用",
      "title": "优先用项目已经知道的东西。",
      "description": "先挑已批准的检查，缺的才补。一次改动不该逼团队把同一套关键行为重新摸一遍。",
      "outputTitle": "选中的检查集",
      "foot": "示例数据 · 实际选择必须按项目真实情况校验",
      "points": [
        "找出与受影响预期关联的检查。",
        "已批准资产优先，新生成的检查靠后。",
        "只有覆盖确实不足时，才提新检查。"
      ],
      "output": "<span class=\"c-mut\">选中的已有资产</span>\n\n<span class=\"c-green\">+</span> coupon.claim.success\n<span class=\"c-green\">+</span> account.coupon.list\n<span class=\"c-green\">+</span> inventory.unchanged\n\n<span class=\"c-mut\">补充覆盖</span>\n<span class=\"c-amber\">+</span> coupon.claim.ineligible\n\n<span class=\"c-mut\">资产来源：</span>\n<span class=\"c-blue\">已批准预期 + 检查版本</span>\n\n<span class=\"c-mut\">选择状态：</span>\n<span class=\"c-green\">可以开始验证</span>"
    },
    "evidence": {
      "eyebrow": "可信判定",
      "title": "让每条结论都能解释。",
      "description": "结论不取决于脚本跑没跑完，而取决于「已批准的预期」是否被充足的证据支撑。",
      "outputTitle": "验证结果",
      "foot": "示例数据 · 举例结果，不是真实执行",
      "points": [
        "把结果绑定到确切的代码版本与检查版本。",
        "期望值必须和实际观测值并排显示。",
        "证据不足时返回 UNKNOWN，不返回 PASS。"
      ],
      "output": "<span class=\"c-mut\">运行：</span>\n<span class=\"c-blue\">run_2026_001</span>\n\n<span class=\"c-mut\">目标预期</span>\n<span class=\"c-green\">PASS</span> 优惠券领取成功。\n\n<span class=\"c-mut\">保护预期</span>\n<span class=\"c-red\">FAIL</span> 库存发生了非预期变化。\n\n<span class=\"c-mut\">期望：</span> 12\n<span class=\"c-mut\">实际：</span> <span class=\"c-red\">11</span>\n\n<span class=\"c-mut\">最终结论：</span>\n<span class=\"c-red\">FAIL</span>\n\n<span class=\"c-mut\">证据：</span>\n<span class=\"c-blue\">断言 + 观测值 + 运行版本</span>"
    }
  }
};

(function () {
  'use strict';

  var doc = document;

  /* ---------- 1. Sticky navigation ---------- */
  var nav = doc.getElementById('siteNav');
  function syncNav() {
    if (!nav) return;
    var y = window.pageYOffset || doc.documentElement.scrollTop || 0;
    nav.classList.toggle('scrolled', y > 8);
  }
  syncNav();
  window.addEventListener('scroll', syncNav, { passive: true });

  /* ---------- 2. Mobile menu ---------- */
  var menuBtn = doc.getElementById('menuToggle');
  var navLinks = doc.getElementById('navLinks');
  if (menuBtn && navLinks) {
    var setMenu = function (open) {
      navLinks.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      var label = open ? menuBtn.getAttribute('data-label-close') : menuBtn.getAttribute('data-label-open');
      if (label) menuBtn.setAttribute('aria-label', label);
      var use = menuBtn.querySelector('use');
      if (use) use.setAttribute('href', open ? '#mi-x' : '#mi-menu');
    };
    menuBtn.addEventListener('click', function () {
      setMenu(!navLinks.classList.contains('open'));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    doc.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (nav && nav.contains(e.target)) return;
      setMenu(false);
    });
  }

  /* ---------- 3. Product demo tabs ---------- */
  var tabs = [].slice.call(doc.querySelectorAll('.mk-tab'));
  var panel = doc.getElementById('demoPanel');
  if (tabs.length && panel) {
    var el = {
      eyebrow: doc.getElementById('demoEyebrow'),
      title: doc.getElementById('demoTitle'),
      desc: doc.getElementById('demoDescription'),
      outTitle: doc.getElementById('outputTitle'),
      out: doc.getElementById('demoOutput'),
      foot: doc.getElementById('outputFoot'),
      points: doc.getElementById('demoPoints')
    };
    var lang = (doc.documentElement.lang || 'en').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
    var data = RG_DEMO[lang] || RG_DEMO.en;

    var render = function (key) {
      var d = data[key];
      if (!d) return;
      el.eyebrow.textContent = d.eyebrow;
      el.title.textContent = d.title;
      el.desc.textContent = d.description;
      el.outTitle.textContent = d.outputTitle;
      el.out.innerHTML = d.output;
      el.foot.textContent = d.foot;

      el.points.innerHTML = '';
      d.points.forEach(function (text) {
        var row = doc.createElement('div');
        row.className = 'mk-point';
        var icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'icon');
        icon.setAttribute('aria-hidden', 'true');
        var use = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#mi-check');
        icon.appendChild(use);
        var span = doc.createElement('span');
        span.textContent = text;
        row.appendChild(icon);
        row.appendChild(span);
        el.points.appendChild(row);
      });

      tabs.forEach(function (t) {
        var on = t.getAttribute('data-demo') === key;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', 'tab-' + key);
    };

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        render(t.getAttribute('data-demo'));
      });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t);
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        tabs[next].focus();
        render(tabs[next].getAttribute('data-demo'));
      });
    });

    render('understand');
  }

  /* ---------- 4. FAQ accordion ---------- */
  var faq = [].slice.call(doc.querySelectorAll('.mk-faq details'));
  faq.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faq.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- 5. Active-section highlight ---------- */
  if ('IntersectionObserver' in window) {
    var anchors = [].slice.call(doc.querySelectorAll('#navLinks a'));
    var byId = {};
    anchors.forEach(function (a) {
      var id = (a.getAttribute('href') || '').split('#')[1];
      if (id) byId[id] = a;
    });
    var sections = Object.keys(byId).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    if (sections.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          anchors.forEach(function (a) { a.removeAttribute('aria-current'); });
          var a = byId[entry.target.id];
          if (a) a.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
  }
})();
