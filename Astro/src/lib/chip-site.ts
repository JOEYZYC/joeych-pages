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
  fill: Color
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => t * t * (3 - 2 * t)
const color = (a: Color, b: Color, t: number): Color => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
const rgb = (value: Color) => `rgb(${value.map(Math.round).join(",")})`
const interpolate = (a: ChipState, b: ChipState, t: number): ChipState => ({
  ...a,
  x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), size: mix(a.size, b.size, t),
  fill: color(a.fill, b.fill, t),
})

export function initializeChipSite(): void {
  const root = document.documentElement
  const rail = document.querySelector<HTMLElement>("[data-chapter-rail]")
  const canvas = document.querySelector<HTMLElement>("[data-chapter-canvas]")
  const overlay = document.querySelector<HTMLElement>("#chip-overlay")
  const chip = document.querySelector<HTMLElement>("[data-shared-chip]")
  const shape = chip?.querySelector<SVGElement>(".chapter-shape")
  if (!overlay || !chip || !shape) return
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
  let layoutWidth = rail?.clientWidth ?? innerWidth
  let moveFrame = 0
  let resizeFrame = 0
  let settleTimer = 0
  let wheelTimer = 0
  let wheelLocked = false
  let wheelStart = 0
  let pendingFocus: number | undefined
  let destinationIndex: number | undefined
  let restoring = false
  let paints = 0
  let documentShown = document.readyState === "complete"
  let movingShape: ChipState | undefined
  let entrance: Animation[] = []
  let layers: Animation[] = []
  const clearLayers = () => { for (const animation of layers) animation.cancel(); layers = [] }
  const clearEntrance = () => { for (const animation of entrance) animation.cancel(); entrance = [] }
  const clamp = (value: number) => Math.max(0, Math.min(chapters.length - 1, value))
  const horizontal = () => !!rail && root.dataset["reflow"] === "false"

  const states = (): readonly ChipState[] => {
    const dark = root.dataset["theme"] === "dark"
    const ink: Color = dark ? [255, 252, 240] : [16, 15, 15]
    const cyan: Color = dark ? [90, 189, 172] : [28, 108, 102]
    const base: readonly ChipState[] = [
      { x: .79, y: .45, size: Math.min(280, innerWidth * .23), fill: ink },
      { x: .90, y: .18, size: 80, fill: cyan },
      { x: .87, y: .18, size: 96, fill: ink },
      { x: .89, y: .18, size: 80, fill: [135, 211, 195] },
      { x: .85, y: .18, size: 72, fill: cyan },
    ]
    const mobile = [
      { x: .87, y: .29, size: 72 },
      { x: .87, y: .28, size: 60 },
      { x: .87, y: .28, size: 68 },
      { x: .87, y: .28, size: 60 },
      { x: .87, y: .28, size: 56 },
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
    if (!rail || root.dataset["view"] === "detail") return { ...first, x: innerWidth - (innerWidth < 600 ? 120 : 140), y: 32, size: innerWidth < 600 ? 24 : 28 }
    if (movingShape) return movingShape
    const progress = Math.max(0, Math.min(4, rail.scrollLeft / Math.max(1, rail.clientWidth)))
    const i = Math.floor(progress)
    const t = progress - i
    const a = list[i] ?? first
    const b = list[Math.min(4, i + 1)] ?? a
    if (reduced.matches) return list[Math.round(progress)] ?? a
    if (t < .001 || i === 4) return a
    if (t > .999) return b
    // Native touch/trackpad owns the rail. Its intermediate shape uses the clear band.
    return { ...interpolate(a, b, t), x: innerWidth * mix(.76, .87, t), y: innerHeight * .18, size: innerWidth < 600 ? 48 : 64 }
  }

  const paint = () => {
    if (document.hidden) return
    overlay.hidden = root.dataset["reflow"] === "true" && !!rail
    if (overlay.hidden) return
    const state = desired()
    chip.style.transform = `translate3d(${state.x - 160}px,${state.y - 160}px,0) scale(${state.size / 320})`
    shape.style.fill = rgb(state.fill)
    overlay.dataset["updates"] = String(++paints)
    overlay.dataset["size"] = state.size.toFixed(3)
    overlay.dataset["x"] = state.x.toFixed(3)
    overlay.dataset["y"] = state.y.toFixed(3)
    overlay.dataset["animating"] = String(!!moveFrame)
  }

  const stopMove = () => {
    if (moveFrame) cancelAnimationFrame(moveFrame)
    moveFrame = 0
    movingShape = undefined
    destinationIndex = undefined
    pendingFocus = undefined
    clearLayers()
    clearEntrance()
    rail?.style.removeProperty("scroll-snap-type")
    overlay.dataset["animating"] = "false"
  }
  const ui = () => {
    if (rail && horizontal() && rail.clientWidth === layoutWidth) index = clamp(Math.round(rail.scrollLeft / Math.max(1, layoutWidth)))
    root.dataset["activeChapter"] = String(index)
    if (position) position.textContent = `${String(index + 1).padStart(2, "0")} / 05`
    if (previous) previous.disabled = (destinationIndex ?? index) === 0
    if (next) next.disabled = (destinationIndex ?? index) === 4
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
    const currentShape = desired()
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
    if (Math.abs(destination - from) < 1) { ui(); settle(); return }
    const started = performance.now()
    destinationIndex = n
    const endShape = states()[n] ?? currentShape
    const small = { ...currentShape, size: innerWidth < 600 ? 48 : 64 }
    const lane = { ...small, x: innerWidth * .87, y: innerHeight * .18 }
    const arrival = { ...endShape, size: small.size }
    const incoming = chapters[n]
    for (const [selector, distance, delay] of [["h2,h1", 18, 0], [".hero-art-link,.research-art-link,.skill-pathways,.experience-preview", 32, 90]] as const) {
      for (const element of incoming?.querySelectorAll<HTMLElement>(selector) ?? []) {
        layers.push(element.animate([{ translate: `0 ${distance}px` }, { translate: "0 0" }], { duration: 440, delay: 640 + delay, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }))
      }
    }
    rail.style.scrollSnapType = "none"
    const move = (now: number) => {
      const elapsed = now - started
      const progress = Math.max(0, Math.min(1, (elapsed - 320) / 520))
      rail.scrollLeft = from + (destination - from) * ease(progress)
      movingShape = elapsed < 160 ? interpolate(currentShape, small, ease(elapsed / 160))
        : elapsed < 320 ? interpolate(small, lane, ease((elapsed - 160) / 160))
        : elapsed < 840 ? { ...lane, fill: color(currentShape.fill, endShape.fill, progress), x: innerWidth * mix(.87, .76, Math.sin(progress * Math.PI)) }
        : elapsed < 960 ? interpolate({ ...lane, fill: endShape.fill }, arrival, ease((elapsed - 840) / 120))
        : interpolate(arrival, endShape, ease(Math.min(1, (elapsed - 960) / 160)))
      ui()
      if (elapsed < 1120) moveFrame = requestAnimationFrame(move)
      else {
        moveFrame = 0
        movingShape = undefined
        destinationIndex = undefined
        clearLayers()
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
      layoutWidth = rail.clientWidth
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
  previous?.addEventListener("click", () => go((destinationIndex ?? index) - 1))
  next?.addEventListener("click", () => go((destinationIndex ?? index) + 1))
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
  const cancelGesture = () => { stopMove(); ui() }
  rail.addEventListener("pointerdown", cancelGesture, { passive: true })
  rail.addEventListener("touchstart", cancelGesture, { passive: true })
  rail.addEventListener("focusin", (event) => {
    if (restoring || !horizontal() || !(event.target instanceof HTMLElement)) return
    const owner = event.target.closest<HTMLElement>("[data-chapter]")
    if (owner) go(Number(owner.dataset["chapter"]), false, true)
  })
  rail.addEventListener("keydown", (event) => {
    if (!horizontal() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !(event.target instanceof Element) || event.target.closest("input,textarea,select,[contenteditable]")) return
    const origin = destinationIndex ?? index
    const directions: Record<string, number> = { ArrowRight: origin + 1, PageDown: origin + 1, ArrowLeft: origin - 1, PageUp: origin - 1, Home: 0, End: 4 }
    const target = directions[event.key]
    if (target === undefined || target < 0 || target > 4 || target === origin) return
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
  document.addEventListener("focusin", (event) => {
    clearEntrance()
    if (event.target instanceof Node && !rail.contains(event.target)) pendingFocus = undefined
  })
  document.fonts.ready.then(() => { if (!moveFrame) ui() })
  // Only a fresh, unfragmented Home entry. Never wait for fonts or move focus.
  const navigation = performance.getEntriesByType("navigation")[0]
  if (horizontal() && !reduced.matches && !location.hash && !originInvoker && navigation instanceof PerformanceNavigationTiming && navigation.type === "navigate") {
    root.dataset["homeEntrance"] = "played"
    for (const [i, line] of [...document.querySelectorAll<HTMLElement>(".chapter-hello h1 > span")].entries()) {
      entrance.push(line.animate([{ clipPath: "inset(0 0 100% 0)", translate: "0 18px" }, { clipPath: "inset(0)", translate: "0 0" }], { duration: 520, delay: i * 80, easing: "cubic-bezier(.2,.8,.2,1)" }))
    }
    entrance.push(shape.animate([{ transform: "scale(.65)" }, { transform: "scale(1)" }], { duration: 680, easing: "cubic-bezier(.16,1,.3,1)" }))
  }
}
