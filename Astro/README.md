# Astro 个人网站维护指南

这是 Astro 6 静态个人网站。Node.js 要求 `>=22.12.0`，包管理器为 pnpm `11.18.0`。

## Profile 页面内容

`../Profile/` 是唯一公开内容源，并整体作为 Astro `publicDir`：

| 网站内容 | Profile 来源 |
| --- | --- |
| 全站身份、联系、favicon | `Profile/site/site.yml` |
| 首页 | `Profile/home/home.yml` |
| 自我介绍 | `Profile/about/about.yml` |
| 项目与成果 | `Profile/projects/` |
| 技术栈 | `Profile/tech-stack/tech-stack.yml` |

页面标题、导语、摘要和正文由对应 YAML 管理。导航、按钮、筛选器、对话框和无障碍标签由 `src/i18n/ui.ts` 管理。不得在 Astro 中建立内容副本。

`Profile/private/` 和旧 `Profile/profile/` 不得存在。媒体字段只能引用所属内容包目录中的文件名。

## 路由

| 页面 | 中文 | English |
| --- | --- | --- |
| 首页 | `/` | `/en/` |
| 自我介绍 | `/about/` | `/en/about/` |
| 项目与成果 | `/projects/` | `/en/projects/` |
| 技术栈 | `/tech-stack/` | `/en/tech-stack/` |

旧 `/experience/` 路由已删除。所有规范路径保留末尾斜杠并应用 `/joeych-pages` base。

## 数据流

- `src/content/page-schemas.ts` 校验 site、home、about、project page 和 tech-stack。
- `src/content/record-schemas.ts` 校验项目及嵌入成果。
- `src/lib/profile-data.ts` 并行读取页面内容、项目索引和项目文件，校验技能证据和媒体。
- `BaseLayout` 从当前页面 YAML 接收 SEO 标题和摘要。
- 内部路径使用 `getRoutePath()`/`withBase()`；公开文件使用 `publicMediaUrl()`。

## 命令

| 用途 | 命令 |
| --- | --- |
| 开发 | `pnpm run dev` |
| 检查 | `pnpm run check` |
| Lint | `pnpm run lint` |
| 单元测试 | `pnpm run test:unit` |
| 构建 | `pnpm run build` |
| E2E | `pnpm run test:e2e` |
| 聚合验证 | `pnpm run verify` |

部署仅由根目录 `.github/workflows/deploy-pages.yml` 完成，只上传 `Astro/dist`。
