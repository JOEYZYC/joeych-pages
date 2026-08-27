import type { RouteId } from "../lib/routes"
import type { Locale } from "./locales"

type SectionId = RouteId | "awards"

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
  readonly actions: {
    readonly about: string
    readonly projects: string
  }
  readonly projectExplorer: {
    readonly category: string
    readonly name: string
    readonly allCategories: string
    readonly allProjects: string
    readonly honor: string
    readonly allHonors: string
    readonly open: string
    readonly close: string
    readonly pending: string
    readonly emptySource: string
    readonly current: string
    readonly skillOrigin: string
    readonly imagePending: string
    readonly imagePendingAlt: string
    readonly resultCountOne: string
    readonly resultCountMany: string
    readonly filtersAdjusted: string
    readonly clearFilters: string
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
  readonly sections: Readonly<Record<SectionId, Readonly<Record<string, string>>>>
  readonly evidence: {
    readonly project: string
    readonly credential: string
    readonly generalAbility: string
    readonly levels: {
      readonly working: string
      readonly exposure: string
    }
  }
}

export const UI = {
  zh: {
    skipToContent: "跳到主要内容",
    navigation: {
      home: "首页",
      about: "自我介绍",
      projects: "项目与成果",
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
    actions: {
      about: "查看自我介绍",
      projects: "探索项目与成果",
    },
    projectExplorer: {
      category: "关键词",
      name: "项目名称",
      allCategories: "全部关键词",
      allProjects: "全部项目",
      honor: "荣誉",
      allHonors: "全部荣誉",
      open: "查看项目详情",
      close: "关闭项目详情",
      pending: "请补充",
      emptySource: "暂无项目资料。",
      current: "当前项目",
      skillOrigin: "来自技能证据",
      imagePending: "项目图片待补充",
      imagePendingAlt: "项目占位图片；项目图片待补充",
      resultCountOne: "显示 {count} 个项目",
      resultCountMany: "显示 {count} 个项目",
      filtersAdjusted: "已清除不兼容的筛选条件。",
      clearFilters: "清除筛选",
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
      about: {
        overview: "个人概述",
        basic: "基本信息",
        name: "姓名",
        role: "身份",
        hometown: "家乡",
        political: "政治面貌",
        direction: "关注方向",
        statistics: "公开统计",
        interests: "兴趣方向",
        goal: "个人目标",
        education: "教育经历",
        campus: "校园经历",
      },
      awards: {
        awards: "获奖记录",
        publications: "学术论文",
        patents: "发明专利",
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
  },
  en: {
    skipToContent: "Skip to main content",
    navigation: {
      home: "Home",
      about: "About",
      projects: "Projects & Achievements",
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
    actions: {
      about: "Read about me",
      projects: "Explore projects & achievements",
    },
    projectExplorer: {
      category: "Keyword",
      name: "Project name",
      allCategories: "All keywords",
      allProjects: "All projects",
      honor: "Honor",
      allHonors: "All honors",
      open: "Open project details",
      close: "Close project details",
      pending: "To be completed",
      emptySource: "No project records available.",
      current: "Current project",
      skillOrigin: "From skill evidence",
      imagePending: "Project image pending",
      imagePendingAlt: "Project placeholder image; project image pending",
      resultCountOne: "{count} project shown",
      resultCountMany: "{count} projects shown",
      filtersAdjusted: "Incompatible filters were cleared.",
      clearFilters: "Clear filters",
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
      about: {
        overview: "Overview",
        basic: "Basic information",
        name: "Name",
        role: "Role",
        hometown: "Hometown",
        political: "Political affiliation",
        direction: "Focus",
        statistics: "Public statistics",
        interests: "Interests",
        goal: "Goal",
        education: "Education",
        campus: "Campus experience",
      },
      awards: {
        awards: "Awards",
        publications: "Publications",
        patents: "Patent applications",
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
  },
} as const satisfies Readonly<Record<Locale, UiLabels>>
