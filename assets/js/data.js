/* ============================================================
   data.js — 站点数据（真实作品 · 4 类 + 站点主人信息）
   ⚠️ 权威来源：_real_works.json（无需爬取，直接采用其 title/desc/results 等字段）。
   分类 id：data(数据分析) / prototype(产品原型) / aigc(AIGC) / game(网页游戏)
   字段说明（ACCEPTANCE.md §2）：
     统一：title / desc / category / year / hue / link / featured
     data：results=[str] 关键结论（来源于 JSON 的 results）
     各分类通用 keywords=[str] 为描述性标签（来源于 JSON 的 tags）
     分类专属：prototype: prototypeUrl+downloadUrl；aigc: videoSrc；game: gameUrl(+controls)
   说明：作品集为 5 类 11 个项目（数据分析5 / 产品原型1 / AIGC2 / 网页游戏2 / 工具开发1）。
         工具/开发类（tool）为 LocalMiniDrama·本地短剧 Mod。⚠️ 数据来源：_real_works.json（权威）。
   ============================================================ */

/* 站点主人信息（用于页头名、联系方式、页脚、二维码等） */
window.OWNER = {
  name: "李嘉豪",
  email: "18672786151@163.com",
  github: "xiaolu-fzu",
  githubUrl: "https://github.com/xiaolu-fzu",
  wechatQR: "微信二维码/b59c1e61ff6b95d2141f0a3c2406dc5b.jpg",
  tagline: "会用数据找答案，会用AI造东西。从舆情报告到记账App，从AI视频到网页游戏。"
};

