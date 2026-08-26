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
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/REPLACE_ME";

  var currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  /* ---------- 1) 主导航高亮 ---------- */
  function initNavHighlight() {
    var links = document.querySelectorAll(".nav__list .nav__link, .nav-drawer__list .nav-drawer__link");
    var map = { "index.html": "index", "portfolio.html": "portfolio", "about.html": "about", "contact.html": "contact" };
    var id = map[currentPage] || "index";
    links.forEach(function (link) {
      if (link.getAttribute("data-page") === id) {
        link.classList.add("is-active");
        if (link.classList.contains("nav-drawer__link")) link.setAttribute("aria-current", "page");
      }
    });
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

  function catClass(tag) {
    if (tag === "data" || tag === "prototype") return "tag--cyan";
    if (tag === "aigc" || tag === "game") return "tag--magenta";
    if (tag === "tool") return "tag--green";
    return "";
  }
  function tagLabel(tag) {
    return { data: "数据分析", prototype: "产品原型", aigc: "AIGC", game: "网页游戏", tool: "工具/开发" }[tag] || tag;
  }
  function catPriority(tag) {
    return { data: 0, prototype: 1, game: 2, aigc: 3, tool: 4 }[tag] || 99;
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
    var tags = '<span class="tag ' + catClass(work.category) + '">' + tagLabel(work.category) + "</span>";
    return (
      '<a class="work-card" href="#work-detail" data-index="' + index + '">' +
        '<div class="work-card__thumb" style="--work-hue:' + work.hue + '" role="img" aria-label="' + escapeHtml(work.title) + ' 缩略图占位"></div>' +
        '<div class="work-card__meta">' +
          '<h3 class="work-card__title">' + escapeHtml(work.title) + "</h3>" +
          '<span class="work-card__year">' + escapeHtml(work.year) + "</span>" +
        "</div>" +
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
    return '<div class="report-table-wrap"><table><thead><tr>' + t.thead.map(function (h) { return "<th>" + escapeHtml(h) + "</th>"; }).join("") + '</tr></thead><tbody>' + rows + "</tbody></table></div>";
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
    var hasReport = w.report && w.report.tables && w.report.tables.length;
    if (hasReport) {
      var tablesHtml = w.report.tables.map(function (t) {
        return '<div class="report-block"><h4>' + escapeHtml(t.title) + "</h4>" + renderTableHtml(t) + "</div>";
      }).join("");
      var reportPane = '<div class="report-pane" data-pane="tables" hidden>' +
        (w.report.title ? '<h3 class="report-title">' + escapeHtml(w.report.title) + "</h3>" : "") +
        tablesHtml +
        "</div>";
      var backgroundPane = '<div class="report-pane" data-pane="background" hidden>' +
        (w.background ? '<p class="report-background">' + escapeHtml(w.background) + "</p>" : '<p class="report-background report-background--empty">项目背景整理中…</p>') +
        "</div>";
      // 切换按钮：项目背景(左) + 主要结论(默认) + 查看报表表格
      return '<div class="work-report">' +
        '<div class="report-tabs">' +
          '<button type="button" class="report-tab" data-tab="background">项目背景</button>' +
          (resultsHtml ? '<button type="button" class="report-tab is-active" data-tab="conclusions">主要结论</button>' : "") +
          '<button type="button" class="report-tab" data-tab="tables">📊 查看报表表格</button>' +
        "</div>" +
        backgroundPane +
        (resultsHtml ? resultsHtml : "") +
        reportPane +
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
      html += '<div class="work-media">' +
        '<iframe src="' + escapeHtml(w.gameUrl) + '" title="' + escapeHtml(w.title) + ' 在线游玩" loading="lazy" allow="fullscreen; autoplay; gamepad" allowfullscreen width="100%" height="560" tabindex="0" class="game-frame" style="border:0;border-radius:var(--radius-md);background:var(--surface)"></iframe>' +
        (w.controls ? '<p class="work-controls">玩法：' + escapeHtml(w.controls) + "</p>" : "") +
        '<a class="btn btn-ghost" href="' + escapeHtml(w.gameUrl) + '" target="_blank" rel="noopener">在新窗口打开游戏 ↗</a>' +
        "</div>";
    }
    if (w.prototypeUrl) {
      html += '<div class="proto-showcase">' +
        '<p class="proto-showcase__label">产品原型展示</p>' +
        '<div class="work-media proto-frame">' +
          '<iframe src="' + escapeHtml(w.prototypeUrl) + '" title="' + escapeHtml(w.title) + ' 在线原型" loading="lazy" class="proto-iframe"></iframe>' +
        '</div>' +
      "</div>";
    }
    return html;
  }

  /* 各类外链动作 */
  function renderLinks(w) {
    var html = '<div class="work-detail__links">';
    // 数据作品(有报表)不显示外链"查看完整报告"，仅无报表的外链作品显示"查看项目"
    if (w.link && !w.report) html += '<a class="btn btn-primary" href="' + escapeHtml(w.link) + '" target="_blank" rel="noopener">查看项目 ↗</a>';
    if (w.prototypeUrl) html += '<a class="btn btn-ghost" href="' + escapeHtml(w.prototypeUrl) + '" target="_blank" rel="noopener">在新窗口打开原型 ↗</a>';
    if (w.downloadUrl) html += '<a class="btn btn-ghost" href="' + escapeHtml(w.downloadUrl) + '" target="_blank" rel="noopener">获取 App / 下载页 ↗</a>';

    if (!w.link && !w.downloadUrl && !w.videoSrc && !w.gameUrl && !w.prototypeUrl) html += '<a class="btn btn-ghost" href="mailto:' + (window.OWNER && window.OWNER.email ? window.OWNER.email : "hello@example.com") + '">联系获取更多 ↗</a>';
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
      var list = sortWorks(works.filter(function (w) { return meetsFilter(w, filterValue); }));
      grid.innerHTML = "";
      if (!list.length) { if (empty) empty.style.display = "block"; return; }
      if (empty) empty.style.display = "none";
      list.forEach(function (w) { grid.insertAdjacentHTML("beforeend", makeCard(w, works.indexOf(w))); });
    }

    function hideDetail() { if (detail) detail.classList.remove("is-open"); }

    function openDetail(index) {
      var w = works[index];
      if (!w || !detail) return;
      var catTags = '<span class="tag ' + catClass(w.category) + '">' + tagLabel(w.category) + "</span>";
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
          renderLinks(w) +
        "</div>";
      detail.classList.add("is-open");
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
      if (gameFrame) { setTimeout(function () { try { gameFrame.focus(); } catch (e) {} }, 300); }
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
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && detail && detail.classList.contains("is-open")) hideDetail();
    });

    var filterBar = document.getElementById("filterBar");
    if (filterBar) {
      Array.prototype.forEach.call(filterBar.querySelectorAll(".filter-btn"), function (btn) {
        var on = (btn.getAttribute("data-filter") || "") === "";
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
    render("");
  }

  /* ---------- 4) 联系表单占位（无后端） ---------- */
  function initContactForm() {
    var form = document.querySelector(".contact-form");
    if (!form) return;
    var status = document.getElementById("formStatus");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var msg = form.querySelector("#message");
      var ok = true;
      [name, email, msg].forEach(function (f) { f.parentElement.classList.remove("is-invalid"); });
      if (name && !name.value.trim()) { name.parentElement.classList.add("is-invalid"); ok = false; }
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { email.parentElement.classList.add("is-invalid"); ok = false; }
      if (msg && !msg.value.trim()) { msg.parentElement.classList.add("is-invalid"); ok = false; }
      if (!ok) {
        if (status) { status.textContent = "请完善标 * 的必填项（邮箱格式需正确）。"; status.style.color = "var(--neon-magenta)"; }
        return;
      }
      if (typeof FORMSPREE_ENDPOINT !== 'undefined' && FORMSPREE_ENDPOINT.indexOf('REPLACE_ME') === -1) {
        // 真实提交到 Formspree
        var submitBtn = form.querySelector('button[type="submit"]');
        var payload = { name: name.value.trim(), email: email.value.trim(), message: msg.value.trim() };
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '发送中…'; }
        fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) {
          if (res.ok) {
            if (status) { status.textContent = '✔ 已收到你的留言，我会尽快联系你。'; status.style.color = 'var(--neon-cyan)'; }
            form.reset();
          } else { throw new Error('submit failed'); }
        }).catch(function () {
          if (status) { status.textContent = '⚠ 发送失败，请直接邮箱联系 18672786151@163.com。'; status.style.color = 'var(--neon-magenta)'; }
        }).finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '发送留言'; }
        });
      } else {
        if (status) { status.textContent = '留言功能配置中，可先用邮箱联系 18672786151@163.com。'; status.style.color = 'var(--neon-magenta)'; }
      }
      form.reset();
    });
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
    initContactForm();
    initStoryZoom();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
