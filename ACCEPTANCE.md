# 作品集信息架构 + 验收标准（ACCEPTANCE.md）

> 版本：v1.0 · 状态：待 lead-dev / tester 落地与验收
> 文档负责人：产品经理（product-manager）　| 协作：lead-dev（实现）、tester（验收）、art-designer（视觉）
> 对应规格：spec.md §3.2（作品集页）、§4（信息架构）、§7（技术约束）；DESIGN.md §2.3（作品卡片）、§2.4（标签）
> 前置事实：**用户真实作品共 4 类**（见 §1），当前 data.js / main.js 的「web / app / visual」占位模型**需按本文件升级**为 4 类真实分类（见 §5）。

---

## 0. 文档目的与范围

- 定义作品集（portfolio.html）的**信息架构**：4 类真实作品如何分类、排序、筛选、在首页精选。
- 定义每类卡片的**统一字段与分类专属字段**（title / desc / tags / year / link，以及原型 iframe、AIGC 视频、游戏 iframe 所需的字段）。
- 定义**站内交互要求**：原型 iframe 嵌入、AIGC 视频站内播放、网页游戏 iframe 可玩。
- 给出**验收 Checklist**，供 tester 逐条勾选，作为 t4 的验收依据。
- 说明当前实现的**改造点**（§5），供 lead-dev 落地真实数据时对齐。

> 素材红线不变：本站仍**禁止自创美术 / 无版权来源素材**（spec §8）。AIGC 视频、游戏画面、原型界面为用户**本人作品**，属站点内容，可在 assets/ATTRIBUTIONS.md 标注「作者提供 · 本人原创」；第三方素材一律按 spec §8 记录来源与许可。

---

## 1. 作品集信息架构（Portfolio IA）

### 1.1 分类总览（4 类）

| 分类 id（tags 值） | 分类名（筛选按钮） | 标签着色（推荐，见 §5.3） | 站内交互类型 | 典型作品 |
| --- | --- | --- | --- | --- |
| `data` | 数据分析 | `tag--cyan` | 外链（新窗口报告 / 作品集页） | 绝区零 · X 日语区海外社区监测决策报告 |
| `prototype` | 产品原型 | `tag--cyan` | **iframe 嵌入**（可操作原型）+ 下载页外链 | ProListing 记账流程原型 V4、离线记账安卓 App |
| `aigc` | AIGC | `tag--magenta` | **video 站内播放**（本地 mp4） | 硬币.mp4、荔枝的组会日.mp4 |
| `game` | 网页游戏 | `tag--magenta` | **iframe 嵌入**（可直接游玩） | 果宝特攻 · 水果机甲肉鸽、班尼特 · 炎光试炼 |

> 筛选按钮顺序：**全部 → 数据分析 → 产品原型 → AIGC → 网页游戏**（与上表一致，直观对应能力类型）。

### 1.2 每类定义与真实作品

#### ① 数据分析（`data`）
- **定义**：用数据洞察支撑决策的报告 / 可视化 / 调研类产出，体现「数据分析者 · AI 工具使用者 · 工具链搭建者」定位。
- **真实作品**：
  - **绝区零 2.7 · X 日语区海外社区监测**
    - 一句话：对《绝区零》2.7 版本在 X 日语区做系统性内容生态监测，定位投放机会、量化商单效率，为运营决策提供数据支撑。
    - 核心结论（卡片摘要有代表性）：内容生态高度集中于头部创作者（前 0.6% 贡献 73.8% 热度）、内容依赖插画（44.8%）存在结构风险；视频类二创呈「低供给、高需求」机会（浏览 19.3% vs 帖数 4.8%）；商单互动率仅 0.3%、远低于非商单 5.1%。
    - 外链：https://xiaolu-fzu.github.io/portfolio/
    - 建议年份：2025
- **交互**：卡片外链到线上报告页（新窗口 target=_blank）。

