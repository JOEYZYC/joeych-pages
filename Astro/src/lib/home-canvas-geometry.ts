export type HomeCanvasMode = "vertical" | "native" | "desktop"

export function chooseHomeCanvasMode(input: {
  readonly width: number
  readonly height: number
  readonly coarse: boolean
  readonly reduced: boolean
  readonly rootFontSize: number
  readonly availableHeight: number
  readonly requiredHeight: number
}): HomeCanvasMode {
  if (input.reduced || input.rootFontSize > 20 || input.height < 680) return "vertical"
  if (input.coarse && input.width < 1100) return "native"
  if (!input.coarse && input.width >= 1100 && input.height >= 760 && input.requiredHeight <= input.availableHeight) return "desktop"
  return "vertical"
}

export function canvasProgress(scroll: number, start: number, travel: number, count: number): number {
  return Math.max(0, Math.min(count - 1, (scroll - start) / Math.max(1, travel) * (count - 1)))
}
