import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

puppeteer.use(StealthPlugin())

function transformResponse(apiResponse: any) {
  if (!apiResponse) {
    return []
  }

  let items: any[] = []

  if (Array.isArray(apiResponse)) {
    items = apiResponse
  } else if (typeof apiResponse === "object") {
    items = [apiResponse]
  } else {
    return []
  }

  return items.map((item) => {
    const mainUrl = item.url && Array.isArray(item.url) && item.url[0] ? item.url[0].url : ""
    const thumbnailUrl = item.thumb || ""

    return {
      thumbnail: thumbnailUrl,
      url: mainUrl,
    }
  }).filter((item) => item.url)
}

async function tryFastdl(instagramUrl: string): Promise<any[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()

  return new Promise<any[]>(async (resolve, reject) => {
    let apiResponse: any = null
    let responseReceived = false

    page.on("response", async (response) => {
      if (response.url().includes("/api/convert") && !responseReceived) {
        responseReceived = true
        try {
          apiResponse = await response.json()
          const transformedData = transformResponse(apiResponse)
          await browser.close()
          resolve(transformedData)
        } catch (error: any) {
          await browser.close()
          reject(error)
        }
      }
    })

    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    try {
      await page.goto("https://fastdl.app/id", { waitUntil: "domcontentloaded" })
      await page.type("#search-form-input", instagramUrl)
      await page.click(".search-form__button")

      setTimeout(async () => {
        if (!responseReceived) {
          await browser.close()
          reject(new Error("Timeout waiting for API response"))
        }
      }, 30000)

    } catch (error: any) {
      await browser.close()
      reject(error)
    }
  })
}

async function tryIgram(instagramUrl: string): Promise<any[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()

  return new Promise<any[]>(async (resolve, reject) => {
    let apiResponse: any = null
    let responseReceived = false

    page.on("response", async (response) => {
      if (response.url().includes("/api/convert") && !responseReceived) {
        responseReceived = true
        try {
          apiResponse = await response.json()
          const transformedData = transformResponse(apiResponse)
          await browser.close()
          resolve(transformedData)
        } catch (error: any) {
          await browser.close()
          reject(error)
        }
      }
    })

    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    try {
      await page.goto("https://igram.world/id/", { waitUntil: "networkidle2" })
      await page.waitForSelector("#search-form-input", { visible: true })
      await page.type("#search-form-input", instagramUrl)
      await page.waitForSelector(".search-form__button", { visible: true })
      await page.evaluate(() => {
        document.querySelector(".search-form__button")?.click()
      })

      setTimeout(async () => {
        if (!responseReceived) {
          await browser.close()
          reject(new Error("Timeout waiting for API response"))
        }
      }, 30000)

    } catch (error: any) {
      await browser.close()
      reject(error)
    }
  })
}

async function downloadInstagram(instagramUrl: string): Promise<any[]> {
  try {
    return await tryFastdl(instagramUrl)
  } catch (error) {
    try {
      return await tryIgram(instagramUrl)
    } catch (fallbackError) {
      throw new Error("Both services failed")
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/igdl",
    name: "igdl",
    category: "Downloader",
    description: "This API endpoint allows users to download Instagram videos and photos by providing the Instagram post URL. It automates the process of accessing a third-party downloader website (fastdl.app), inputting the URL, and scraping the resulting download links. The endpoint handles various types of Instagram content, including reels, photos, and videos, and returns the direct download URLs and thumbnails. This is useful for users who want to save Instagram media for offline viewing or integration into other applications.",
    tags: ["DOWNLOADER", "INSTAGRAM", "MEDIA"],
    example: "?url=https://www.instagram.com/reel/DMNiqN2TV3v/?igsh=aHVtdmZ3d3loejY0",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The Instagram post URL",
        example: "https://www.instagram.com/reel/DMNiqN2TV3v/?igsh=aHVtdmZ3d3loejY0",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "Parameter URL is required",
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

      try {
        const result = await downloadInstagram(url.trim())
        if (!result || result.length === 0) {
          return {
            status: false,
            error: "No download links found for the provided URL",
            code: 404,
          }
        }
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/d/igdl",
    name: "igdl",
    category: "Downloader",
    description: "This API endpoint allows users to download Instagram videos and photos by providing the Instagram post URL in the request body. It automates the process of accessing a third-party downloader website (fastdl.app), inputting the URL, and scraping the resulting download links. The endpoint handles various types of Instagram content, including reels, photos, and videos, and returns the direct download URLs and thumbnails. This is useful for users who want to save Instagram media for offline viewing or integration into other applications.",
    tags: ["DOWNLOADER", "INSTAGRAM", "MEDIA"],
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
                description: "The Instagram post URL",
                example: "https://www.instagram.com/reel/DMNiqN2TV3v/?igsh=aHVtdmZ3d3loejY0",
                minLength: 1,
                maxLength: 1000,
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
      const { url } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "Parameter URL is required",
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

      try {
        const result = await downloadInstagram(url.trim())
        if (!result || result.length === 0) {
          return {
            status: false,
            error: "No download links found for the provided URL",
            code: 404,
          }
        }
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]