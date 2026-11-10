/* biome-ignore-all lint/complexity/useLiteralKeys: DOMStringMap requires indexed access under strict TypeScript. */
type Color = readonly [number, number, number]
type OverviewOrigin = { readonly path: string; readonly destination: string; readonly chapter: number; readonly href: string; readonly occurrence: number; readonly y: number }

function overviewOrigin(value: unknown): OverviewOrigin | undefined {
  if (typeof value !== "object" || value === null || !("path" in value) || typeof value.path !== "string" || !("destination" in value) || typeof value.destination !== "string" || !("chapter" in value) || typeof value.chapter !== "number" || !("href" in value) || typeof value.href !== "string" || !("occurrence" in value) || typeof value.occurrence !== "number" || !("y" in value) || typeof value.y !== "number") return undefined
  return { path: value.path, destination: value.destination, chapter: value.chapter, href: value.href, occurrence: value.occurrence, y: value.y }
}
type ChipState = {
  x: number
  y: number
  size: number
  r: number
  spread: number
  fill: Color
  stroke: Color
  die: Color
  mark: Color
  trace: number
  field: number
  body: number
  side: number
  label: string
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => t * t * (3 - 2 * t)
const color = (a: Color, b: Color, t: number): Color => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
const rgb = (value: Color) => `rgb(${value.map(Math.round).join(",")})`
const interpolate = (a: ChipState, b: ChipState, t: number): ChipState => ({
  ...a,
  x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), size: mix(a.size, b.size, t),
  r: mix(a.r, b.r, t), spread: mix(a.spread, b.spread, t),
  trace: mix(a.trace, b.trace, t), field: mix(a.field, b.field, t), body: mix(a.body, b.body, t),
  fill: color(a.fill, b.fill, t), stroke: color(a.stroke, b.stroke, t),
  die: color(a.die, b.die, t), mark: color(a.mark, b.mark, t), label: t < .5 ? a.label : b.label,
})

