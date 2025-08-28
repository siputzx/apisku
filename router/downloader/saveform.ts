import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import * as cheerio from "cheerio"

puppeteer.use(StealthPlugin())

class SaveFromDownloader {
  targetUrl: string
  browser: any
  page: any

  constructor() {
    this.targetUrl = "https://id.savefrom.net/251le/"
    this.browser = null
    this.page = null
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    this.page = await this.browser.newPage()
  }

  async download(url: string) {
    try {
      if (!this.browser) await this.init()

      await this.page.goto(this.targetUrl, { waitUntil: "domcontentloaded" })
      await this.page.type("#sf_url", url)
      await this.page.click("#sf_submit")

      await this.page.waitForResponse((res: any) => res.url().includes("savefrom.php"), { timeout: 15000 })
      await this.page.waitForSelector("#sf_result .media-result", { timeout: 30000 })

      const html = await this.page.content()
      const results = this.parseResult(html)

      return {
        success: true,
        data: results,
        count: results.length,
        url: url,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
        url: url,
      }
    }
  }

  parseResult(html: string) {
    const $ = cheerio.load(html)
    const results: any[] = []

    $("#sf_result .result-box").each((i, el) => {
      const $el = $(el)
      const link = $el.find(".link-download").attr("href")

      if (link) {
        const dataType = $el.find(".link-download").attr("data-type") || ""
        const buttonText = $el.find(".link-download").text().trim()
        const urlExtension = link.split(".").pop()?.split("?")[0].toLowerCase() || ""
        const htmlClass = $el.attr("class") || ""

        let format =
          dataType ||
          buttonText.match(/\b(MP3|JPEG|MP4|PNG|GIF|WAV|JPG)\b/i)?.[1]?.toLowerCase() ||
          urlExtension ||
          "unknown"

        let type = "unknown"
        if (htmlClass.includes("video") || ["mp4", "avi", "mov", "webm"].includes(format)) {
          type = "video"
        } else if (htmlClass.includes("audio") || ["mp3", "wav", "aac", "ogg"].includes(format)) {
          type = "audio"
        } else if (["jpeg", "jpg", "png", "gif", "webp"].includes(format)) {
          type = "image"
        }

        results.push({
          title: $el.find(".title").text().trim().replace(/^#+\s*/, "") || "untitled",
          platform: $el.attr("data-hid") || "unknown",
          type,
          format,
          url: link,
          thumb: $el.find(".thumb img").attr("src") || null,
          quality: $el.find(".link-download").attr("data-quality") || null,
        })
      }
    })

    return results
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }
}

async function scrapeDownload(videoUrl: string) {
  const downloader = new SaveFromDownloader()
  try {
    const result = await downloader.download(videoUrl)
    await downloader.close()
    return result
  } catch (error: any) {
    await downloader.close()
    console.error("Error downloading video:", error)
    return null
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/savefrom",
    name: "savefrom",
    category: "Downloader",
    description: "This API endpoint leverages SaveFrom.net to provide download links for media (videos, audios, and images) from various online platforms such as YouTube, Instagram, TikTok, Twitter, and more. Users can provide a media URL as a query parameter, and the API will scrape SaveFrom.net to extract available download options, including different qualities and formats. The endpoint supports filtering results by media type (video, audio, or image) for convenience. It's a versatile tool for obtaining direct download links from a wide range of social media and video-sharing sites, offering a robust solution for media acquisition.",
    tags: ["DOWNLOADER", "SaveFrom", "Video Downloader", "Audio Downloader", "Image Downloader", "Multi-platform"],
    example: "?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&type=video",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "Media URL",
        example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        name: "type",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["video", "audio", "image"],
        },
        description: "Filter by media type",
        example: "video",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url, type } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeDownload(url.trim())

        if (!result || !result.success) {
          return {
            status: false,
            error: result?.error || "Failed to download media data",
            code: 500,
          }
        }

        let filteredData = result.data
        if (typeof type === "string" && ["video", "audio", "image"].includes(type)) {
          filteredData = result.data.filter((item: any) => item.type === type)
        }

        return {
          status: true,
          data: filteredData,
          count: filteredData.length,
          url: result.url,
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
    endpoint: "/api/d/savefrom",
    name: "savefrom",
    category: "Downloader",
    description: "This API endpoint leverages SaveFrom.net to provide download links for media (videos, audios, and images) from various online platforms such as YouTube, Instagram, TikTok, Twitter, and more. Users can provide a media URL in the request body, and the API will scrape SaveFrom.net to extract available download options, including different qualities and formats. The endpoint supports filtering results by media type (video, audio, or image) for convenience. It's a versatile tool for obtaining direct download links from a wide range of social media and video-sharing sites, offering a robust solution for media acquisition.",
    tags: ["DOWNLOADER", "SaveFrom", "Video Downloader", "Audio Downloader", "Image Downloader", "Multi-platform"],
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
                description: "Media URL",
                example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                minLength: 1,
                maxLength: 2000,
              },
              type: {
                type: "string",
                enum: ["video", "audio", "image"],
                description: "Filter by media type (optional)",
                example: "video",
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
      const { url, type } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeDownload(url.trim())

        if (!result || !result.success) {
          return {
            status: false,
            error: result?.error || "Failed to download media data",
            code: 500,
          }
        }

        let filteredData = result.data
        if (typeof type === "string" && ["video", "audio", "image"].includes(type)) {
          filteredData = result.data.filter((item: any) => item.type === type)
        }

        return {
          status: true,
          data: filteredData,
          count: filteredData.length,
          url: result.url,
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