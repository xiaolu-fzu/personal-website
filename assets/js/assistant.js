/* 作品集助手「小洄」：右下角常驻桌宠 + 对话弹窗
 * 语料：window.WORKS（全部项目卡）
 * 检索：前端关键词打分 → 选最相关的几张随问题发后端
 * 动作（边界严格限定在「打开 / 关闭 / 定位」）：
 *   open_project 打开项目卡（先切分类 → 滚动 → 高亮 → 打开详情）
 *   open_link    打开链接（仅限资料里出现过的）
 *   filter       切换作品集分类
 *   locate       定位到页面区块（作品集 / 关于我 / 文档库 / 顶部）
 *   close        关闭弹窗
 * 降级：后端不可用时用前端检索结果自答
 * 交互范式借鉴 project8：dsh-whale-widget（常驻/拖拽记位置/失败静默）+ deepseek-pet（状态表达）
 */
(function () {
  var API = "https://xiaolu-stats.pages.dev/api/chat";
  var PKEY = "lxh_asst_pos", SKEY = "lxh_asst_size", HKEY = "lxh_asst_hist", AVATAR = "assets/img/小洄头像.webp", PET = "assets/img/小洄.webp";
  var works = window.WORKS || [];
  if (!works.length) return;

  /* ---------- 语料 ---------- */
  function slugify(s) { return String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 48); }
  function cardText(w) {
    var p = [w.title, w.desc || "", w.value || "", (w.mainline || []).join(" "), (w.keywords || []).join(" ")];
    if (w.idea) p.push(w.idea);
    return p.join(" ").replace(/\s+/g, " ");
  }
  function cardLinks(w) {
    var o = [];
    if (w.link) o.push({ label: w.outLinkText || "产品链接", href: w.link });
    if (w.caseUrl) o.push({ label: w.caseText || "案例展示", href: w.caseUrl });
    if (w.gameUrl) o.push({ label: "在线游玩", href: w.gameUrl });
    if (w.reqDocUrl) o.push({ label: "需求文档", href: w.reqDocUrl });
    if (w.devDocUrl) o.push({ label: "开发文档", href: w.devDocUrl });
    if (w.docUrl) o.push({ label: "需求/开发文档", href: w.docUrl });
    if (w.prdUrl) o.push({ label: "PRD 展示页", href: w.prdUrl });
    if (w.prdDocUrl) o.push({ label: "PRD 文档", href: w.prdDocUrl });
    return o;
  }
  var CORPUS = works.map(function (w, i) {
    return { index: i, title: w.title, category: w.category, text: cardText(w), links: cardLinks(w), value: w.value || "" };
  });

  /* ---------- 检索 ---------- */
  function tokens(q) {
    var t = String(q).toLowerCase().replace(/[，。？！,?!.;；:：、\s]+/g, " ").trim().split(" ").filter(Boolean), x = [];
    t.forEach(function (w) { if (w.length > 2) for (var i = 0; i + 1 < w.length; i++) x.push(w.slice(i, i + 2)); });
    return t.concat(x);
  }
  function search(q, top) {
    var ts = tokens(q), sc = [];
    CORPUS.forEach(function (c) {
      var hay = (c.title + " " + c.text).toLowerCase(), s = 0;
      ts.forEach(function (t) {
        if (!t) return;
        var n = hay.split(t).length - 1;
        if (n > 0) s += n * (c.title.toLowerCase().indexOf(t) >= 0 ? 6 : 1) * (t.length > 2 ? 2 : 1);
      });
      if (/数据|分析|指标|报告/.test(q) && c.category === "data") s += 3;
      if (/游戏|可玩/.test(q) && (c.category === "game" || c.links.some(function (l) { return l.label === "在线游玩"; }))) s += 3;
      if (/agent|智能体|rag|对话/i.test(q) && c.category === "agent") s += 3;
      if (s > 0) sc.push({ c: c, s: s });
    });
    sc.sort(function (a, b) { return b.s - a.s; });
    return sc.slice(0, top || 5).map(function (x) { return x.c; });
  }

  /* ---------- 动作（打开 / 关闭 / 定位） ---------- */
  function findCard(name) {
    var hit = null;
    CORPUS.forEach(function (c) {
      if (hit) return;
      if (c.title === name) hit = c;
    });
    if (hit) return hit;
    CORPUS.forEach(function (c) {
      if (hit) return;
      if (c.title.indexOf(name) >= 0 || (name && name.indexOf(c.title) >= 0)) hit = c;
    });
    if (hit) return hit;
    // 退回关键词匹配
    var hits = search(name || "", 1);
    return hits.length ? hits[0] : null;
  }
  function openProject(name) {
    var hit = findCard(name);
    if (!hit) return false;
    var w = works[hit.index];
    close();
    // ① 先切到该卡所属分类（关键：不切的话卡片根本不在网格里）
    var btn = document.querySelector('[data-filter="' + w.category + '"]');
    if (btn && !btn.classList.contains("is-active")) btn.click();
    // ② 滚动 → 高亮 → 打开详情
    setTimeout(function () {
      var card = document.querySelector('.work-card[data-index="' + hit.index + '"]');
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("is-flash");
        setTimeout(function () { card.click(); }, 520);
        setTimeout(function () { card.classList.remove("is-flash"); }, 2400);
      } else {
        var grid = document.getElementById("worksGrid");
        if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
        location.hash = "#work-" + slugify(w.title);
      }
    }, 260);
    return true;
  }
  function openUrl(href) {
    if (!href || !/^https?:/i.test(href)) return false;
    // 安全边界：只允许打开资料里出现过的链接
    var ok = false;
    CORPUS.forEach(function (c) { c.links.forEach(function (l) { if (l.href === href) ok = true; }); });
    if (!ok) return false;
    window.open(href, "_blank", "noopener");
    return true;
  }
  function filterCategory(cat) {
    var map = { data: "数据分析", industry: "行业研究", prototype: "原型和产品", agent: "Agent开发", aigc: "AIGC", game: "网页游戏", tool: "工具/开发" };
    var id = null;
    Object.keys(map).forEach(function (k) { if (cat === k || cat === map[k]) id = k; });
    var btn = id && document.querySelector('[data-filter="' + id + '"]');
    if (!btn) return false;
    close(); btn.click();
    setTimeout(function () {
      var g = document.getElementById("worksGrid");
      if (g) g.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return true;
  }
  function locate(where) {
    var t = String(where || "").toLowerCase(), el = null;
    if (/top|顶部|首页|开头/.test(t)) el = document.getElementById("home") || document.body;
    else if (/关于|about/.test(t)) el = document.getElementById("about");
    else if (/文档|docs/.test(t)) el = document.getElementById("portfolio");
    else el = document.getElementById("portfolio");
    close();
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); if (/文档/.test(t)) { var b = document.querySelector('[data-filter="docs"]'); if (b) b.click(); } return true; }
    return false;
  }
  function runAction(a) {
    if (!a || !a.type) return;
    if (a.type === "open_project") openProject(a.target || "");
    else if (a.type === "open_link") openUrl(a.target || "");
    else if (a.type === "filter") filterCategory(a.target || "");
    else if (a.type === "locate") locate(a.target || "");
    else if (a.type === "close") close();
  }

  /* ---------- 界面 ---------- */
  var root = document.createElement("div");
  root.className = "asst";
  root.innerHTML =
    '<button class="asst__fab" id="asstFab" type="button" title="拖动我换位置，点我聊天"><img src="' + PET + '" alt="小洄"></button>' +
    '<div class="asst__tip" id="asstTip">点点我。</div>' +
    '<div class="asst__panel" id="asstPanel" hidden>' +
      '<div class="asst__head" id="asstHead">' +
        '<img class="asst__headpic" src="' + AVATAR + '" alt="">' +
        '<span class="asst__title">小洄 · 作品集助手</span>' +
        '<span class="asst__tools">' +
          '<button type="button" class="asst__mini" id="asstSize" title="切换大小">⤢</button>' +
          '<button type="button" class="asst__mini" id="asstClear" title="清空对话">🗑</button>' +
          '<button type="button" class="asst__mini" id="asstClose" title="关闭（也可以说“关掉”）">✕</button>' +
        '</span>' +
      '</div>' +
      '<div class="asst__log" id="asstLog"></div>' +
      '<div class="asst__chips" id="asstChips">' +
        '<button type="button">帮我找有据这个项目</button>' +
        '<button type="button">哪个项目最能体现数据分析？</button>' +
        '<button type="button">有哪些能直接玩的？</button>' +
        '<button type="button">打开三体的产品链接</button>' +
      '</div>' +
      '<form class="asst__form" id="asstForm">' +
        '<input id="asstInput" type="text" placeholder="和小洄说点什么…" autocomplete="off">' +
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
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  function bubble(who, html, actions, followups) {
    var el = document.createElement("div");
    el.className = "asst__msg asst__msg--" + who;
    if (who === "bot") {
      var av = document.createElement("img");
      av.className = "asst__msgpic"; av.src = AVATAR; av.alt = "";
      el.appendChild(av);
    }
    var wrap = document.createElement("div");
    wrap.className = "asst__msgbody";
    var body = document.createElement("div");
    body.className = "asst__bubble";
    body.innerHTML = html;
    wrap.appendChild(body);
    if (actions && actions.length) {
      var bar = document.createElement("div");
      bar.className = "asst__actions";
      actions.forEach(function (a) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = a.label;
        b.addEventListener("click", function () { runAction(a.action); });
        bar.appendChild(b);
      });
      wrap.appendChild(bar);
    }
    if (followups && followups.length) {
      var fu = document.createElement("div");
      fu.className = "asst__followups";
      followups.forEach(function (q) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = q;
        b.addEventListener("click", function () { ask(q); });
        fu.appendChild(b);
      });
      wrap.appendChild(fu);
    }
    el.appendChild(wrap);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  function greet() {
    bubble("bot", "你好。我是您的人工助手小洄，请问您有什么想了解的吗？<br><span class=\"asst__hint\">可以问我某个项目是怎么做的，也可以直接说「帮我找有据」「打开三体的产品链接」「看看数据分析的项目」「带我去文档库」「关掉」。</span>");
  }
  function showHist() {
    log.innerHTML = "";
    if (!state.hist.length) { greet(); return; }
    state.hist.forEach(function (m) { bubble(m.who, m.html, m.actions, m.followups); });
  }

  /* ---------- 无后端也能答 ---------- */
  function fallbackAnswer(q) {
    // 先看是不是纯命令
    var cmd = quickCommand(q);
    if (cmd) return { html: cmd.reply, actions: cmd.actions || [] };
    var hits = search(q, 3);
    if (!hits.length) return { html: "我没找到相关项目，换个说法试试？比如「有哪些网页游戏」「哪个项目用了 RAG」。", actions: [] };
    var html = "（暂时没连上大模型，我先按项目库帮你找）<br>", actions = [];
    hits.forEach(function (c) {
      html += "· <b>" + esc(c.title) + "</b>" + (c.value ? " —— " + esc(c.value) : "") + "<br>";
      actions.push({ label: "打开「" + c.title.slice(0, 10) + "…」", action: { type: "open_project", target: c.title } });
    });
    return { html: html, actions: actions.slice(0, 3), followups: ["还有哪些 Agent 项目？", "哪个项目最能体现数据分析？", "有哪些能直接玩的？"] };
  }
  // 纯前端能直接执行的命令（离线也灵）
  function quickCommand(q) {
    var t = String(q).trim();
    if (/^(关掉|关闭|收起|不用了|退下)$/.test(t)) return { reply: "好，那我先退到右下角，随时叫我。", actions: [], run: { type: "close" } };
    var m = t.match(/(?:打开|帮我打开|看看|访问)\s*(https?:\/\/[^\s]+)/i);
    if (/文档库/.test(t)) return { reply: '好，带你去文档库。', actions: [], run: { type: 'locate', target: 'docs' } };
    if (/(关于我|你是谁|介绍下自己)/.test(t)) return { reply: '好，带你去「关于我」看看。', actions: [], run: { type: 'locate', target: 'about' } };
    if (/(回到顶部|去顶部|回首页)/.test(t)) return { reply: '好，回到顶部。', actions: [], run: { type: 'locate', target: 'top' } };
    if (/(作品集|所有项目|全部项目)/.test(t)) return { reply: '好，带你去作品集。', actions: [], run: { type: 'locate', target: 'portfolio' } };
    if (m) return { reply: "这就帮你打开。", actions: [{ label: "打开链接", action: { type: "open_link", target: m[1] } }] };
    return null;
  }

  function ask(q) {
    if (state.busy) return;
    var quick = quickCommand(q);
    if (quick && quick.run) { state.busy = true; bubble("me", esc(q)); state.hist.push({ who: "me", html: esc(q) }); setTimeout(function () { state.busy = false; bubble("bot", quick.reply); state.hist.push({ who: "bot", html: quick.reply }); save(); runAction(quick.run); }, 260); return; }

    state.busy = true;
    bubble("me", esc(q));
    state.hist.push({ who: "me", html: esc(q) });
    var thinking = document.createElement("div");
    thinking.className = "asst__msg asst__msg--bot";
    thinking.innerHTML = '<img class="asst__msgpic" src="' + AVATAR + '" alt=""><div class="asst__msgbody"><div class="asst__bubble asst__typing">小洄正在翻项目库…</div></div>';
    log.appendChild(thinking);
    log.scrollTop = log.scrollHeight;

    var hits = search(q, 5);
    var ctx = hits.map(function (c) {
      return "【" + c.title + "】分类:" + c.category + "｜卖点:" + c.value + "｜简介:" + c.text.slice(0, 420) +
        "｜可用链接:" + c.links.map(function (l) { return l.label + " " + l.href; }).join(" ; ");
    }).join("\n");

    function done(res) {
      state.busy = false;
      thinking.remove();
      bubble("bot", res.html, res.actions, res.followups);
      state.hist.push({ who: "bot", html: res.html, actions: res.actions, followups: res.followups });
      save();
      if (res.auto) runAction(res.auto);
    }

    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 22000);
    fetch(API, {
      method: "POST", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ question: q, context: ctx, projects: hits.map(function (c) { return c.title; }) }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
      .then(function (j) {
        clearTimeout(timer);
        var actions = [], auto = null;
        // 模型给的动作：直接执行（用户说「直接帮忙执行即可」）
        if (j.action && j.action.type) {
          auto = j.action;
          if (j.action.type === "open_link") actions.push({ label: "打开链接", action: j.action });
        }
        (j.projects || []).slice(0, 3).forEach(function (t) {
          if (j.action && j.action.type === "open_project" && j.action.target === t) return;
          actions.push({ label: "打开「" + t.slice(0, 10) + "…」", action: { type: "open_project", target: t } });
        });
        done({ html: esc(j.reply || "（小洄没说话）").replace(/\n/g, "<br>"), actions: actions.slice(0, 4), auto: auto, followups: (j.followups || []).slice(0, 3) });
      })
      .catch(function () { clearTimeout(timer); done(fallbackAnswer(q)); });
  }

  /* ---------- 开关与拖拽（拖小洄 = 移动弹窗） ---------- */
  function open() {
    panel.hidden = false; fab.classList.add("is-open"); tip.classList.add("is-hidden");
    if (!log.childElementCount) showHist();
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() { panel.hidden = true; fab.classList.remove("is-open"); tip.classList.remove("is-hidden"); }
  var isOpen = function () { return !panel.hidden; };

  var lastToggle = 0;
  (function dragPet() {
    var sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
    fab.addEventListener("mousedown", function (e) {
      down = true; moved = false;
      var r = root.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      root.classList.add("asst--dragging");
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (!down) return;
      if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 9) moved = true;
      if (!moved) return;
      var left = Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, ox + e.clientX - sx));
      var top = Math.max(8, Math.min(window.innerHeight - 60, oy + e.clientY - sy));
      root.style.left = left + "px"; root.style.top = top + "px"; root.style.right = "auto"; root.style.bottom = "auto";
    });
    document.addEventListener("mouseup", function () {
      if (!down) return;
      down = false;
      root.classList.remove("asst--dragging");
      if (moved) { try { localStorage.setItem(PKEY, JSON.stringify({ l: root.style.left, t: root.style.top })); } catch (e) {} }
      else { lastToggle = Date.now(); isOpen() ? close() : open(); }     // 没拖动 = 点击 = 开关
    });
    try {
      var p = JSON.parse(localStorage.getItem(PKEY) || "null");
      if (p && p.l) { root.style.left = p.l; root.style.top = p.t; root.style.right = "auto"; root.style.bottom = "auto"; }
    } catch (e) {}
  })();

  // 头部也可拖（方便从标题栏移动）
  (function dragHead() {
    var sx = 0, sy = 0, ox = 0, oy = 0, down = false;
    head.addEventListener("mousedown", function (e) {
      if (e.target.closest(".asst__mini")) return;
      down = true;
      var r = root.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (!down) return;
      var left = Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, ox + e.clientX - sx));
      var top = Math.max(8, Math.min(window.innerHeight - 60, oy + e.clientY - sy));
      root.style.left = left + "px"; root.style.top = top + "px"; root.style.right = "auto"; root.style.bottom = "auto";
    });
    document.addEventListener("mouseup", function () {
      if (!down) return;
      down = false;
      try { localStorage.setItem(PKEY, JSON.stringify({ l: root.style.left, t: root.style.top })); } catch (e) {}
    });
  })();

  fab.addEventListener("click", function () {
    if (Date.now() - lastToggle < 350) return;   // 刚被 mouseup 处理过，避免重复
    isOpen() ? close() : open();
  });
  root.querySelector("#asstClose").addEventListener("click", close);
  root.querySelector("#asstClear").addEventListener("click", function () { state.hist = []; save(); showHist(); });
  root.querySelector("#asstSize").addEventListener("click", function () {
    var order = ["", "asst--wide", "asst--tall"], cur = root.className.replace("asst", "").replace("asst--dragging", "").trim();
    var next = order[(order.indexOf(cur) + 1) % order.length];
    root.className = "asst" + (next ? " " + next : "");
    try { localStorage.setItem(SKEY, next || ""); } catch (e) {}
  });
  try {
    var s = localStorage.getItem(SKEY);
    if (s) root.className = "asst " + s;
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
    if (b) ask(b.textContent.trim());
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen()) close(); });
})();
