const fs = require("fs");
const h = fs.readFileSync("E:/dev/project/project2/个人网站/_zuopin.html","utf8");
const t = h.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi," ").replace(/<[^>]+>/g,"\n").replace(/&nbsp;/g," ").replace(/\n{2,}/g,"\n").trim();
// 从"项目经历"开始打印
const i = t.indexOf("项目经历");
console.log(t.slice(i, i+4200));
