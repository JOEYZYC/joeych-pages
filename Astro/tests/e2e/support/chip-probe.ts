/** The actual filled circle, not the former SVG package or invisible viewBox. */
export function chipProbe() {
  const svg = document.querySelector<SVGSVGElement>("[data-shared-chip] svg")
  const matrix = svg?.getScreenCTM()
  if (!svg || !matrix) throw new Error("Missing single shared chip")
  const bounds = svg.getBBox()
  const corners = [[bounds.x, bounds.y], [bounds.x + bounds.width, bounds.y], [bounds.x, bounds.y + bounds.height], [bounds.x + bounds.width, bounds.y + bounds.height]]
    .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix))
  const paint = {
    left: Math.max(0, Math.min(...corners.map((point) => point.x))),
    right: Math.min(innerWidth, Math.max(...corners.map((point) => point.x))),
    top: Math.max(0, Math.min(...corners.map((point) => point.y))),
    bottom: Math.min(innerHeight, Math.max(...corners.map((point) => point.y))),
  }
  const diameter = Math.max(...corners.map(point => point.x)) - Math.min(...corners.map(point => point.x))
  const visibleFraction = Math.max(0, paint.right - paint.left) * Math.max(0, paint.bottom - paint.top) / (diameter * diameter)
  const collisions: { text: string; tag: string }[] = []
  for (const element of document.querySelectorAll<HTMLElement>(".chapter h1,.chapter h2,.chapter h3,.chapter p,.chapter a,.chapter figcaption,.chapter img,.directory > summary,.overview-navigation a,.overview-navigation button")) {
    if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden" || element.matches(".hero-art-link,.research-art-link")) continue
    const rect = element.getBoundingClientRect()
    const chapter = element.closest("[data-chapter]")?.getBoundingClientRect()
    const visible = { left: Math.max(0, rect.left, chapter?.left ?? 0), right: Math.min(innerWidth, rect.right, chapter?.right ?? innerWidth), top: Math.max(0, rect.top), bottom: Math.min(innerHeight, rect.bottom) }
    if (Math.min(visible.right, paint.right) - Math.max(visible.left, paint.left) > 1 && Math.min(visible.bottom, paint.bottom) - Math.max(visible.top, paint.top) > 1) collisions.push({ text: element.textContent?.slice(0, 70) ?? "", tag: element.tagName })
  }
  return { paint, diameter, visibleFraction, fill: getComputedStyle(svg.querySelector(".chapter-shape") ?? svg).fill, collisions, x: document.querySelector("[data-chapter-rail]")?.scrollLeft ?? 0 }
}

/** Bounded RAF evidence includes rendered geometry and independent content transforms. */
export async function motionFrames() {
  const samples = []
  const start = performance.now()
  do {
    const shape = document.querySelector<SVGCircleElement>(".chapter-shape")
    const rail = document.querySelector<HTMLElement>("[data-chapter-rail]")
    if (!shape || !rail) throw new Error("Missing production motion geometry")
    const rect = shape.getBoundingClientRect()
    const title = document.querySelector<HTMLElement>("#chapter-1 h2")
    const media = document.querySelector<HTMLElement>("#chapter-1 .hero-art-link")
    const collisions = [...document.querySelectorAll<HTMLElement>(".chapter h1,.chapter h2,.chapter h3,.chapter p,.chapter a,.chapter figcaption,.chapter img,.directory > summary,.overview-navigation a,.overview-navigation button")].flatMap(element => {
      if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden" || element.matches(".hero-art-link,.research-art-link")) return []
      const bounds = element.getBoundingClientRect()
      const chapter = element.closest("[data-chapter]")?.getBoundingClientRect()
      const left = Math.max(0, bounds.left, chapter?.left ?? 0)
      const right = Math.min(innerWidth, bounds.right, chapter?.right ?? innerWidth)
      if (Math.min(right, rect.right) - Math.max(left, rect.left) > 1 && Math.min(innerHeight, bounds.bottom, rect.bottom) - Math.max(0, bounds.top, rect.top) > 1) return [element.textContent?.slice(0, 60) ?? element.tagName]
      return []
    })
    samples.push({
      ms: performance.now() - start, x: rail.scrollLeft, left: rect.left, top: rect.top, diameter: rect.width,
      visible: Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left)) * Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)) / (rect.width * rect.height),
      fill: getComputedStyle(shape).fill, collisions, title: title ? getComputedStyle(title).translate : "none", media: media ? getComputedStyle(media).translate : "none",
    })
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  } while (performance.now() - start < 1400)
  return samples
}
