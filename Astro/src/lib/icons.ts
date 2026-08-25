import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { faGithub, faGoogleScholar, faOrcid } from "@fortawesome/free-brands-svg-icons"
import {
  faArrowRight,
  faBars,
  faCertificate,
  faChevronLeft,
  faChevronRight,
  faEnvelope,
  faExternalLink,
  faFileLines,
  faGraduationCap,
  faLanguage,
  faLink,
  faMicrochip,
  faMoon,
  faSun,
  faXmark,
} from "@fortawesome/free-solid-svg-icons"

export const ICONS = {
  bars: faBars,
  language: faLanguage,
  envelope: faEnvelope,
  sun: faSun,
  moon: faMoon,
  xmark: faXmark,
  "chevron-left": faChevronLeft,
  "chevron-right": faChevronRight,
  certificate: faCertificate,
  "graduation-cap": faGraduationCap,
  "file-lines": faFileLines,
  microchip: faMicrochip,
  link: faLink,
  "arrow-right": faArrowRight,
  external: faExternalLink,
  github: faGithub,
  "google-scholar": faGoogleScholar,
  orcid: faOrcid,
} as const satisfies Readonly<Record<string, IconDefinition>>

export type IconName = keyof typeof ICONS
