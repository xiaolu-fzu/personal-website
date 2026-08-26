# 视觉设计规范与素材风格（DESIGN.md）

> 版本：v1.1 · 状态：已实现
> ⚠️ v1.1 变更：视觉方向已由「暗色霓虹 / 赛博」正式改为「**暖琥珀 · 编辑体**」。设计令牌由 `--neon-cyan`/`--glow-cyan-*` 等改名为 `--accent`/`--glow*`，辉光统一改琥珀系；展示字体用 Georgia 衬线；正文走系统无衬线栈，等宽用 JetBrains Mono。下方彩色/辉光/字体小节以实际 `assets/css/variables.css` 为准。
> 文档负责人：美术设计师（art-designer）　| 审核：lead-dev / tester
> 对应规格：spec.md §6 视觉方向 + §8 素材原则
> 前置原则：本站**禁止自创美术/照片/图标**。所有视觉元素只允许以下两类来源（spec §8.1）：
> - **A. CC0 / 宽松开源授权素材**（记录来源 URL 与许可）
> - **B. 纯几何 + CSS**（渐变、阴影、边框、径向/线性渐变构造，不依赖图片文件）
>
> 本文档整体遵循 **推荐方案：默认采用「纯几何 + CSS」**，可最大程度规避授权风险且与赛博风格天然契合。

---

## 0. 目录（与 spec §4 保持一致）

最终 CSS 按 spec §7.3 允许拆分，但必须可用普通 `<link>` 直接引用（无 import / alias），并可在 file:// 下双击打开。

字体、配色令牌 → `assets/css/variables.css`
基础排版/重置 → `assets/css/base.css`
组件样式     → `assets/css/components.css`
页面专属     → `assets/css/pages/`（可合并为 pages.css）
交互/筛选    → `assets/js/main.js`
素材/署名     → `assets/ATTRIBUTIONS.md`

本文档定义的**令牌与组件规范是 variables.css / components.css 的权威来源**，实现时应逐条对齐。

---

## 1. 设计令牌（Design Tokens）—— 写入 `assets/css/variables.css`

> 所有颜色/圆角/辉光均以 CSS 变量集中管理，便于全站统一与后期调整。以下「变量名 = 变量值」。

### 1.1 颜色 —— 色板（Color Palette）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#0a0a0f` | **主背景**（近黑深蓝，spec §6.1） |
| `--bg-gradient` | `radial-gradient(...)` | 背景微弱渐变（见 §1.2） |
| `--surface` | `#12121a` | 卡片 / 表面（第 1 级） |
| `--surface-2` | `#16161f` | 卡片 hover / 嵌套表面（第 2 级） |
| `--surface-3` | `#1c1c28` | 更亮表面（可选，用于输入框/高亮块） |
| `--text` | `#eaeaf0` | **正文主色**（近白，spec §6.1） |
| `--text-secondary` | `#9a9ab0` | 次级文本 / 描述 |
| `--text-muted` | `#6b6b85` | 弱化文本 / 时间戳 / 占位 |
| `--neon-cyan` | `#00e5ff` | **主霓虹（青色）**，文字/高亮/CTA |
| `--neon-magenta` | `#ff2ee0` | **辅霓虹（洋红）**，点缀/强调 |
| `--neon-purple` | `#8a2be2` | 可选点缀（紫） |
| `--neon-green` | `#39ff14` | 可选点缀（绿，谨慎小面积用） |
| `--border` | `rgba(255,255,255,0.08)` | 基础描边 |
| `--border-strong` | `rgba(255,255,255,0.15)` | 强调描边 / hover |
| `--border-cyan` | `rgba(0,229,255,0.35)` | 霓虹描边（青色） |
| `--border-magenta` | `rgba(255,46,224,0.35)` | 霓虹描边（洋红） |

### 1.2 背景渐变（赛博氛围，纯 CSS）

主背景为「深蓝 → 暗紫」的极弱渐变，叠加噪点网格（见 §4 素材）。推荐：

