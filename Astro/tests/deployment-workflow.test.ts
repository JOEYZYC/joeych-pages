import { readFile } from "node:fs/promises"

import { z } from "astro/zod"
import { describe, expect, it } from "vitest"
import { parse } from "yaml"

const WORKFLOW_URL = new URL("../../.github/workflows/deploy-pages.yml", import.meta.url)
const SHA_PIN = /^[0-9a-f]{40}$/

const scalarSchema = z.union([z.string(), z.number(), z.boolean()])
const stepSchema = z
  .object({
    name: z.string(),
    id: z.string().optional(),
    uses: z.string().optional(),
    run: z.string().optional(),
    "working-directory": z.string().optional(),
    with: z.record(z.string(), scalarSchema).optional(),
  })
  .strict()
  .readonly()

const workflowSchema = z
  .object({
    name: z.string(),
    on: z
      .object({
        push: z
          .object({
            branches: z.array(z.string()).readonly(),
            paths: z.array(z.string()).readonly(),
          })
          .strict()
          .readonly(),
        workflow_dispatch: z.object({}).strict().readonly(),
      })
      .strict()
      .readonly(),
    permissions: z
      .object({
        contents: z.literal("read"),
        pages: z.literal("write"),
        "id-token": z.literal("write"),
      })
      .strict()
      .readonly(),
    concurrency: z
      .object({
        group: z.literal("github-pages"),
        "cancel-in-progress": z.literal(true),
      })
      .strict()
      .readonly(),
    jobs: z
      .object({
        build: z
          .object({
            if: z.string(),
            "runs-on": z.string(),
            steps: z.array(stepSchema).readonly(),
          })
          .strict()
          .readonly(),
        deploy: z
          .object({
            if: z.string(),
            "runs-on": z.string(),
            needs: z.string(),
            environment: z
              .object({ name: z.string(), url: z.string() })
              .strict()
              .readonly(),
            steps: z.array(stepSchema).readonly(),
          })
          .strict()
          .readonly(),
      })
      .strict()
      .readonly(),
  })
  .strict()
  .readonly()

async function loadWorkflow() {
  const raw = await readFile(WORKFLOW_URL, "utf8")
  const yamlValue: unknown = parse(raw)
  return { raw, workflow: workflowSchema.parse(yamlValue) }
}

describe("GitHub Pages deployment workflow", () => {
  it("triggers only for approved public inputs on main or manual dispatch", async () => {
    // Given: the checked-in Pages workflow
    const { workflow } = await loadWorkflow()

    // When: its trigger contract is inspected
    const triggers = workflow.on

    // Then: only main and the approved public build inputs trigger publication
    expect(triggers).toEqual({
      push: {
        branches: ["main"],
        paths: [
          "Astro/**",
          "!Astro/Demo/**",
          "!Astro/research/**",
          "Profile/data/**",
          "Profile/media/**",
          ".github/workflows/deploy-pages.yml",
        ],
      },
      workflow_dispatch: {},
    })
  })

  it("uses the least Pages permissions and one cancelling concurrency group", async () => {
    // Given: the checked-in Pages workflow
    const { workflow } = await loadWorkflow()

    // When: repository permissions and concurrency are inspected
    const { permissions, concurrency } = workflow

    // Then: no broader token access or parallel Pages publication is allowed
    expect(permissions).toEqual({ contents: "read", pages: "write", "id-token": "write" })
    expect(concurrency).toEqual({ group: "github-pages", "cancel-in-progress": true })
  })

  it("builds on main with pinned toolchain actions and verified Astro commands", async () => {
    // Given: the checked-in Pages workflow
    const { workflow } = await loadWorkflow()

    // When: the build job is inspected
    const build = workflow.jobs.build

    // Then: checkout, pnpm, Node, Pages setup, install, and verification are exact
    expect(build).toEqual({
      if: "github.ref == 'refs/heads/main'",
      "runs-on": "ubuntu-latest",
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
          with: { "fetch-depth": 1, "persist-credentials": false },
        },
        {
          name: "Setup pnpm",
          uses: "pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86",
          with: { version: "11.18.0" },
        },
        {
          name: "Setup Node.js",
          uses: "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
          with: {
            "node-version": "24",
            cache: "pnpm",
            "cache-dependency-path": "Astro/pnpm-lock.yaml",
          },
        },
        {
          name: "Configure GitHub Pages",
          uses: "actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d",
        },
        {
          name: "Install dependencies",
          run: "pnpm install --frozen-lockfile",
          "working-directory": "Astro",
        },
        {
          name: "Build and verify",
          run: "pnpm run verify",
          "working-directory": "Astro",
        },
        {
          name: "Upload Pages artifact",
          uses: "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9",
          with: { path: "Astro/dist" },
        },
      ],
    })
  })

  it("deploys the build artifact to the protected github-pages environment", async () => {
    // Given: the checked-in Pages workflow
    const { workflow } = await loadWorkflow()

    // When: the deploy job is inspected
    const deploy = workflow.jobs.deploy

    // Then: deployment consumes only build output and publishes the action's page URL
    expect(deploy).toEqual({
      if: "github.ref == 'refs/heads/main'",
      "runs-on": "ubuntu-latest",
      needs: "build",
      environment: {
        name: "github-pages",
        url: `\${{ steps.deployment.outputs.page_url }}`,
      },
      steps: [
        {
          name: "Deploy GitHub Pages",
          id: "deployment",
          uses: "actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128",
        },
      ],
    })
  })

  it("pins every action to an immutable SHA with its audited release metadata", async () => {
    // Given: the checked-in Pages workflow
    const { raw, workflow } = await loadWorkflow()

    // When: action references and their release annotations are inspected
    const actionReferences = [...workflow.jobs.build.steps, ...workflow.jobs.deploy.steps]
      .map(({ uses }) => uses)
      .filter((uses) => uses !== undefined)

    // Then: no action can float to a mutable tag or branch
    expect(actionReferences).toHaveLength(6)
    for (const reference of actionReferences) {
      expect(reference.split("@")[1]).toMatch(SHA_PIN)
    }
    expect(raw).toContain("@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1")
    expect(raw).toContain("@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10")
    expect(raw).toContain("@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0")
    expect(raw).toContain("@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0")
    expect(raw).toContain("@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0")
    expect(raw).toContain("@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0")
  })

  it("contains no alternate or broad publication mechanism", async () => {
    // Given: the checked-in Pages workflow
    const { raw, workflow } = await loadWorkflow()

    // When: its artifact and executable publication surface are inspected
    const uploadSteps = workflow.jobs.build.steps.filter(({ uses }) =>
      uses?.startsWith("actions/upload-pages-artifact@"),
    )

    // Then: only Astro/dist is uploaded and no legacy publication path exists
    expect(uploadSteps).toEqual([
      {
        name: "Upload Pages artifact",
        uses: "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9",
        with: { path: "Astro/dist" },
      },
    ])
    expect(raw).not.toMatch(/\bgh-pages\b|\bCNAME\b|custom[ -]domain/i)
    expect(raw).not.toMatch(/(?:Profile|Jeklly)(?:\/|\\).*artifact/i)
  })
})
