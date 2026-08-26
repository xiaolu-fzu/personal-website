# 测试验收报告（t4 · 测试工程师 tester）

> 验收对象：E:/dev/project/project2/个人网站（个人网站）
> 验收依据：个人网站/ACCEPTANCE.md §4 + 任务 t4 的 6 项重点
> 结论：**整体通过（PASS）**，无阻断性问题；修复 6 处小问题；1 项已知待办（非 bug）。

## 验收方法
- 静态审查：index/portfolio/about/contact 4 页 + assets/js/data.js + assets/js/main.js + 4 个 CSS + assets/ATTRIBUTIONS.md
- node --check 两个 JS 均通过；4 个 CSS 花括号平衡
- 运行时加载 data.js 验证数据模型（11 作品 / 6 筛选按钮 / 5 类配比 / featured=5）
- 外链 HEAD 请求全部 HTTP 200
- 资源存在性核对（CSS/JS/AIGC 两视频/硬币 2 张故事截图/ATTRIBUTIONS 均存在；微信二维码缺失）
- 注：iframe（原型/游戏）实际加载与视频实际播放需真实浏览器渲染；本报告基于「有效标记 + 外链 200 + 本地资源存在」的静态验证。

## 逐项结果

### 4.1 页面与导航 — PASS
- 4 页面齐全；导航全站统一（顶栏 + footer 副本）；当前页高亮（JS data-page → is-active）。PASS
- 移动端抽屉开合 / Esc / 遮罩点击 / 抽屉链接点击均绑定。PASS
- Footer：重复主导航 + 素材署名链接 + 版权（#year 由 JS 自动更新为当年）。PASS
- 首页可跳作品集；5 张精选卡均链接 portfolio.html，无死链。PASS

### 4.2 作品数据与分类 — PASS（注：实现为 5 类 11 项目）
- WORKS 来自 data.js；title/desc/tags/year/hue 齐全，无缺失必填字段。PASS
- 分类：data/prototype/aigc/game/tool 共 5 类；筛选按钮「全部 + 5 类」= 6 个。PASS
  - ⚠️ ACCEPTANCE.md §4.2 原写「4 类」，任务与实现为「5 类（含 tool）」；属规格演进，建议同步更新 ACCEPTANCE.md。
- 卡片：CSS 几何缩略图（--work-hue）+ 标题 + 标签 + 年份。PASS
- 排序：精选置顶 → 年限倒序 → 同年按类优先级（data0/prototype1/game2/aigc3/tool4）→ 标题。PASS
- 筛选：点击仅显示该类；无匹配显示友好空态（worksEmpty）；选中高亮 + aria-pressed。PASS

### 4.3 站内可操作播放 — PASS
- AIGC：两视频 <video controls preload=metadata playsinline> 本地 mp4，file:// 可播、不依赖外网。PASS
- 原型：详情内嵌 prototypeUrl iframe（高 640），含「在新窗口打开原型 ↗」备用。PASS（URL 200）
- 游戏：详情内嵌 gameUrl iframe（高 560、无嵌套滚动、allowfullscreen），含「在新窗口打开游戏 ↗」备用。PASS（URL 200）
- 「新窗口打开 ↗」外链均 rel=noopener，HEAD 均 200。PASS
- 硬币详情含折叠「故事原文」显示 2 张截图；LocalMiniDrama（tool）走外链 GitHub。PASS

### 4.4 响应式 — PASS
- 断点：桌面 >1024（3 列）/ 平板 ≤1024（2 列）/ 手机 ≤767（1 列）；works-grid 1/2/3 列。PASS
- iframe/video 宽 100%；手机端 iframe 高 520px，不溢出视口。PASS
- 导航：手机隐藏 nav__list、显示抽屉；桌面 nav 为 sticky 吸顶。PASS

### 4.5 素材红线与署名 — PASS
- 无自创/无版权美术：CSS 无 @import、无外链图片 url()；背景/缩略图/头像全为纯 CSS 几何渐变。PASS
- 外部素材仅 Google Fonts（Space Grotesk / JetBrains Mono，SIL OFL 1.1），ATTRIBUTIONS.md 记录来源 URL 与许可。PASS
- 用户本人作品（AIGC 视频 / 原型 / 游戏 / 报告 / 工具 Mod）均标注「作者提供 · 本人原创」；硬币故事截图标注「同学原创脑洞 · 作者提供」。PASS
- 未虚构作品截图或人物照片。PASS

### 4.6 技术约束 — PASS
- 纯静态 HTML+CSS+JS，无框架/构建/包管理器。PASS
- 双击 index.html 可本地打开（file://）；无 fetch 外部 JSON（数据走内联 <script>）。PASS
- CSS 以普通 link 引入，无 import/path alias；4 个 CSS 花括号平衡。PASS
- JS 原生无依赖，node --check 通过；4 页面均以 </html> 结束。PASS
- 字体/视频/iframe 渐进增强：字体离线回落系统栈；iframe/视频有「新窗口/本地播放」兜底。PASS

### 4.7 无障碍与动效 — PASS（含修复）
- 语义标签与标题层级：全站 header/nav/main/section/article/footer；修复 portfolio 页 h1→h3 跳级（新增 sr-only h2「作品列表」→ h1→h2→h3）。PASS
- 所有可点击项 focus-visible 淡青色轮廓（全局 :focus-visible + .nav__toggle:focus-visible）。PASS
- prefers-reduced-motion：CSS 关闭全部 transition/animation；并修复 JS 详情展开 scrollIntoView 在 reduced-motion 下不再平滑滚动。PASS
- video/iframe 有 title/aria-label：iframe 均有 title；已为 video 补 aria-label。PASS

## 已修复问题（6 处）
1. main.js — video 元素补 aria-label（4.7）
2. main.js — 详情展开 scrollIntoView 改为按 prefers-reduced-motion 降级为 auto（4.7）
3. main.js — 主外链按钮文案按有无 results 动态「查看完整报告 / 查看项目」（tool 类 GitHub 不再误标「查看完整报告」）（4.3 文案）
4. data.js — LocalMiniDrama 补 featured:true，与首页「5 大代表作」一致（4.2）
5. 4 个 HTML — 素材署名链接 assets/attributions.md → assets/ATTRIBUTIONS.md，匹配实际文件名（避免大小写敏感托管 404）
6. portfolio.html — 新增 sr-only h2，修正标题层级跳级（4.7）

## 已知待办（非 bug，标记待用户提供）
- 微信二维码图片缺失：contact.html 已用 onerror 优雅降级为「素材待放」文字；ATTRIBUTIONS.md §5/§6 已登记，待把 b59c1e61ff6b95d2141f0a3c2406dc5b.jpg 放入「微信二维码/」目录。非缺陷。

## 建议（小项，非阻断）
- 5 个 data 作品 link 均指向同一报告 URL（xiaolu-fzu.github.io/portfolio/），可视为不同报告提供细分外链。
- ACCEPTANCE.md §1.1/§4.2 仍写「4 类」，建议同步为 5 类模型。
- Google Fonts / 外链 iframe 需网络；离线时回落系统栈 / 走备用外链，可接受。
