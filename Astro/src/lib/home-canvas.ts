import { canvasProgress, chooseHomeCanvasMode, type HomeCanvasMode } from "./home-canvas-geometry"

export function initializeHomeCanvas(canvas: HTMLElement): void {
  if (canvas.getAttribute("data-canvas-ready") === "true") return
  const stage = canvas.querySelector<HTMLElement>("[data-home-stage]")
  const viewport = canvas.querySelector<HTMLElement>("[data-home-viewport]")
  const rail = canvas.querySelector<HTMLElement>("[data-home-rail]")
  const controls = canvas.querySelector<HTMLElement>("[data-home-controls]")
  const panels = [...canvas.querySelectorAll<HTMLElement>("[data-home-panel]")]
  const previous = canvas.querySelector<HTMLButtonElement>("[data-home-prev]")
  const next = canvas.querySelector<HTMLButtonElement>("[data-home-next]")
  const status = canvas.querySelector<HTMLElement>("[data-home-position]")
  const hint = canvas.querySelector<HTMLElement>("[data-home-hint]")
  if (!stage || !viewport || !rail || !controls || !previous || !next || !status || !hint || panels.length !== 4) return
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  const coarse = matchMedia("(pointer: coarse)")
  let mode: HomeCanvasMode = "vertical"
  let index = 0
  let current = 0
  let target = 0
  let velocity = 0
  let frame = 0
  let resizeFrame = 0
  let headerHeight = 72
  let available = 600
  let started = false
  const animations: Animation[] = []
  const clamp = (value: number) => Math.max(0, Math.min(panels.length - 1, value))
  const stride = () => (panels[1]?.offsetLeft ?? 0) - (panels[0]?.offsetLeft ?? 0)
  const start = () => Math.max(0, canvas.getBoundingClientRect().top + scrollY - headerHeight)
  const travel = () => Math.max(1, canvas.offsetHeight - stage.offsetHeight)
  const announce = (value: number) => {
    const selected = Math.round(clamp(value))
    if (selected !== index || !status.textContent) {
      index = selected
      status.textContent = (canvas.getAttribute("data-position-template") ?? "{current} / {total}").replace("{current}", String(index + 1)).replace("{total}", String(panels.length))
    }
    previous.disabled = selected === 0
    next.disabled = selected === panels.length - 1
    canvas.setAttribute("data-active-panel", String(selected))
  }
  const paint = () => {
    rail.style.transform = `translate3d(${-current * stride()}px, 0, 0)`
    announce(current)
  }
  const tick = () => {
    frame = 0
    if (document.hidden || mode !== "desktop") return
    velocity = (velocity + (target - current) * 0.075) * 0.73
    current += velocity
    if (Math.abs(target - current) < 0.0004 && Math.abs(velocity) < 0.0004) {
      current = target
      velocity = 0
    } else frame = requestAnimationFrame(tick)
    paint()
  }
  const sync = () => {
    if (mode === "desktop") {
      target = canvasProgress(scrollY, start(), travel(), panels.length)
      if (!frame && !document.hidden) frame = requestAnimationFrame(tick)
    } else if (mode === "native") announce(rail.scrollLeft / Math.max(1, stride()))
  }
  const go = (requested: number, instant = false, focus = false) => {
    const selected = Math.round(clamp(requested))
    const panel = panels[selected]
    if (!panel) return
    if (mode === "desktop") {
      if (instant) { current = selected; target = selected; velocity = 0; paint() }
      window.scrollTo({ top: start() + travel() * selected / (panels.length - 1), behavior: instant || reduced.matches ? "instant" : "smooth" })
    } else if (mode === "native") rail.scrollTo({ left: stride() * selected, behavior: instant || reduced.matches ? "instant" : "smooth" })
    else panel.scrollIntoView({ block: "start", behavior: instant || reduced.matches ? "instant" : "smooth" })
    if (focus) panel.focus({ preventScroll: true })
  }
  const revealHash = () => {
    let id = ""
    try { id = decodeURIComponent(location.hash.slice(1)) } catch { return }
    const selected = panels.findIndex(panel => panel.id === id || [...panel.querySelectorAll("[id]")].some(child => child.id === id))
    if (selected >= 0) go(selected, true)
  }
  const measure = () => {
    resizeFrame = 0
    const focusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    const focused = panels.findIndex(panel => panel.contains(document.activeElement))
    const retained = focused >= 0 ? focused : index
    const oldMode = mode
    const canvasBounds = canvas.getBoundingClientRect()
    const wasVisible = canvasBounds.bottom > headerHeight && canvasBounds.top < innerHeight
    headerHeight = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 72
    available = Math.max(0, innerHeight - headerHeight - 100)
    const required = Math.max(...panels.map(panel => (panel.firstElementChild?.scrollHeight ?? 0) + 64))
    mode = chooseHomeCanvasMode({ width: innerWidth, height: innerHeight, coarse: coarse.matches, reduced: reduced.matches, rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize), availableHeight: available, requiredHeight: required })
    canvas.setAttribute("data-mode", mode)
    canvas.style.setProperty("--home-header", `${headerHeight}px`)
    canvas.style.setProperty("--home-stage-height", `${innerHeight - headerHeight}px`)
    canvas.style.setProperty("--home-panel-height", `${available}px`)
    canvas.style.setProperty("--home-panel-width", `${viewport.clientWidth - 16}px`)
    canvas.style.setProperty("--home-travel", `${Math.max(600, innerHeight * 0.9)}px`)
    if (frame) { cancelAnimationFrame(frame); frame = 0 }
    rail.style.transform = ""
    velocity = 0
    if (oldMode === "desktop" && mode !== "desktop") viewport.scrollLeft = 0
    hint.textContent = canvas.getAttribute(`data-hint-${mode}`) ?? ""
    controls.hidden = mode === "vertical"
    if (started && (focused >= 0 || (oldMode !== mode && wasVisible))) {
      announce(retained)
      requestAnimationFrame(() => {
        if (mode === "vertical" && focusedElement && focusedElement !== panels[retained] && document.activeElement === focusedElement) {
          focusedElement.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" })
          const bounds = focusedElement.getBoundingClientRect()
          if (bounds.top < headerHeight + 8) window.scrollBy({ top: bounds.top - headerHeight - 8, behavior: "instant" })
        } else go(retained, true)
      })
    }
    else if (mode === "desktop") { current = canvasProgress(scrollY, start(), travel(), panels.length); target = current; paint() }
    else if (mode === "native") sync()
    else announce(retained)
    started = true
  }
  const requestMeasure = () => { if (!resizeFrame) resizeFrame = requestAnimationFrame(measure) }
  previous.addEventListener("click", () => go(index - 1))
  next.addEventListener("click", () => go(index + 1))
  for (const control of canvas.querySelectorAll<HTMLButtonElement>("[data-home-go]")) control.addEventListener("click", () => go(Number(control.getAttribute("data-home-go")), false, true))
  for (const [selected, panel] of panels.entries()) panel.addEventListener("focusin", () => { if (mode !== "vertical") go(selected, true) })
  canvas.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !(event.target instanceof Element) || event.target.closest("input, textarea, select, [contenteditable], dialog")) return
    const direction = event.key === "ArrowRight" || event.key === "PageDown" ? 1 : event.key === "ArrowLeft" || event.key === "PageUp" ? -1 : 0
    if (!direction || mode === "vertical" || clamp(index + direction) === index) return
    event.preventDefault()
    const handOffFocus = event.target.closest("[data-home-panel]") !== null
    go(index + direction, handOffFocus, handOffFocus)
  })
  const entrance = () => {
    for (const animation of animations) animation.cancel()
    animations.length = 0
    if (reduced.matches || index !== 0) return
    for (const [i, line] of [...canvas.querySelectorAll<HTMLElement>(".home-headline-line > span")].entries()) animations.push(line.animate([{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], { duration: 650, delay: i * 100, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }))
    const buddy = canvas.querySelector<HTMLElement>(".home-buddy")
    if (buddy) animations.push(buddy.animate([{ transform: "rotate(-8deg) scale(.7)", opacity: 0 }, { transform: "rotate(12deg) scale(1.025)", opacity: 1, offset: 0.75 }, { transform: "rotate(9deg) scale(1)", opacity: 1 }], { duration: 800, easing: "ease-out", fill: "backwards" }))
  }
  canvas.querySelector("[data-home-replay]")?.addEventListener("click", () => { go(0, true); entrance() })
  window.addEventListener("scroll", sync, { passive: true })
  rail.addEventListener("scroll", () => { if (mode === "native") sync() }, { passive: true })
  window.addEventListener("resize", requestMeasure)
  window.addEventListener("pageshow", () => { requestMeasure(); requestAnimationFrame(revealHash) })
  window.addEventListener("hashchange", revealHash)
  window.addEventListener("popstate", () => { requestMeasure(); requestAnimationFrame(revealHash) })
  reduced.addEventListener("change", () => { for (const animation of animations) animation.cancel(); requestMeasure() })
  coarse.addEventListener("change", requestMeasure)
  document.addEventListener("visibilitychange", () => { if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0 } else sync() })
  for (const control of canvas.querySelectorAll<HTMLElement>("[data-home-enhancement]")) control.hidden = false
  canvas.setAttribute("data-canvas-ready", "true")
  measure()
  requestAnimationFrame(revealHash)
  document.fonts.ready.then(() => { requestMeasure(); entrance() })
  window.setTimeout(requestMeasure, 2000)
}