```css
--bg-gradient: radial-gradient(ellipse 80% 60% at 20% 0%, rgba(0,229,255,0.05), transparent 60%),
               radial-gradient(ellipse 70% 55% at 90% 10%, rgba(138,43,226,0.08), transparent 55%),
               radial-gradient(ellipse 60% 50% at 60% 100%, rgba(255,46,224,0.04), transparent 55%),
               #0a0a0f;
```

> 用意：四角微弱霓虹晕染 + 深底，营造赛博氛围而不喧宾夺主。透明度极低（≤0.08），保证正文可读性与对比。

### 1.3 字体（Typography）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--font-display` | `'Space Grotesk', 'JetBrains Mono', ui-monospace, monospace` | 标题 / 数字 / logo（等宽+无衬线混搭） |
| `--font-body` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | 正文（系统无衬线栈，spec §6.2） |
| `--font-mono` | `'JetBrains Mono', ui-monospace, 'Cascadia Code', Consolas, monospace` | 代码 / 标签 / 时间戳 / 数据 |

> 字体授权：Space Grotesk 与 JetBrains Mono 均为 **SIL OFL 1.1**（可自由商用、可修改、可再分发）。通过 **Google Fonts** 加载（`<link>` 引入，http 协议，file:// 下仍可加载；离线时自动回落系统栈）。中文使用系统中文字体栈，**不依赖外网**。
> 字体是**渐进增强**：加载失败回落 `ui-monospace/monospace` 与系统 sans-serif，不影响可读性。

### 1.4 字号阶梯（Responsive Type Scale）

以 `clamp()` 实现响应式，基准 16px。标题用 display 字体，正文用 body 字体。

| 令牌 | 值（参考） | 用途 |
| --- | --- | --- |
| `--fs-xs` | `0.75rem` (12px) | 时间戳 / 小标签 |
| `--fs-sm` | `0.875rem` (14px) | 次级描述 / 表单辅助 |
| `--fs-base` | `1rem` (16px) | 正文 |
| `--fs-lg` | `1.125rem` (18px) | 卡片标题 / 强调 |
| `--fs-xl` | `clamp(1.4rem, 3vw, 1.75rem)` | 二级标题 h2 |
| `--fs-2xl` | `clamp(1.8rem, 4vw, 2.5rem)` | 一级标题 h1 |
| `--fs-hero` | `clamp(2.4rem, 6vw, 4rem)` | HERO 主标题 |
| `--lh-tight` | `1.15` | 标题行高 |
| `--lh-body` | `1.6` | 正文行高 |
| `--weight-regular` | `400` | 正文 |
| `--weight-medium` | `500` | 强调 |
| `--weight-bold` | `700` | 标题/CTA |

### 1.5 间距系统（Spacing Scale）

基于 **4px 基准** 的递增间距（8px 制，便于统一节奏）：

| 令牌 | 值 |
| --- | --- |
| `--space-1` | `0.25rem` (4px) |
| `--space-2` | `0.5rem` (8px) |
| `--space-3` | `0.75rem` (12px) |
| `--space-4` | `1rem` (16px) |
| `--space-5` | `1.5rem` (24px) |
| `--space-6` | `2rem` (32px) |
| `--space-8` | `3rem` (48px) |
| `--space-10` | `4rem` (64px) |
| `--space-12` | `6rem` (96px) |
| `--section-pad` | `clamp(4rem, 8vw, 7rem)` | 纵向区块间距 |

> 大区块纵向用 `--section-pad`，组件内用 `--space-2/3/4`，网格间距用 `--space-6/8`。保持「8px 倍数」节奏。

### 1.6 圆角（Border Radius）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--radius-sm` | `6px` | 标签 / 小按钮 / 输入内部 |
| `--radius-md` | `12px` | 按钮 / 输入框 / 小卡片 |
| `--radius-lg` | `20px` | 作品卡片 / 大面板 |
| `--radius-full` | `999px` | 胶囊按钮 / 标签 pill / 头像 |
| `--radius-card` | `var(--radius-lg)` | 统一卡片圆角别名 |

### 1.7 霓虹辉光规格（Neon Glow）

