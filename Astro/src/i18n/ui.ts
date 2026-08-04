import type { RouteId } from "../lib/routes"
import type { Locale } from "./locales"

type RouteIntro = {
  readonly overline: string
  readonly title: string
}

type UiLabels = {
  readonly navigation: Readonly<Record<RouteId, string>>
  readonly menu: string
  readonly mainNavigation: string
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
    navigation: {
      home: "自我介绍",
      experience: "个人经历",
      awards: "获奖证书",
      projects: "项目介绍",
      "tech-stack": "技术栈",
    },
    menu: "菜单",
    mainNavigation: "主导航",
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
    links: { github: "GitHub", scholar: "Google Scholar", orcid: "ORCID", related: "相关链接" },
    sections: {
      home: { profile: "个人档案", education: "教育经历", featured: "精选证据" },
      experience: { education: "教育经历", campus: "校园经历" },
      awards: { awards: "获奖记录", publications: "学术论文", patents: "发明专利", thesis: "毕业设计" },
      projects: { index: "项目索引", contribution: "个人贡献", links: "相关链接", figures: "项目图示" },
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
      experience: { overline: "经历", title: "个人经历" },
      awards: { overline: "成果", title: "获奖证书" },
      projects: { overline: "工程实践", title: "项目介绍" },
      "tech-stack": { overline: "专业能力", title: "技术栈" },
    },
  },
  en: {
    navigation: {
      home: "About",
      experience: "Experience",
      awards: "Awards",
      projects: "Projects",
      "tech-stack": "Tech Stack",
    },
    menu: "Menu",
    mainNavigation: "Primary navigation",
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
    links: { github: "GitHub", scholar: "Google Scholar", orcid: "ORCID", related: "Related links" },
    sections: {
      home: { profile: "Profile", education: "Education", featured: "Featured evidence" },
      experience: { education: "Education", campus: "Campus experience" },
      awards: { awards: "Awards", publications: "Publications", patents: "Patent applications", thesis: "Thesis" },
      projects: { index: "Project index", contribution: "Contribution", links: "Related links", figures: "Figures" },
      "tech-stack": { skills: "Skill evidence", evidence: "Evidence basis" },
    },
    evidence: {
      project: "Project evidence",
      credential: "Public-profile credential",
      generalAbility: "Self-described ability",
      levels: { working: "Working knowledge", exposure: "Exposure" },
    },
    routeIntros: {
      home: { overline: "Profile", title: "About" },
      experience: { overline: "Background", title: "Experience" },
      awards: { overline: "Achievements", title: "Awards" },
      projects: { overline: "Engineering Work", title: "Projects" },
      "tech-stack": { overline: "Capabilities", title: "Tech Stack" },
    },
  },
} as const satisfies Readonly<Record<Locale, UiLabels>>
