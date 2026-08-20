import type { RouteId } from "../lib/routes"
import type { Locale } from "./locales"

type RouteIntro = {
  readonly overline: string
  readonly title: string
} & (
  | { readonly summary?: never }
  | { readonly summary: string }
)

type UiLabels = {
  readonly skipToContent: string
  readonly navigation: Readonly<Record<RouteId, string>>
  readonly menu: string
  readonly mainNavigation: string
  readonly menuOpen: string
  readonly menuClose: string
  readonly theme: {
    readonly light: string
    readonly dark: string
    readonly toLight: string
    readonly toDark: string
  }
  readonly tooltips: {
    readonly menu: string
    readonly language: string
    readonly contact: string
    readonly theme: string
  }
  readonly archive: {
    readonly ledgerOverline: string
    readonly researchOverline: string
  }
  readonly actions: {
    readonly experience: string
    readonly projects: string
  }
  readonly projectExplorer: {
    readonly category: string
    readonly name: string
    readonly allCategories: string
    readonly allProjects: string
    readonly emptySource: string
    readonly current: string
    readonly skillOrigin: string
    readonly imagePending: string
    readonly imagePendingAlt: string
  }
  readonly language: {
    readonly label: string
    readonly switchToEnglish: string
    readonly switchToEnglishVersion: string
    readonly switchToChinese: string
    readonly switchToChineseVersion: string
  }
  readonly contact: {
    readonly open: string
    readonly title: string
    readonly close: string
    readonly closeButton: string
    readonly email: string
    readonly github: string
    readonly scholar: string
    readonly orcid: string
  }
  readonly unavailable: {
    readonly link: string
    readonly media: string
  }
  readonly certificate: {
    readonly view: string
    readonly title: string
    readonly close: string
    readonly closeButton: string
    readonly previous: string
    readonly next: string
    readonly loading: string
    readonly unavailable: string
  }
  readonly links: {
    readonly external: string
    readonly github: string
    readonly scholar: string
    readonly orcid: string
    readonly related: string
  }
  readonly sections: Readonly<Record<RouteId, Readonly<Record<string, string>>>>
  readonly evidence: {
    readonly project: string
    readonly credential: string
    readonly generalAbility: string
    readonly levels: {
      readonly working: string
      readonly exposure: string
    }
  }
  readonly routeIntros: Readonly<Record<RouteId, RouteIntro>>
}

