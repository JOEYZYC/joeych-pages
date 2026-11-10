import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { parseYamlValue } from "../src/content/loaders"
import { homeSchema } from "../src/content/page-schemas"
import { projectIdSchema } from "../src/content/schema-fields"
import { canvasProgress, chooseHomeCanvasMode } from "../src/lib/home-canvas-geometry"
import { loadProfileData, selectHomeProjects } from "../src/lib/profile-data"

describe("Home selection and canvas safety", () => {
  const desktop = { width: 1280, height: 900, coarse: false, reduced: false, rootFontSize: 16, availableHeight: 728, requiredHeight: 600 }
  it("enhances only desktop geometry that can contain its content", () => {
    expect(chooseHomeCanvasMode(desktop)).toBe("desktop")
    expect(chooseHomeCanvasMode({ ...desktop, requiredHeight: 800 })).toBe("vertical")
    expect(chooseHomeCanvasMode({ ...desktop, height: 600 })).toBe("vertical")
    expect(chooseHomeCanvasMode({ ...desktop, rootFontSize: 32 })).toBe("vertical")
    expect(chooseHomeCanvasMode({ ...desktop, reduced: true })).toBe("vertical")
    expect(chooseHomeCanvasMode({ ...desktop, width: 640 })).toBe("vertical")
  })
  it("uses native horizontal reading only for suitable coarse screens", () => {
    expect(chooseHomeCanvasMode({ ...desktop, width: 375, height: 812, coarse: true })).toBe("native")
    expect(chooseHomeCanvasMode({ ...desktop, width: 768, height: 1024, coarse: true })).toBe("native")
    expect(chooseHomeCanvasMode({ ...desktop, width: 375, height: 568, coarse: true })).toBe("vertical")
  })
  it("maps the exact sticky start/end, clamping outside the story", () => {
    expect(canvasProgress(0, 100, 2400, 4)).toBe(0)
    expect(canvasProgress(900, 100, 2400, 4)).toBe(1)
    expect(canvasProgress(2500, 100, 2400, 4)).toBe(3)
    expect(canvasProgress(9999, 100, 2400, 4)).toBe(3)
  })
  it("resolves editorial selection without reordering or changing project metadata", async () => {
    const data = await loadProfileData()
    const ids = data.projects.map(({ id }) => id)
    expect(data.homeProjects.map(({ id }) => id)).toEqual(data.home.selected_project_ids)
    expect(data.homeProjects).toHaveLength(2)
    expect(data.projects.map(({ id }) => id)).toEqual(ids)
    expect(data.homeProjects[0]?.status?.zh).toBe("实物尚未完成测试")
    expect(data.homeProjects[0]?.figures[0]?.zh).toContain("3D")
    expect(data.home.headline_lines.map(line => line.zh).join("")).toBe("充满热情的电子工程师")
  })
  it("rejects duplicate and unknown Home selections", async () => {
    const data = await loadProfileData()
    const authored = homeSchema.parse(parseYamlValue(await readFile(new URL("../../Profile/home/home.yml", import.meta.url), "utf8")))
    const id = authored.selected_project_ids[0]
    const duplicate = homeSchema.safeParse({ ...authored, selected_project_ids: [id, id] })
    expect(duplicate.success).toBe(false)
    if (!duplicate.success) expect(duplicate.error.issues).toContainEqual(expect.objectContaining({ message: "duplicate Home project ID" }))
    expect(() => selectHomeProjects({ ...data.home, selected_project_ids: [projectIdSchema.parse("2026-Project-Unknown"), projectIdSchema.parse("2026-Project-AlsoUnknown")] }, data.projects)).toThrow("unknown selected project")
  })
})
