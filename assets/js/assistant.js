/* 作品集助手：右下角常驻按钮 + 对话弹窗
 * 语料：window.WORKS（每张卡的标题 / 描述 / 卖点 / 理念 / 主线 / 关键词 / 链接）
 * 检索：前端关键词打分，选最相关的几张卡随问题一起发后端
 * 动作：打开项目详情 / 打开链接 / 切换分类筛选
 * 降级：后端不可用时直接用检索结果自答，功能不消失
 * 交互范式参考 dsh-whale-widget：常驻 + 可拖拽 + 大小三档 + 气泡提示 + 失败静默
 */
(function () {
  var API = "https://xiaolu-stats.pages.dev/api/chat";
  var PKEY = "lxh_asst_pos", SKEY = "lxh_asst_size", HKEY = "lxh_asst_hist";
  var works = window.WORKS || [];
  if (!works.length) return;

  /* ---------- 语料 ---------- */
  function slugify(s) {
    return String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  }
  function cardText(w) {
    var parts = [w.title, w.desc || "", w.value || "", (w.mainline || []).join(" "), (w.keywords || []).join(" ")];
    if (w.idea) parts.push(w.idea);
    return parts.join(" ").replace(/\s+/g, " ");
  }
  function cardLinks(w) {
    var out = [];
    if (w.link) out.push({ label: w.outLinkText || "产品链接", href: w.link });
    if (w.caseUrl) out.push({ label: w.caseText || "案例展示", href: w.caseUrl });
    if (w.gameUrl) out.push({ label: "在线游玩", href: w.gameUrl });
    if (w.prototypeUrl && /^https?:/i.test(w.prototypeUrl)) out.push({ label: "在线原型", href: w.prototypeUrl });
    if (w.reqDocUrl) out.push({ label: "需求文档", href: w.reqDocUrl });
    if (w.devDocUrl) out.push({ label: "开发文档", href: w.devDocUrl });
    if (w.docUrl) out.push({ label: "需求/开发文档", href: w.docUrl });
    if (w.prdUrl) out.push({ label: "PRD 展示页", href: w.prdUrl });
    if (w.prdDocUrl) out.push({ label: "PRD 文档", href: w.prdDocUrl });
    return out;
  }
  var CORPUS = works.map(function (w, i) {
    return { index: i, title: w.title, category: w.category, text: cardText(w), links: cardLinks(w), value: w.value || "" };
  });

  /* ---------- 前端检索（轻量打分） ---------- */
  function tokens(q) {
    var t = String(q).toLowerCase().replace(/[，。？！,?!.;；:：、\s]+/g, " ").trim().split(" ").filter(Boolean);
    var extra = [];
    t.forEach(function (x) { if (x.length > 2) for (var i = 0; i + 1 < x.length; i++) extra.push(x.slice(i, i + 2)); });
    return t.concat(extra);
  }
  function search(q, top) {
    var ts = tokens(q), scored = [];
    CORPUS.forEach(function (c) {
      var hay = (c.title + " " + c.text).toLowerCase(), s = 0;
      ts.forEach(function (t) {
        if (!t) return;
        var inTitle = c.title.toLowerCase().indexOf(t) >= 0;
        var n = hay.split(t).length - 1;
        if (n > 0) s += n * (inTitle ? 6 : 1) * (t.length > 2 ? 2 : 1);
      });
      if (/数据|分析|指标|报告/.test(q) && c.category === "data") s += 3;
      if (/游戏|可玩|玩/.test(q) && (c.category === "game" || c.links.some(function (l) { return l.label === "在线游玩"; }))) s += 3;
      if (/agent|智能体|rag|对话/i.test(q) && c.category === "agent") s += 3;
      if (s > 0) scored.push({ c: c, s: s });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, top || 5).map(function (x) { return x.c; });
  }

  /* ---------- 动作 ---------- */
  function openProject(title) {
    var idx = -1;
    CORPUS.forEach(function (c) { if (c.title === title || c.title.indexOf(title) >= 0) idx = c.index; });
    if (idx < 0) return false;
    close();
    location.hash = "#work-" + slugify(works[idx].title);
    setTimeout(function () {
      var grid = document.getElementById("worksGrid");
      if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return true;
  }
  function openUrl(href) { window.open(href, "_blank", "noopener"); }
  function filterCategory(cat) {
    var map = { data: "数据分析", industry: "行业研究", prototype: "原型和产品", agent: "Agent开发", aigc: "AIGC", game: "网页游戏", tool: "工具/开发" };
    var id = null;
    Object.keys(map).forEach(function (k) { if (cat === k || cat === map[k]) id = k; });
    var btn = id && document.querySelector('[data-filter="' + id + '"]');
    if (!btn) return false;
    close();
    btn.click();
    var grid = document.getElementById("worksGrid");
    if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }
  function runAction(a) {
    if (!a || !a.type) return;
    if (a.type === "open_project") openProject(a.target || "");
    else if (a.type === "open_link") openUrl(a.target || "");
    else if (a.type === "filter") filterCategory(a.target || "");
  }

  /* ---------- 界面 ---------- */
  var root = document.createElement("div");
  root.className = "asst";
  root.innerHTML =
    '<button class="asst__fab" id="asstFab" type="button" aria-label="打开作品集助手">💬</button>' +
    '<div class="asst__tip" id="asstTip">想了解我的项目？问我 →</div>' +
    '<div class="asst__panel" id="asstPanel" hidden>' +
      '<div class="asst__head" id="asstHead">' +
        '<span class="asst__title">作品集助手</span>' +
        '<span class="asst__tools">' +
          '<button type="button" class="asst__mini" id="asstSize" title="切换大小">⤢</button>' +
          '<button type="button" class="asst__mini" id="asstClear" title="清空对话">🗑</button>' +
          '<button type="button" class="asst__mini" id="asstClose" title="关闭">✕</button>' +
        '</span>' +
      '</div>' +
      '<div class="asst__log" id="asstLog"></div>' +
      '<div class="asst__chips" id="asstChips">' +
        '<button type="button">有据是什么？</button>' +
        '<button type="button">哪个项目最能体现数据分析？</button>' +
        '<button type="button">有哪些能直接玩的？</button>' +
        '<button type="button">打开三体的产品链接</button>' +
      '</div>' +
      '<form class="asst__form" id="asstForm">' +
        '<input id="asstInput" type="text" placeholder="问我任何项目的问题…" autocomplete="off">' +
        '<button type="submit" id="asstSend">发送</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var fab = root.querySelector("#asstFab"), tip = root.querySelector("#asstTip");
  var panel = root.querySelector("#asstPanel"), log = root.querySelector("#asstLog");
  var form = root.querySelector("#asstForm"), input = root.querySelector("#asstInput");
  var chips = root.querySelector("#asstChips"), head = root.querySelector("#asstHead");
  var state = { busy: false, hist: [] };

  try { state.hist = JSON.parse(localStorage.getItem(HKEY) || "[]").slice(-20); } catch (e) {}

  function save() { try { localStorage.setItem(HKEY, JSON.stringify(state.hist.slice(-20))); } catch (e) {} }

  function bubble(who, html, actions) {
    var el = document.createElement("div");
    el.className = "asst__msg asst__msg--" + who;
    var body = document.createElement("div");
    body.className = "asst__bubble";
    body.innerHTML = html;
    el.appendChild(body);
    if (actions && actions.length) {
      var bar = document.createElement("div");
      bar.className = "asst__actions";
      actions.forEach(function (a) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = a.label;
        b.addEventListener("click", function () { runAction(a.action); });
        bar.appendChild(b);
      });
      el.appendChild(bar);
    }
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function showHist() {
    log.innerHTML = "";
    if (!state.hist.length) {
      bubble("bot", "你好，我是这个作品集的助手 👋<br>我的知识库就是下面这 " + works.length + " 个项目。可以问我：<br>· 某个项目是怎么做的<br>· 哪个项目最体现某项能力<br>· 直接让我帮你打开项目或链接");
      return;
    }
    state.hist.forEach(function (m) { bubble(m.who, m.html, m.actions); });
  }

  /* ---------- 回答（无后端也能用） ---------- */
  function fallbackAnswer(q) {
    var hits = search(q, 3);
    if (!hits.length) return { html: "我没找到匹配的项目。可以换个说法，或者问我「有哪些网页游戏」「哪个项目用了 RAG」这类问题。", actions: [] };
    var html = "没连上大模型，先用项目库给你找到这些：<br>";
    var actions = [];
    hits.forEach(function (c) {
      html += "· <b>" + esc(c.title) + "</b>" + (c.value ? " —— " + esc(c.value) : "") + "<br>";
      actions.push({ label: "打开「" + c.title.slice(0, 10) + "…」", action: { type: "open_project", target: c.title } });
      if (c.links[0]) actions.push({ label: esc(c.links[0].label), action: { type: "open_link", target: c.links[0].href } });
    });
    return { html: html, actions: actions.slice(0, 4) };
  }

  function ask(q) {
    if (state.busy) return;
    state.busy = true;
    bubble("me", esc(q));
    state.hist.push({ who: "me", html: esc(q) });
    var thinking = document.createElement("div");
    thinking.className = "asst__msg asst__msg--bot";
    thinking.innerHTML = '<div class="asst__bubble asst__typing">正在翻项目库…</div>';
    log.appendChild(thinking);
    log.scrollTop = log.scrollHeight;

    var hits = search(q, 5);
    var ctx = hits.map(function (c) {
      return "【" + c.title + "】分类:" + c.category + "｜卖点:" + c.value + "｜简介:" + c.text.slice(0, 420) +
        "｜可用链接:" + c.links.map(function (l) { return l.label + " " + l.href; }).join(" ; ");
    }).join("\n");
    var payload = { question: q, context: ctx, projects: hits.map(function (c) { return c.title; }) };

    function done(res) {
      state.busy = false;
      thinking.remove();
      bubble("bot", res.html, res.actions);
      state.hist.push({ who: "bot", html: res.html, actions: res.actions });
      save();
    }

    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
      .then(function (j) {
        clearTimeout(timer);
        var actions = [];
        (j.projects || []).slice(0, 3).forEach(function (t) { actions.push({ label: "打开「" + t.slice(0, 10) + "…」", action: { type: "open_project", target: t } }); });
        if (j.action && j.action.type) actions.unshift({ label: "帮我执行：" + (j.action.label || j.action.type), action: j.action });
        done({ html: esc(j.reply || "（模型没有返回内容）").replace(/\n/g, "<br>"), actions: actions.slice(0, 4) });
      })
      .catch(function () { clearTimeout(timer); done(fallbackAnswer(q)); });
  }

  /* ---------- 交互 ---------- */
  function open() {
    panel.hidden = false; fab.classList.add("is-open"); tip.classList.add("is-hidden");
    try { localStorage.setItem("lxh_asst_seen", "1"); } catch (e) {}
    if (!log.childElementCount) showHist();
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() { panel.hidden = true; fab.classList.remove("is-open"); }
  var isOpen = function () { return !panel.hidden; };

  fab.addEventListener("click", function () { isOpen() ? close() : open(); });
  root.querySelector("#asstClose").addEventListener("click", close);
  root.querySelector("#asstClear").addEventListener("click", function () {
    state.hist = []; save(); showHist();
  });
  root.querySelector("#asstSize").addEventListener("click", function () {
    var order = ["", "asst--wide", "asst--tall"], cur = root.className.replace("asst", "").trim();
    var next = order[(order.indexOf(cur) + 1) % order.length];
    root.className = "asst" + (next ? " " + next : "");
    try { localStorage.setItem(SKEY, next || ""); } catch (e) {}
  });
  try {
    var savedSize = localStorage.getItem(SKEY);
    if (savedSize) root.className = "asst " + savedSize;
    if (localStorage.getItem("lxh_asst_seen")) tip.classList.add("is-hidden");
  } catch (e) {}

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });
  chips.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    ask(b.textContent.trim());
  });

  /* 拖拽（记位置，学 dsh-whale-widget 的可拖动挂件） */
  (function drag() {
    var sx = 0, sy = 0, ox = 0, oy = 0, moving = false;
    head.addEventListener("mousedown", function (e) {
      if (e.target.closest(".asst__mini")) return;
      moving = true;
      var r = root.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      root.classList.add("asst--dragging");
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (!moving) return;
      var left = Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, ox + e.clientX - sx));
      var top = Math.max(8, Math.min(window.innerHeight - 60, oy + e.clientY - sy));
      root.style.left = left + "px"; root.style.top = top + "px";
      root.style.right = "auto"; root.style.bottom = "auto";
    });
    document.addEventListener("mouseup", function () {
      if (!moving) return;
      moving = false;
      root.classList.remove("asst--dragging");
      try { localStorage.setItem(PKEY, JSON.stringify({ l: root.style.left, t: root.style.top })); } catch (e) {}
    });
    try {
      var p = JSON.parse(localStorage.getItem(PKEY) || "null");
      if (p && p.l) { root.style.left = p.l; root.style.top = p.t; root.style.right = "auto"; root.style.bottom = "auto"; }
    } catch (e) {}
  })();

  /* 回车发送、Esc 关闭 */
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen()) close(); });
})();
