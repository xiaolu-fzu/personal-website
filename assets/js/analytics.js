/* 个人网站访问统计（匿名上报）
 * 事件：page_view（打开网站）/ project_open（点开项目卡）/ link_click（点项目卡上的按钮）
 * 匿名：只用一个本地随机 ID 去重，不写 cookie、不采集 IP。
 *
 * 不想让自己的访问被统计？在这台设备上打开一次：
 *     https://xiaolu-fzu.github.io/personal-website/?self=1
 * 之后这台设备就不再上报了（想恢复：把 1 改成 0）。
 */
(function () {
  var ENDPOINT = "https://xiaolu-stats.pages.dev";   // 统计后端（Cloudflare Pages）
  var VKEY = "lxh_visitor";
  var NKEY = "lxh_nostats";

  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get("self") === "1") localStorage.setItem(NKEY, "1");
    if (qs.get("self") === "0") localStorage.removeItem(NKEY);
  } catch (e) {}

  var muted = false;
  try { muted = localStorage.getItem(NKEY) === "1"; } catch (e) {}

  if (muted) {                                  // 本机（或主动关闭）不上报
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
    if (!ENDPOINT) return;
    payload.visitor = vid;
    payload.path = location.pathname;
    try { payload.ref = document.referrer ? document.referrer.slice(0, 120) : ""; } catch (e) {}
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
