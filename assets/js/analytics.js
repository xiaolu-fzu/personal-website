/* 个人网站访问统计（匿名上报）
 * 事件：page_view（打开网站）/ project_open（点开项目卡）/ link_click（点项目卡上的按钮）
 * 来源：src = "user"（访客自己点的）/ "xiaohui"（小洄帮忙打开的）
 *
 * 来源怎么判 —— 不看小洄的代码，只看浏览器事实：
 *   ① 访客真手点 → 点击事件 isTrusted === true
 *   ② 小洄是脚本，它用 el.click() 代替人点开卡片、用 window.open() 打开文档 → isTrusted === false
 *   站点里只有小洄会程序化点击（main.js 里没有 .click()、也没有 window.open），所以「非可信」即小洄。
 *   判定窗口 TRUST_MS = 6000ms：小洄点开卡片后约 1.9 秒才 window.open，这段内的动作算它的。
 * 匿名：只用一个本地随机 ID 去重，不写 cookie、不采集 IP。
 *
 * 想排除自己的访问？在这台设备上打开一次：
 *     https://xiaolu-fzu.github.io/personal-website/?self=1
 * 该设备的地址会被后端登记为「不统计」，之后这台设备（以及同一网络下的设备）都不计数。
 * 想恢复统计：把 1 改成 0 打开一次（本机标记清除；后端名单需要另行移除）。
 */
(function () {
  var ENDPOINT = "https://xiaolu-stats.pages.dev";   // 统计后端（Cloudflare Pages）
  var VKEY = "lxh_visitor";
  var NKEY = "lxh_nostats";
  var TRUST_MS = 6000;   // 小洄「先程序化点击卡片、约 1.9 秒后再 window.open」——给这段动作一点归属窗口

  function beacon(payload) {
    if (!ENDPOINT) return;
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT + "/api/track", new Blob([body], { type: "text/plain;charset=UTF-8" }));
      } else {
        fetch(ENDPOINT + "/api/track", {
          method: "POST", body: body, keepalive: true,
          headers: { "Content-Type": "text/plain" }
        });
      }
    } catch (e) { /* 统计失败绝不影响访客 */ }
  }

  // ---- 开关：?self=1 让自己不再被统计（同时把本机地址登记到后端）----
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get("self") === "1") {
      localStorage.setItem(NKEY, "1");
      beacon({ type: "exclude_self", note: "本机（?self=1）" });   // 后端登记该地址
    }
    if (qs.get("self") === "0") localStorage.removeItem(NKEY);
  } catch (e) {}

  var muted = false;
  try { muted = localStorage.getItem(NKEY) === "1"; } catch (e) {}

  if (muted) {                                  // 本机已排除：不再上报
    window.DSH_TRACK = { pageView: function () {}, projectOpen: function () {}, linkClick: function () {} };
    return;
  }

  var vid;
  try {
    vid = localStorage.getItem(VKEY);
    if (!vid) {
      vid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(VKEY, vid);
    }
  } catch (e) { vid = "anon"; }

  function send(payload) {
    payload.visitor = vid;
    payload.path = location.pathname;
    try { payload.ref = document.referrer ? document.referrer.slice(0, 120) : ""; } catch (e) {}
    beacon(payload);
  }

  /* ---------- 来源判定 ---------- */

  var lastClick = null;        // { trusted, at }：给点击类事件用，取一次就清
  var lastProgrammaticAt = 0;  // 最近一次「脚本点击」的时刻：给 window.open 用，不被消费

  // 捕获阶段监听：比 main.js 的事件委托更早拿到同一个点击事件
  document.addEventListener("click", function (e) {
    var trusted = e.isTrusted !== false;
    lastClick = { trusted: trusted, at: Date.now() };
    // 访客一动手，之前那次脚本动作就作废；否则记下这次脚本动作
    lastProgrammaticAt = trusted ? 0 : Date.now();
  }, true);

  // 取一次就清掉，避免「上一次点击」被算到后面的事件上
  function srcOfClick() {
    var c = lastClick;
    lastClick = null;
    if (c && c.trusted === false && Date.now() - c.at <= TRUST_MS) return "xiaohui";
    return "user";
  }

  // 只看不取：小洄「点开卡片」会产生 project_open（已把 lastClick 消费掉），
  // 紧接着才是 window.open —— 所以这里必须用不被消费的 lastProgrammaticAt。
  function recentUntrusted() {
    return lastProgrammaticAt > 0 && Date.now() - lastProgrammaticAt <= TRUST_MS;
  }

  /* ---------- 小洄开文档：走的是 window.open，不产生任何点击事件 ---------- */

  function findAnchor(href) {
    var list = document.querySelectorAll("a[href]");
    for (var i = 0; i < list.length; i++) {
      if (list[i].getAttribute("href") === href || list[i].href === href) return list[i];
    }
    return null;
  }

  // 这条链接属于哪个项目、是哪种按钮：先看展开的详情面板，再看 window.WORKS 兜底
  function linkMeta(href) {
    var a = findAnchor(href);
    var panel = document.getElementById("workDetail");
    var project = "";
    if (a && a.closest) {
      var box = a.closest(".work-detail");
      if (box) project = box.getAttribute("data-project") || "";
    }
    if (!project && panel && panel.classList.contains("is-open")) project = panel.getAttribute("data-project") || "";
    if (!project && window.WORKS) {
      var keys = ["link", "reqDocUrl", "devDocUrl", "docUrl", "prdUrl", "prdDocUrl", "caseUrl", "downloadUrl", "gameUrl", "teardownDocUrl", "videoSrc", "prototypeUrl", "report"];
      for (var i = 0; i < window.WORKS.length && !project; i++) {
        for (var k = 0; k < keys.length; k++) {
          if (window.WORKS[i][keys[k]] && window.WORKS[i][keys[k]] === href) { project = window.WORKS[i].title; break; }
        }
      }
    }
    return { project: project, linkType: (a && a.getAttribute("data-link-type")) || "（小洄打开）" };
  }

  var nativeOpen = window.open;
  if (typeof nativeOpen === "function") {
    window.open = function (url, name, features) {
      try {
        var u = String(url || "");
        if (/^https?:/i.test(u) && recentUntrusted()) {
          var meta = linkMeta(u);
          send({ type: "link_click", project: meta.project, linkType: meta.linkType, href: u, src: "xiaohui" });
        }
      } catch (e) { /* 统计失败绝不影响打开链接 */ }
      return nativeOpen.apply(window, arguments);
    };
  }

  window.DSH_TRACK = {
    pageView: function () { send({ type: "page_view", src: "user" }); },
    projectOpen: function (project, category) { send({ type: "project_open", project: project, category: category, src: srcOfClick() }); },
    linkClick: function (project, linkType, href, src) { send({ type: "link_click", project: project, linkType: linkType, href: href, src: src || srcOfClick() }); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { window.DSH_TRACK.pageView(); });
  } else {
    window.DSH_TRACK.pageView();
  }
})();
