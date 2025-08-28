import { Logger } from "../utils/logger"
import type { BrowserService } from "./browser"
import fs from "fs"
import path from "path"

interface ProxyConfig {
  host: string
  port: number
  username?: string
  password?: string
}

interface BypassResult {
  success: boolean
  data?: any
  error?: string
  duration: number
}

interface WafSessionResult {
  cookies: any[]
  headers: Record<string, string>
}

export class BypassService {
  private logger = new Logger("Bypass")
  private browserService: BrowserService
  private fakePageContent: string

  constructor(browserService: BrowserService) {
    this.browserService = browserService
    this.loadFakePage()
  }

  private loadFakePage(): void {
    try {
      // Try to load from assets directory first
      let fakePagePath = path.join(process.cwd(), "assets", "fakePage.html")

      // If assets doesn't exist, try current directory
      if (!fs.existsSync(fakePagePath)) {
        fakePagePath = path.join(process.cwd(), "fakePage.html")
      }

      // Create assets directory if it doesn't exist
      const assetsDir = path.dirname(fakePagePath)
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true })
      }

      // Create fake page if it doesn't exist
      if (!fs.existsSync(fakePagePath)) {
        this.fakePageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>
<body>
    <div class="turnstile"></div>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" defer></script>
    <script>
        window.onloadTurnstileCallback = function () {
            turnstile.render('.turnstile', {
                sitekey: '<site-key>',
                callback: function (token) {
                    var c = document.createElement('input');
                    c.type = 'hidden';
                    c.name = 'cf-response';
                    c.value = token;
                    document.body.appendChild(c);
                },
            });
        };
    </script>
</body>
</html>`
        fs.writeFileSync(fakePagePath, this.fakePageContent)
      } else {
        this.fakePageContent = fs.readFileSync(fakePagePath, "utf-8")
      }

      this.logger.success("Fake page loaded successfully")
    } catch (error: any) {
      this.logger.error("Failed to load fake page:", error)
      // Fallback content - use the exact same content as original
      this.fakePageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
</head>
<body>
    <div class="turnstile"></div>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" defer></script>
    <script>
        window.onloadTurnstileCallback = function () {
            turnstile.render('.turnstile', {
                sitekey: '<site-key>',
                callback: function (token) {
                    var c = document.createElement('input');
                    c.type = 'hidden';
                    c.name = 'cf-response';
                    c.value = token;
                    document.body.appendChild(c);
                },
            });
        };
    </script>
</body>
</html>`
    }
  }

  async wafSession(url: string, proxy?: ProxyConfig, timeout = 60000): Promise<BypassResult> {
    const startTime = Date.now()
    let context: any = null
    let page: any = null

    try {
      if (!url) {
        throw new Error("Missing url parameter")
      }

      context = await this.browserService.createContext({
        proxyServer: proxy ? `http://${proxy.host}:${proxy.port}` : undefined,
      })

      page = await context.newPage()
      await page.setDefaultTimeout(30000)
      await page.setDefaultNavigationTimeout(30000)

      if (proxy?.username && proxy?.password) {
        await page.authenticate({
          username: proxy.username,
          password: proxy.password,
        })
      }

      // Find accept language
      const acceptLanguage = await this.findAcceptLanguage(page)
      await page.setRequestInterception(true)

      let resolved = false
      const result = await new Promise<WafSessionResult>((resolve, reject) => {
        const timeoutHandler = setTimeout(() => {
          if (!resolved) {
            resolved = true
            reject(new Error("Timeout Error"))
          }
        }, timeout)

        page.on("request", async (request: any) => {
          try {
            await request.continue()
          } catch (e) {
            // Request might already be handled
          }
        })

        page.on("response", async (res: any) => {
          try {
            if (!resolved && [200, 302].includes(res.status()) && [url, url + "/"].includes(res.url())) {
              await page.waitForNavigation({ waitUntil: "load", timeout: 5000 }).catch(() => {})

              const cookies = await page.cookies()
              const headers = await res.request().headers()

              // Clean headers
              delete headers["content-type"]
              delete headers["accept-encoding"]
              delete headers["accept"]
              delete headers["content-length"]
              headers["accept-language"] = acceptLanguage

              resolved = true
              clearTimeout(timeoutHandler)
              resolve({ cookies, headers })
            }
          } catch (error: any) {
            if (!resolved) {
              resolved = true
              clearTimeout(timeoutHandler)
              reject(error)
            }
          }
        })

        // Navigate to URL
        page
          .goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          })
          .catch((error: any) => {
            if (!resolved) {
              resolved = true
              clearTimeout(timeoutHandler)
              reject(error)
            }
          })
      })

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      }
    } catch (error: any) {
      this.logger.error("WAF session error:", error)
      return {
        success: false,
        error: error.message || "Unknown error",
        duration: Date.now() - startTime,
      }
    } finally {
      await this.cleanup(page, context)
    }
  }

  async solveTurnstileMin(url: string, siteKey: string, proxy?: ProxyConfig, timeout = 60000): Promise<BypassResult> {
    const startTime = Date.now()
    let context: any = null
    let contextClosed = false

    try {
      if (!url || !siteKey) {
        throw new Error("Missing url or siteKey parameter")
      }

      context = await this.browserService.createContext({
        proxyServer: proxy ? `http://${proxy.host}:${proxy.port}` : undefined,
      })

      if (!context) {
        throw new Error("Failed to create browser context")
      }

      let isResolved = false

      const timeoutHandler = setTimeout(async () => {
        if (!isResolved && !contextClosed) {
          try {
            contextClosed = true
            await context.close()
          } catch (err: any) {
            this.logger.error("Error closing context on timeout:", err.message)
          }
        }
      }, timeout)

      try {
        const page = await context.newPage()

        if (proxy?.username && proxy?.password) {
          await page.authenticate({
            username: proxy.username,
            password: proxy.password,
          })
        }

        await page.setRequestInterception(true)

        page.on("request", async (request: any) => {
          if ([url, url + "/"].includes(request.url()) && request.resourceType() === "document") {
            await request.respond({
              status: 200,
              contentType: "text/html",
              body: this.fakePageContent.replace(/<site-key>/g, siteKey),
            })
          } else {
            await request.continue()
          }
        })

        await page.goto(url, {
          waitUntil: "domcontentloaded",
        })

        await page.waitForSelector('[name="cf-response"]', {
          timeout: timeout,
        })

        const token = await page.evaluate(() => {
          try {
            return (document.querySelector('[name="cf-response"]') as HTMLInputElement)?.value
          } catch (e) {
            return null
          }
        })

        isResolved = true
        clearTimeout(timeoutHandler)

        if (!contextClosed) {
          try {
            contextClosed = true
            await context.close()
          } catch (err: any) {
            this.logger.error("Error closing context after completion:", err.message)
          }
        }

        if (!token || token.length < 10) {
          throw new Error("Failed to get token")
        }

        return {
          success: true,
          data: token,
          duration: Date.now() - startTime,
        }
      } catch (err: any) {
        isResolved = true
        clearTimeout(timeoutHandler)

        if (!contextClosed) {
          try {
            contextClosed = true
            await context.close()
          } catch (closeErr: any) {
            this.logger.error("Error closing context after error:", closeErr.message)
          }
        }

        throw err
      }
    } catch (error: any) {
      this.logger.error("Turnstile min solve error:", error)
      return {
        success: false,
        error: error.message || "Unknown error",
        duration: Date.now() - startTime,
      }
    }
  }

  async solveTurnstileMax(url: string, proxy?: ProxyConfig, timeout = 60000): Promise<BypassResult> {
    const startTime = Date.now()
    let context: any = null
    let page: any = null

    try {
      if (!url) {
        throw new Error("Missing url parameter")
      }

      context = await this.browserService.createContext({
        proxyServer: proxy ? `http://${proxy.host}:${proxy.port}` : undefined,
      })

      page = await context.newPage()
      await page.setDefaultTimeout(30000)
      await page.setDefaultNavigationTimeout(30000)

      if (proxy?.username && proxy?.password) {
        await page.authenticate({
          username: proxy.username,
          password: proxy.password,
        })
      }

      await page.evaluateOnNewDocument(() => {
        let token: string | null = null
        async function waitForToken(): Promise<void> {
          while (!token) {
            try {
              token = (window as any).turnstile.getResponse()
            } catch (e) {}
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
          const c = document.createElement("input")
          c.type = "hidden"
          c.name = "cf-response"
          c.value = token
          document.body.appendChild(c)
        }
        waitForToken()
      })

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })

      await page.waitForSelector('[name="cf-response"]', { timeout })

      const token = await page.evaluate(() => {
        try {
          return (document.querySelector('[name="cf-response"]') as HTMLInputElement)?.value
        } catch (e) {
          return null
        }
      })

      if (!token || token.length < 10) {
        throw new Error("Failed to get token")
      }

      return {
        success: true,
        data: token,
        duration: Date.now() - startTime,
      }
    } catch (error: any) {
      this.logger.error("Turnstile max solve error:", error)
      return {
        success: false,
        error: error.message || "Unknown error",
        duration: Date.now() - startTime,
      }
    } finally {
      await this.cleanup(page, context)
    }
  }

  async getSource(url: string, proxy?: ProxyConfig, timeout = 60000): Promise<BypassResult> {
    const startTime = Date.now()
    let context: any = null
    let page: any = null

    try {
      if (!url) {
        throw new Error("Missing url parameter")
      }

      context = await this.browserService.createContext({
        proxyServer: proxy ? `http://${proxy.host}:${proxy.port}` : undefined,
      })

      page = await context.newPage()
      await page.setDefaultTimeout(30000)
      await page.setDefaultNavigationTimeout(30000)

      if (proxy?.username && proxy?.password) {
        await page.authenticate({
          username: proxy.username,
          password: proxy.password,
        })
      }

      await page.setRequestInterception(true)

      let resolved = false
      const result = await new Promise<string>((resolve, reject) => {
        const timeoutHandler = setTimeout(() => {
          if (!resolved) {
            resolved = true
            reject(new Error("Timeout Error"))
          }
        }, timeout)

        page.on("request", async (request: any) => {
          try {
            await request.continue()
          } catch (e) {
            // Request might already be handled
          }
        })

        page.on("response", async (res: any) => {
          try {
            if (!resolved && [200, 302].includes(res.status()) && [url, url + "/"].includes(res.url())) {
              await page.waitForNavigation({ waitUntil: "load", timeout: 5000 }).catch(() => {})
              const html = await page.content()

              resolved = true
              clearTimeout(timeoutHandler)
              resolve(html)
            }
          } catch (error: any) {
            if (!resolved) {
              resolved = true
              clearTimeout(timeoutHandler)
              reject(error)
            }
          }
        })

        // Navigate to URL
        page
          .goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          })
          .catch((error: any) => {
            if (!resolved) {
              resolved = true
              clearTimeout(timeoutHandler)
              reject(error)
            }
          })
      })

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      }
    } catch (error: any) {
      this.logger.error("Get source error:", error)
      return {
        success: false,
        error: error.message || "Unknown error",
        duration: Date.now() - startTime,
      }
    } finally {
      await this.cleanup(page, context)
    }
  }

  private async findAcceptLanguage(page: any): Promise<string | null> {
    try {
      return await page.evaluate(async () => {
        const result = await fetch("https://httpbin.org/get")
          .then((res: Response) => res.json())
          .then((res: any) => res.headers["Accept-Language"] || res.headers["accept-language"])
          .catch(() => null)
        return result
      })
    } catch (error) {
      return "en-US,en;q=0.9"
    }
  }

  private async cleanup(page: any, context: any): Promise<void> {
    try {
      if (page) {
        await page.close().catch(() => {})
      }
      if (context) {
        await context.close().catch(() => {})
      }
    } catch (error: any) {
      this.logger.debug("Cleanup error:", error.message)
    }
  }

  getStats() {
    return this.browserService.getBrowserStats()
  }
}
