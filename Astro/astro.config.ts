import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

import sitemap from "@astrojs/sitemap"
import { defineConfig, fontProviders } from "astro/config"

const profileDirectory = fileURLToPath(new URL("../Profile/", import.meta.url))
if (existsSync(fileURLToPath(new URL("../Profile/private/", import.meta.url)))) {
  throw new Error("Profile/private must not exist because Profile is published directly")
}
if (existsSync(fileURLToPath(new URL("../Profile/profile/", import.meta.url)))) {
  throw new Error("Profile/profile is retired; use the page-owned Profile bundles")
}

export default defineConfig({
  output: "static",
  site: "https://joeyzyc.github.io",
  base: "/joeych-pages",
  trailingSlash: "always",
  publicDir: profileDirectory,
  integrations: [sitemap()],
  fonts: [
    {
      provider: fontProviders.local(),
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      weights: ["400 700"],
      styles: ["normal"],
      display: "swap",
      options: {
        variants: [
          {
            src: ["@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2"],
            weight: "400 700",
            style: "normal",
          },
        ],
      },
    },
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