#### ② 产品原型（`prototype`）
- **定义**：从需求到可交互原型的落地过程，覆盖流程原型、移动端 App、下载分发页。
- **真实作品**：
  - **ProListing · 记一笔流程原型 V4**（理念：逾期标红 + 延期 + 历史永久）——原型页，**iframe 可操作**。
    - 外链/嵌入地址：https://xiaolu-fzu.github.io/prolist-prototype/
  - **ProListIng · 离线记账计划应用**（理念：一部手机装下全部生活）——安卓 App 下载页，外链。
    - 外链：https://xiaolu-fzu.github.io/prolist-download/
- **交互**：原型页用 iframe 直接嵌入可操作；App 下载页用外链（新窗口）。可提供「在线试用原型 ↗」「获取 App ↗」两个动作。

#### ③ AIGC（`aigc`）
- **定义**：用 AI 生成工具创作的音视频 / 视觉作品，体现「AI 工具使用者」的创作实验。
- **真实作品**（本地文件，站内播放）：
  - **《硬币》** —— 本地路径 AIGC/硬币.mp4
  - **《荔枝的组会日》** —— 本地路径 AIGC/荔枝的组会日.mp4
- **交互**：用 <video controls> 站内播放。两条视频可作为「视频系列」在同一个作品详情内或各自独立卡片呈现。

#### ④ 网页游戏（`game`）
- **定义**：纯前端（HTML/JS）制作的网页小游戏，体现交互与实现能力，且**访客可直接游玩**。
- **真实作品**：
  - **果宝特攻 · 水果机甲肉鸽**——水果机甲肉鸽类，WASD/方向键移动、自动射击、1–4 切武器、升级三选一，支持触屏。
    - 嵌入/外链地址：https://xiaolu-fzu.github.io/fruit-rogue/
  - **班尼特 · 炎光试炼**——进入即玩的 Boss 挑战小游戏。
    - 嵌入/外链地址：https://xiaolu-fzu.github.io/bennett-boss-rush/
- **交互**：iframe 直接嵌入可玩（保证高度不滚动，见 §3.3）。

### 1.3 排序策略

作品网格默认排序优先级（自上而下）：

1. **精选置顶**：`featured: true` 的作品排最前（用于突出最能代表能力、最贴近雇主关注的作品）。
2. **年限倒序**：其余按 `year` 降序（最新在前）。
3. **同年按类别优先级**：数据分析 → 产品原型 → 网页游戏 → AIGC。
4. **类别内**：按标题（拼音/字母序）稳定排序。

> 说明：跨类不混排，筛选后仅显示该类的作品；「全部」视图按上述规则跨类混排并置顶精选。

### 1.4 筛选（Filter）

- 筛选按钮：全部 / 数据分析 / 产品原型 / AIGC / 网页游戏（纯前端 JS，无刷新）。
- 逻辑：按钮 data-filter 与作品 `tags` 数组匹配；无匹配时显示友好空态（现有 worksEmpty 文案可复用）。
- 语义：按钮 aria-pressed 反映选中态；当前选中高亮（复用 .filter-btn.is-active）。

### 1.5 首页精选（Featured）

- 首页「精选作品」区展示 4 个**跨类代表作**（每类挑 1 个），以体现能力广度为优先：
  - 数据分析 → 绝区零监测报告
  - 产品原型 → ProListing 流程原型
  - AIGC → 《硬币》或《荔枝的组会日》
  - 网页游戏 → 果宝特攻 · 水果机甲肉鸽
- 每张精选卡点击跳转至 portfolio.html（并可用锚点定位到该类，作为增强项）。

---

## 2. 卡片字段（Card Schema）

### 2.1 统一字段（数据层 WORKS[] 每项）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | string | 是 | 作品标题 |
| `desc` | string | 是 | 一句话描述（含关键结论 / 玩法 / 效果，便于访客快速理解） |
| `tags` | string[] | 是 | 分类 id 数组：["data"] / ["prototype"] / ["aigc"] / ["game"]（可多标签） |
| `year` | number | 是 | 年份（用于排序与展示） |
| `hue` | number | 是 | 缩略图纯 CSS 渐变色相 0–360（几何占位，识别度） |
| `link` | string | 否 | 可选外链（报告 / App 下载页 / 演示），无则留空字符串 |
| `featured` | boolean | 否 | 是否首页精选 / 列表置顶（默认 false） |