辉光统一用 `box-shadow` 与 `text-shadow` 实现，从「微光 → 强光」分档。

**box-shadow（元素辉光）—— 青色（默认）**

| 令牌 | 值 | 档位 |
| --- | --- | --- |
| `--glow-cyan-sm` | `0 0 8px rgba(0,229,255,0.25)` | 微光（常态标签/描边） |
| `--glow-cyan-md` | `0 0 16px rgba(0,229,255,0.35)` | 中等（按钮/卡片 hover） |
| `--glow-cyan-lg` | `0 0 28px rgba(0,229,255,0.5)` | 强光（主要 CTA hover） |
| `--glow-cyan-outer` | `0 0 0 1px rgba(0,229,255,0.4), 0 0 24px rgba(0,229,255,0.3)` | 外圈淡描边+光 |

**box-shadow（元素辉光）—— 洋红（点缀）**

| 令牌 | 值 |
| --- | --- |
| `--glow-magenta-md` | `0 0 16px rgba(255,46,224,0.35)` |
| `--glow-magenta-lg` | `0 0 28px rgba(255,46,224,0.5)` |

**text-shadow（文字发光）**

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--text-glow-cyan` | `0 0 6px rgba(0,229,255,0.6), 0 0 12px rgba(0,229,255,0.35)` | 标题/CTA 文字发光 |
| `--text-glow-magenta` | `0 0 6px rgba(255,46,224,0.6), 0 0 12px rgba(255,46,224,0.35)` | 洋红强调文字 |

> 对比度与可读性：**正文与次级文本不得使用发光**，发光仅用于标题、CTA、hover 态、装饰性霓虹元素。发光会摊薄对比度，须控制使用频率与强度（spec §6.4 动效原则）。

### 1.8 布局与容器（Layout）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--container-max` | `1200px` | 内容最大宽 |
| `--container-pad` | `clamp(1rem, 4vw, 2.5rem)` | 两侧留白 |
| `--nav-height` | `64px` | 固定导航高度 |
| `--gap-grid` | `clamp(1rem, 2.5vw, 1.5rem)` | 卡片网格间距 |
| `--z-nav` | `100` | 导航层级 |
| `--z-overlay` | `200` | 抽屉/遮罩 |
| `--maxwidth-text` | `72ch` | 正文阅读最大宽度（可读性） |

### 1.9 动效（Transitions / Motion）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--transition-fast` | `150ms ease` | 标签/小元素 |
| `--transition-base` | `250ms ease` | 按钮/链接/卡片 |
| `--transition-slow` | `400ms cubic-bezier(0.22,1,0.36,1)` | 卡片上浮/面板 |
| `--ease-out` | `cubic-bezier(0.22,1,0.36,1)` | 通用缓动 |
| `--hover-lift` | `translateY(-4px)` | 卡片 hover 上浮 |
| `--hover-lift-lg` | `translateY(-6px)` | 主要卡片/CTA hover |

> **可访问性（spec §6.4）**：所有动效包在 `@media (prefers-reduced-motion: reduce)` 中降级为无过渡（`transition: none`、`animation: none`）。不得使用自动播放/闪烁/大幅缩放的装饰动画。

---

## 2. 组件风格规范（Component Spec）—— 写入 `assets/css/components.css`

> 每个组件给出：结构要点、颜色/圆角/辉光令牌引用、hover / focus 动效。

### 2.1 导航（Navbar）

- **结构**：`<header class="nav">` 内含 `<nav>`（链接）+ 可选 logo/名字（`--font-display`）。
- **定位**：`position: sticky; top: 0`（或 fixed + `--nav-height` 占位），全站一致（spec §5）。
- **视觉**：
  - 背景：`rgba(10,10,15,0.75)` + `backdrop-filter: blur(12px)`（玻璃拟态，纯 CSS）。
  - 底边：`1px solid var(--border)`。
  - 高度：`var(--nav-height)`，左右 `var(--container-pad)` 内边距。