export const UI = {
  zh: {
    skipToContent: "跳到主要内容",
    navigation: {
      home: "自我介绍",
      experience: "个人经历",
      awards: "成果与获奖",
      projects: "项目介绍",
      "tech-stack": "技术栈",
    },
    menu: "菜单",
    mainNavigation: "主导航",
    menuOpen: "打开菜单",
    menuClose: "关闭菜单",
    theme: {
      light: "浅色",
      dark: "深色",
      toLight: "切换至浅色主题",
      toDark: "切换至深色主题",
    },
    tooltips: {
      menu: "打开导航菜单",
      language: "切换语言",
      contact: "打开联系方式",
      theme: "切换主题",
    },
    archive: { ledgerOverline: "获奖档案", researchOverline: "研究档案" },
    actions: {
      experience: "查看经历",
      projects: "探索项目",
    },
    projectExplorer: {
      category: "项目类别",
      name: "项目名称",
      allCategories: "全部类别",
      allProjects: "全部项目",
      emptySource: "暂无项目资料。",
      current: "当前项目",
      skillOrigin: "来自技能证据",
      imagePending: "项目图片待补充",
      imagePendingAlt: "项目占位图片；项目图片待补充",
    },
    language: {
      label: "English",
      switchToEnglish: "切换至英文",
      switchToEnglishVersion: "切换至英文版本",
      switchToChinese: "切换至中文",
      switchToChineseVersion: "切换至中文版本",
    },
    contact: {
      open: "联系",
      title: "联系方式",
      close: "关闭联系方式",
      closeButton: "关闭",
      email: "电子邮箱",
      github: "GitHub",
      scholar: "Google Scholar",
      orcid: "ORCID",
    },
    unavailable: {
      link: "链接暂不可用",
      media: "资料暂不可用",
    },
    certificate: {
      view: "查看证书",
      title: "证书",
      close: "关闭证书",
      closeButton: "关闭",
      previous: "上一张证书",
      next: "下一张证书",
      loading: "证书加载中",
      unavailable: "证书暂不可用",
    },
    links: { external: "外部链接", github: "GitHub", scholar: "Google Scholar", orcid: "ORCID", related: "相关链接" },
    sections: {
      home: {},
      experience: { education: "教育经历", campus: "校园经历" },
      awards: {
        awards: "获奖记录",
        publications: "学术论文",
        patents: "发明专利",
        thesis: "毕业设计",
        ledgerOverline: "获奖档案",
        researchOverline: "研究档案",
      },
      projects: { contribution: "个人贡献", links: "相关链接", figures: "项目图示" },
      "tech-stack": { skills: "技能证据", evidence: "证据依据" },
    },
    evidence: {
      project: "项目证据",
      credential: "公开资料凭证",
      generalAbility: "自述能力",
      levels: { working: "工作使用", exposure: "接触了解" },
    },
    routeIntros: {
      home: { overline: "个人档案", title: "自我介绍" },
      experience: { overline: "经历", title: "个人经历", summary: "按时间查看教育经历与校园实践。" },
      awards: { overline: "成果", title: "成果与获奖", summary: "按年份查阅竞赛荣誉、出版成果、专利与毕业论文。" },
      projects: { overline: "工程实践", title: "项目介绍", summary: "按项目类别与项目名称筛选，查看完整的工程实践、贡献与图文证据。" },
      "tech-stack": { overline: "专业能力", title: "技术栈", summary: "按技能领域查看对应组件、能力语境与项目证据。" },
    },
  },
  en: {
    skipToContent: "Skip to main content",
    navigation: {
      home: "About",
      experience: "Experience",
      awards: "Achievements",
      projects: "Projects",
      "tech-stack": "Tech Stack",
    },
    menu: "Menu",
    mainNavigation: "Primary navigation",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    theme: {
      light: "Light",
      dark: "Dark",
      toLight: "Switch to light theme",
      toDark: "Switch to dark theme",
    },
    tooltips: {
      menu: "Open navigation menu",
      language: "Change language",
      contact: "Open contact details",
      theme: "Change theme",
    },
    archive: { ledgerOverline: "Achievement ledger", researchOverline: "Research archive" },
    actions: {
      experience: "View experience",
      projects: "Explore projects",
    },
    projectExplorer: {
      category: "Project category",
      name: "Project name",
      allCategories: "All categories",
      allProjects: "All projects",
      emptySource: "No project records available.",
      current: "Current project",
      skillOrigin: "From skill evidence",
      imagePending: "Project image pending",
      imagePendingAlt: "Project placeholder image; project image pending",
    },
    language: {
      label: "中文",
      switchToEnglish: "Switch to English",
      switchToEnglishVersion: "Switch to English version",
      switchToChinese: "切换至中文",
      switchToChineseVersion: "Switch to Chinese version",
    },
    contact: {
      open: "Contact",
      title: "Contact",
      close: "Close contact details",
      closeButton: "Close",
      email: "Email",
      github: "GitHub",
      scholar: "Google Scholar",
      orcid: "ORCID",
    },
    unavailable: {
      link: "Link unavailable",
      media: "Media unavailable",
    },
    certificate: {
      view: "View certificate",
      title: "Certificate",
      close: "Close certificate",
      closeButton: "Close",
      previous: "Previous certificate",
      next: "Next certificate",
      loading: "Loading certificate",
      unavailable: "Certificate unavailable",
    },
    links: { external: "External link", github: "GitHub", scholar: "Google Scholar", orcid: "ORCID", related: "Related links" },
    sections: {
      home: {},
      experience: { education: "Education", campus: "Campus experience" },
      awards: {
        awards: "Awards",
        publications: "Publications",
        patents: "Patent applications",
        thesis: "Thesis",
        ledgerOverline: "Achievement ledger",
        researchOverline: "Research archive",
      },
      projects: { contribution: "Contribution", links: "Related links", figures: "Figures" },
      "tech-stack": { skills: "Skill evidence", evidence: "Evidence" },
    },
    evidence: {
      project: "Project",
      credential: "Credential",
      generalAbility: "Self-reported skill",
      levels: { working: "Working knowledge", exposure: "Exposure" },
    },
    routeIntros: {
      home: { overline: "Profile", title: "About" },
      experience: { overline: "Background", title: "Experience", summary: "Review education and campus experience in chronological order." },
      awards: { overline: "Achievements", title: "Achievements", summary: "Review awards, publications, patents, and thesis evidence by year." },
      projects: { overline: "Engineering Work", title: "Projects", summary: "Filter by project category and name to inspect complete engineering work, contributions, and supporting figures." },
      "tech-stack": { overline: "Capabilities", title: "Tech Stack", summary: "Browse technical capabilities by domain with their components, context, and project evidence." },
    },
  },
} as const satisfies Readonly<Record<Locale, UiLabels>>
