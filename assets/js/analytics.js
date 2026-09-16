/* 个人网站访问统计（匿名上报）
 * 事件类型：page_view（打开网站）/ project_open（点开项目卡）/ link_click（点项目卡上的按钮）
 * 匿名：只用一个本地随机 ID 去重，不写 cookie、不收集 IP。
 * 部署后端后，把下面的 ENDPOINT 换成你的后端域名即可（例如 https://xiaolu-stats.pages.dev）。
 */
(function () {
  var ENDPOINT = "";                       // ← 部署后填写后端域名，留空则不上报
  var VKEY = "lxh_visitor";
  var vid;

  try {
    vid = localStorage.getItem(VKEY);
    if (!vid) {
      vid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(VKEY, vid);
    }
  } catch (e) { vid = "anon"; }

  function send(payload) {
    if (!ENDPOINT) return;                 // 未配置后端：静默跳过
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
