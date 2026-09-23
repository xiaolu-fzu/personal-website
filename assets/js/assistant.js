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
  var SUGGEST_API = "https://xiaolu-stats.pages.dev/api/suggest";
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
    if (w.protoUrl) o.push({ label: "在线原型", href: w.protoUrl });
    if (w.gameUrl) o.push({ label: "在线游玩", href: w.gameUrl });
    if (w.reqDocUrl) o.push({ label: "需求文档", href: w.reqDocUrl });
    if (w.devDocUrl) o.push({ label: "开发文档", href: w.devDocUrl });
    if (w.docUrl) o.push({ label: "需求/开发文档", href: w.docUrl });
    if (w.prdUrl) o.push({ label: "PRD 展示页", href: w.prdUrl });
    if (w.prdDocUrl) o.push({ label: "PRD 文档", href: w.prdDocUrl });
    if (w.teardownDocUrl) o.push({ label: "拆解全文", href: w.teardownDocUrl });   // 产品拆解：飞书全文
    return o;
  }
  var CAT_NAME = { prototype: "原型和产品", agent: "AI项目", data: "数据分析", industry: "行业研究", aigc: "AIGC", game: "网页游戏", tool: "工具/开发" };
  var CORPUS = works.map(function (w, i) {
    return { index: i, title: w.title, category: w.category, text: cardText(w), links: cardLinks(w), value: w.value || "" };
  });

  /* 全量项目总览：任何问题都随请求带上，避免「一共多少项目」这类统计问题被检索子集带偏 */
  function overviewText() {
    var byCat = {};
    CORPUS.forEach(function (c) { byCat[c.category] = (byCat[c.category] || 0) + 1; });
    var dist = Object.keys(byCat).map(function (k) { return (CAT_NAME[k] || k) + " " + byCat[k] + " 个"; }).join("、");
    var list = CORPUS.map(function (c, i) { return (i + 1) + "." + c.title + "（" + (CAT_NAME[c.category] || c.category) + "）"; }).join("；");
    var docs = (window.DOCS || []).length;
    return "【项目总览】本站作品集共 " + CORPUS.length + " 个项目；分类分布：" + dist + "。" +
      (docs ? "文档库另收录 " + docs + " 份需求/开发文档。" : "") +
      "\n完整清单：" + list;
  }

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
  function openProject(name, deferClose) {
    var hit = findCard(name);
    if (!hit) return false;
    var w = works[hit.index];
    if (!deferClose) close();
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
  /* 按链接反查它属于哪张项目卡（用于「先跳到项目、再打开链接」） */
  function locateProjectByHref(href) {
    var hit = null;
    CORPUS.forEach(function (c) {
      if (hit) return;
      c.links.forEach(function (l) { if (l.href === href) hit = c; });
    });
    return hit;
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
  function filterCategory(cat, deferClose) {
    var map = { data: "数据分析", industry: "行业研究", prototype: "原型和产品", agent: "AI项目", aigc: "AIGC", game: "网页游戏", tool: "工具/开发" };
    var id = null;
    Object.keys(map).forEach(function (k) { if (cat === k || cat === map[k]) id = k; });
    var btn = id && document.querySelector('[data-filter="' + id + '"]');
    if (!btn) return false;
    if (!deferClose) close(); btn.click();
    setTimeout(function () {
      var g = document.getElementById("worksGrid");
      if (g) g.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return true;
  }
  function locate(where, deferClose) {
    var t = String(where || "").toLowerCase(), el = null;
    if (/top|顶部|首页|开头/.test(t)) el = document.getElementById("home") || document.body;
    else if (/关于|about/.test(t)) el = document.getElementById("about");
    else if (/文档|docs/.test(t)) el = document.getElementById("portfolio");
    else el = document.getElementById("portfolio");
    if (!deferClose) close();
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); if (/文档/.test(t)) { var b = document.querySelector('[data-filter="docs"]'); if (b) b.click(); } return true; }
    return false;
  }
  /* 执行动作并返回「做了什么」——循环时要把这个结果回灌给模型 */
  function runAction(a) {
    if (!a || !a.type) return { ok: false, msg: "没有可执行的动作" };
    try {
      if (a.type === "open_project") {
        var ok = openProject(a.target || "", true);
        return { ok: !!ok, msg: ok ? "已打开项目卡「" + a.target + "」（分类已切换、卡片已高亮并展开详情）" : "没有找到项目「" + a.target + "」" };
      }
      if (a.type === "open_link") {
        var href = a.target || "";
        var owner = locateProjectByHref(href);
        if (owner) {
          // ① 先"走到"这张项目卡：切分类 → 滚动 → 高亮 → 展开详情（弹窗先不关，让用户看得见过程）
          openProject(owner.title, true);
          // ② 再滑到详情区里**那一行资源卡**（也就是即将点开的按钮那一行），让用户先看到按钮
          setTimeout(function () {
            var row = null;
            var rows = document.querySelectorAll(".work-detail__links--cards .link-card");
            Array.prototype.forEach.call(rows, function (el) {
              var a = el.querySelector("a.btn");
              if (a && a.getAttribute("href") === href) row = el;
            });
            if (row) {
              row.scrollIntoView({ behavior: "smooth", block: "center" });
              row.classList.add("is-flash");
              setTimeout(function () { row.classList.remove("is-flash"); }, 2400);
            }
          }, 1000);
          // ③ 看清楚按钮之后再打开链接
          setTimeout(function () { openUrl(href); }, 1900);
          return { ok: true, msg: "已定位到项目卡「" + owner.title + "」并滑到对应按钮，随后打开该链接" };
        }
        var ok2 = openUrl(href);
        return { ok: !!ok2, msg: ok2 ? "已在浏览器新标签页打开该链接" : "该链接不在项目资料里，出于安全已拒绝打开" };
      }
      if (a.type === "filter") {
        var ok3 = filterCategory(a.target || "", true);
        return { ok: !!ok3, msg: ok3 ? "已把作品集切换到「" + a.target + "」分类" : "没有这个分类" };
      }
      if (a.type === "locate") {
        var ok4 = locate(a.target || "", true);
        return { ok: !!ok4, msg: ok4 ? "页面已定位到对应区块" : "没找到该区块" };
      }
      if (a.type === "close") { close(); return { ok: true, msg: "已关闭对话弹窗" }; }
    } catch (e) { return { ok: false, msg: "执行出错：" + String(e).slice(0, 60) }; }
    return { ok: false, msg: "未知动作类型" };
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
      /* 预测追问：放在输入框上方（不再塞进回答气泡里），且只显示最新一组 */
      '<div class="asst__askbar" id="asstAskbar" hidden>' +
        '<div class="asst__followups" id="asstFollowups"></div>' +
      '</div>' +
      '<div class="asst__chips" id="asstChips">' +
        '<button type="button">有据是什么</button>' +
        '<button type="button">打开三体的产品链接</button>' +
        '<button type="button">看看你的产品拆解</button>' +
        '<button type="button">你有什么推荐的内容吗</button>' +
      '</div>' +
      '<form class="asst__form" id="asstForm">' +
        '<input id="asstInput" type="text" placeholder="和小洄说点什么…" autocomplete="off">' +
        '<button type="submit" id="asstSend">发送</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var fab = root.querySelector("#asstFab"), tip = root.querySelector("#asstTip");

  /* 气泡精确定位：小洄可拖动，所以用 fab 的实际位置来算。
     ★ 气泡宽度改为「自适应内容」（不再是和小洄同宽），因此这里做的是
     「按小洄中心线水平居中」——宽度交给文字撑开，只算 left。 */
  function syncTip() {
    if (!tip || !fab || !root) return;
    var r = fab.getBoundingClientRect();
    var rr = root.getBoundingClientRect();
    if (!r.width || !rr.width) return;
    tip.style.width = "auto";
    var tw = tip.offsetWidth;
    if (!tw) return;
    tip.style.left = Math.round((rr.width - tw) / 2) + "px";
    tip.style.right = "auto";
    tip.style.bottom = Math.round(rr.bottom - r.top + 10) + "px";
    tip.style.top = "auto";
  }
  var panel = root.querySelector("#asstPanel"), log = root.querySelector("#asstLog");
  var form = root.querySelector("#asstForm"), input = root.querySelector("#asstInput");
  var chips = root.querySelector("#asstChips"), head = root.querySelector("#asstHead");
  var state = { busy: false, hist: [], lastHits: [], currentProject: "", opened: [], seq: 0, lastBotReply: "", substReply: "" };
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
    return el;                                  // 返回元素，便于稍后异步追加追问
  }
  /* 兜底模板：仍严格保持三条职能（命令请求 / 点名另一个真实项目 / 当前项目细节） */
  function templateFollowups() {
    var cur = (state.currentProject || "").split("·")[0].split("（")[0].trim();
    var curCard = null;
    (window.WORKS || []).forEach(function (w) { if (!curCard && cur && w.title.indexOf(cur) >= 0) curCard = w; });
    var curName = curCard ? String(curCard.title).split("·")[0].trim() : "这个项目";
    // 挑一个与本项目不同的项目来点名 —— **随机挑**（原来固定取第一个，导致永远是「绝区零」）
    var pool = (window.WORKS || []).filter(function (w) {
      return w && w.title && (!curCard || w.category !== curCard.category) &&
        (!cur || String(w.title).indexOf(cur) < 0);
    });
    var other = pool.length ? String(pool[Math.floor(Math.random() * pool.length)].title).split("·")[0].trim() : null;
    var out = ["打开 " + curName + " 的需求文档"];
    if (other) out.push("那 " + other + " 呢？");
    out.push(curName + " 最难的地方是什么");
    return out.slice(0, 3);
  }

  /* 预测追问区（输入框上方）：只保留最新一组；点击后立刻清空，避免旧问题残留 */
  var fuBar = root.querySelector("#asstAskbar"), fuBox = root.querySelector("#asstFollowups");
  function clearFollowups() { try { fuBox.innerHTML = ""; fuBar.hidden = true; } catch (e) {} }
  function showFollowups(list) {
    clearFollowups();
    if (!list || !list.length) return;
    list.forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = q;
      b.addEventListener("click", function () { ask(q); });     // 点击 → 提问（ask 开头会清空本区）
      fuBox.appendChild(b);
    });
    fuBar.hidden = false;
  }

  /* 旧版：把追问追加到气泡下方（保留函数但不再使用） */
  function attachFollowups(el, list) {
    if (!el || !list || !list.length) return;
    var body = el.querySelector(".asst__msgbody");
    if (!body || body.querySelector(".asst__followups")) return;
    var fu = document.createElement("div");
    fu.className = "asst__followups";
    list.forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = q;
      b.addEventListener("click", function () { ask(q); });
      fu.appendChild(b);
    });
    body.appendChild(fu);
    log.scrollTop = log.scrollHeight;
  }

  /* 新手推荐问题只在「还没聊过」时出现；一旦开始对话，就让位给回答下方的「你可能还想问」 */
  function updateChips() {
    try { chips.hidden = state.hist.length > 0; } catch (e) {}
  }
  function greet() {
    bubble("bot", "你好。我是您的人工助手小洄，请问您有什么想了解的吗？<br><span class=\"asst__hint\">可以问我某个项目是怎么做的，也可以直接说「有据是什么」「打开三体的产品链接」「看看你的产品拆解」「你有什么推荐的内容吗」。</span>");
  }
  function showHist() {
    log.innerHTML = "";
    updateChips();
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
    // 离线降级也用三方向模板（原来那三条"你还有别的项目吗"式老问题已废弃）
    return { html: html, actions: actions.slice(0, 3), followups: templateFollowups() };
  }
  // 纯前端能直接执行的命令（离线也灵）
  function quickCommand(q) {
    var t = String(q).trim();
    if (/^(关掉|关闭|收起|不用了|退下)$/.test(t)) return { reply: "好，那我先退到右下角，随时叫我。", actions: [], run: { type: "close" } };
    var m = t.match(/(?:打开|帮我打开|看看|访问)\s*(https?:\/\/[^\s]+)/i);
    if (/(文档库)/.test(t)) return { reply: '好，带你去文档库。', actions: [], run: { type: 'locate', target: 'docs' } };
    if (/(关于我|你是谁|介绍下自己)/.test(t)) return { reply: '好，带你去「关于我」看看。', actions: [], run: { type: 'locate', target: 'about' } };
    if (/(回到顶部|去顶部|回首页)/.test(t)) return { reply: '好，回到顶部。', actions: [], run: { type: 'locate', target: 'top' } };
    if (/(作品集|所有项目|全部项目)/.test(t)) return { reply: '好，带你去作品集。', actions: [], run: { type: 'locate', target: 'portfolio' } };
    if (m) return { reply: "这就帮你打开。", actions: [{ label: "打开链接", action: { type: "open_link", target: m[1] } }] };
    return null;
  }

  function ask(q) {
    if (state.busy) return;
    clearFollowups();          // 提问即清掉上一轮的预测问题
    state.seq++;               // 轮次号：避免上一轮的异步追问结果回来后又渲染一次

    // 纯前端能直接执行的命令（离线也灵）
    var quick = quickCommand(q);
    if (quick && quick.run) {
      state.busy = true;
      bubble("me", esc(q)); state.hist.push({ who: "me", html: esc(q) }); updateChips();
      setTimeout(function () {
        state.busy = false;
        bubble("bot", quick.reply); state.hist.push({ who: "bot", html: quick.reply }); save(); updateChips();
        runAction(quick.run);
      }, 240);
      return;
    }

    state.busy = true;
    bubble("me", esc(q));
    state.hist.push({ who: "me", html: esc(q) });
    updateChips();

    var thinking = document.createElement("div");
    thinking.className = "asst__msg asst__msg--bot";
    thinking.innerHTML = '<img class="asst__msgpic" src="' + AVATAR + '" alt=""><div class="asst__msgbody"><div class="asst__bubble asst__typing">小洄正在翻项目库…</div></div>';
    log.appendChild(thinking); log.scrollTop = log.scrollHeight;

    /* ═══════ Agent 循环：反复调用 LLM，每次把「上一步执行结果」回灌，直到模型说完成 ═══════
       最多 MAX_STEPS 轮；只有用户明确下指令时才允许执行动作；不明确则只回一次话。 */
    var MAX_STEPS = 3;
    // 执行意图：既包含强命令（打开/跳转/带我去），也包含委婉请求（能看看吗/给我看/我想看）——
    // 用户用「能看看吗」也是明确想要，不能因为措辞客气就不执行。
    var EXPLICIT = /(打开|帮我打开|跳转|带我去|带我去看|去看看|看看|看一下|能看|可以看|我想看|我要看|给我看|展示|访问|点开|进入|切到|切换到|关掉|关闭|收起)/;
    var steps = [];                 // 执行过的动作与结果（给用户看，也回灌给模型）
    // 显式携带「当前讨论的项目」，指代词（它/这个/上面说的）才有确定所指
    var sysMemo = [];
    if (state.currentProject) sysMemo.push("【系统】本次对话当前讨论的项目是：「" + state.currentProject + "」。用户说「它 / 这个 / 上面说的」都指这个项目，不要反问用户指哪个。");
    if (state.opened && state.opened.length) sysMemo.push("【系统】本次会话已经打开过：" + state.opened.slice(-4).join("；") + "。若用户再要同一份，可直接说明已打开过。");
    var loopHist = (sysMemo.length
      ? [{ role: "user", content: sysMemo.join("\n") }]
      : []).concat(state.hist.slice(-12).map(function (m) {
      return { role: m.who === "me" ? "user" : "assistant", content: String(m.html || "").replace(/<br[^>]*>/gi, " ").replace(/<[^>]+>/g, "").slice(0, 500) };
    }));
    var lastReply = "", lastFollowups = [], lastHits = [];

    function actionLabel(a) {
      if (a.type === "open_project") return "打开项目卡「" + (a.target || "") + "」";
      if (a.type === "open_link") return "打开链接";
      if (a.type === "filter") return "切换到分类「" + (a.target || "") + "」";
      if (a.type === "locate") return "定位到「" + (a.target || "") + "」";
      if (a.type === "close") return "关闭弹窗";
      return a.type;
    }

    function finish() {
      state.busy = false;
      thinking.remove();
      var html = esc(lastReply || "（小洄没有说出内容）").replace(/\n/g, "<br>");
      // 步骤只包含真正执行过的动作（label 来自 actionLabel），不含追问与回答
      if (steps.length) {
        html += '</div><div class="asst__steps"><b>我做了这些：</b>' + steps.map(function (st, i) {
          return '<span class="asst__step' + (st.ok ? "" : " is-fail") + '">' + (i + 1) + ". " + esc(st.label) + " —— " + esc(st.msg) + "</span>";
        }).join("") + "</div>";
      }
      // 动作按钮：不再自动罗列「相关项目」（会和下方追问重复）；
      // 只保留模型自己给出的那个动作，并且只在没有追问时才展示，避免两排胶囊撞车。
      var actions = [];
      var pending = state.pendingAction;
      state.pendingAction = null;
      if (pending && pending.type && !lastFollowups.length) {
        actions.push({
          label: pending.type === "open_link" ? "打开这个链接"
            : pending.type === "open_project" ? "打开「" + String(pending.target || "").slice(0, 12) + "」"
            : pending.type === "filter" ? "切换到「" + (pending.target || "") + "」"
            : "执行",
          action: pending
        });
      }
      // 追问去重：已经执行过的项目不要再出现在「你可能还想问」里
      var doneNames = steps.map(function (s) { return s.target || ""; }).filter(Boolean);
      lastFollowups = lastFollowups.filter(function (q) {
        return !doneNames.some(function (n) { return n && q.indexOf(n.slice(0, 6)) >= 0 && /打开|看看|查看/.test(q); });
      }).slice(0, 3);
      var el = bubble("bot", html, actions, []);        // 先渲染回答（不等待追问）
      state.hist.push({ who: "bot", html: html, actions: actions.slice(0, 3), followups: [] });
      state.lastBotReply = String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").slice(0, 1200);
      // ★ 追问生成要基于「有实质内容的回答」：像「好的，我先把卡片打开」这类动作确认语没有素材，
      //   拿它去生成追问必然是空的。所以只记录长度 > 80 字的回答供追问使用。
      if (state.lastBotReply.replace(/\s/g, "").length > 80) state.substReply = state.lastBotReply;
      save(); updateChips();

      // 追问：单独一次调用专门生成（贴住本次回答的具体内容），拿到后渲染到输入框上方
      var mySeq = state.seq;
      var doneTitles = steps.map(function (s) { return s.target || ""; }).filter(Boolean);
      fetch(SUGGEST_API, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          question: q,
          reply: ((lastReply && lastReply.replace(/\s/g, "").length > 80) ? lastReply : (state.substReply || lastReply || "")).slice(0, 1200),
          projects: lastHits.slice(0, 4).map(function (c) { return { title: c.title, value: c.value, links: c.links }; }),
          allProjects: (window.WORKS || []).map(function (w) { return w.title; }),
          currentProject: state.currentProject || ""
        })
      }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
        .catch(function () {
          // 失败重试一次（追问接口偶尔会超时/空返回）
          return fetch(SUGGEST_API, {
            method: "POST", headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
              question: q,
              reply: ((lastReply && lastReply.replace(/\s/g, "").length > 80) ? lastReply : (state.substReply || lastReply || "")).slice(0, 1200),
              projects: lastHits.slice(0, 4).map(function (c) { return { title: c.title, value: c.value, links: c.links }; }),
              // 全部项目名：让第 2 条追问能"点名另一个真实的项目"
              allProjects: (window.WORKS || []).map(function (w) { return w.title; }),
              currentProject: state.currentProject || ""
            })
          }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); });
        })
        .then(function (j) {
          if (mySeq !== state.seq) return;      // 已经进入下一轮，丢弃过期结果
          var list = (j.followups || []).filter(function (x) {
            // 过滤掉已经执行过的项目相关的追问
            return !doneTitles.some(function (n) { return n && x.indexOf(n.slice(0, 6)) >= 0 && /打开|看看|查看/.test(x); });
          }).slice(0, 3);
          // 模型没给 / 全被去重掉 → 用一组通用兜底，保证「下一轮」永远点得动
          if (!list.length) {
            list = templateFollowups();
          }
          if (!list.length) return;
          showFollowups(list);
          var last = state.hist[state.hist.length - 1];
          if (last && last.who === "bot") { last.followups = list; save(); }
        })
        .catch(function () {
          if (mySeq !== state.seq) return;
          showFollowups(templateFollowups());   // 连重试都失败 → 用三方向模板兜底，不留空白
        });
    }

    function step(n) {
      var isFirst = n === 0;
      var question = isFirst ? q
        : "（系统消息）你上一轮要求执行的动作已经执行完毕，结果见上一条对话。若任务已全部完成，请把 action 设为 null 并简短总结你做了哪几步；若还需继续，请给出下一个动作。";
      // 指代识别：把单个「它/他/她」也算进来（之前只认「它们」，导致「它是给谁用的」接不住）
      var ANAPHORA = /(它|他|她|这两个|那两个|这两|那两|它们|他们|这几个|这些|那些|上面|刚才|前面|之前|这个项目|那个项目|还有呢|继续)/;
      var hits = (ANAPHORA.test(question) && state.lastHits && state.lastHits.length) ? state.lastHits : search(question, 5);
      if (isFirst) {
        state.lastHits = hits; lastHits = hits;
        // ★ 项目锁定的更新规则（此前每轮无条件覆盖，导致聊几轮后项目就跑了）：
        //   · 含指代词（它/这个项目/那…）→ **沿用**当前项目，绝不因检索结果而改变；
        //   · 问题里**明确提到某个项目名** → 切换到那个项目；
        //   · 其余（新话题）→ 才按检索结果更新。
        try {
          var titles = (window.WORKS || []).map(function (w) { return w.title; });
          var named = null;
          titles.forEach(function (t) {
            if (!named && t && q.indexOf(String(t).split("·")[0].trim().slice(0, 6)) >= 0) named = t;
          });
          if (named) state.currentProject = named;                        // 明确点名 → 切过去
          else if (!state.currentProject && hits.length) state.currentProject = hits[0].title;  // 首次才按检索设定
          // 其余情况一律**保持不变**：宁可沿用当前项目，也不要被检索结果带跑
          // （用户要换项目时会说项目名，那时上面的 named 分支会接住）
        } catch (e) {}
      }
      var ctx = overviewText() + "\n\n【与本次问题最相关的项目详情】\n" + hits.map(function (c) {
        return "【" + c.title + "】分类:" + c.category + "｜卖点:" + c.value + "｜简介:" + c.text.slice(0, 420) +
          "｜可用链接:" + c.links.map(function (l) { return l.label + " " + l.href; }).join(" ; ");
      }).join("\n");

      var ctrl = ("AbortController" in window) ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
      fetch(API, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          question: question, context: ctx, projects: hits.map(function (c) { return c.title; }),
          history: loopHist.slice(-8), step: n, maxSteps: MAX_STEPS,
          currentProject: state.currentProject || "",   // ★ 当前讨论的项目（后端最高优先级采用）
          // 交给后端做查询改写（还原「它/这个」）；若还没记录到，就从对话历史里取最后一条助手消息兜底
          lastReply: state.lastBotReply || (function () {
            for (var i = state.hist.length - 1; i >= 0; i--) {
              if (state.hist[i] && state.hist[i].who === "bot" && state.hist[i].html) {
                return String(state.hist[i].html).replace(/<br[^>]*>/gi, " ").replace(/<[^>]+>/g, "").slice(0, 1200);
              }
            }
            return "";
          })()
        }),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
        .then(function (j) {
          clearTimeout(timer);
          if (isFirst) { lastReply = j.reply || ""; lastFollowups = (j.followups || []).slice(0, 3); }
          else if (j.reply && j.reply.trim() && steps.length) { lastReply = j.reply; }   // 后续轮有总结就更新
          if (j.followups && j.followups.length) lastFollowups = j.followups.slice(0, 3);

          // 没有动作 → 任务结束
          if (!j.action || !j.action.type) { finish(); return; }
          // 用户没明确下指令 → 只回答不执行；但把动作挂起，作为可点按钮（保持行为边界，又给用户选择）
          if (!EXPLICIT.test(q)) { state.pendingAction = j.action; finish(); return; }

          var res = runAction(j.action);
          steps.push({ label: actionLabel(j.action), msg: res.msg, ok: res.ok, target: j.action.target || "" });
          if (res.ok) { try { state.opened.push(actionLabel(j.action)); } catch (e) {} }
          loopHist.push({ role: "assistant", content: "（我调用了工具 " + j.action.type + "，目标：" + (j.action.target || "-") + "）" + (j.reply || "") });
          loopHist.push({ role: "user", content: "【系统反馈】" + res.msg + "。如果任务已完成，请把 action 设为 null 并简短总结；否则给出下一个动作。" });

          if (n + 1 >= MAX_STEPS) { finish(); return; }   // 达到步数上限
          step(n + 1);                                     // ← 继续循环：带着结果再问一次模型
        })
        .catch(function () {
          clearTimeout(timer);
          if (isFirst && !steps.length) {
            var fb = fallbackAnswer(q);
            state.busy = false; thinking.remove();
            bubble("bot", fb.html, fb.actions, fb.followups);
            state.hist.push({ who: "bot", html: fb.html, actions: fb.actions, followups: fb.followups });
            save(); updateChips();
          } else { finish(); }
        });
    }

    step(0);
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
      if (moved) { try { localStorage.setItem(PKEY, JSON.stringify({ l: root.style.left, t: root.style.top })); } catch (e) {} syncTip(); }
      else { lastToggle = Date.now(); isOpen() ? close() : open(); }     // 没拖动 = 点击 = 开关
    });
    try {
      var p = JSON.parse(localStorage.getItem(PKEY) || "null");
      if (p && p.l) { root.style.left = p.l; root.style.top = p.t; root.style.right = "auto"; root.style.bottom = "auto"; }
    } catch (e) {}
  })();

  // 位置恢复后 + 窗口尺寸变化 / 图片加载完成时，重新对齐气泡
  syncTip();
  window.addEventListener("resize", syncTip);
  window.addEventListener("load", syncTip);
  setTimeout(syncTip, 120);
  setTimeout(syncTip, 600);

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
  root.querySelector("#asstClear").addEventListener("click", function () { state.hist = []; state.currentProject = ""; save(); showHist(); updateChips(); clearFollowups(); });
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
