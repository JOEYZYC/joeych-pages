import { join } from "node:path"
import { defineConfig } from "astro/config"

const outputDirectory = process.env.ARCHIVE_LINK_TEST_OUT_DIR

if (outputDirectory === undefined) {
  throw new Error("ARCHIVE_LINK_TEST_OUT_DIR is required")
}

export default defineConfig({
  cacheDir: join(outputDirectory, "cache"),
  outDir: outputDirectory,
})
