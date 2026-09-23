/* ============================================================
   main.js — 全站交互（原生 Vanilla JS，无依赖）
   处理：导航高亮 / 移动端抽屉 / 5 类作品渲染与排序筛选 /
         报告表格与 video / iframe 详情渲染 / 表单占位 / 年份
   兼容：file:// 下直接打开（不依赖 fetch 外部 JSON）
   分类：data / prototype / aigc / game / tool（数据见 data.js）
   ============================================================ */
(function () {
  "use strict";

  /* 联系表单 Formspree 端点 —— 上线前把 REPLACE_ME 换成你的 Formspree 表单 ID
     注册：https://formspree.io ，用邮箱建表单得链接 https://formspree.io/f/abcd1234
     把 REPLACE_ME 替换为 abcd1234 即可，留言会直达你的邮箱 */
  

  var currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  /* ---------- 1) 主导航高亮（单页滚动高亮：IntersectionObserver scroll-spy） ---------- */
  function initNavHighlight() {
    var links = document.querySelectorAll(".nav__list .nav__link, .nav-drawer__list .nav-drawer__link");
    if (!links.length) return;
    var ids = ["home", "portfolio"];
    function setActive(id) {
      links.forEach(function (link) {
        var on = link.getAttribute("data-page") === id;
        link.classList.toggle("is-active", on);
        if (link.classList.contains("nav-drawer__link")) {
          if (on) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        }
      });
    }
    var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length) { setActive(ids[0]); return; }
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    } else {
      setActive(ids[0]);
    }
  }

  /* ---------- 2) 移动端抽屉 ---------- */
  function initNavDrawer() {
    var toggle = document.querySelector(".nav__toggle");
    var drawer = document.querySelector(".nav-drawer");
    var overlay = document.querySelector(".nav-overlay");
    var closeBtn = document.querySelector(".nav-drawer__close");
    if (!toggle || !drawer) return;

    function open() {
      drawer.classList.add("is-open");
      if (overlay) overlay.classList.add("is-open");
      document.body.classList.add("nav-locked");
      toggle.setAttribute("aria-expanded", "true");
      var first = drawer.querySelector(".nav-drawer__link");
      if (first) first.focus();
    }
    function close() {
      drawer.classList.remove("is-open");
      if (overlay) overlay.classList.remove("is-open");
      document.body.classList.remove("nav-locked");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
    toggle.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (overlay) overlay.addEventListener("click", close);
    drawer.querySelectorAll(".nav-drawer__link").forEach(function (link) {
      link.addEventListener("click", function () { close(); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
    });
  }

  /* ---------- 3) 作品渲染 + 排序 + 筛选 + 详情（portfolio.html） ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slugify(s) {
    return String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "work";
  }

  function catClass(tag) {
    return { data: "tag--data", industry: "tag--industry", prototype: "tag--prototype", aigc: "tag--aigc", game: "tag--game", tool: "tag--tool", agent: "tag--agent", teardown: "tag--teardown" }[tag] || "";
  }
  function catVar(tag) {
    return { data: "var(--cat-data)", industry: "var(--cat-industry)", prototype: "var(--cat-prototype)", aigc: "var(--cat-aigc)", game: "var(--cat-game)", tool: "var(--cat-tool)", agent: "var(--cat-agent)", teardown: "var(--cat-teardown)" }[tag] || "var(--accent)";
  }
  function tagLabel(tag) {
    return { data: "数据分析", industry: "行业研究", prototype: "产品原型 · C端", aigc: "AIGC", game: "网页游戏", tool: "工具/开发", agent: "AI项目", teardown: "产品拆解（游戏）" }[tag] || tag;
  }
  function catTagsHtml(category, labelOverride) {
    var cls = catClass(category);
    return (labelOverride || tagLabel(category)).split(" · ").map(function (part) {
      return '<span class="tag ' + cls + '">' + escapeHtml(part) + "</span>";
    }).join("");
  }
  function catPriority(tag) {
    return { data: 0, industry: 1, prototype: 2, game: 3, aigc: 4, tool: 5, agent: 6, teardown: 7 }[tag] || 99;
  }

  /* 排序：精选置顶 → 年限倒序 → 同年按类优先级 → 标题 */
  function sortWorks(list) {
    return list.slice().sort(function (a, b) {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.year !== b.year) return b.year - a.year;
      var pa = catPriority(a.category), pb = catPriority(b.category);
      if (pa !== pb) return pa - pb;
      return String(a.title).localeCompare(String(b.title), "zh-Hans-CN");
    });
  }

  /* 卡面徽标：依据卡片已有字段自动推导（+ 手写 verify） */
  /* 图标：Lucide 官方 path（内联，零依赖） */
  function badgeIcon(kind) {
    var s = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    if (kind === "report") return s + '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>';
    if (kind === "doc") return s + '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
    if (kind === "live") return s + '<polygon points="6 3 20 12 6 21 6 3"/></svg>';
    if (kind === "video") return s + '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 13 5-3-5-3v6Z"/><path d="M7 3v18"/></svg>';
    if (kind === "verify") return s + '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    if (kind === "down") return s + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>';
    if (kind === "repo") return s + '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>';
    return s + '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';
  }
  function repoIcon() { return badgeIcon("repo"); }
  function badgesHtml(w) {
    var list = [];
    if (w.report && w.category !== "teardown") list.push(["report", "数据报告"]);   // 拆解卡走下面的「拆解报告」，避免两个徽标重复
    if (w.reqDocUrl || w.prdDocUrl || w.docUrl) list.push(["doc", "需求文档"]);
    if (w.devDocUrl) list.push(["doc", "开发文档"]);
    // 「上线可玩」只给真能上手体验的：游戏 / 在线原型 / 原型与 Agent 分类的可访问外链
    var playableCat = (w.category === "prototype" || w.category === "agent" || w.category === "game");
    if (w.gameUrl || w.prototypeUrl || (w.link && playableCat)) list.push(["live", "上线可玩"]);
    if (w.videoSrc) list.push(["video", "成片"]);
    if (w.verify) list.push(["verify", w.verify]);
    // 拆解卡：拆解报告 + 证据等级（evidence: "desktop" 桌面研究 / "field" 已体验验证）
    // 与数据卡的 verify 同一套诚实机制——卡片自己说明"这篇还没实地玩过"
    if (w.category === "teardown") list.push(["report", "拆解报告"]);
    if (w.evidence === "field") list.push(["verify", "已体验验证"]);
    else if (w.evidence === "desktop") list.push(["doc", "桌面研究"]);
    if (!list.length) return "";
    return '<div class="work-card__badges">' + list.map(function (b) {
      return '<span class="badge badge--' + b[0] + '">' + badgeIcon(b[0]) + escapeHtml(b[1]) + "</span>";
    }).join("") + "</div>";
  }

  function makeCard(work, index) {
    var tags = catTagsHtml(work.category, work.catLabel);
    var valueHtml = work.value ? '<p class="work-card__value">' + escapeHtml(work.value) + "</p>" : "";
    // 拆解卡独有：关键指标带（数据卡没有）——让访客扫一眼就知道拆的是什么量级的产品
    var metricsHtml = "";
    if (work.metrics && work.metrics.length) {
      metricsHtml = '<div class="work-card__metrics">' + work.metrics.map(function (m) {
        return '<span class="metric-pill"><span class="metric-pill__k">' + escapeHtml(m.k) + '</span><span class="metric-pill__v">' + escapeHtml(m.v) + "</span></span>";
      }).join("") + "</div>";
    }
    var badge = work.featured ? '<span class="work-card__badge">精选</span>' : "";
    return (
      '<a class="work-card" href="#work-detail" data-slug="' + escapeHtml(slugify(work.title)) + '" data-index="' + index + '">' +
        '<div class="work-card__thumb' + (work.thumb ? ' has-img' : '') + '" style="--cat:' + catVar(work.category) + '" role="img" aria-label="' + escapeHtml(work.title) + '">' +
          (work.thumb ? '<img class="work-card__img" src="' + escapeHtml(work.thumb) + '" alt="' + escapeHtml(work.title) + '" loading="lazy">' : "") +
        "</div>" +
        '<div class="work-card__meta">' +
          '<h3 class="work-card__title">' + escapeHtml(work.title) + "</h3>" +
          badge +
        "</div>" +
        '<div class="work-card__value-row">' + valueHtml + "</div>" +
        metricsHtml +
        badgesHtml(work) +
        '<div class="work-card__tags">' + tags + "</div>" +
      "</a>"
    );
  }

  function meetsFilter(work, val) {
    if (!val) return true;
    return work.category === val;
  }

  /* 报告：报表表格(悬停预览+下方展示) 或 关键结论列表 */
  function renderTableHtml(t) {
    var rows = (t.tbody || []).map(function (r) {
      return "<tr>" + r.map(function (c, i) { return '<td' + (i > 0 && /^[-+0-9.,%]/.test(String(c)) ? ' class="num"' : "") + ">" + escapeHtml(c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    var note = t.note ? '<p class="table-note">' + escapeHtml(t.note) + "</p>" : "";
    return '<div class="report-table-wrap"><table><thead><tr>' + t.thead.map(function (h) { return "<th>" + escapeHtml(h) + "</th>"; }).join("") + '</tr></thead><tbody>' + rows + "</tbody></table></div>" + note;
  }
  /* ============================================================
     拆解卡专用渲染（category === "teardown"）
     与数据卡的报表面板**共用同一套 class 与 tab 交互**（.work-report / .report-tab /
     .report-pane / .report-conclusions / .report-caliber / .report-summary-list），
     只把「报告骨架」换成「产品骨架」：6 tab → 8 tab。
     表格按 t.pane 分组：structure / economy / monetize / market（缺省 market）。
     数据卡走原路径不受影响——这里是一支独立函数，不改动原有 renderReport 逻辑。
     ============================================================ */
  var TEARDOWN_TABS = [
    ["conclusions", "💡 核心结论"],
    ["coreloop",    "🔄 核心循环"],
    ["structure",   "🧩 玩法结构"],
    ["economy",     "⏳ 数值与时间墙"],
    ["monetize",    "💰 商业化设计"],
    ["market",      "📊 市场表现"],
    ["validate",    "🎯 可迁移洞察"],
    ["caliber",     "🧭 证据强度与口径"],
    ["background",  "📋 拆解背景"]
  ];
  function renderTeardownReport(w) {
    var tables = (w.report && w.report.tables) || [];
    var byPane = {};
    tables.forEach(function (t) {
      var k = t.pane || "market";
      (byPane[k] = byPane[k] || []).push(t);
    });
    function blocks(list) {
      return list.map(function (t) {
        return '<div class="report-block"><h4>' + escapeHtml(t.title) + "</h4>" + renderTableHtml(t) + "</div>";
      }).join("");
    }
    var panes = {};
    /* 核心结论 */
    if (w.results && w.results.length) {
      panes.conclusions = '<div class="report-pane" data-pane="conclusions"><ol class="report-conclusions">' +
        w.results.map(function (r) {
          var t = String(r);
          var m = t.match(/^([^：:]+)[：:]\s*(.+)$/);
          if (m) return '<li class="concl-item"><span class="concl-label">' + escapeHtml(m[1]) + '</span><span class="concl-body">' + escapeHtml(m[2]) + "</span></li>";
          return "<li>" + escapeHtml(t) + "</li>";
        }).join("") + "</ol></div>";
    }
    /* 核心循环：主循环链 + 子循环卡（策划视角，数据卡没有这一层） */
    if (w.coreLoop) {
      var cl = w.coreLoop, loopHtml = "";
      if (cl.loop && cl.loop.length) {
        loopHtml += '<div class="report-block">' +
          (cl.title ? "<h4>" + escapeHtml(cl.title) + "</h4>" : "") +
          '<ol class="loop-chain" style="--loop-n:' + cl.loop.length + '">' + cl.loop.map(function (n) {
            return '<li class="loop-node">' +
              '<span class="loop-node__step">' + escapeHtml(n.step) + "</span>" +
              '<span class="loop-node__name">' + escapeHtml(n.name) + "</span>" +
              '<span class="loop-node__desc">' + escapeHtml(n.desc) + "</span>" +
            "</li>";
          }).join("") + "</ol>" +
          (cl.back ? '<p class="loop-back">' + escapeHtml(cl.back) + "</p>" : "") +
        "</div>";
      }
      if (cl.sub && cl.sub.length) {
        loopHtml += '<div class="report-block">' +
          "<h4>" + escapeHtml(cl.subTitle || "子循环") + "</h4>" +
          '<div class="loop-subs">' + cl.sub.map(function (s) {
            return '<div class="loop-sub"><b>' + escapeHtml(s.name) + "</b><i>" + escapeHtml(s.desc) + "</i></div>";
          }).join("") + "</div>" +
          (cl.purpose ? '<p class="loop-purpose">' + escapeHtml(cl.purpose) + "</p>" : "") +
        "</div>";
      }
      if (loopHtml) panes.coreloop = '<div class="report-pane" data-pane="coreloop" hidden>' + loopHtml + "</div>";
    }
    /* 纯表格的三个面 */
    ["structure", "economy", "market"].forEach(function (k) {
      if (byPane[k] && byPane[k].length) {
        panes[k] = '<div class="report-pane" data-pane="' + k + '" hidden>' + blocks(byPane[k]) + "</div>";
      }
    });
    /* 商业化设计 = 文字小结（summary）+ 表格 */
    var mon = [];
    if (w.summary && w.summary.length) {
      mon.push('<ul class="report-summary-list">' + w.summary.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + "</ul>");
    }
    if (byPane.monetize && byPane.monetize.length) mon.push(blocks(byPane.monetize));
    if (mon.length) panes.monetize = '<div class="report-pane" data-pane="monetize" hidden>' + mon.join("") + "</div>";
    /* 可迁移洞察 */
    if (w.report && w.report.validate && w.report.validate.length) {
      panes.validate = '<div class="report-pane" data-pane="validate" hidden><ul class="report-summary-list">' +
        w.report.validate.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + "</ul></div>";
    }
    /* 证据强度与口径 */
    if (w.report && w.report.caliber && w.report.caliber.length) {
      panes.caliber = '<div class="report-pane" data-pane="caliber" hidden><ul class="report-caliber">' +
        w.report.caliber.map(function (c) { return "<li>" + escapeHtml(c) + "</li>"; }).join("") + "</ul></div>";
    }
    /* 拆解背景 */
    if (w.background) {
      var bb = Array.isArray(w.background)
        ? '<ul class="report-background-list">' + w.background.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + "</ul>"
        : '<p class="report-background">' + escapeHtml(w.background) + "</p>";
      panes.background = '<div class="report-pane" data-pane="background" hidden>' + bb + "</div>";
    }
    /* 组装：第一个存在的 pane 去 hidden 并置 is-active */
    var firstKey = "";
    TEARDOWN_TABS.forEach(function (t) { if (!firstKey && panes[t[0]]) firstKey = t[0]; });
    if (!firstKey) return "";
    var tabsHtml = "", paneHtml = "";
    TEARDOWN_TABS.forEach(function (t) {
      var key = t[0];
      if (!panes[key]) return;
      tabsHtml += '<button type="button" class="report-tab' + (key === firstKey ? " is-active" : "") + '" data-tab="' + key + '">' + t[1] + "</button>";
      paneHtml += (key === firstKey) ? panes[key].replace(" hidden>", ">") : panes[key];
    });
    return '<div class="work-report"><div class="report-tabs">' + tabsHtml + "</div>" + paneHtml + "</div>";
  }

  function renderReport(w) {
    if (w.category === "teardown") return renderTeardownReport(w);
    var resultsHtml = "";
    if (w.results && w.results.length) {
      var items = w.results.map(function (r) {
        var t = String(r);
        var m = t.match(/^([^：:]+)[：:]\s*(.+)$/);
        if (m) {
          return '<li class="concl-item"><span class="concl-label">' + escapeHtml(m[1]) + "</span><span class=\"concl-body\">" + escapeHtml(m[2]) + "</span></li>";
        }
        return "<li>" + escapeHtml(t) + "</li>";
      }).join("");
      resultsHtml = '<div class="report-pane" data-pane="conclusions"><ol class="report-conclusions">' + items + "</ol></div>";
    }
    var caliberHtml = (w.report && w.report.caliber && w.report.caliber.length) ? w.report.caliber.map(function (c) { return "<li>" + escapeHtml(c) + "</li>"; }).join("") : "";
    var caliberPane = '<div class="report-pane" data-pane="caliber" hidden>' +
        (caliberHtml ? '<ul class="report-caliber">' + caliberHtml + "</ul>" : '<p class="report-caliber--empty">数据口径整理中…</p>') +
        "</div>";
    var validateHtml = (w.report && w.report.validate && w.report.validate.length) ? w.report.validate.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") : "";
    var validatePane = '<div class="report-pane" data-pane="validate" hidden>' +
        (validateHtml ? '<ul class="report-summary-list">' + validateHtml + "</ul>" : '<p class="report-summary--empty">建议与验证整理中…</p>') +
        "</div>";
    var hasReport = w.report && w.report.tables && w.report.tables.length;
    if (hasReport) {
      var tablesHtml = w.report.tables.map(function (t) {
        return '<div class="report-block"><h4>' + escapeHtml(t.title) + "</h4>" + renderTableHtml(t) + "</div>";
      }).join("");
      var reportPane = '<div class="report-pane" data-pane="tables" hidden>' +
        (w.report.title ? '<h3 class="report-title">' + escapeHtml(w.report.title) + "</h3>" : "") +
        tablesHtml +
        "</div>";
      var backgroundBody = Array.isArray(w.background)
        ? '<ul class="report-background-list">' + w.background.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + "</ul>"
        : (w.background ? '<p class="report-background">' + escapeHtml(w.background) + "</p>" : '<p class="report-background report-background--empty">项目背景整理中…</p>');
      var backgroundPane = '<div class="report-pane" data-pane="background" hidden>' + backgroundBody + "</div>";
      var summaryBody = Array.isArray(w.summary)
        ? '<ul class="report-summary-list">' + w.summary.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + "</ul>"
        : (w.summary ? '<p class="report-summary">' + escapeHtml(w.summary) + "</p>" : '<p class="report-summary report-summary--empty">报告摘要整理中…</p>');
      var summaryPane = '<div class="report-pane" data-pane="summary" hidden>' + summaryBody + "</div>";
      // 切换按钮：项目背景 / 主要结论(默认) / 报告摘要 / 查看报表表格（均带图标）
      return '<div class="work-report">' +
        '<div class="report-tabs">' +
          (resultsHtml ? '<button type="button" class="report-tab is-active" data-tab="conclusions">💡 主要结论</button>' : "") +
          '<button type="button" class="report-tab" data-tab="summary">📄 报告摘要</button>' +
          '<button type="button" class="report-tab" data-tab="validate">🎯 建议与验证</button>' +
          '<button type="button" class="report-tab" data-tab="tables">📊 查看报表表格</button>' +
          '<button type="button" class="report-tab" data-tab="caliber">🧭 数据口径</button>' +
          '<button type="button" class="report-tab" data-tab="background">📋 项目背景</button>' +
        "</div>" +
        backgroundPane +
        (resultsHtml ? resultsHtml : "") +
        summaryPane +
        reportPane +
        caliberPane +
        validatePane +
        "</div>";
    }
    if (!resultsHtml) return "";
    return '<div class="work-report"><h3>主要结论</h3><ol class="report-conclusions">' + w.results.map(function (r) { return "<li>" + escapeHtml(r) + "</li>"; }).join("") + "</ol></div>";
  }

  /* 站内互动媒体（video / 游戏 iframe / 原型 iframe） */
  function renderMedia(w) {
    var html = "";
    if (w.videoSrc) {
      html += '<figure class="work-media">' +
        '<video controls preload="metadata" playsinline src="' + escapeHtml(w.videoSrc) + '" aria-label="' + escapeHtml(w.title + ' 视频') + '" style="width:100%;max-width:min(480px,100%);margin:0 auto;display:block;border-radius:var(--radius-md);background:var(--surface)"></video>' +
        (w.videoTitle ? "<figcaption>" + escapeHtml(w.videoTitle) + " · AI 生成视频</figcaption>" : "") +
        "</figure>";
      if (w.story && w.story.img1) {
        html += '<details class="work-story">' +
          "<summary>📖 " + escapeHtml(w.story.label || "故事原文（同学原创脑洞）") + "</summary>" +
          '<p class="work-story__note">' + escapeHtml(w.story.note || "同学写的原创故事蓝本") + "</p>" +
          '<div class="work-story__imgs">' +
            '<figure><img src="' + escapeHtml(w.story.img1) + '" alt="故事原文截图 1" loading="lazy" class="story-zoom"></figure>' +
            (w.story.img2 ? '<figure><img src="' + escapeHtml(w.story.img2) + '" alt="故事原文截图 2" loading="lazy" class="story-zoom"></figure>' : "") +
          "</div>" +
        "</details>";
      }
    }
    if (w.gameUrl) {
      html += '<div class="work-media game-wrap">' +
        '<iframe src="' + escapeHtml(w.gameUrl) + '" title="' + escapeHtml(w.title) + ' 在线游玩" loading="lazy" allow="fullscreen; autoplay; gamepad" allowfullscreen width="100%" height="560" tabindex="0" class="game-frame" style="border:0;border-radius:var(--radius-md);background:var(--surface)"></iframe>' +
        (w.controls ? '<p class="work-controls">玩法：' + escapeHtml(w.controls) + "</p>" : "") +
        // 旧版这里还有「在新窗口打开游戏 / 开发飞书文档」两个按钮——
        // 已统一由下方「资源卡」承担（在线游玩 / 开发文档），此处不再重复。
        "</div>";
    }
    if (w.prototypeUrl) {
      html += '<div class="proto-showcase">' +
        '<p class="proto-showcase__label">' + (w.protoLabel || "产品原型展示（点击可交互）") + '</p>' +
        '<div class="work-media proto-frame">' +
          '<iframe src="' + escapeHtml(w.prototypeUrl) + '" title="' + escapeHtml(w.title) + ' 在线原型" loading="lazy" class="proto-iframe' + (w.protoWide ? ' proto-wide' : '') + '"></iframe>' +
        '</div>' +
      "</div>";
    }
    return html;
  }

  /* 按钮小图标（内联 SVG） */
  function svgIcon(kind) {
    var s = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    if (kind === "file") return s + '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>';
    if (kind === "down") return s + '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>';
    return s + '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  }
  function repoIcon() {
    return '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';
  }
  function linkBtn(href, cls, label, icon) {
    return '<a class="btn ' + cls + '" data-link-type="' + escapeHtml(label) + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + (icon === "repo" ? repoIcon() : svgIcon(icon)) + "<span>" + escapeHtml(label) + "</span></a>";
  }
  /* 按钮顺序统一：产品类在前（产品链接固定最左、主按钮）→ 文档类在后 */
  /* 资源卡样式：一行一个资源（图标 + 标题 + 说明 + 按钮），由卡片的 linksStyle: "card" 启用 */
  function linkRows(w) {
    var rows = [], notes = w.linkNotes || {};
    function push(field, href, title, note, action, icon, emoji, primary) {
      rows.push({ href: href, title: title, note: notes[field] || note, action: action, icon: icon, emoji: emoji, primary: !!primary });
    }
    var isRepo = w.link && w.link.indexOf("github.com") >= 0;
    // 拆解卡：正文在飞书，固定第一行且为主按钮（可被 linkNotes.teardownDocUrl 覆盖说明文案）
    if (w.teardownDocUrl) push("teardownDocUrl", w.teardownDocUrl, "拆解全文（飞书）", "完整拆解：玩法结构、数值与时间墙、商业化四段模型、证据强度表", "在线查看", "doc", "📖", true);
    if (w.link && !w.report) push("link", w.link, w.outLinkText || "产品链接", isRepo ? "源码仓库，可直接查看实现" : "已部署上线，浏览器直接打开", isRepo ? "查看仓库" : "访问站点", isRepo ? "repo" : "open", isRepo ? "🐙" : "🚀", true);
    if (w.protoUrl) push("protoUrl", w.protoUrl, "在线原型", "可点击的交互原型，直接打开体验完整流程", "打开原型", "open", "🎨", true);
    if (w.gameUrl) push("gameUrl", w.gameUrl, "在线游玩", "浏览器直接打开即可玩，支持键盘与触屏", "开始游戏", "live", "🎮", true);
    if (w.caseUrl) push("caseUrl", w.caseUrl, w.caseText || "案例展示", "更多细节与过程记录", w.caseBtn || "查看案例", "open", w.caseEmoji || "🖼️");
    if (w.downloadUrl) push("downloadUrl", w.downloadUrl, "下载页", "安装包与下载说明", "去下载", "down", "⬇️");
    if (w.reqDocUrl) push("reqDocUrl", w.reqDocUrl, "需求文档", "背景、目标用户、功能需求与验收标准", "在线查看", "doc", "📄");
    if (w.devDocUrl) push("devDocUrl", w.devDocUrl, "开发文档", "实现思路、系统结构与当前状态", "在线查看", "doc", "🛠️");
    if (w.docUrl) push("docUrl", w.docUrl, "需求 / 开发文档", "需求说明与技术实现", "在线查看", "doc", "📄");
    if (w.prdUrl) push("prdUrl", w.prdUrl, "PRD 展示页", "产品需求文档在线展示", "查看", "open", "📋");
    if (w.prdDocUrl) push("prdDocUrl", w.prdDocUrl, "PRD 文档（飞书）", "产品需求文档全文", "在线查看", "doc", "📄");
    if (!w.link && !w.downloadUrl && !w.videoSrc && !w.gameUrl && !w.prototypeUrl && !w.caseUrl && !w.teardownDocUrl) {
      push("contact", "mailto:" + (window.OWNER && window.OWNER.email ? window.OWNER.email : "18672786151@163.com"),
        "联系获取更多", "这个项目还没有公开链接，欢迎直接找我聊", "写邮件", "open", "✉️");
    }
    return rows;
  }
  function renderLinkCards(w) {
    var rows = linkRows(w);
    if (!rows.length) return "";
    return '<div class="work-detail__links work-detail__links--cards">' + rows.map(function (r) {
      var btnIcon = r.icon === "repo" ? repoIcon() : badgeIcon(r.icon);
      return '<div class="link-card">' +
        '<span class="link-card__icon" aria-hidden="true">' + r.emoji + '</span>' +
        '<span class="link-card__text"><b>' + escapeHtml(r.title) + '</b><i>' + escapeHtml(r.note) + '</i></span>' +
        '<a class="btn ' + (r.primary ? "btn-primary" : "btn-ghost") + '" data-link-type="' + escapeHtml(r.title) + '" href="' + escapeHtml(r.href) + '" target="_blank" rel="noopener">' +
          btnIcon + '<span>' + escapeHtml(r.action) + '</span>' +
        '</a>' +
      '</div>';
    }).join("") + mainlineRow(w) + "</div>";
  }

  /* 产品设计主线：做成按钮区里的一行 —— 按钮本身**不跳转**，
     桌面端鼠标悬浮弹出、移动端点击弹出（见 initMainlinePop） */
  function mainlineRow(w) {
    if (!w.mainline || !w.mainline.length) return "";
    var title = w.mainlineTitle || "产品设计主线";
    return '<div class="link-card link-card--mainline">' +
      '<span class="link-card__icon" aria-hidden="true">📐</span>' +
      '<span class="link-card__text"><b>' + escapeHtml(title) + '</b><i>' +
        w.mainline.length + ' 步设计过程 · 桌面悬浮 / 手机点击查看</i></span>' +
      '<button type="button" class="btn btn-ghost mainline-trigger" aria-expanded="false" aria-label="查看' + escapeHtml(title) + '">' +
        badgeIcon("doc") + '<span>查看主线</span>' +
      '</button>' +
      '<div class="mainline-pop" hidden>' +
        '<h4>' + escapeHtml(title) + '</h4>' +
        '<ol class="mainline-list">' + w.mainline.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + '</ol>' +
      '</div>' +
    '</div>';
  }
  /* 是否用「资源卡」样式：默认开启；代码仓库类卡片保持原来的按钮排（用户要求），
     个别卡片可用 linksStyle: false 单独关掉 */
  function useCardStyle(w) {
    return w.linksStyle !== false;
  }
  function renderLinks(w) {
    if (useCardStyle(w)) return renderLinkCards(w);
    var html = '<div class="work-detail__links">';
    if (w.link && !w.report) html += linkBtn(w.link, "btn-primary", w.outLinkText || "查看项目", /github\.com/i.test(w.link) ? "repo" : "open");
    if (w.caseUrl) html += linkBtn(w.caseUrl, "btn-ghost", w.caseText || "案例展示", "open");   // 有 caseUrl 也不再加邮件兜底
    if (w.downloadUrl) html += linkBtn(w.downloadUrl, "btn-ghost", "下载页", "down");
    if (w.reqDocUrl) html += linkBtn(w.reqDocUrl, "btn-ghost", "需求文档", "file");
    if (w.devDocUrl) html += linkBtn(w.devDocUrl, "btn-ghost", "开发文档", "file");
    if (w.docUrl) html += linkBtn(w.docUrl, "btn-ghost", "需求/开发文档", "file");
    if (w.prdUrl) html += linkBtn(w.prdUrl, "btn-ghost", "PRD 展示页", "open");
    if (w.prdDocUrl) html += linkBtn(w.prdDocUrl, "btn-ghost", "PRD 文档", "file");
    if (!w.link && !w.downloadUrl && !w.videoSrc && !w.gameUrl && !w.prototypeUrl && !w.caseUrl) html += '<a class="btn btn-ghost" href="mailto:' + (window.OWNER && window.OWNER.email ? window.OWNER.email : "18672786151@163.com") + '"><span>联系获取更多</span></a>';
    html += "</div>";
    return html;
  }

  function initPortfolio() {
    var grid = document.getElementById("worksGrid");
    var empty = document.getElementById("worksEmpty");
    var detail = document.getElementById("workDetail");
    if (!grid) return;
    var works = window.WORKS || [];

    function render(filterValue) {
      if (filterValue === "docs") { renderDocs(); return; }
      grid.classList.remove("works-grid--docs");
      var list = sortWorks(works.filter(function (w) { return meetsFilter(w, filterValue); }));
      grid.innerHTML = "";
      if (!list.length) { if (empty) empty.style.display = "block"; return; }
      if (empty) empty.style.display = "none";
      list.forEach(function (w) { grid.insertAdjacentHTML("beforeend", makeCard(w, works.indexOf(w))); });
    }

    /* 切换分类：卡片先按方向滑出、渲染新内容后滑入（点右边的分类 → 内容向左滑） */
    var curIdx = 0;
    function btnIndex(btn) {
      var all = filterBar ? filterBar.querySelectorAll(".filter-btn") : [];
      for (var i = 0; i < all.length; i++) { if (all[i] === btn) return i; }
      return 0;
    }
    function switchTo(btn) {
      if (!btn) return;
      var idx = btnIndex(btn);
      var dir = idx >= curIdx ? -1 : 1;          // -1 向左滑出，1 向右滑出
      curIdx = idx;
      Array.prototype.forEach.call(filterBar.querySelectorAll(".filter-btn"), function (b) {
        var active = b === btn;
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.classList.toggle("is-active", active);
      });
      grid.style.setProperty("--slide-dir", String(dir));
      grid.classList.add("works-grid--out");
      setTimeout(function () {
        render(btn.getAttribute("data-filter") || "");
        grid.classList.remove("works-grid--out");
        grid.classList.add("works-grid--in");
        setTimeout(function () { grid.classList.remove("works-grid--in"); }, 360);
      }, 170);
    }

    /* 文档库：文件图标网格，点击打开飞书文档 */
    function docIconSvg() {
      return '<svg viewBox="0 0 48 60" width="52" height="65" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M6 5a5 5 0 0 1 5-5h19l12 12v43a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V5z" fill="currentColor" opacity="0.13"/>' +
        '<path d="M6 5a5 5 0 0 1 5-5h19l12 12v43a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V5z" stroke="currentColor" stroke-width="2.6"/>' +
        '<path d="M30 0v12h12" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M15 26h18M15 34h18M15 42h11" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>' +
      "</svg>";
    }
    function makeDoc(d) {
      var parts = String(d.name || "").split(" · ");
      var proj = parts[0] || "";
      var kindName = parts.slice(1).join(" · ");
      var nameHtml = '<span class="doc-item__proj">' + escapeHtml(proj) + "</span>" +
        (kindName ? '<span class="doc-item__sep"> · </span><span class="doc-item__type">' + escapeHtml(kindName) + "</span>" : "");
      return '<a class="doc-item doc-item--' + (d.type || "doc") + '" href="' + escapeHtml(d.url) + '" target="_blank" rel="noopener">' +
        '<span class="doc-item__icon" aria-hidden="true">' + docIconSvg() + "</span>" +
        '<span class="doc-item__name">' + nameHtml + "</span>" +
      "</a>";
    }
    function renderDocs() {
      var docs = window.DOCS || [];
      grid.innerHTML = "";
      grid.classList.add("works-grid--docs");
      if (!docs.length) { if (empty) empty.style.display = "block"; return; }
      if (empty) empty.style.display = "none";
      docs.forEach(function (d) { grid.insertAdjacentHTML("beforeend", makeDoc(d)); });
    }

    /* 首页「工作方式」区块的项目链接：按标题匹配作品卡，自动补上正确 hash（标题改了也不会失效） */
    Array.prototype.forEach.call(document.querySelectorAll("[data-title]"), function (a) {
      var t = a.getAttribute("data-title");
      for (var i = 0; i < works.length; i++) {
        if (works[i].title === t) { a.setAttribute("href", "#work-" + slugify(t)); break; }
      }
    });

    function hideDetail() { if (detail) detail.classList.remove("is-open"); }

    function openDetail(index) {
      var w = works[index];
      if (!w || !detail) return;
      if (window.DSH_TRACK) { try { window.DSH_TRACK.projectOpen(w.title, w.category); } catch (e) {} }
      detail.setAttribute("data-project", w.title);
      var catTags = catTagsHtml(w.category, w.catLabel);
      var kwTags = (w.keywords || []).map(function (k) {
        return '<span class="tag">' + escapeHtml(k) + "</span>";
      }).join("");
      detail.innerHTML =
        '<div class="work-detail__card">' +
          '<div class="work-detail__head">' +
            '<h2>' + escapeHtml(w.title) + "</h2>" +
            '<button class="work-detail__close" type="button" aria-label="收起详情">×</button>' +
          "</div>" +
          '<div class="work-detail__tags">' + catTags + "</div>" +
          (kwTags ? '<div class="work-detail__kws">' + kwTags + "</div>" : "") +
          '<p class="work-detail__desc">' + escapeHtml(w.desc) + "</p>" +
          (w.idea ? '<div class="work-detail__idea"><h4>设计理念</h4><p>' + escapeHtml(w.idea) + "</p></div>" : "") +
          renderReport(w) +
          renderMedia(w) +
          renderLinks(w)
        "</div>";
      detail.classList.add("is-open");
      detail.setAttribute("role", "dialog");
      detail.setAttribute("aria-label", escapeHtml(w.title));
      var panelTitle = detail.querySelector(".work-detail__head h2") || detail.querySelector("h2");
      if (panelTitle) { panelTitle.setAttribute("tabindex", "-1"); panelTitle.focus({ preventScroll: true }); }
      // 报表 主要结论/查看报表表格 切换
      var reportTabs = detail.querySelectorAll(".report-tab");
      if (reportTabs.length) {
        reportTabs.forEach(function (tab) {
          tab.addEventListener("click", function () {
            var name = tab.getAttribute("data-tab");
            reportTabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
            detail.querySelectorAll(".report-pane").forEach(function (p) {
              p.hidden = p.getAttribute("data-pane") !== name;
            });
          });
        });
      }
      // 聚焦游戏/原型 iframe，让键盘事件能进入（解决游戏按键失灵）
      var gameFrame = detail.querySelector(".game-frame");
      if (gameFrame) {
        var focusGame = function () { try { gameFrame.focus(); } catch (e) {} try { if (gameFrame.contentWindow) gameFrame.contentWindow.focus(); } catch (e) {} try { var c = gameFrame.contentDocument && gameFrame.contentDocument.querySelector("canvas"); if (c) c.focus(); } catch (e) {} };
        focusGame();
        setTimeout(focusGame, 300);
        // 很多游戏内部会动态加载/重绘，晚一点再聚焦一次更稳
        setTimeout(focusGame, 1500);
        gameFrame.addEventListener("load", focusGame);
        gameFrame.addEventListener("click", focusGame);
        var gameWrap = detail.querySelector(".game-wrap");
        if (gameWrap) {
          // 捕获阶段(在游戏内部 preventDefault 之前)强制聚焦，任何点击/触摸都聚焦 iframe
          gameWrap.addEventListener("pointerdown", function () { focusGame(); }, true);
          gameWrap.addEventListener("mousedown", function () { focusGame(); }, true);
          gameWrap.addEventListener("touchstart", function () { focusGame(); }, true);
          // 焦点被别处抢走（如切窗口、点页眉）时，详情仍开着则把焦点还给游戏
          gameWrap.addEventListener("focusout", function (e) {
            if (detail.classList.contains("is-open") && gameWrap.contains(e.relatedTarget) === false) {
              setTimeout(focusGame, 50);
            }
          });
        }
        // 切换窗口/标签页回来时重新聚焦
        document.addEventListener("visibilitychange", function () {
          if (!document.hidden && detail.classList.contains("is-open")) setTimeout(focusGame, 200);
        });
      }
      if (!detail.__trackBound) {
        detail.__trackBound = true;
        detail.addEventListener("click", function (e) {
          var a = e.target.closest ? e.target.closest(".work-detail__links a") : null;
          if (!a || !window.DSH_TRACK) return;
          try {
            window.DSH_TRACK.linkClick(detail.getAttribute("data-project") || "", a.getAttribute("data-link-type") || "", a.href);
          } catch (err) {}
        });
      }
      var closeBtn = detail.querySelector(".work-detail__close");
      if (closeBtn) closeBtn.addEventListener("click", hideDetail);
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      detail.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".work-card");
      if (!card) return;
      e.preventDefault();
      openDetail(parseInt(card.getAttribute("data-index"), 10));
      try { history.replaceState(null, "", "#work-" + card.getAttribute("data-slug")); } catch (err) {}
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && detail && detail.classList.contains("is-open")) hideDetail();
    });

    var filterBar = document.getElementById("filterBar");
    if (filterBar) {
      var firstBtn = filterBar.querySelector(".filter-btn");
      Array.prototype.forEach.call(filterBar.querySelectorAll(".filter-btn"), function (btn) {
        var on = btn === firstBtn;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.classList.toggle("is-active", on);
        btn.addEventListener("click", function () { switchTo(btn); });
      });
    }
    render(firstBtn ? (firstBtn.getAttribute("data-filter") || "") : "");

    /* ── 静止 5 秒自动轮播：切到下一个分类，最后一个回到第一个 ──
       · 任何交互（鼠标移动 / 点击 / 键盘 / 滚轮 / 触摸 / 滚动）都会重置计时；
       · 只有作品集区域进入视口时才轮播，避免用户在看别处时页面自己乱动。 */
    var autoTimer = null;
    /* 自动轮播的前提（用户明确要求）：**没有任何项目卡被打开**，且页面在前台 */
    function autoAllowed() {
      if (!filterBar) return false;
      if (document.hidden) return false;
      if (detail && detail.classList.contains("is-open")) return false;   // 有人打开了详情 → 不许动
      return true;
    }
    function scheduleAuto() {
      clearTimeout(autoTimer);
      if (!autoAllowed()) return;
      autoTimer = setTimeout(function () {
        if (!autoAllowed()) return;                  // 计时期间被打开详情 → 放弃这一轮
        var all = filterBar.querySelectorAll(".filter-btn");
        if (!all.length) return;
        switchTo(all[(curIdx + 1) % all.length]);    // 最后一个 → 回到第一个
        scheduleAuto();
      }, 5000);
    }
    if (filterBar) {
      scheduleAuto();
      // 任何交互都重置「静止 5 秒」的计时
      ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "scroll"].forEach(function (ev) {
        document.addEventListener(ev, scheduleAuto, { passive: true });
      });
      // 详情打开 / 关闭时立刻重新评估：打开就停，关闭后重新计时
      if (detail && window.MutationObserver) {
        new MutationObserver(scheduleAuto).observe(detail, { attributes: true, attributeFilter: ["class"] });
      }
      document.addEventListener("visibilitychange", scheduleAuto);
    }
    function openFromHash() {
      var slug = (location.hash || "").replace("#work-", "");
      if (!slug) return;
      var idx = -1;
      for (var i = 0; i < works.length; i++) { if (slugify(works[i].title) === slug) { idx = i; break; } }
      if (idx >= 0) openDetail(idx);
    }
    window.addEventListener("hashchange", openFromHash);
    openFromHash();
  }


  /* ---------- 5) Footer 当前年份 ---------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* JS 驱动的导航模式：<768 显示汉堡+隐藏链接，≥768 反之（兜底 CSS 媒体查询，
     确保各渲染环境都正确显示移动端汉堡） */
  function applyNavMode() {
    var toggle = document.querySelector(".nav__toggle");
    var list = document.querySelector(".nav__list");
    if (!toggle || !list) return;
    var mobile = window.innerWidth < 768;
    toggle.style.display = mobile ? "inline-flex" : "none";
    list.style.display = mobile ? "none" : "flex";
  }
  window.addEventListener("resize", applyNavMode);

  /* 故事图点击放大（lightbox） */
  function initStoryZoom() {
    document.addEventListener("click", function (e) {
      var zoomTarget = e.target.closest(".story-zoom");
      if (zoomTarget) {
        var lb = document.querySelector(".work-story__lightbox");
        if (!lb) {
          lb = document.createElement("div");
          lb.className = "work-story__lightbox close";
          lb.setAttribute("role", "dialog");
          lb.setAttribute("aria-label", "查看大图");
          lb.addEventListener("click", close)
          document.body.appendChild(lb);
        }
        lb.innerHTML = '<img src="' + zoomTarget.src + '" alt="查看大图">';
        lb.classList.remove("close");
        document.body.classList.add("nav-locked");
      }
      function close() { if (lb) lb.classList.add("close"); document.body.classList.remove("nav-locked"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var lb = document.querySelector(".work-story__lightbox");
        if (lb) { lb.classList.add("close"); document.body.classList.remove("nav-locked"); }
      }
    });
  }

  /* 视频浮层播放：点视频 → 全屏浮层（z-index 最高，盖过页眉与小洄），ESC / 点击空白关闭 */
  function initVideoZoom() {
    var lb = null, vid = null, saveTime = 0;
    function open(src, t) {
      if (!lb) {
        lb = document.createElement("div");
        lb.className = "video-lightbox close";
        lb.setAttribute("role", "dialog");
        lb.setAttribute("aria-label", "视频播放");
        lb.innerHTML = '<video controls playsinline preload="metadata"></video><span class="video-lightbox__hint">点击空白处或按 Esc 关闭</span>';
        lb.addEventListener("click", function (e) { if (e.target === lb || e.target.className === "video-lightbox__hint") close(); });
        document.body.appendChild(lb);
      }
      vid = lb.querySelector("video");
      vid.src = src;
      vid.currentTime = t || 0;
      lb.classList.remove("close");
      document.body.classList.add("nav-locked");
      try { vid.play(); } catch (e) {}
    }
    function close() {
      if (!lb) return;
      var inline = document.querySelector('.work-media video');
      if (inline && vid) { try { inline.currentTime = vid.currentTime; } catch (e) {} }
      try { vid.pause(); } catch (e) {}
      lb.classList.add("close");
      document.body.classList.remove("nav-locked");
    }
    document.addEventListener("click", function (e) {
      var v = e.target;
      if (v && v.tagName === "VIDEO" && v.closest && v.closest(".work-media")) {
        // 内嵌视频：点击画面（非控制条区域）→ 放大到浮层
        var rect = v.getBoundingClientRect();
        if (e.clientY - rect.top < rect.height - 44) {    // 避开底部控制条
          e.preventDefault();
          open(v.getAttribute("src"), v.currentTime);
        }
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var l = document.querySelector(".video-lightbox");
        if (l && !l.classList.contains("close")) close();
      }
    });
  }

  /* 产品设计主线的弹层交互：桌面端悬浮即显，触屏端点击切换（按钮本身不跳转） */
  function initMainlinePop() {
    var wrap = null, timer = null;
    function show(trigger) {
      clearTimeout(timer);
      wrap = trigger.closest(".link-card--mainline");
      if (!wrap) return;
      var pop = wrap.querySelector(".mainline-pop");
      if (!pop) return;
      pop.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }
    function hide() {
      clearTimeout(timer);
      if (!wrap) return;
      var pop = wrap.querySelector(".mainline-pop");
      if (pop) pop.hidden = true;
      var t = wrap.querySelector(".mainline-trigger");
      if (t) t.setAttribute("aria-expanded", "false");
      wrap = null;
    }
    /* 鼠标是否仍在「按钮 / 桥接区 / 弹窗」范围内 */
    function inside(el) { return !!(wrap && el && wrap.contains(el)); }

    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest && e.target.closest(".mainline-trigger");
      if (t) { show(t); return; }
      // 进入弹窗（或桥接区）→ 取消待执行的隐藏
      if (inside(e.target)) clearTimeout(timer);
    });

    document.addEventListener("mouseout", function (e) {
      if (!wrap) return;
      // 只有「离开按钮 / 桥接区 / 弹窗」才隐藏；移到它们内部一律保留
      var to = e.relatedTarget;
      if (inside(to)) { clearTimeout(timer); return; }
      // 再留 150ms 缓冲：快速划过空隙时不会误关（配合 CSS 的桥接区双保险）
      clearTimeout(timer);
      timer = setTimeout(hide, 150);
    });
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".mainline-trigger");
      if (t) { e.preventDefault(); (wrap && wrap.contains(t)) ? hide() : show(t); return; }   // 触屏：点开关
      if (wrap && !wrap.contains(e.target)) hide();                                          // 点别处收起
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  }

  function boot() {
    initNavHighlight();
    initNavDrawer();
    applyNavMode();
    initPortfolio();

    initStoryZoom();
    initVideoZoom();
    initMainlinePop();
    initYear();
    landOnPortfolio();
  }

  /* 首次打开直接停在作品集（URL 带锚点时尊重锚点；同一次会话只自动跳一次，避免用户返回时被再次拉走） */
  function landOnPortfolio() {
    try {
      if (location.hash) return;
      if (sessionStorage.getItem("lxh_landed") === "1") return;
      var el = document.getElementById("portfolio");
      if (!el) return;
      sessionStorage.setItem("lxh_landed", "1");
      requestAnimationFrame(function () {
        window.scrollTo({ top: el.offsetTop - 72, behavior: "auto" });   // 减去固定页眉高度
      });
    } catch (e) { /* 忽略 */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