- **链接**：
  - 常态：`color: var(--text-secondary)`，`--fs-base`，`--font-body`，`padding: var(--space-2) var(--space-3)`，`border-radius: var(--radius-sm)`。
  - **hover**：`color: var(--text)`，文字微弱发光 `--text-glow-cyan`（可选，强度小），过渡 `--transition-base`。
  - **当前页（active）**：`color: var(--neon-cyan)` + 底部 2px 指示条（`::after` 在 `bottom: 0`，宽 0→100% 展开）或胶囊背景 `rgba(0,229,255,0.1)` + `--glow-cyan-sm`。
- **移动端（<768px）**：转为汉堡按钮 + 抽屉（`.nav-drawer`），背景 `var(--bg)`，`position: fixed; inset: 0`（或顶部滑出），含独立关闭按钮，层级 `--z-overlay`。键盘可关（Esc），遮罩可点击关闭。
- **焦点样式**：所有可点击项 `:focus-visible` 显示 `outline: 2px solid var(--neon-cyan); outline-offset: 2px`。

### 2.2 按钮（Button）

两类：**主按钮（Primary / CTA）** 与 **次按钮（Secondary / Ghost）**。

**主按钮（.btn-primary）**
- 背景：`linear-gradient(135deg, #00e5ff, #00b8e0)`（青色渐变）。
- 文字：`#071018`（深色，保证对比）`--weight-medium`。
- 圆角：`var(--radius-md)`（或 `--radius-full` 胶囊）。
- 内边距：`var(--space-3) var(--space-6)`。
- 常态辉光：`--glow-cyan-md`。
- **hover**：`--glow-cyan-lg`，`transform: translateY(-2px)`，背景渐变微调亮度，`transition: var(--transition-base)`。
- **active**：`translateY(0)`，辉光略收。

**次按钮（.btn-ghost）**
- 背景：透明或 `rgba(255,255,255,0.04)`。
- 描边：`1px solid var(--border-cyan)`。
- 文字：`var(--neon-cyan)`。
- **hover**：背景 `rgba(0,229,255,0.08)`，`--glow-cyan-sm`，`color: var(--text)`，`border-color: var(--neon-cyan)`。

**洋红点缀（.btn-accent，可选）**
- 主色为洋红渐变 `linear-gradient(135deg, #ff2ee0, #ff2a9e)`，辉光用 `--glow-magenta-md/lg`，用于「联系我」等强烈 CTA（少量使用）。

> 按钮需 `:focus-visible` 轮廓、足够文字对比（WCAG AA），大触摸目标（≥44px 高）。

### 2.3 作品卡片（Work Card）

- **结构**：`<article class="work-card">` 内含缩略图区 + 信息区（标题 + 标签 + 年份）。
- **缩略图区（`.work-card__thumb`）**：`aspect-ratio: 16/10`、`border-radius: var(--radius-sm)`、`overflow: hidden`。内含 CSS 几何占位（见 §3.2 素材方案），每件作品渲染时给不同的色相/渐变（如 `--work-hue` 变量）。
- **信息区**：
  - 标题：`--fs-lg`，`--font-display`，`color: var(--text)`。
  - 标签：复用 §2.4 组件；年份：`--fs-xs`，`color: var(--text-muted)`，`--font-mono`。
- **卡片本体**：
  - 背景：`var(--surface)`；描边 `1px solid var(--border)`。
  - 圆角：`var(--radius-card)`；内边距：`var(--space-4)`。
  - 常态辉光：无（或 `--glow-cyan-sm` 于右上角）——保持克制的静态感。
- **hover**：
  - `transform: var(--hover-lift)`（上浮 4px）。
  - 描边变亮：`border-color: var(--border-cyan)`。
  - 辉光：`--glow-cyan-md`（外部光晕）。
  - 缩略图轻微 `scale(1.04)`（仅图区，`transition: var(--transition-slow)`），标题文字加 `--text-glow-cyan`（轻微）。
  - 整体 `transition: var(--transition-slow)`。
- **链接**：整卡可点击（`<a>` 包卡片），`display: block`，`:focus-visible` 轮廓。

