import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { build } from "vite"

await import("./generate-content.mjs")
await build()

const configPath = resolve("dist/admin/config.yml")
let cmsConfig = await readFile(configPath, "utf8")
const oauthBaseUrl =
  process.env.OAUTH_BASE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "")
const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "")

if (oauthBaseUrl) {
  const parsedUrl = new URL(oauthBaseUrl)
  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("OAUTH_BASE_URL must be an HTTPS origin without a path.")
  }
  cmsConfig = cmsConfig.replace(
    /^  base_url: __OAUTH_BASE_URL__$/m,
    `  base_url: ${oauthBaseUrl}`,
  )
} else {
  cmsConfig = cmsConfig.replace(/^  base_url: __OAUTH_BASE_URL__\r?\n/m, "")
}

if (siteUrl) {
  const parsedUrl = new URL(siteUrl)
  if (parsedUrl.protocol !== "https:") {
    throw new Error("SITE_URL must use HTTPS.")
  }
  cmsConfig = cmsConfig.replace(
    /^site_url: __SITE_URL__$/m,
    `site_url: ${siteUrl}`,
  )
} else {
  cmsConfig = cmsConfig.replace(/^site_url: __SITE_URL__\r?\n/m, "")
}

await writeFile(configPath, cmsConfig)
