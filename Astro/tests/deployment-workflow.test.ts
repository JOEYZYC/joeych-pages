import { readFile } from "node:fs/promises"

import { z } from "astro/zod"
import { describe, expect, it } from "vitest"
import { parse } from "yaml"

const WORKFLOW_URL = new URL("../../.github/workflows/deploy-pages.yml", import.meta.url)
const SHA_PIN = /^[0-9a-f]{40}$/
const scalarSchema = z.union([z.string(), z.number(), z.boolean()])
const stepSchema = z.object({
  name: z.string(),
  uses: z.string().optional(),
  run: z.string().optional(),
  "working-directory": z.string().optional(),
  with: z.record(z.string(), scalarSchema).optional(),
})
const jobSchema = z.object({ steps: z.array(stepSchema) })
const workflowSchema = z.object({
  on: z.object({
    push: z.object({ branches: z.array(z.string()), paths: z.array(z.string()) }),
    workflow_dispatch: z.object({}),
  }),
  permissions: z.record(z.string(), z.string()),
  jobs: z.object({ build: jobSchema, deploy: jobSchema }),
})

async function loadWorkflow() {
  const raw = await readFile(WORKFLOW_URL, "utf8")
  const workflow = workflowSchema.parse(parse(raw) as unknown)
  return { raw, workflow }
}

describe("GitHub Pages deployment workflow", () => {
  it("publishes only approved inputs with least privilege", async () => {
    const { workflow } = await loadWorkflow()

    expect(workflow.on).toEqual({
      push: {
        branches: ["main"],
        paths: [
          "Astro/**",
          "!Astro/Demo/**",
          "!Astro/research/**",
          "Profile/**",
          ".github/workflows/deploy-pages.yml",
        ],
      },
      workflow_dispatch: {},
    })
    expect(workflow.permissions).toEqual({ contents: "read", pages: "write", "id-token": "write" })
  })

  it("verifies Astro and uploads only Astro/dist", async () => {
    const { raw, workflow } = await loadWorkflow()
    const buildSteps = workflow.jobs.build.steps
    const browserInstall = buildSteps.find(({ name }) => name === "Install Playwright Chrome")
    const verify = buildSteps.find(({ name }) => name === "Build and verify")
    const e2e = buildSteps.find(({ name }) => name === "Run non-visual E2E")
    const uploads = buildSteps.filter(({ uses }) => uses?.startsWith("actions/upload-pages-artifact@"))

    expect(browserInstall).toMatchObject({ run: "pnpm exec playwright install --with-deps chrome", "working-directory": "Astro" })
    expect(verify).toMatchObject({ run: "pnpm run verify", "working-directory": "Astro" })
    expect(e2e).toMatchObject({ run: "pnpm run test:e2e:ci", "working-directory": "Astro" })
    expect(buildSteps.findIndex(({ name }) => name === "Run non-visual E2E")).toBeLessThan(
      buildSteps.findIndex(({ uses }) => uses?.startsWith("actions/upload-pages-artifact@")),
    )
    expect(uploads).toHaveLength(1)
    expect(uploads[0]?.with).toEqual({ path: "Astro/dist" })
    expect(raw).not.toMatch(/(?:Profile|Jeklly)(?:\/|\\).*artifact/i)
    expect(raw).not.toMatch(/\bCNAME\b|custom[ -]domain/i)
  })

  it("pins every action to an immutable audited release", async () => {
    const { raw, workflow } = await loadWorkflow()
    const references = [...workflow.jobs.build.steps, ...workflow.jobs.deploy.steps]
      .flatMap(({ uses }) => uses === undefined ? [] : [uses])

    expect(references).toHaveLength(6)
    for (const reference of references) expect(reference.split("@")[1]).toMatch(SHA_PIN)
    expect(raw.match(/^\s*uses: .+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/gm)).toHaveLength(6)
  })
})
