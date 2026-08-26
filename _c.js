const fs = require("fs");
(async () => {
  // CLAUDE.md（作者给AI的说明，最能反映真实逻辑）
  const c = await fetch("https://api.github.com/repos/xiaolu-fzu/portfolio/contents/CLAUDE.md", { headers: { "User-Agent": "dsh", accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(20000) });
  const cj = await c.json();
  const claude = Buffer.from(cj.content.replace(/\n/g,""), "base64").toString("utf8");
  fs.writeFileSync("E:/dev/project/project2/个人网站/_CLAUDE.md", claude, "utf8");
  console.log("===== CLAUDE.md =====");
  console.log(claude);
})();