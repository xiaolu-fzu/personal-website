const fs = require("fs");
(async () => {
  const r = await fetch("https://api.github.com/repos/xiaolu-fzu/portfolio/contents/作品集.html", { headers: { "User-Agent": "dsh", accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(30000) });
  const j = await r.json();
  const html = Buffer.from(j.content.replace(/\n/g,""), "base64").toString("utf8");
  fs.writeFileSync("E:/dev/project/project2/个人网站/_zuopin.html", html, "utf8");
  console.log("作品集.html len:", html.length);
  // 提取文本结构（卡片/项目）
  const text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi," ").replace(/<[^>]+>/g,"\n").replace(/&nbsp;/g," ").replace(/\n{2,}/g,"\n").trim();
  console.log("=== 正文片段 ===");
  console.log(text.slice(0, 1500));
})();