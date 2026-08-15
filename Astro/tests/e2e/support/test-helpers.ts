import type { ConsoleMessage, Page } from "@playwright/test"

import type { Theme } from "./site-matrix"

export type PageErrorCapture = {
  readonly pageErrors: readonly string[]
  readonly consoleErrors: readonly string[]
}

export type VisualEnvironment = {
  readonly theme: Theme
  readonly reducedMotion?: "reduce" | "no-preference"
}

export function capturePageErrors(page: Page): PageErrorCapture {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  const captureConsoleError = (message: ConsoleMessage): void => {
    if (message.type() === "error") consoleErrors.push(message.text())
  }

  page.on("pageerror", (error) => pageErrors.push(error.message))
  page.on("console", captureConsoleError)

  return { pageErrors, consoleErrors }
}

export async function configureVisualEnvironment(page: Page, environment: VisualEnvironment): Promise<void> {
  await page.emulateMedia(
    environment.reducedMotion === undefined
      ? { colorScheme: environment.theme }
      : { colorScheme: environment.theme, reducedMotion: environment.reducedMotion },
  )
  await page.addInitScript((theme) => window.localStorage.setItem("joeych-theme", theme), environment.theme)
}

export async function waitForStableScreenshot(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
}