export function initializeChipSite(): void {
  const root = document.documentElement
  const rail = document.querySelector<HTMLElement>("[data-chapter-rail]")
  const canvas = document.querySelector<HTMLElement>("[data-chapter-canvas]")
  const overlay = document.querySelector<HTMLElement>("#chip-overlay")
  const chip = document.querySelector<HTMLElement>("[data-shared-chip]")
  const pins = chip?.querySelector<SVGElement>(".chip-pin-group")
  const shell = chip?.querySelector<SVGElement>(".chip-shell")
  const die = chip?.querySelector<SVGElement>(".chip-die")
  const mark = chip?.querySelector<SVGElement>(".chip-mark")
  const traces = chip?.querySelector<SVGElement>(".chip-traces")
  const field = chip?.querySelector<SVGElement>(".chip-field")
  const caption = chip?.querySelector<HTMLElement>(".chip-caption")
  if (!overlay || !chip || !pins || !shell || !die || !mark || !traces || !field || !caption) return
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  const originKey = "joeych-chip-origin"
  const intentKey = "joeych-chip-return-intent"
  const historyOrigin = (key: "profileChipOrigin" | "profileChipSourceOrigin") => {
    const state: unknown = history.state
    return typeof state === "object" && state !== null && key in state ? overviewOrigin(Reflect.get(state, key)) : undefined
  }
  const storeHistoryOrigin = (key: "profileChipOrigin" | "profileChipSourceOrigin", origin: OverviewOrigin) => {
    const state: unknown = history.state
    history.replaceState({ ...(typeof state === "object" && state !== null ? state : {}), [key]: origin }, "")
  }
  const takeStoredOrigin = (key: string) => {
    try {
      const raw = sessionStorage.getItem(key)
      sessionStorage.removeItem(key)
      return raw ? overviewOrigin(JSON.parse(raw)) : undefined
    } catch { return undefined }
  }
  if (!rail) {
    // Bind the origin to this actual reader history entry, not every future same-origin visit.
    const inbound = takeStoredOrigin(originKey)
    if (inbound?.destination === location.pathname) storeHistoryOrigin("profileChipSourceOrigin", inbound)
    document.querySelector<HTMLAnchorElement>("[data-overview-return]")?.addEventListener("click", (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(event.currentTarget instanceof HTMLAnchorElement)) return
      const origin = historyOrigin("profileChipSourceOrigin")
      if (origin?.path === event.currentTarget.pathname) {
        try { sessionStorage.setItem(intentKey, JSON.stringify(origin)) } catch {}
      }
    })
  }
  const chapters = [...document.querySelectorAll<HTMLElement>("section[data-chapter]")]
  const previous = document.querySelector<HTMLButtonElement>("[data-chapter-prev]")
  const next = document.querySelector<HTMLButtonElement>("[data-chapter-next]")
  const position = document.querySelector<HTMLElement>("[data-chapter-position]")
  const dots = [...document.querySelectorAll<HTMLElement>("[data-chapter-go]")]
  let index = 0
  let moveFrame = 0
  let resizeFrame = 0
  let settleTimer = 0
  let wheelTimer = 0
  let wheelLocked = false
  let wheelStart = 0
  let pendingFocus: number | undefined
  let restoring = false
  let paints = 0
  let documentShown = document.readyState === "complete"
  const clamp = (value: number) => Math.max(0, Math.min(chapters.length - 1, value))
  const horizontal = () => !!rail && root.dataset["reflow"] === "false"

  const states = (): readonly ChipState[] => {
    const dark = root.dataset["theme"] === "dark"
    const paper: Color = dark ? [16, 15, 15] : [255, 252, 240]
    const ink: Color = dark ? [255, 252, 240] : [16, 15, 15]
    const cyan: Color = dark ? [90, 189, 172] : [28, 108, 102]
    const soft: Color = dark ? [40, 39, 38] : [230, 228, 217]
    const mint: Color = [135, 211, 195]
    const base: readonly ChipState[] = [
      { x: .79, y: .45, size: 350, r: -12, spread: 1, fill: ink, stroke: ink, die: paper, mark: cyan, trace: .2, field: 0, body: 1, side: 1, label: "01 / CURIOSITY" },
      { x: .91, y: .34, size: 128, r: 23, spread: 1.12, fill: paper, stroke: cyan, die: soft, mark: ink, trace: .95, field: .08, body: 1, side: 1, label: "02 / MAKING" },
      { x: .77, y: .28, size: 220, r: -7, spread: .82, fill: paper, stroke: cyan, die: paper, mark: cyan, trace: .22, field: .95, body: .35, side: 1, label: "03 / SIGNAL" },
      { x: .24, y: .75, size: 175, r: 45, spread: 1.05, fill: [16, 15, 15], stroke: mint, die: [16, 15, 15], mark: [255, 252, 240], trace: .8, field: .45, body: .8, side: -1, label: "04 / CONNECTIONS" },
      { x: .40, y: .77, size: 130, r: -12, spread: .94, fill: paper, stroke: cyan, die: paper, mark: ink, trace: .25, field: .1, body: 1, side: -1, label: "05 / STILL CURIOUS" },
    ]
    const mobile = [
      { x: .79, y: .53, size: 128, r: -12 },
      { x: .85, y: .29, size: 66, r: 24 },
      { x: .85, y: .26, size: 72, r: -7 },
      { x: .84, y: .26, size: 82, r: 45 },
      { x: .85, y: .27, size: 70, r: -12 },
    ]
    return base.map((state, i) => {
      const adjusted = innerWidth < 600 ? { ...state, ...mobile[i] } : state
      return { ...adjusted, x: adjusted.x * innerWidth, y: adjusted.y * innerHeight }
    })
  }

  const desired = (): ChipState => {
    const list = states()
    const first = list[0]
    if (!first) throw new Error("Missing chip composition")
    if (!rail || root.dataset["view"] === "detail") return { ...first, x: innerWidth - (innerWidth < 600 ? 120 : 140), y: 32, size: innerWidth < 600 ? 29 : 36, r: 0, fill: first.die, stroke: first.mark, die: first.die, mark: first.stroke, trace: .3, field: .1, body: 1, label: "" }
    const progress = Math.max(0, Math.min(4, rail.scrollLeft / Math.max(1, rail.clientWidth)))
    const i = Math.floor(progress)
    const t = progress - i
    const a = list[i] ?? first
    const b = list[Math.min(4, i + 1)] ?? a
    if (reduced.matches) return list[Math.round(progress)] ?? a
    if (t < .001 || i === 4) return a
    if (t > .999) return b
    // Clear the entering chapter before its first target crosses the viewport edge.
    // The outer transit lane also stays clear of longer translated directory labels.
    const smallA = { ...a, size: Math.min(46, a.size), r: a.r * .3, label: "" }
    const smallB = { ...b, size: Math.min(46, b.size), r: b.r * .3, label: "" }
    const exit = { ...smallA, x: innerWidth < 600 || a.side > 0 ? innerWidth + 40 : -40 }
    const entry = { ...smallB, x: innerWidth < 600 || b.side > 0 ? innerWidth + 40 : -40 }
    const topA = { ...exit, y: -30 }
    const topB = { ...entry, y: -30 }
    const shrinkEnd = innerWidth < 600 ? .025 : .05
    const exitEnd = innerWidth < 600 ? .045 : .07
    if (t < shrinkEnd) return interpolate(a, smallA, ease(t / shrinkEnd))
    if (t < exitEnd) return interpolate(smallA, exit, ease((t - shrinkEnd) / (exitEnd - shrinkEnd)))
    if (t < .28) return interpolate(exit, topA, ease((t - exitEnd) / (.28 - exitEnd)))
    if (t < .60) return interpolate(topA, topB, ease((t - .28) / .32))
    if (t < .90) return interpolate(topB, entry, ease((t - .60) / .30))
    if (t < .96) return interpolate(entry, smallB, ease((t - .90) / .06))
    return interpolate(smallB, b, ease((t - .96) / .04))
  }

  const paint = () => {
    if (document.hidden) return
    overlay.hidden = root.dataset["reflow"] === "true" && !!rail
    if (overlay.hidden) return
    const state = desired()
    chip.style.transform = `translate3d(${state.x - 160}px,${state.y - 160}px,0) rotate(${state.r}deg) scale(${state.size / 320})`
    pins.style.transform = `scale(${state.spread})`
    shell.style.fill = rgb(state.fill)
    shell.style.stroke = rgb(state.stroke)
    shell.style.opacity = String(state.body)
    pins.style.stroke = rgb(state.stroke)
    die.style.fill = rgb(state.die)
    die.style.stroke = rgb(state.stroke)
    mark.style.stroke = rgb(state.mark)
    traces.style.stroke = rgb(state.stroke)
    traces.style.opacity = String(state.trace)
    field.style.stroke = rgb(state.stroke)
    field.style.opacity = String(state.field)
    field.style.transform = `rotate(${state.r * -1.5}deg)`
    caption.textContent = state.label
    caption.style.color = rgb(state.stroke)
    caption.style.opacity = state.size >= 220 ? "1" : "0"
    overlay.dataset["updates"] = String(++paints)
    overlay.dataset["size"] = state.size.toFixed(3)
    overlay.dataset["x"] = state.x.toFixed(3)
    overlay.dataset["y"] = state.y.toFixed(3)
    overlay.dataset["rotation"] = state.r.toFixed(3)
    overlay.dataset["animating"] = String(!!moveFrame)
  }

  const stopMove = () => {
    if (moveFrame) cancelAnimationFrame(moveFrame)
    moveFrame = 0
    rail?.style.removeProperty("scroll-snap-type")
    overlay.dataset["animating"] = "false"
  }
  const ui = () => {
    if (rail && horizontal()) index = clamp(Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth)))
    root.dataset["activeChapter"] = String(index)
    if (position) position.textContent = `${String(index + 1).padStart(2, "0")} / 05`
    if (previous) previous.disabled = index === 0
    if (next) next.disabled = index === 4
    for (const dot of dots) {
      if (Number(dot.dataset["chapterGo"]) === index) dot.setAttribute("aria-current", "step")
      else dot.removeAttribute("aria-current")
    }
    paint()
  }
  const settle = () => {
    if (!rail || moveFrame) return
    ui()
    if (horizontal() && Math.abs(rail.scrollLeft - index * rail.clientWidth) > 3) return
    if (pendingFocus !== undefined) {
      restoring = true
      chapters[pendingFocus]?.focus({ preventScroll: true })
      restoring = false
      pendingFocus = undefined
    }
    // Scene states are hashes on the existing Home document, never new routes.
    if (horizontal() && documentShown) {
      history.replaceState(history.state, "", `#chapter-${index}`)
      window.dispatchEvent(new Event("profile:urlchange"))
    }
  }
  const go = (target: number, focus = false, instant = false) => {
    if (!rail) return
    const n = clamp(target)
    stopMove()
    clearTimeout(settleTimer)
    pendingFocus = focus ? n : undefined
    if (!horizontal()) {
      index = n
      chapters[n]?.scrollIntoView({ block: "start", behavior: "instant" })
      ui()
      settle()
      return
    }
    const destination = n * rail.clientWidth
    if (instant || reduced.matches) {
      rail.scrollLeft = destination
      ui()
      settle()
      return
    }
    const from = rail.scrollLeft
    const started = performance.now()
    rail.style.scrollSnapType = "none"
    const move = (now: number) => {
      const progress = Math.min(1, (now - started) / 620)
      rail.scrollLeft = from + (destination - from) * (1 - (1 - progress) ** 3)
      ui()
      if (progress < 1) moveFrame = requestAnimationFrame(move)
      else {
        moveFrame = 0
        rail.style.removeProperty("scroll-snap-type")
        rail.scrollLeft = destination
        settle()
      }
    }
    moveFrame = requestAnimationFrame(move)
  }
  const applyLayout = () => {
    stopMove()
    if (rail && canvas) {
      const focused = chapters.find((chapter) => chapter.contains(document.activeElement))
      const retained = focused ? Number(focused.dataset["chapter"]) : index
      root.dataset["reflow"] = String(innerHeight < 520 || innerWidth < 340 || Number.parseFloat(getComputedStyle(root).fontSize) > 22)
      canvas.style.setProperty("--scene-h", `${innerHeight}px`)
      index = clamp(retained)
      if (horizontal()) rail.scrollLeft = index * rail.clientWidth
      ui()
    } else paint()
  }

  // Keep the original graphic in the top layer during full-length project reading.
  const projectDialog = document.querySelector<HTMLDialogElement>("[data-project-dialog]")
  if (projectDialog) {
    const dock = () => {
      if (projectDialog.open && overlay.parentElement !== projectDialog) projectDialog.append(overlay)
      else if (!projectDialog.open && overlay.parentElement !== document.body) document.body.append(overlay)
      paint()
    }
    new MutationObserver(dock).observe(projectDialog, { attributes: true, attributeFilter: ["open"] })
    dock()
  }
  new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ["data-theme"] })
  window.addEventListener("resize", () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; applyLayout() })
  })
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stopMove(); if (resizeFrame) cancelAnimationFrame(resizeFrame); resizeFrame = 0 }
    else applyLayout()
  })
  reduced.addEventListener("change", applyLayout)
  if (!rail || !canvas) { applyLayout(); return }
  document.querySelector<HTMLElement>("[data-overview-controls]")?.removeAttribute("hidden")
  previous?.addEventListener("click", () => go(index - 1))
  next?.addEventListener("click", () => go(index + 1))
  for (const dot of dots) dot.addEventListener("click", (event) => {
    event.preventDefault()
    go(Number(dot.dataset["chapterGo"]), true)
  })
  rail.addEventListener("scroll", () => {
    ui()
    clearTimeout(settleTimer)
    settleTimer = window.setTimeout(settle, 140)
  }, { passive: true })
  rail.addEventListener("scrollend", settle)
  rail.addEventListener("pointerdown", stopMove, { passive: true })
  rail.addEventListener("touchstart", stopMove, { passive: true })
  rail.addEventListener("focusin", (event) => {
    if (restoring || !horizontal() || !(event.target instanceof HTMLElement)) return
    const owner = event.target.closest<HTMLElement>("[data-chapter]")
    if (owner) go(Number(owner.dataset["chapter"]), false, true)
  })
  rail.addEventListener("keydown", (event) => {
    if (!horizontal() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !(event.target instanceof Element) || event.target.closest("input,textarea,select,[contenteditable]")) return
    const directions: Record<string, number> = { ArrowRight: index + 1, PageDown: index + 1, ArrowLeft: index - 1, PageUp: index - 1, Home: 0, End: 4 }
    const target = directions[event.key]
    if (target === undefined || target < 0 || target > 4 || target === index) return
    event.preventDefault()
    go(target, true)
  })
  rail.addEventListener("wheel", (event) => {
    if (!horizontal() || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || !(event.target instanceof Element) || event.target.closest("input,textarea,select,[contenteditable]") || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || Math.abs(event.deltaY) < 2) return
    const sign = Math.sign(event.deltaY)
    const atEdge = sign > 0 ? rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2 : rail.scrollLeft <= 1
    if (atEdge && !wheelLocked) return
    event.preventDefault()
    if (!wheelLocked) {
      wheelLocked = true
      wheelStart = performance.now()
      go(index + sign)
    }
    clearTimeout(wheelTimer)
    wheelTimer = window.setTimeout(() => { wheelLocked = false }, Math.max(230, 700 - (performance.now() - wheelStart)))
  }, { passive: false })
  const readHash = () => {
    const match = /^#chapter-([0-4])$/.exec(location.hash)
    if (match?.[1]) index = Number(match[1])
  }
  window.addEventListener("hashchange", () => { readHash(); go(index, false, true) })
  rail.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]")
    if (!anchor || anchor.origin !== location.origin || anchor.pathname === location.pathname) return
    const links = [...rail.querySelectorAll<HTMLAnchorElement>("a[href]")]
    const origin = { path: location.pathname, destination: anchor.pathname, chapter: index, href: anchor.getAttribute("href") ?? "", occurrence: links.filter((link) => link.getAttribute("href") === anchor.getAttribute("href")).indexOf(anchor), y: scrollY }
    storeHistoryOrigin("profileChipOrigin", origin)
    try { sessionStorage.setItem(originKey, JSON.stringify(origin)) } catch {}
  })
  let restored = false
  let originInvoker: HTMLAnchorElement | undefined
  const focusOriginInvoker = () => {
    if (!originInvoker?.isConnected || document.hidden || Number(originInvoker.closest<HTMLElement>("[data-chapter]")?.dataset["chapter"]) !== index) return
    restoring = true
    originInvoker.focus({ preventScroll: true })
    restoring = false
  }
  const restoreOrigin = (event?: PageTransitionEvent) => {
    if (restored && !event?.persisted) return
    restored = true
    originInvoker = undefined
    const explicitHash = /^#chapter-[0-4]$/.test(location.hash)
    readHash()
    applyLayout()
    const navigation = performance.getEntriesByType("navigation").find((entry): entry is PerformanceNavigationTiming => entry instanceof PerformanceNavigationTiming)
    const backForward = event?.persisted || navigation?.type === "back_forward"
    const intent = takeStoredOrigin(intentKey)
    takeStoredOrigin(originKey)
    const candidate = backForward ? historyOrigin("profileChipOrigin") : navigation?.type === "navigate" && !explicitHash ? intent : undefined
    const origin = candidate?.path === location.pathname && (!explicitHash || candidate.chapter === index) ? candidate : undefined
    if (origin) {
      index = clamp(origin.chapter)
      go(index, false, true)
      originInvoker = [...rail.querySelectorAll<HTMLAnchorElement>("a[href]")].filter((link) => link.getAttribute("href") === origin.href)[origin.occurrence]
      focusOriginInvoker()
      scrollTo({ top: origin.y, behavior: "instant" })
    } else go(index, false, true)
  }
  window.addEventListener("pageshow", (event) => {
    // Native initial fragment navigation must finish before adding a scene hash.
    documentShown = true
    restoreOrigin(event)
    settle()
    if (originInvoker) requestAnimationFrame(focusOriginInvoker)
  })
  restoreOrigin()
  document.fonts.ready.then(applyLayout)
}
