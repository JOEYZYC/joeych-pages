import { fileURLToPath } from "node:url"

import sitemap from "@astrojs/sitemap"
import { defineConfig } from "astro/config"

export default defineConfig({
  output: "static",
  site: "https://joeyzyc.github.io",
  base: "/joeych-pages",
  trailingSlash: "always",
  publicDir: fileURLToPath(new URL("../Profile/media/", import.meta.url)),
  integrations: [sitemap()],
})