### 2.4 标签（Tag）

三类场景：技能标签、作品标签、筛选标签。

- **基础（.tag）**：
  - 背景：`rgba(255,255,255,0.03)`；描边：`1px solid var(--border)`。
  - 圆角：`var(--radius-full)`（胶囊）；内边距 `var(--space-1) var(--space-3)`。
  - 文字：`--fs-sm`，`--font-mono`，`color: var(--text-secondary)`。
- **技能/分类着色**：
  - **前端/技术**：字色 `var(--neon-cyan)`，描边 `var(--border-cyan)`，hover 背景 `rgba(0,229,255,0.08)` + `--glow-cyan-sm`。
  - **设计**：字色 `var(--neon-magenta)`，描边 `var(--border-magenta)`，hover 背景 `rgba(255,46,224,0.08)` + `--glow-magenta-md`。
  - **工具/其他**：中性 `var(--text-secondary)`，hover 提亮。
  - 分类色用语义化 class：`.tag--cyan` / `.tag--magenta` / `.tag--ghost`。
- **筛选标签（可交互，JS）**：`.filter-btn` 增加选中态——`aria-pressed="true"` 时背景 `neon` + 辉光 + `color: var(--bg)`；hover 用 `--glow-cyan-sm`。
- 过渡：`--transition-fast`。

### 2.5 表单（Form）

- **结构**：`<form class="contact-form">`，字段：姓名、邮箱、留言（spec §3.4）。纯前端占位，无后端（spec §6.2 无框架/无后端）。
- **输入框（.field）**：
  - 背景：`var(--surface-3)`；描边：`1px solid var(--border)`。
  - 圆角：`var(--radius-md)`；内边距：`var(--space-3) var(--space-4)`。
  - 文字：`var(--text)`，`--fs-base`；占位 `color: var(--text-muted)`。
  - 标签（label）：`--fs-sm`，`color: var(--text-secondary)`，置于输入框上方。
- **focus 态**：
  - 描边：`border-color: var(--neon-cyan)`。
  - 辉光：`--glow-cyan-md`（输入框外发光）。
  - 过渡：`--transition-base`。
- **错误/校验态（可选）**：`border-color: var(--neon-magenta)` + `--glow-magenta-md`，并提示 `role="alert"` 文案。
- **提交按钮**：复用 §2.2 主按钮。
- 宽度：表单在 `--maxwidth-text` 内容列内，字段栈式全宽（`width: 100%`），`gap: var(--space-4)`。

### 2.6 Footer

