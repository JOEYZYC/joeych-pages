# Astro 个人网站维护指南

这是已实现的 Astro 6 静态个人网站。运行环境为 Node.js `>=22.12.0`，包管理器为 pnpm `11.18.0`。本目录负责站点渲染、样式和验证，不拥有公开内容或媒体的著作权。

## 内容边界

`../Profile/data/` 与 `../Profile/media/` 是唯一的公开内容源。页面不得维护 YAML 或媒体的副本、别名、覆盖层或站点专用变体。

六个 YAML 文件均由站点直接读取：

- `profile.yml`
- `projects.yml`
- `awards.yml`
- `publications.yml`
- `patents.yml`
- `thesis.yml`

新增或修订公开事实时，修改对应的 `Profile/data/` 文件。新增媒体放入 `Profile/media/`，并由其所属 YAML 记录引用。内容必须有来源支撑，不得编造经历、资格、指标、链接或关联。

严禁读取、枚举、复制或发布 `Profile/private/`。`Astro/research/` 仅限本地调研材料；`Astro/Demo/` 是被忽略的本地参考快照，绝不导入、构建或发布。`Jeklly/_data/`、`Jeklly/assets/img/` 与 `Jeklly/.generated/` 是忽略的镜像，不是内容源，也不能作为修改目标。

## 路由

站点只公开下列十个路由。中文位于根路径，英文位于 `/en/` 前缀下；所有路径保留末尾斜杠。

| 页面 | 中文 | English |
| --- | --- | --- |
| 首页 | `/` | `/en/` |
| 经历 | `/experience/` | `/en/experience/` |
| 荣誉与研究 | `/awards/` | `/en/awards/` |
| 项目 | `/projects/` | `/en/projects/` |
| 技术栈 | `/tech-stack/` | `/en/tech-stack/` |

`astro.config.ts` 固定使用静态输出，`site` 是规范 URL 的来源，`base` 为 `/joeych-pages`，`trailingSlash` 为 `always`，`publicDir` 直接指向 `../Profile/media/`。因此，站内路由和公开媒体路径必须通过 `src/lib/routes.ts` 的 `getRoutePath()`、`withBase()`，或 `src/lib/urls.ts` 的 `publicMediaUrl()` 生成。不要手写以 `/` 开头的站内资源或链接，否则会丢失发布基路径。

站点地图只应包含上述十个规范 URL。没有 RSS，`showcase` 已退役，不能恢复或新增为公开路由。

## 架构

- `src/content.config.ts` 将六份 YAML 注册为 `profile`、`projects`、`awards`、`publications`、`patents`、`thesis` 集合。
- `src/content/` 的 Zod schema 与加载器校验记录形状、项目关联、技能证据和公开媒体路径。`src/lib/profile-data.ts` 在构建和页面渲染时加载并校验全部资料。
- `src/pages/` 只定义十个路由入口，中文与英文入口共享 `src/components/pages/` 中的页面组件。
- `src/layouts/BaseLayout.astro` 提供文档壳、SEO、页眉、页脚、语言切换和导航交互。`src/components/` 存放页面区块、记录展示与对话框。
- `src/styles/` 以 `tokens.css`、`base.css`、`layout.css`、`components.css` 为共享层，并按首页、经历、荣誉、项目、技术栈拆分页面样式。
- `tests/` 包含 Vitest 单元测试和 Playwright 端到端测试。后者会构建站点并在本机预览服务上检查页面外壳、路由、内容和交互。

## 本地命令

在 `Astro/` 目录执行。以下脚本与 `package.json` 完全一致：

| 用途 | 命令 | 脚本 |
| --- | --- | --- |
| 开发服务器 | `pnpm run dev` | `astro dev` |
| 类型与 Astro 检查 | `pnpm run check` | `astro check` |
| 静态检查 | `pnpm run lint` | `biome check .` |
| 单元测试 | `pnpm run test:unit` | `vitest run` |
| 静态构建 | `pnpm run build` | `astro build` |
| 本地预览 | `pnpm run preview` | `astro preview --host 127.0.0.1 --port 4321` |
| 端到端测试 | `pnpm run test:e2e` | `playwright test` |
| 完整验证 | `pnpm run verify` | `pnpm run check && pnpm run lint && pnpm run test:unit && pnpm run build` |

## 验证政策

提交站点、内容模式、样式或路由变更前，至少运行 `pnpm run verify`。涉及页面行为、导航、对话框或可访问性时，再运行 `pnpm run test:e2e`。编辑器的语言服务若因缺少 `typescript.tsdk` 未能提供完整类型信息，以 `pnpm run check` 中的 `astro check` 为权威编译门槛。

构建成功不等于内容正确。资料改动还必须确认六份 YAML 都能通过 schema，关联媒体确实存在于 `Profile/media/`，并且中英文路由、规范 URL 和站点地图仍只覆盖十个页面。

## 发布边界

部署由仓库根目录唯一的 `.github/workflows/deploy-pages.yml` 工作流负责。本目录不得新增第二条部署路径、部署工作流、部署脚本或托管配置。该根工作流仅从 `Astro/` 构建，仅读取公开 `Profile/` 来源，仅上传 `Astro/dist`，并通过 GitHub Actions 部署到 GitHub Pages。维护时保留工作区的发布防火墙，显式暂存路径，不要批量暂存，更不能将本地私有材料、调研材料、Demo 参考快照或 Jekyll 镜像带入公开内容。
