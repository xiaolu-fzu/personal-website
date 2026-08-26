# 素材署名（ATTRIBUTIONS.md）

> 规范依据：spec.md §8 素材原则、DESIGN.md §3.6。
> 本站点遵循「优先纯 CSS + 几何」，**未使用任何外部图片素材**。以下列出所有可能被引用的外部资源及其授权。

## 1. 字体（外部资源）

| 名称 | 来源 | 来源 URL | 许可 | 用途 |
| --- | --- | --- | --- | --- |
| Space Grotesk | Google Fonts | https://fonts.google.com/specimen/Space+Grotesk | SIL OFL 1.1 | 标题 / 展示字体（--font-display） |
| JetBrains Mono | Google Fonts | https://fonts.google.com/specimen/JetBrains+Mono | SIL OFL 1.1 | 代码 / 标签 / 时间戳 / 数据（--font-mono） |

- 字体为**渐进增强**：通过 link 标签引入（https），file:// 下可加载；离线时自动回落系统栈（ui-monospace / monospace 与系统 sans-serif），不影响可读性。
- SIL OFL 1.1 许可允许自由商用、修改与再分发。

## 2. 图标（本站内联 SVG，非外部素材）

- 导航汉堡 / 关闭按钮、联系页社交（邮箱 / GitHub / LinkedIn）图标均为**内联 SVG 基础几何线条**（line / rect / circle / path），属于「纯几何 + CSS」方案（spec §8.1-B），**非受版权保护的品牌 Logo 图形临摹**。
- 社交链接为占位（yourname），正式替换时请使用真实的本人账号；如需品牌图标，请核对各品牌及图标库许可（见 spec §8.1 / DESIGN.md §3.4）。

## 3. 图片 / 纹理 / 头像占位（纯 CSS）

本站点**未引入任何外部图片、纹理或头像**：

- 背景网格 / 扫描线 / 光晕：纯 CSS（linear-gradient / radial-gradient / repeating-linear-gradient / mask-image）。
- 作品缩略图：纯 CSS 几何渐变占位（通过 --work-hue 色相变量区分）。
- 若未来引入真实作品截图 / 头像，须在本文件登记：**素材名称、来源、来源 URL、许可**，否则不得引用（spec §8 红线）。

## 4. 用户本人作品（作者提供 · 本人原创）

下列内容为站点作者本人产出，属站点内容（ACCEPTANCE.md §0 红线说明），标注「作者提供 · 本人原创」，无第三方版权素材：

| 分类 | 作品 | 形态 | 说明 |
| --- | --- | --- | --- |
| 数据分析 | 绝区零 2.7 · X 日语区海外社区监测 等 5 项 | 外链报告 / 站内关键结论表 | 作者提供 · 本人原创 |
| 产品原型 | ProListing · 离线记账 | 原型 iframe + App / 下载页 | 作者提供 · 本人原创 |
| AIGC | 《硬币》《荔枝的组会日》 | 本地视频站内播放 | 作者本人 AI 生成作品 · 本人原创 |
| 网页游戏 | 果宝特攻 · 水果机甲肉鸽、班尼特 · 炎光试炼 | iframe 在线游玩 | 作者开发 · 本人原创 |
| 工具/开发 | LocalMiniDrama · 本地短剧 Mod | 外链 GitHub | 作者开发 · 本人原创 |
| AIGC | 硬币 · 故事原文截图 | 站内图片（折叠区） | 同学原创脑洞 · 作者提供 |

- 数据报告外链（均为作者本人 github.io 主页）：https://xiaolu-fzu.github.io/portfolio/
- 原型 / App / 下载页：https://xiaolu-fzu.github.io/prolist-prototype/ 、 https://xiaolu-fzu.github.io/prolist-download/
- 游戏：https://xiaolu-fzu.github.io/fruit-rogue/ 、 https://xiaolu-fzu.github.io/bennett-boss-rush/
- AIGC 本地视频：assets/../AIGC/硬币.mp4 、 AIGC/荔枝的组会日.mp4（站内 <video> 播放）

> 素材红线核对（spec §8.2）：
> - [x] 未使用受版权保护的图片、字体、图标、Logo 图形。
> - [x] 未虚构作品截图或人物照片（卡面均为纯 CSS 几何占位）。
> - [x] 未纳入任何非授权「原创插画」类美术素材（全部纯 CSS 几何，符合 spec §8.1-B）。
> - [x] 用户本人作品（AIGC 视频 / 原型 / 游戏 / 报告）已在此标注「作者提供 · 本人原创」。

## 5. 站点主人与联系方式（作者提供）

| 项 | 值 |
| --- | --- |
| 姓名 | 李嘉豪 |
| 邮箱 | 18672786151@163.com |
| GitHub | xiaolu-fzu（https://github.com/xiaolu-fzu） |
| 微信二维码 | 微信二维码/b59c1e61ff6b95d2141f0a3c2406dc5b.jpg（素材待放入该目录后显示） |

## 6. 待补充 / 特别说明

- [ ] 微信二维码图片文件：请将 b59c1e61ff6b95d2141f0a3c2406dc5b.jpg 放入「微信二维码/」目录（当前未提供，页面已做优雅降级为文字说明）。
- 作品集当前为 5 类 11 项目：数据分析5 / 产品原型1 / AIGC2 / 网页游戏2 / 工具开发1（LocalMiniDrama · 本地短剧 Mod，作者开发 · 本人原创）。
- 「硬币」作品的故事原文为同学创作，截图（AIGC/196af08be41760cb4ce6c9eee1271449.png、AIGC/6c462adef4cc2bae1431fed71ffe56a8.png）由作者提供，标注「同学原创脑洞 · 作者提供」。
