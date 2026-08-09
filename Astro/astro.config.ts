import { fileURLToPath } from "node:url"

import sitemap from "@astrojs/sitemap"
import { defineConfig, fontProviders } from "astro/config"

export default defineConfig({
  output: "static",
  site: "https://joeyzyc.github.io",
  base: "/joeych-pages",
  trailingSlash: "always",
  publicDir: fileURLToPath(new URL("../Profile/media/", import.meta.url)),
  integrations: [sitemap()],
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      weights: ["300 800"],
      styles: ["normal"],
      display: "swap",
      options: {
        variants: [
          {
            src: ["@fontsource-variable/google-sans-code/files/google-sans-code-latin-wght-normal.woff2"],
            weight: "300 800",
            style: "normal",
          },
        ],
      },
    },
  ],
})