### 2.2 分类专属字段（区分交互形态）

| 分类 | 额外字段 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | 无（用 link） | — | 外链报告页 |
| `prototype` | `prototypeUrl` | 原型类必填 | iframe 嵌入的可操作原型地址（https://xiaolu-fzu.github.io/prolist-prototype/） |
|   | `platform` | 否 | 形态备注：Web 原型 / 安卓 App / 下载页 |
|   | `downloadUrl` | 否 | 若为 App，提供下载/详情外链 |
| `aigc` | `videoSrc` | 是 | 本地 mp4 相对路径（AIGC/硬币.mp4） |
|   | `videoTitle` | 否 | 视频小标题（区分多视频） |
|   | `videoPoster` | 否 | 可选封面（缺省用 CSS 几何占位） |
| `game` | `gameUrl` | 是 | iframe 嵌入的游戏地址（https://xiaolu-fzu.github.io/fruit-rogue/） |
|   | `controls` | 否 | 玩法操作说明（WASD / 方向键 / 1–4 / 触屏） |
|   | `genre` | 否 | 类型：肉鸽 / Boss 挑战 等 |

> 可让单条作品携带多个分类专属字段（如「原型 + 下载页」），由 lead-dev 在渲染时按字段决定展示哪种交互组件。

### 2.3 缩略图与视觉

- 默认沿用纯 CSS 几何缩略图（`--work-hue`）+ 辉光（DESIGN §2.3 / §3.2）。
- AIGC 类可用视频首帧或 `videoPoster`；原型/游戏类可用 CSS 占位（避免加载外部截图，遵守素材红线）。
- 若作者提供真实作品截图（属本人原创），可在 assets/ATTRIBUTIONS.md 标注「作者提供」后引入（spec §8.1-A / §3.2）。

---

## 3. 站内交互要求

### 3.1 原型 iframe 嵌入
- 作品详情面板内嵌：` <iframe src="<prototypeUrl>" title="<作品标题>" loading="lazy" width="100%" height="640" style="border:0;border-radius:var(--radius-md);background:var(--surface)"></iframe> `。
- 移动端高度可缩至约 520px，避免嵌套滚动混乱；scrolling 由原型页自身控制。
- 提供**备用动作**：详情内同时给「在新窗口打开 ↗」（target=_blank rel=noopener）以防 iframe 失效。
- 原型 iframe 属跨域加载（GitHub Pages https），在本地 file:// 下作为外部资源加载是允许的；若个别环境受限，则回退到外链新窗口打开。

### 3.2 AIGC 视频站内播放
- 用本地 <video controls preload=metadata playsinline>，src=<videoSrc>。
- **file:// 兼容**：<video controls> 播放本地 mp4 不依赖 fetch/CORS，双击本地页面可正常播放，需提供 controls 供用户主动触发。
- 多视频：同一详情内多个 <video> 各自带标题；或一个作品一个视频卡片。
- 无障碍/可读性：为视频提供标题文字（aria-label / figcaption）；如需字幕可加 track（可选）。
- 体积：AIGC mp4 可能较大，卡片用 CSS 几何占位 + preload=metadata，点击展开后再播放（避免首屏大资源阻塞）。

### 3.3 游戏 iframe 嵌入
- 详情内嵌：` <iframe src="<gameUrl>" title="<作品标题>" loading="lazy" width="100%" height="560" style="border:0;border-radius:var(--radius-md);background:var(--surface)"></iframe> `。
- **保证整屏可玩**：高度设至少 560px（避免内嵌滚动条）；scrolling=no；可按 aspect-ratio 16/9 响应式。
- 可选放宽 allow=fullscreen; gamepad; autoplay；allowfullscreen 供全屏。
- 提供「在新窗口打开 ↗」备用动作（target=_blank rel=noopener）。
- 玩法说明写进 desc / controls（如「WASD 移动 · 自动射击 · 1–4 切武器 · 升级三选一」），降低上手门槛。

