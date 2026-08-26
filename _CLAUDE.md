# 作品集项目

## 项目简介
个人作品集网站，展示游戏行业数据分析项目经历与成果。纯静态 HTML+CSS+JS，零依赖。

## 项目结构
- `index.html` — 主页面（所有内容 + 嵌入的表格数据 JS）
- `style.css` — 深色主题样式
- `.claude/memory/` — 记忆文件（约定、流程、项目进展）

## 不要推送到远程的文件
- Excel 报告文件（`.xlsx`）
- 生成方案（`生成方案*.txt`）
- 个人信息档案（`*.txt`）
- `.claude/` 目录
- 其他非网页素材

## 迭代工作流
0. **写方案**：用户提出需求后，先写 `生成方案N.txt`，待用户确认后再动手
1. **备份当前版本**：将 `index.html` + `style.css` 复制到 `历史版本/YYYY-MM-DD_vN_简短描述/`
2. 用户放置 `生成方案N.txt`，告知后读取方案
3. 更新 `index.html` 和 `style.css`
4. 用户手动纠正的内容 → 精简后记录到 `.claude/memory/开发日志.md`
5. 更新 `历史版本/README.md` 记录本次版本
6. 更新 `.claude/memory/项目基本信息.md` 记录进展
7. 部署：`git add index.html style.css && git commit -m "..." && git push`

## 版本管理
- `历史版本/` 文件夹存放每次迭代前的 `index.html` + `style.css`
- `历史版本/README.md` 为版本索引表
- 命名规范：`YYYY-MM-DD_vN_简短描述/`（如 `2026-06-23_v1_初始版`）

## GitHub Pages 部署（走代理）
```bash
# 首次
git init
git add index.html style.css
git commit -m "init: 作品集"
# 创建 GitHub 仓库后
git branch -m master main
git remote add origin https://github.com/xiaolu-fzu/portfolio.git
git -c http.proxy=http://127.0.0.1:7890 push -u origin main

# 后续更新
git add index.html style.css
git commit -m "update: ..."
git -c http.proxy=http://127.0.0.1:7890 push
```

## 部署到 Gitee Pages（国内加速）
```bash
git remote add gitee https://gitee.com/用户名/portfolio.git
git -c http.proxy=http://127.0.0.1:7890 push -u gitee main
# 在 gitee.com 仓库设置中启用 Gitee Pages
```
