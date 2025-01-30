Hyde
Hyde 是一个大胆的两栏 Jekyll 主题，它将显眼的侧边栏与简洁的内容相结合。它基于 Poole，Jekyll 的管家。

Hyde 截图

内容

使用
选项
侧边栏菜单
固定侧边栏内容
主题
反转布局
开发
作者
许可
使用
Hyde 是一个基于 Poole 构建的主题，Poole 提供了一个完整的 Jekyll 设置——只需下载并启动 Jekyll 服务器。请参阅 Poole 使用指南，了解如何安装和使用 Jekyll。

选项
Hyde 包含一些可自定义的选项，通常通过在 <body> 元素上应用类来实现。

侧边栏菜单
通过在页面的 front-matter 中为每个 Jekyll 页面分配正确的布局，来创建一个侧边栏中的导航链接列表。

layout: page
title: About
为什么需要特定的布局？Jekyll 会返回所有页面，包括 atom.xml，并按字母顺序排序。为了确保第一个链接是首页，我们通过指定页面布局将 index.html 页面排除在这个列表之外。

固定侧边栏内容
默认情况下，Hyde 附带一个将内容固定在侧边栏底部的侧边栏。您可以选择通过移除 .sidebar-sticky 类来禁用此功能。这样，侧边栏内容将正常从上到下流动。

<!-- 默认侧边栏 --> <div class="sidebar"> <div class="container sidebar-sticky"> ... </div> </div> <!-- 修改后的侧边栏 --> <div class="sidebar"> <div class="container"> ... </div> </div>
主题
Hyde 附带八个可选主题，基于 base16 颜色方案。应用一个主题来改变颜色方案（主要作用于侧边栏和链接）。

Hyde 红色主题

目前有八个主题可供选择。

Hyde 主题类

要使用主题，将可用的主题类之一添加到默认布局中的 <body> 元素，如下所示：

<body class="theme-base-08"> ... </body>
要创建自己的主题，请查看附带的 CSS 文件中的主题部分。复制任何现有的主题（它们只有几行 CSS），重命名并更改提供的颜色。

反转布局
Hyde 带有反转布局

Hyde 的页面方向可以通过一个类来反转。

<body class="layout-reverse"> ... </body>
开发
Hyde 有两个分支，但只有一个用于活跃开发。

master 用于开发。所有的 pull 请求应提交到 master。
gh-pages 用于我们的托管站点，其中包含我们的分析跟踪代码。请避免使用此分支。
作者
Mark Otto
GitHub: https://github.com/mdo
Twitter: https://twitter.com/mdo

许可
根据 MIT 许可开源。

