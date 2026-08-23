export const LOCALES = ["zh", "en"] as const

export type Locale = (typeof LOCALES)[number]

const CORRESPONDING_LOCALE = {
  zh: "en",
  en: "zh",
} as const satisfies Readonly<Record<Locale, Locale>>

export function getCorrespondingLocale(locale: Locale): Locale {
  return CORRESPONDING_LOCALE[locale]
}
