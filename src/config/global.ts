import { readFileSync } from "fs"
import { join } from "path"

if (!globalThis.fetch) {
  ;(globalThis as any).fetch = (...args: Parameters<typeof import("node-fetch")>) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args))
}

let proxyUrls: string[] | null = null
let lastProxyLoad = 0
let cloudflareAiUrls: string[] | null = null
let lastCloudflareAiLoad = 0
const PROXY_CACHE_TTL = 60000
const CLOUDFLARE_AI_CACHE_TTL = 60000

;(globalThis as any).proxy = () => {
  const now = Date.now()

  if (!proxyUrls || now - lastProxyLoad > PROXY_CACHE_TTL) {
    try {
      const configPath = join(process.cwd(), "src", "config", "cpa.txt")
      const content = readFileSync(configPath, "utf-8")
      proxyUrls = content
        .split("\n")
        .map((url: string) => url.trim())
        .filter((url: string) => url && url.startsWith("http"))

      lastProxyLoad = now

      if (proxyUrls.length === 0) {
        console.warn("No valid proxy URLs found in cpa.txt")
        return null
      }
    } catch (error) {
      console.error("Failed to load proxy URLs:", error)
      return null
    }
  }

  return proxyUrls[Math.floor(Math.random() * proxyUrls.length)]
}

;(globalThis as any).CloudflareAi = () => {
  const now = Date.now()

  if (!cloudflareAiUrls || now - lastCloudflareAiLoad > CLOUDFLARE_AI_CACHE_TTL) {
    try {
      const configPath = join(process.cwd(), "src", "config", "cfai.txt")
      const content = readFileSync(configPath, "utf-8")
      cloudflareAiUrls = content
        .split("\n")
        .map((url: string) => url.trim())
        .filter((url: string) => url && url.startsWith("http"))

      lastCloudflareAiLoad = now

      if (cloudflareAiUrls.length === 0) {
        console.warn("No valid Cloudflare AI URLs found in cfai.txt")
        return null
      }
    } catch (error) {
      console.error("Failed to load Cloudflare AI URLs:", error)
      return null
    }
  }

  return cloudflareAiUrls[Math.floor(Math.random() * cloudflareAiUrls.length)]
}