# 张易成 · 个人学术作品集 / JOEYCH — Academic Portfolio

电子信息工程本科生的个人作品集站点，托管于 **GitHub Pages**：

**🔗 https://joeyzyc.github.io/joeych-pages/**

学术专业·浅色蓝调风格，支持 **中 / EN 双语切换**，响应式（桌面 / 平板 / 手机）。

---

## 目录结构

```
index.html          首页（Hero + 概览 + 研究方向）
about.html          自我介绍（教育 / 校园经历 / 技能 / 联系方式）
awards.html         获奖证书（竞赛 / 论文 / 专利 / 毕设 / 证书图）
projects.html       项目介绍（电纹识别 / 双光融合热像仪 / ResGatNet）
tech-stack.html     技术栈（基础知识 / 技术方向 / 架构设计）
404.html            404 页

assets/
  css/main.css      设计系统与全部组件样式
  js/main.js        双语切换 + 移动导航 + 滚动揭示
  img/              图片资源（替换占位图请放这里）
  img/favicon.svg   站点图标

_layouts/           Jekyll 博客布局（default / post）
_posts/             博客文章（Markdown）
_config.yml         Jekyll / GitHub Pages 配置
atom.xml            RSS/Atom 订阅源
DESIGN.md           设计契约（配色 / 字体 / 组件 / 动效规范）
deploy.ps1          一键提交并部署脚本
serve.ps1           本地预览脚本
```

> 核心四页为**纯静态 HTML**（无 Liquid、相对路径），既能本地直接预览，又能在 GitHub Pages 子路径 `/joeych-pages/` 正常工作；博客层使用标准 Jekyll。

---

## 本地预览

环境：仅需 **Python 3**（无需安装 Ruby/Jekyll，核心页为静态）。

```powershell
./serve.ps1            # 默认 http://localhost:8123
./serve.ps1 8080       # 自定义端口
```

浏览器打开 `http://localhost:8123/index.html` 即可。
（博客 `blog.html` 已重定向到 `tech-stack.html`。）

---

## 部署（与本次相同的方式）

直推 `main` 分支 → GitHub Pages **自动构建并部署**，约 1–2 分钟生效。

```powershell
./deploy.ps1                 # 使用默认提交信息
./deploy.ps1 "更新项目图片"   # 自定义提交信息
```

脚本等价于：

```powershell
git add -A
git commit -m "<提交信息>"
git push origin main
```

> 若线上 404，请到仓库 **Settings → Pages** 确认 Source = `Deploy from a branch`、分支 `main` / `(root)`。

---

## 内容维护指南

### 1. 替换占位图（获奖证书 / 项目 图1~图7）

页面中预留的占位块形如：

```html
<div class="img-placeholder">
  <svg class="img-placeholder__icon" ...></svg>
  <span class="img-placeholder__caption" data-en="Fig.1 C# Host App">图1 C# 上位机</span>
  <span class="img-placeholder__hint" data-en="Image coming soon">图片待补充</span>
</div>
```

把图片放进 `assets/img/`（如 `assets/img/fig1.jpg`），将整个占位块替换为：

```html
<figure class="project-figure">
  <img src="assets/img/fig1.jpg" alt="图1 C# 上位机" loading="lazy">
  <figcaption data-en="Fig.1 C# Host App">图1 C# 上位机</figcaption>
</figure>
```

> 头像、微信 / GitHub 二维码（`about.html`）、荣誉证书（`awards.html`，6 格）同理替换。

### 2. 补全链接占位

`projects.html` 中的「链接待补充」按钮：

```html
<span class="link-placeholder" ...>链接待补充 / link coming soon</span>
```

改为真实链接：

```html
<a class="btn btn--outline" href="https://github.com/JOEYZYC/xxx" target="_blank" rel="noopener noreferrer">开源链接 / Open-source</a>
```

### 3. 新增双语文本

所有可翻译元素：中文写在标签内，英文放 `data-en` 属性，切换自动生效：

```html
<h2 class="section-title" data-en="New Section">新板块</h2>
```

### 4. 写博客

在 `_posts/` 新建 `YYYY-MM-DD-标题.md`：

```markdown
---
layout: post
title: "文章标题"
date: 2026-07-01
---

正文（Markdown）……
```

---

## 设计规范

配色、字体、间距、组件与动效规范见 [`DESIGN.md`](DESIGN.md)。修改样式请遵循其中的设计令牌，保持一致性。

---

## 使用协议 / License

本仓库不是开源网站模板。除非获得作者书面许可，禁止复制、复用、改作或再发布本站的视觉设计、页面布局、组件样式、文案、照片、证书图片、个人资料与其他素材。

代码和仓库内容仅允许用于在线浏览、个人非商业参考，以及通过 GitHub 提交 issue 或 pull request 回馈到本仓库。完整条款见 [`LICENSE`](LICENSE)。