### 3.4 通用交互
- 卡片可点击：整卡为 <a>，点击展开详情（复用现有 openDetail），支持键盘（Enter）操作。
- 详情面板：展开后 scrollIntoView，提供「收起 / 返回列表」；支持 Esc 关闭（与移动端抽屉一致）。
- 空态：筛选无匹配时显示友好提示（复用 worksEmpty）。
- prefers-reduced-motion：动效全降级（DESIGN §1.9）。
- 焦点与对比：所有可点击项 focus-visible 轮廓（淡青色）；正文不使用发光。

---

## 4. 验收 Checklist（Acceptance）

> 供 tester 逐条勾选（t4）。每一项均为**可操作验证**，不满足即视为缺陷。

### 4.1 页面与导航
- [ ] 4 个页面齐全：index / portfolio / about / contact，导航全站统一（首页/作品集/关于/联系），当前页正确高亮。
- [ ] 移动端汉堡抽屉可开合、Esc 关闭、遮罩点击关闭，逻辑与桌面一致。
- [ ] Footer 有重复主导航 + 素材署名链接 + 版权（含年份自动更新）。
- [ ] 首页可跳转到作品集，精选卡点击能进入作品集；无死链。

### 4.2 作品数据与分类
- [ ] 作品集数据来自 assets/js/data.js 的 WORKS（真实作品已替换占位），title/desc/tags/year/link 齐全。
- [ ] 分类为 4 类：数据分析(data)/产品原型(prototype)/AIGC(aigc)/网页游戏(game)，筛选按钮含全部 + 4 类。
- [ ] 卡片展示：缩略图(CSS 几何/色相) + 标题 + 标签 + 年份，样式与 DESIGN §2.3 一致。
- [ ] 排序符合 §1.3（精选置顶 → 年限倒序 → 同年按类优先级）。
- [ ] 筛选：点击分类只显示该类作品；无匹配时显示友好空态；选中按钮高亮且 aria-pressed 正确。

### 4.3 站内可操作播放
- [ ] **AIGC**：视频可在本站内播放（<video controls>），不依赖外网；双击本地页面可播。
- [ ] **原型**：点击卡片后详情内嵌原型 iframe，原型可交互/可滚动，且有「新窗口打开 ↗」备用。
- [ ] **游戏**：点击卡片后详情内嵌游戏 iframe，**可直接进入游玩**（无嵌套滚动条遮挡），且有「新窗口打开 ↗」备用。
- [ ] 各分类的「新窗口打开 ↗」外链均真实可用且带 rel=noopener。

### 4.4 响应式
- [ ] 三档断点正常（手机 <768px / 平板 768–1024px / 桌面 >1024px），作品网格 1/2/3 列。
- [ ] 原型 / 游戏 iframe 与 video 在手机端不溢出视口，高度合理可操作。
- [ ] 导航在移动端切换为抽屉；桌面端为固定/吸顶导航。

### 4.5 素材红线与署名
- [ ] 无任何自创 / 无版权来源的美术素材（spec §8.2）。
- [ ] 引用外部素材（如有）均在 assets/ATTRIBUTIONS.md 记录：名称 / 来源 / 来源 URL / 许可。
- [ ] 用户本人作品（AIGC 视频、游戏、原型界面、报告）标注为「作者提供 · 本人原创」。
- [ ] 不虚构作品截图或人物照片（除用户本人提供并授权的素材）。

### 4.6 技术约束
- [ ] 纯静态 HTML+CSS+JS，无框架 / 无构建 / 无包管理器。
- [ ] 双击 index.html 可本地打开（file://），浏览器控制台无 fetch 外部 JSON 的相关报错。
- [ ] CSS 均以普通 link 引入（无 import / path alias），4 个 CSS 花括号平衡。
- [ ] JS 用原生无依赖，node --check 通过；页面以 </html> 正常结束。
- [ ] 字体 / 视频 / iframe 为渐进增强，离线或资源缺失时回落系统栈 / 提供备用外链，不破坏可读性。

