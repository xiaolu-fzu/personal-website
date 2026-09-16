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
    return { data: "tag--data", industry: "tag--industry", prototype: "tag--prototype", aigc: "tag--aigc", game: "tag--game", tool: "tag--tool", agent: "tag--agent" }[tag] || "";
  }
  function catVar(tag) {
    return { data: "var(--cat-data)", industry: "var(--cat-industry)", prototype: "var(--cat-prototype)", aigc: "var(--cat-aigc)", game: "var(--cat-game)", tool: "var(--cat-tool)", agent: "var(--cat-agent)" }[tag] || "var(--accent)";
  }
  function tagLabel(tag) {
    return { data: "数据分析", industry: "行业研究", prototype: "产品原型 · C端", aigc: "AIGC", game: "网页游戏", tool: "工具/开发", agent: "Agent开发" }[tag] || tag;
  }
  function catTagsHtml(category, labelOverride) {
    var cls = catClass(category);
    return (labelOverride || tagLabel(category)).split(" · ").map(function (part) {
      return '<span class="tag ' + cls + '">' + escapeHtml(part) + "</span>";
    }).join("");
  }
  function catPriority(tag) {
    return { data: 0, industry: 1, prototype: 2, game: 3, aigc: 4, tool: 5, agent: 6 }[tag] || 99;
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

  function makeCard(work, index) {
    var tags = catTagsHtml(work.category, work.catLabel);
    var valueHtml = work.value ? '<p class="work-card__value">' + escapeHtml(work.value) + "</p>" : "";
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
  function renderReport(w) {
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
        '<a class="btn btn-ghost" href="' + escapeHtml(w.gameUrl) + '" target="_blank" rel="noopener">在新窗口打开游戏 ↗</a>' +
        (w.devDocUrl ? '<a class="btn btn-ghost" href="' + escapeHtml(w.devDocUrl) + '" target="_blank" rel="noopener">开发飞书文档 ↗</a>' : "") +
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
  function renderLinks(w) {
    var html = '<div class="work-detail__links">';
    if (w.link && !w.report) html += linkBtn(w.link, "btn-primary", w.outLinkText || "查看项目", /github\.com/i.test(w.link) ? "repo" : "open");
    if (w.caseUrl) html += linkBtn(w.caseUrl, "btn-ghost", w.caseText || "案例展示", "open");
    if (w.downloadUrl) html += linkBtn(w.downloadUrl, "btn-ghost", "下载页", "down");
    if (w.reqDocUrl) html += linkBtn(w.reqDocUrl, "btn-ghost", "需求文档", "file");
    if (w.devDocUrl && !w.gameUrl) html += linkBtn(w.devDocUrl, "btn-ghost", "开发文档", "file");
    if (w.docUrl) html += linkBtn(w.docUrl, "btn-ghost", "需求/开发文档", "file");
    if (w.prdUrl) html += linkBtn(w.prdUrl, "btn-ghost", "PRD 展示页", "open");
    if (w.prdDocUrl) html += linkBtn(w.prdDocUrl, "btn-ghost", "PRD 文档", "file");
    if (!w.link && !w.downloadUrl && !w.videoSrc && !w.gameUrl && !w.prototypeUrl) html += '<a class="btn btn-ghost" href="mailto:' + (window.OWNER && window.OWNER.email ? window.OWNER.email : "18672786151@163.com") + '"><span>联系获取更多</span></a>';
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
          (w.mainline && w.mainline.length ? '<div class="work-detail__mainline"><h4>产品设计主线</h4><ol class="mainline-list">' + w.mainline.map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("") + "</ol></div>" : "") +
          renderReport(w) +
          renderMedia(w) +
          renderLinks(w) +
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
        btn.addEventListener("click", function () {
          Array.prototype.forEach.call(filterBar.querySelectorAll(".filter-btn"), function (b) {
            var active = b === btn;
            b.setAttribute("aria-pressed", active ? "true" : "false");
            b.classList.toggle("is-active", active);
          });
          render(btn.getAttribute("data-filter") || "");
        });
      });
    }
    render(firstBtn ? (firstBtn.getAttribute("data-filter") || "") : "");
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

  function boot() {
    initNavHighlight();
    initNavDrawer();
    applyNavMode();
    initPortfolio();

    initStoryZoom();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
