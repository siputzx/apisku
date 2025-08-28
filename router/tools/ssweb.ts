import { chromium } from "playwright"
import { Buffer } from "buffer"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function takeScreenshot(url: string, theme: string, device: string) {
  let browser: any
  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    const deviceSettings: { [key: string]: { width: number, height: number, isMobile?: boolean, hasTouch?: boolean } } = {
      desktop: { width: 1920, height: 1080 },
      mobile: { width: 375, height: 812, isMobile: true, hasTouch: true },
      tablet: { width: 768, height: 1024, isMobile: true, hasTouch: true },
    }

    await page.setViewportSize({
      width: deviceSettings[device].width,
      height: deviceSettings[device].height,
    })

    let responseStatus: number | undefined
    page.on("response", (response) => {
      if (response.url() === formattedUrl) {
        responseStatus = response.status()
      }
    })

    const response = await page.goto(formattedUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null)

    if (!responseStatus && response) {
      responseStatus = response.status()
    }

    if (theme === "dark") {
      await page.evaluate(() => {
        document.body.style.backgroundColor = "#1a1a1a"
        document.body.style.color = "#ffffff"
      })
    } else {
      await page.evaluate(() => {
        document.body.style.backgroundColor = "#ffffff"
        document.body.style.color = "#000000"
      })
    }

    await page.waitForTimeout(1000)

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
    })

    return { screenshotBuffer, responseStatus }
  } catch (error: any) {
    console.error("Screenshot API Error:", error.message)
    throw new Error(`Failed to take screenshot: ${error.message}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/ssweb",
    name: "screenshot",
    category: "Tools",
    description: "This API endpoint allows you to capture a full-page screenshot of any given website URL. You can specify the theme (light or dark) and the device type (desktop, mobile, or tablet) to customize the rendering of the screenshot. This tool is ideal for web developers, content creators, or anyone needing to visually document web pages. It provides a high-fidelity image representation of the website, perfect for presentations, auditing web content, or archiving page layouts.",
    tags: ["TOOLS", "Screenshot", "Web Utility"],
    example: "?url=https://google.com&theme=light&device=desktop",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2048,
        },
        description: "Website URL",
        example: "https://google.com",
      },
      {
        name: "theme",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["light", "dark"],
          default: "light",
        },
        description: "Screenshot theme",
        example: "light",
      },
      {
        name: "device",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["desktop", "mobile", "tablet"],
          default: "desktop",
        },
        description: "Device type",
        example: "desktop",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url, theme = "light", device = "desktop" } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "Parameter url is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (typeof theme !== "string" || !["light", "dark"].includes(theme)) {
        return {
          status: false,
          error: "Parameter theme must be 'light' or 'dark'",
          code: 400,
        }
      }

      if (typeof device !== "string" || !["desktop", "mobile", "tablet"].includes(device)) {
        return {
          status: false,
          error: "Parameter device must be 'desktop', 'mobile', or 'tablet'",
          code: 400,
        }
      }

      try {
        const { screenshotBuffer, responseStatus } = await takeScreenshot(url.trim(), theme, device)

        return createImageResponse(screenshotBuffer)
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Error fetching screenshot",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/ssweb",
    name: "screenshot",
    category: "Tools",
    description: "This API endpoint allows you to capture a full-page screenshot of any given website URL using a JSON request body. You can specify the theme (light or dark) and the device type (desktop, mobile, or tablet) to customize the rendering of the screenshot. This tool is ideal for web developers, content creators, or anyone needing to visually document web pages. It provides a high-fidelity image representation of the website, perfect for presentations, auditing web content, or archiving page layouts.",
    tags: ["TOOLS", "Screenshot", "Web Utility"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                description: "Website URL",
                example: "https://google.com",
                minLength: 1,
                maxLength: 2048,
              },
              theme: {
                type: "string",
                enum: ["light", "dark"],
                default: "light",
                description: "Screenshot theme",
                example: "dark",
              },
              device: {
                type: "string",
                enum: ["desktop", "mobile", "tablet"],
                default: "desktop",
                description: "Device type",
                example: "mobile",
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url, theme = "light", device = "desktop" } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "Parameter url is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (typeof theme !== "string" || !["light", "dark"].includes(theme)) {
        return {
          status: false,
          error: "Parameter theme must be 'light' or 'dark'",
          code: 400,
        }
      }

      if (typeof device !== "string" || !["desktop", "mobile", "tablet"].includes(device)) {
        return {
          status: false,
          error: "Parameter device must be 'desktop', 'mobile', or 'tablet'",
          code: 400,
        }
      }

      try {
        const { screenshotBuffer, responseStatus } = await takeScreenshot(url.trim(), theme, device)

        return createImageResponse(screenshotBuffer)
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Error fetching screenshot",
          code: 500,
        }
      }
    },
  },
]