### 4.7 无障碍与动效
- [ ] 语义化标签与标题层级正确（header/nav/main/section/article/footer，h1→h2→h3）。
- [ ] 所有可点击项 focus-visible 可见轮廓（淡青色）。
- [ ] 动效尊重 prefers-reduced-motion（过渡/动画关闭），无自动播放/闪烁大动画。
- [ ] 视频 / iframe 有 title 或 aria-label；图片/占位有 role=img + aria-label。

---

## 5. 与现有实现的差距（供 lead-dev 落地）

> 当前 data.js / main.js 仍为「web / app / visual」占位模型，以下为接入 4 类真实作品所需的改造。

### 5.1 data.js 模型演进
- 将 WORK_CATEGORIES 更新为：["全部", "数据分析", "产品原型", "AIGC", "网页游戏"]。
- 将 WORK_TAG_MAP 更新为：{ "全部":"", "数据分析":"data", "产品原型":"prototype", "AIGC":"aigc", "网页游戏":"game" }。
- WORKS[] 每项增加 featured，并按 §2.2 为对应分类补充 prototypeUrl / videoSrc / gameUrl / controls 等专属字段（原 tags 值改为 data/prototype/aigc/game）。

### 5.2 main.js 渲染 / 筛选扩展
- tagLabel 与 categoryClass 需新增 data/prototype/aigc/game 的映射（推荐色见 §1.1）。
- openDetail 需按分类/字段渲染不同交互：videoSrc→<video> 播放；gameUrl→游戏 iframe；prototypeUrl→原型 iframe；仅 link→外链按钮。保留「新窗口打开 ↗」备用。
- 若移除了「web/app/visual」，请同步清理相关样式与文案（空态 / 页头说明 / 卡片占位文案）。

### 5.3 组件样式扩展（可选，需 DESIGN 确认）
- 为 4 类给出可区分的标签色。最低改动：复用现有 --cyan（数据/原型）与 --magenta（AIGC/游戏）。若需更强区分，可新增 tag--purple（--neon-purple）与 tag--green（--neon-green），并同步 DESIGN.md §2.4。
- 详情面板新增 iframe / video 容器样式，按 aspect-ratio 响应式，移动端全宽。

---

## 6. 附件：真实作品清单

| 分类 | 作品 | 一句话 | 站内交互 | 地址/路径 |
| --- | --- | --- | --- | --- |
| 数据分析 | 绝区零 2.7 · X 日语区海外社区监测 | 内容生态监测 → 投放机会与商单效率量化 → 运营决策支撑 | 外链报告 | https://xiaolu-fzu.github.io/portfolio/ |
| 产品原型 | ProListing · 记一笔流程原型 V4 | 逾期标红 + 延期 + 历史永久，可操作原型 | iframe 原型 | https://xiaolu-fzu.github.io/prolist-prototype/ |
| 产品原型 | ProListIng · 离线记账计划应用 | 一部手机装下全部生活，安卓离线记账 | 外链下载页 | https://xiaolu-fzu.github.io/prolist-download/ |
| AIGC | 硬币 | AI 生成视频 | video 播放 | AIGC/硬币.mp4 |
| AIGC | 荔枝的组会日 | AI 生成视频 | video 播放 | AIGC/荔枝的组会日.mp4 |
| 网页游戏 | 果宝特攻 · 水果机甲肉鸽 | 水果机甲肉鸽，WASD 移动 / 自动射击 / 升级三选一 | iframe 可玩 | https://xiaolu-fzu.github.io/fruit-rogue/ |
| 网页游戏 | 班尼特 · 炎光试炼 | 进入即玩的 Boss 挑战 | iframe 可玩 | https://xiaolu-fzu.github.io/bennett-boss-rush/ |

---

> 本文档由 **product-manager** 编写，作为 lead-dev 接入真实作品、tester 验收的权威依据。站点定位语可参考样本「数据分析者 · AI 工具使用者 · 工具链搭建者」；具体文案（介绍/技能/联系方式）仍由 lead-dev 按 spec 落实。
