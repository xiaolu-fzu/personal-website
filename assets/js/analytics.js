/* 个人网站访问统计（匿名上报）
 * 事件：page_view（打开网站）/ project_open（点开项目卡）/ link_click（点项目卡上的按钮）
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

  window.DSH_TRACK = {
    pageView: function () { send({ type: "page_view" }); },
    projectOpen: function (project, category) { send({ type: "project_open", project: project, category: category }); },
    linkClick: function (project, linkType, href) { send({ type: "link_click", project: project, linkType: linkType, href: href }); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { window.DSH_TRACK.pageView(); });
  } else {
    window.DSH_TRACK.pageView();
  }
})();