window.WORKS = [
  /* ---------------- 数据分析 data ---------------- */
  {
    title: "绝区零 2.7 · X 日语区海外社区监测",
    desc: "对《绝区零》2.7 版本 X 日语区做系统性内容生态监测，定位投放机会、量化商单效率。",
    category: "data",
    year: 2024,
    hue: 190,
    link: "https://xiaolu-fzu.github.io/portfolio/",
    featured: true,
    keywords: ["决策报告", "竞品分析", "内容生态", "商单策略"],
    results: [
      "热度集中于头部创作者，前 0.6% 贡献 73.8% 热度；内容依赖插画 44.8%，生态健康度存结构风险",
      "视频类二创呈「低供给高需求」（浏览 19.3% vs 帖数 4.8%）；商单互动率仅 0.3%，远低于非商单 5.1%",
      "策略：从「泛投」转向以黑马创作者 + 视频类为导向的小规模验证"
    ]
  },
  {
    title: "绝区零 · YouTube 日区长期生态监测",
    desc: "建立长周期跨版本持续性监测体系，覆盖自研爬取 + 官方接口补爬 → 判定引擎 → 固定工作流 → 简报输出全链路。",
    category: "data",
    year: 2024,
    hue: 220,
    link: "https://xiaolu-fzu.github.io/portfolio/",
    keywords: ["数据工程", "长期监测", "跨版本对比", "YouTube"],
    results: [
      "覆盖 7+ 版本跨版本数据，单版本约 1.1 万条视频、2700+ 创作者",
      "全链路自研：社媒爬取平台 + 官方 API 补爬 → 自研语言/地区/游戏判定引擎 → 固定分析工作流 → 标准化简报",
      "生态规模收敛但内容质量提升；短视频是增长引擎（互动率高 40%），头部 3% 创作者贡献 57% 播放量"
    ]
  },
  {
    title: "星布谷地 CBT2 · 小语种地区舆论监控",
    desc: "围绕《星布谷地》CBT2，对泰/印尼/法/俄四语区进行为期一个月周期性舆情监控，覆盖 YouTube/X/VK。",
    category: "data",
    year: 2024,
    hue: 160,
    link: "https://xiaolu-fzu.github.io/portfolio/",
    keywords: ["舆论监控", "风险预警", "多语言分析"],
    results: [
      "全域负向仅 8.7% 整体可控；「未获取资格」定性为正常情绪波动，排除危机误判",
      "识别并预警 7 大风险：移动端性能门槛、抄袭标签固化、商业化忧虑、Bug 卡死、本地化质量等",
      "泰语区设备焦虑突出，印尼区「竞品跳槽」叙事，俄语区负面最集中（占 42%）"
    ]
  },
  {
    title: "欧美 AIGC 用户接受度调研",
    desc: "跨 YouTube/TikTok/X 三大平台，覆盖英/德/法/西语区 AIGC 内容，分析用户接受度、风险结构与平台匹配。",
    category: "data",
    year: 2024,
    hue: 300,
    link: "https://xiaolu-fzu.github.io/portfolio/",
    keywords: ["用户调研", "AIGC", "跨国调研", "情感分析"],
    results: [
      "覆盖 3049 条内容，正向/有限接受度达 54.2%，AIGC 已过「普遍排斥」阶段",
      "质量是核心分水岭：低完成度负向率 43.1% vs 高完成度仅 2.7%",
      "平台分工明确：YouTube 主做视频 Meme，TikTok 优先角色/美术，X 适合视觉/模拟类"
    ]
  },
  {
    title: "鸣潮 · 巴西创作者投资调研",
    desc: "受《鸣潮》项目委托，对巴西 11 位潜在合作创作者做背景调研与风险评估，为投资决策提供依据。",
    category: "data",
    year: 2024,
    hue: 260,
    link: "https://xiaolu-fzu.github.io/portfolio/",
    keywords: ["创作者调研", "跨国调研", "风险评估"],
    results: [
      "完成 11 位创作者的综合评估与信息搜集",
      "识别并排除 1 位存在种族歧视言论的创作者，规避品牌声誉风险"
    ]
  },

  /* ---------------- 产品原型 prototype（1 项目 · 3 形态） ---------------- */
  {
    title: "ProListing · 离线记账应用",
    desc: "「一部手机装下全部生活」的离线记账 App，含原型 + 安卓包 + 下载页。",
    category: "prototype",
    year: 2024,
    hue: 200,
    prototypeUrl: "prototype/prolist.html",
    downloadUrl: "https://xiaolu-fzu.github.io/prolist-download/",
    platform: "Web 原型 · 安卓 App · 下载页",
    keywords: ["产品原型", "移动端", "离线记账"],
    featured: true
  },

  /* ---------------- AIGC aigc ---------------- */
  {
    title: "硬币",
    desc: "实现了同学的想法，把脑洞做成可运行/可复现的 AI 视频作品。",
    category: "aigc",
    year: 2025,
    hue: 45,
    videoSrc: "AIGC/硬币.mp4",
    videoTitle: "硬币",
    keywords: ["AIGC", "视频"],
    featured: true,
    story: { img1: "AIGC/196af08be41760cb4ce6c9eee1271449.png", img2: "AIGC/6c462adef4cc2bae1431fed71ffe56a8.png", note: "同学写的原创故事蓝本" }
  },
  {
    title: "荔枝的组会日",
    desc: "与师兄师姐讨论后，用师兄师姐的小猫为主角制作的 AI 视频作品。",
    category: "aigc",
    year: 2025,
    hue: 130,
    videoSrc: "AIGC/荔枝的组会日.mp4",
    videoTitle: "荔枝的组会日",
    keywords: ["AIGC", "视频"],
    story: { img1: "AIGC/39329728623750764d402a14abea9ecf.jpg", note: "师兄师姐的小猫原型", label: "角色（小猫）原型" }
  },

  /* ---------------- 网页游戏 game ---------------- */
  {
    title: "果宝特攻 · 水果机甲肉鸽",
    desc: "水果机甲肉鸽战斗游戏，升级三选一强化，活得更久冲得更远。",
    category: "game",
    year: 2025,
    hue: 90,
    gameUrl: "https://xiaolu-fzu.github.io/fruit-rogue/",
    genre: "肉鸽",
    controls: "WASD / 方向键移动 · 自动射击 · 1–4 切武器 · 升级三选一 · 支持触屏",
    keywords: ["网页游戏", "肉鸽"],
    featured: true
  },
  {
    title: "班尼特 · 炎光试炼",
    desc: "Boss Rush 战斗游戏，对战多关卡 Boss。",
    category: "game",
    year: 2025,
    hue: 20,
    gameUrl: "https://xiaolu-fzu.github.io/bennett-boss-rush/",
    genre: "Boss 战",
    controls: "进入即玩 · 躲避与输出 · 多关卡 Boss 战",
    keywords: ["网页游戏", "Boss 战"]
  },

  /* ---------------- 工具/开发 tool（第 5 类） ---------------- */
  {
    title: "LocalMiniDrama · 本地短剧 Mod",
    desc: "改装 LocalMiniDrama：适配 RunningHub 中转站 MiniMax H3、加入 AI 配置停用选项、添加输出分辨率选项。",
    category: "tool",
    year: 2025,
    hue: 55,
    link: "https://github.com/xiaolu-fzu/LocalMiniDrama-Mod",
    keywords: ["工具", "开发", "Mod"],
    featured: true
  }
];

window.WORK_CATEGORIES = ["全部", "数据分析", "产品原型", "AIGC", "网页游戏", "工具/开发"];

