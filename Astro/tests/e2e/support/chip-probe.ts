/** Conservative SVG paint bounds, clipped by its viewport overlay. Text is never scaled. */
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
  const collisions: { text: string; tag: string }[] = []
  for (const element of document.querySelectorAll<HTMLElement>(".chapter h1,.chapter h2,.chapter h3,.chapter p,.chapter a,.chapter figcaption,.chapter img,.directory > summary,.overview-navigation a,.overview-navigation button")) {
    if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden" || element.matches(".hero-art-link,.research-art-link")) continue
    const rect = element.getBoundingClientRect()
    const chapter = element.closest("[data-chapter]")?.getBoundingClientRect()
    const visible = { left: Math.max(0, rect.left, chapter?.left ?? 0), right: Math.min(innerWidth, rect.right, chapter?.right ?? innerWidth), top: Math.max(0, rect.top), bottom: Math.min(innerHeight, rect.bottom) }
    if (Math.min(visible.right, paint.right) - Math.max(visible.left, paint.left) > 1 && Math.min(visible.bottom, paint.bottom) - Math.max(visible.top, paint.top) > 1) collisions.push({ text: element.textContent?.slice(0, 70) ?? "", tag: element.tagName })
  }
  return { paint, collisions, x: document.querySelector("[data-chapter-rail]")?.scrollLeft ?? 0 }
}
