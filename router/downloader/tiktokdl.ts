import axios from "axios"
import * as cheerio from "cheerio"
import FormData from "form-data"
import * as tough from "tough-cookie"

class SnapTikClient {
  private config: {
    baseURL: string,
    [key: string]: any,
  }
  private axios: any

  constructor(config: object = {}) {
    this.config = {
      baseURL: "https://snaptik.app",
      ...config,
    }

    const cookieJar = new tough.CookieJar()
    this.axios = axios.create({
      ...this.config,
      withCredentials: true,
      jar: cookieJar,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 30000,
    })
  }

  async get_token(): Promise<string | undefined> {
    const { data } = await this.axios.get("/en2", {
      headers: {
        "Referer": "https://snaptik.app/en2",
      },
    })
    const $ = cheerio.load(data)
    return $("input[name=\"token\"]").val() as string
  }

  async get_script(url: string): Promise<string> {
    const form = new FormData()
    const token = await this.get_token()

    if (!token) {
      throw new Error("Failed to get token")
    }

    form.append("url", url)
    form.append("lang", "en2")
    form.append("token", token)

    const { data } = await this.axios.post("/abc2.php", form, {
      headers: {
        ...form.getHeaders(),
        "authority": "snaptik.app",
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "origin": "https://snaptik.app",
        "referer": "https://snaptik.app/en2",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
    })
    return data
  }

  async eval_script(script1: string): Promise<{ html: string, oembed_url: string }> {
    const script2 = await new Promise<string>((resolve) =>
      Function("eval", script1)(resolve)
    )

    return new Promise((resolve, reject) => {
      let html = ""
      const mockObjects = {
        $: () => ({
          remove() {},
          style: { display: "" },
          get innerHTML() {
            return html
          },
          set innerHTML(t: string) {
            html = t
          },
        }),
        app: { showAlert: reject },
        document: { getElementById: () => ({ src: "" }) },
        fetch: (a: string) => {
          resolve({ html, oembed_url: a })
          return { json: () => ({ thumbnail_url: "" }) }
        },
        gtag: () => 0,
        Math: { round: () => 0 },
        XMLHttpRequest: function () {
          return { open() {}, send() {} }
        },
        window: { location: { hostname: "snaptik.app" } },
      }

      try {
        Function(
          ...Object.keys(mockObjects),
          script2
        )(...Object.values(mockObjects))
      } catch (error: any) {
        console.log("Eval error saved to eval.txt:", error.message)
        reject(error)
      }
    })
  }

  async get_hd_video(hdUrl: string, backupUrl: string): Promise<string> {
    try {
      const { data } = await this.axios.get(hdUrl)
      if (data && data.url) {
        return data.url
      }
    } catch (error: any) {
      console.log("HD URL failed, using backup:", error.message)
    }
    return backupUrl
  }

  async parse_html(html: string): Promise<any> {
    const $ = cheerio.load(html)
    const isVideo = !$("div.render-wrapper").length

    const thumbnail = $(".avatar").attr("src") || $("#thumbnail").attr("src")
    const title = $(".video-title").text().trim()
    const creator = $(".info span").text().trim()

    if (isVideo) {
      const hdButton = $("div.video-links > button[data-tokenhd]")
      const hdTokenUrl = hdButton.data("tokenhd")
      const backupUrl = hdButton.data("backup")

      let hdUrl = null
      if (hdTokenUrl) {
        hdUrl = await this.get_hd_video(hdTokenUrl, backupUrl)
      }

      const videoUrls = [
        hdUrl || backupUrl,
        ...$("div.video-links > a:not(a[href=\"/\"])")
          .map((_, elem) => $(elem).attr("href"))
          .get()
          .filter((url: string | undefined) => url && !url.includes("play.google.com"))
          .map((x: string) => (x.startsWith("/") ? this.config.baseURL + x : x)),
      ].filter(Boolean)

      return {
        type: "video",
        urls: videoUrls,
        metadata: {
          title: title || null,
          description: title || null,
          thumbnail: thumbnail || null,
          creator: creator || null,
        },
      }
    } else {
      const photos = $("div.columns > div.column > div.photo")
        .map((_, elem) => ({
          urls: [
            $(elem).find("img[alt=\"Photo\"]").attr("src"),
            $(elem)
              .find("a[data-event=\"download_albumPhoto_photo\"]")
              .attr("href"),
          ],
        }))
        .get()

      return {
        type: photos.length === 1 ? "photo" : "slideshow",
        urls:
          photos.length === 1
            ? photos[0].urls
            : photos.map((photo: any) => photo.urls),
        metadata: {
          title: title || null,
          description: title || null,
          thumbnail: thumbnail || null,
          creator: creator || null,
        },
      }
    }
  }

  async process(url: string): Promise<any> {
    try {
      const script = await this.get_script(url)
      const { html, oembed_url } = await this.eval_script(script)
      const result = await this.parse_html(html)

      return {
        original_url: url,
        oembed_url,
        type: result.type,
        urls: result.urls,
        metadata: result.metadata,
      }
    } catch (error: any) {
      console.error("Process error:", error.message)
      return {
        original_url: url,
        error: error.message,
      }
    }
  }
}

async function scrapeTiktok(url: string) {
  try {
    const client = new SnapTikClient()
    return await client.process(url)
  } catch (error: any) {
    console.error("Tiktok scrape error:", error)
    return null
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/tiktok",
    name: "tiktok",
    category: "Downloader",
    description: "This API endpoint allows you to download videos or slideshows from a given TikTok URL using query parameters. It leverages the SnapTik service to extract direct download links for the content, including metadata such as title, creator, thumbnail, and the type of content (video, photo, or slideshow). This is ideal for users who want to save TikTok content for offline viewing or integration into other applications.",
    tags: ["Downloader", "TikTok", "Video", "Slideshow", "Social Media"],
    example: "?url=https://vt.tiktok.com/ZSjXNEnbC/",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
        },
        description: "The TikTok URL of the video or slideshow",
        example: "https://vt.tiktok.com/ZSjXNEnbC/",
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
          error: "URL parameter is required",
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
        const result = await scrapeTiktok(url.trim())
        if (!result) {
          return {
            status: false,
            error: result?.error || "Failed to process TikTok URL",
            code: 500,
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
    endpoint: "/api/d/tiktok",
    name: "tiktok",
    category: "Downloader",
    description: "This API endpoint allows you to download videos or slideshows from a given TikTok URL by providing the URL in the request body as JSON. It leverages the SnapTik service to extract direct download links for the content, including metadata such as title, creator, thumbnail, and the type of content (video, photo, or slideshow). This is ideal for users who want to save TikTok content for offline viewing or programmatic integration into other applications.",
    tags: ["Downloader", "TikTok", "Video", "Slideshow", "Social Media"],
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
                description: "The TikTok URL of the video or slideshow",
                example: "https://vt.tiktok.com/ZSjXNEnbC/",
                minLength: 1,
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
          error: "URL parameter is required",
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
        const result = await scrapeTiktok(url.trim())
        if (!result) {
          return {
            status: false,
            error: result?.error || "Failed to process TikTok URL",
            code: 500,
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