const fs = require("fs");
(async () => {
  // 仓库文件列表
  const r = await fetch("https://api.github.com/repos/xiaolu-fzu/portfolio/contents/", { headers: { "User-Agent": "dsh", accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(25000) });
  const items = await r.json();
  console.log("=== portfolio 仓库根 ===");
  (items||[]).forEach(i => console.log((i.type==="dir"?"[DIR] ":"[FILE] ")+i.name+" size="+(i.size||0)));
  // 抓 index.html
  const r2 = await fetch("https://api.github.com/repos/xiaolu-fzu/portfolio/contents/index.html", { headers: { "User-Agent": "dsh", accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(30000) });
  const j = await r2.json();
  const html = Buffer.from(j.content.replace(/\n/g,""), "base64").toString("utf8");
  fs.writeFileSync("E:/dev/project/project2/个人网站/_portfolio_src.html", html, "utf8");
  console.log("index.html len:", html.length);
})();