- **结构**：`<footer class="footer">`，含翻倍导航（repeat 主导航）、社交链接、版权。
- **视觉**：
  - 背景：`var(--bg)`（或 `rgba(0,0,0,0.25)`）`/`var(--surface)`，顶边 `1px solid var(--border)`，左右 `--container-pad`，上下 `--space-8`。
  - **装饰**：顶部一条极细霓虹渐变分隔线（`::before`，`height:1px`，`background: linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-magenta), transparent)`，透明度 0.5）。
- **链接**：`color: var(--text-secondary)`，hover `color: var(--neon-cyan)` + 轻微 `--text-glow-cyan`，`transition: var(--transition-fast)`。
- **社交图标**：若用图标，均需注明来源（推荐内联 SVG 几何图标或开源图标集，见 §3.4）；`aria-label` 必填。
- **版权**：`--fs-sm`，`color: var(--text-muted)`，含来源署名链接（`assets/ATTRIBUTIONS.md` 对应页面入口）。

---

## 3. 素材规划（Asset Plan）

> **总原则（spec §8）：默认纯 CSS + 几何；外部素材一律 CC0/宽松许可并记录 URL。** 下表为每一类视觉元素的具体实现方式。

### 3.1 背景网格 / 扫描线 / 电路纹理 —— **纯 CSS（推荐）**

| 元素 | 实现 | 说明 |
| --- | --- | --- |
| 赛博网格 | `repeating-linear-gradient` 或 `linear-gradient` 组合 | 像素级网格线：`background-image: linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px); background-size: 48px 48px;` |
| 透视网格（Hero） | 添加 `transform: perspective(...) rotateX(...)` 于一个网格层 | 仅装饰、低透明度，放 `.hero::before` 或独立 `<div class="grid-layer">` |
| 扫描线 | `repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 4px)` | 极弱的 CRT 质感，全屏叠加 `pointer-events:none` |
| 光晕/晕影 | `radial-gradient` | 见 §1.2 `--bg-gradient` |
| 粒子/点阵（可选） | 多个 `radial-gradient(circle, rgba(0,229,255,0.3) 0 2px, transparent 2px)` 于不同位置 | 或纯 CSS 动画走位（需 `prefers-reduced-motion` 降级） |

> 均为 `.background` / `.hero` 层的伪元素或装饰 `<div>`，`pointer-events: none`，不得覆盖交互。

### 3.2 作品缩略图 —— **纯 CSS 几何占位（推荐）**

- 每件作品用一个 CSS 几何抽象作为缩略图：不同色相的径向/线性渐变 + 圆形/菱形/网格 overlay + 辉光。
- 通过行内 `--work-hue` 变量区分：`<div class="work-card__thumb" style="--work-hue: 200">`。
- 示例（components.css）：
  ```css
  .work-card__thumb { background:
      radial-gradient(circle at 30% 30%, hsla(var(--work-hue),100%,60%,0.35), transparent 60%),
      linear-gradient(135deg, hsla(var(--work-hue),100%,60%,0.15), transparent),
      var(--surface-2);
      position: relative; }
  .work-card__thumb::after { /* 几何 overlay */
      content:""; position:absolute; inset:0;
      background: repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 12px); }
  ```
- 若作者**已有真实作品截图**：允许并入，但须在 `assets/ATTRIBUTIONS.md` 记录来源/授权（作者原创作品属站点内容，可标注「作者提供」；若如 spec §8.2 涉及第三方，须附授权 URL）。

### 3.3 头像占位 —— **纯 CSS 几何头像（推荐）**

- 用**同心圆/几何抽象**代表「人」：一个带辉光的圆形 `<div class="avatar">`（`border-radius: var(--radius-full)`），内部叠渐变、扫描线或极简几何（三角/点阵），形成赛博感 identity 而非写实照片。
- 示例：
  ```css
  .avatar { width: 160px; height: 160px; border-radius: var(--radius-full);
      background: radial-gradient(circle at 35% 30%, var(--neon-cyan), transparent 55%),
                  radial-gradient(circle at 70% 70%, var(--neon-magenta), transparent 55%),
                  var(--surface-2);
      box-shadow: var(--glow-cyan-md); position: relative; overflow: hidden; }
  .avatar::before { content:""; position:absolute; inset:18%; border-radius:50%;
      border: 1px solid var(--border-cyan); box-shadow: var(--glow-cyan-sm); }
  ```
- **用户自替换**：在 `about.html` 提供 `<img>` 替换入口的注记，替换图须用户自行提供并保证授权（spec §8.2）。

### 3.4 图标 —— **内联 SVG 几何图标（推荐）或开源图标集**

- **推荐：内联 SVGs**——仅用基础几何（line / circle / rect / path 的简单箭头、加号、外部链接、社交符号）。这些属于「纯几何」，符合 spec §8.1-B；**但不得使用受版权保护的品牌 logo 形状做临摹**。
- **或使用开源图标集**（记录来源与许可）：
  - **Lucide**（ISC 许可）：https://lucide.dev ——通用 UI/交互图标。
  - **Feather**（MIT）：https://feathericons.com ——轻量线条图标。
  - **Simple Icons**（各品牌图标）：https://simpleicons.org ——用于 GitHub / X / 社交品牌图标；须核对各品牌许可。
- **社交品牌图标授权提示**：GitHub/X/LinkedIn 等 logo 有各自品牌使用条款，Simple Icons 提供对应图标但**最终使用须遵守品牌指引**；如需稳妥，可用**文字链接**（如「GitHub ↗」）替代品牌图标。
- **ARIA**：社交与功能图标加 `aria-label`，装饰性图标 `aria-hidden="true"`。

### 3.5 可能的 CC0 / 开源外部素材来源（URL 备用）

以下为**可选用**的授权素材来源；**默认不使用**（默认纯 CSS 方案）。若确需引入，必须逐条记录到 `assets/ATTRIBUTIONS.md`。

| 来源 | URL | 许可 | 用途 |
| --- | --- | --- | --- |
| Unsplash | https://unsplash.com | Unsplash License | 摄影/背景（如需写实氛围） |
| Pexels | https://www.pexels.com | Pexels License | 摄影/背景 |
| Pixabay | https://pixabay.com | Pixabay Content License | 图片/插图 |
| Openverse | https://openverse.org | 多许可（含 CC0/CC） | CC 许可图片检索 |
| Wikimedia Commons | https://commons.wikimedia.org | 各类自由许可 | 公共领域图片 |
| Google Fonts | https://fonts.google.com | SIL OFL 1.1 | Space Grotesk / JetBrains Mono 字体 |
| Lucide Icons | https://lucide.dev | ISC | 通用 UI 图标 |
| Feather Icons | https://feathericons.com | MIT | 轻量图标 |
| Simple Icons | https://simpleicons.org | 各品牌条款 | 品牌社交图标（谨慎/核对） |
| Subtle Patterns | https://www.toptal.com/designers/subtlepatterns | 各纹理许可（需核对，多为 CC0/CC BY） | 纹理背景（不推荐，用纯 CSS） |

> **红线（spec §8.2）**：不使用受版权保护的图片、字体、图标、Logo；不虚构作品截图或人物照片；艺术家自创插画**默认不纳入**正文素材，除非取得清晰授权并记录 URL（spec §8.2 例外流程）。

### 3.6 素材署名（Attribution）

- 在仓库 `assets/ATTRIBUTIONS.md` 记录每张引用素材：**名称、来源、来源 URL、许可**（spec §8.3）。
- 页面用到外部素材时，卡片/视觉元素旁附「图片来源」小字。
- **不引用来源 URL 缺失的任何外部素材**；默认不引入外部图片（纯 CSS 方案即空表或注明「本站点未使用外部图片素材」）。

---

## 4. 响应式与可访问性要点（供实现对齐）

- **断点**（spec §7.6）：手机 <768px、平板 768–1024px、桌面 >1024px。用 `clamp()` 自适应字号/间距，用 `@media` 调整网格列数（卡片 1/2/3 列）与导航形态。
- **语义化标签**：`header/nav/main/section/article/footer`、`h1→h2→h3` 层级、`alt`、表单 `<label for>`、按钮 `<button>`。
- **对比度**：正文 `--text`（#eaeaf0）在 `--bg`（#0a0a0f）上对比≈15:1，达标。次级 `--text-secondary`≈7:1 仍达标；发光仅装饰、不承担正文可读。
- **键盘可操作**：所有交互 `:focus-visible` 轮廓（`--neon-cyan`）。
- **prefers-reduced-motion**：关闭过渡/动画（§1.9），避免闪烁。

---

## 5. 与 spec.md 的对照核对（验收）

- [ ] 暗色霓虹/赛博方向落到 spec §6 设计令牌（§1 已覆盖）。
- [ ] 组件（nav/按钮/卡片/标签/表单/footer）有明确样式与 hover 动效（§2）。
- [ ] 素材规划全部为「纯 CSS」或注明授权来源与 URL（§3）。
- [ ] 无自创/无版权来源的美术素材（§3.3/§3.5 红线）。
- [ ] 素材在 `assets/ATTRIBUTIONS.md` 记录来源与许可（§3.6）。
- [ ] 响应式三档、可访问性、prefers-reduced-motion 对齐 spec §7（§4）。

---

> 本文档由 **art-designer** 编写，作为 lead-dev 实现 to-tickets / implement 阶段的视觉权威依据。若视觉细节调整，需更新本文件并通知 lead-dev 同步。