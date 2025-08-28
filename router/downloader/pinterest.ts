import axios from "axios"

class Pinterest {
  api: {
    base: string
    endpoints: {
      pin: string
    }
  }
  headers: {
    accept: string
    referer: string
    "user-agent": string
    "x-app-version": string
    "x-pinterest-appstate": string
    "x-pinterest-pws-handler": string
    "x-pinterest-source-url": string
    "x-requested-with": string
  }
  client: any
  cookies: string

  constructor() {
    this.api = {
      base: "https://www.pinterest.com",
      endpoints: {
        pin: "/resource/PinResource/get/",
      },
    }
    this.headers = {
      accept: "application/json, text/javascript, */*, q=0.01",
      referer: "https://www.pinterest.com/",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "x-app-version": "f1222d7",
      "x-pinterest-appstate": "active",
      "x-pinterest-pws-handler": "www/[username]/[slug].js",
      "x-pinterest-source-url": "/search/pins/?rs=typed&q=xxx/",
      "x-requested-with": "XMLHttpRequest",
    }
    this.client = axios.create({
      baseURL: this.api.base,
      headers: this.headers,
    })
    this.cookies = ""
    this.client.interceptors.response.use(
      (response: any) => {
        const setCookieHeaders = response.headers["set-cookie"]
        if (setCookieHeaders) {
          const newCookies = setCookieHeaders.map((cookieString: string) => {
            const cp = cookieString.split(";")
            return cp[0].trim()
          })
          this.cookies = newCookies.join("; ")
          this.client.defaults.headers.cookie = this.cookies
        }
        return response
      },
      (error: any) => Promise.reject(error),
    )
  }

  isUrl(str: string): boolean {
    try {
      new URL(str)
      return true
    } catch (_) {
      return false
    }
  }

  isPin(url: string): boolean {
    if (!url) return false
    const patterns = [
      /^https?:\/\/(?:[\w-]+\.)?pinterest\.[\w.]+\/pin\/[\w.-]+/,
      /^https?:\/\/pin\.it\/[\w.-]+/,
      /^https?:\/\/(?:[\w-]+\.)?pinterest\.[\w.]+\/pin\/[\d]+(?:\/)?/,
    ]
    const clean = url.trim().toLowerCase()
    return patterns.some((pattern) => pattern.test(clean))
  }

  async followRedirects(url: string, maxRedirects = 2): Promise<string> {
    try {
      let currentUrl = url
      let redirectCount = 0

      while (redirectCount < maxRedirects) {
        const response = await axios.head(currentUrl, {
          maxRedirects: 0,
          validateStatus: (status: number) => status < 400 || (status >= 300 && status < 400),
          timeout: 10000,
        })

        if (response.status >= 300 && response.status < 400 && response.headers.location) {
          currentUrl = response.headers.location
          if (!currentUrl.startsWith("http")) {
            const baseUrl = new URL(url)
            currentUrl = new URL(currentUrl, baseUrl.origin).href
          }
          redirectCount++
        } else {
          break
        }
      }

      return currentUrl
    } catch (error: any) {
      if (error.response && error.response.status >= 300 && error.response.status < 400) {
        return error.response.headers.location || url
      }
      return url
    }
  }

  async initCookies(): Promise<boolean> {
    try {
      await this.client.get("/")
      return true
    } catch (error: any) {
      console.error("Failed to initialize cookies:", error.message)
      return false
    }
  }

  async download({ url: pinUrl }: { url: string }) {
    if (!pinUrl) {
      return {
        status: false,
        code: 400,
        result: { message: "Pin URL cannot be empty." },
      }
    }

    if (!this.isUrl(pinUrl)) {
      return {
        status: false,
        code: 400,
        result: { message: "This is not a valid URL." },
      }
    }

    try {
      const finalUrl = await this.followRedirects(pinUrl, 2)

      if (!this.isPin(finalUrl)) {
        return {
          status: false,
          code: 400,
          result: { message: "This is not a valid Pinterest link." },
        }
      }

      const pinId = finalUrl.split("/pin/")[1]?.split("/")[0]?.split("?")[0]
      if (!pinId) {
        return {
          status: false,
          code: 400,
          result: { message: "Could not extract pin ID from URL." },
        }
      }

      if (!this.cookies) {
        const success = await this.initCookies()
        if (!success) {
          return {
            status: false,
            code: 400,
            result: { message: "Failed to retrieve cookies." },
          }
        }
      }

      const params = {
        source_url: `/pin/${pinId}/`,
        data: JSON.stringify({
          options: {
            field_set_key: "detailed",
            id: pinId,
          },
          context: {},
        }),
        _: Date.now(),
      }

      const { data } = await this.client.get(this.api.endpoints.pin, { params })

      if (!data.resource_response.data) {
        return {
          status: false,
          code: 404,
          result: { message: "Pin not found." },
        }
      }

      const pd = data.resource_response.data
      const mediaUrls: any[] = []

      if (pd.videos?.video_list) {
        const firstVideoKey = Object.keys(pd.videos.video_list)[0]
        let videoUrl = pd.videos.video_list[firstVideoKey]?.url
        if (videoUrl && firstVideoKey.includes("HLS") && videoUrl.includes("m3u8")) {
          videoUrl = videoUrl.replace("hls", "720p").replace("m3u8", "mp4")
        }
        mediaUrls.push({
          type: "video",
          quality: `${pd.videos.video_list[firstVideoKey].width}x${pd.videos.video_list[firstVideoKey].height}`,
          width: pd.videos.video_list[firstVideoKey].width,
          height: pd.videos.video_list[firstVideoKey].height,
          duration: pd.videos.duration || null,
          url: videoUrl,
          file_size: pd.videos.video_list[firstVideoKey].file_size || null,
          thumbnail: pd.videos.video_list[firstVideoKey].thumbnail || pd.images?.orig?.url,
        })
      }

      if (pd.embed?.type === "gif" && pd.embed?.src) {
        mediaUrls.push({
          type: "gif",
          quality: "original",
          width: pd.embed.width || pd.images?.orig?.width,
          height: pd.embed.height || pd.images?.orig?.height,
          url: pd.embed.src,
          file_size: null,
          thumbnail: pd.images?.orig?.url,
        })
      }

      if (pd.images) {
        const imge = {
          original: pd.images.orig,
          large: pd.images["736x"],
          medium: pd.images["474x"],
          small: pd.images["236x"],
          thumbnail: pd.images["170x"],
        }
        Object.entries(imge).forEach(([quality, image]) => {
          if (image) {
            mediaUrls.push({
              type: "image",
              quality: quality,
              width: image.width,
              height: image.height,
              url: image.url,
              size: `${image.width}x${image.height}`,
            })
          }
        })
      }

      if (mediaUrls.length === 0) {
        return {
          status: false,
          code: 404,
          result: { message: "No media found for this pin." },
        }
      }

      return {
        status: true,
        code: 200,
        result: {
          id: pd.id,
          title: pd.title || pd.grid_title || "",
          description: pd.description || "",
          created_at: pd.created_at,
          original_url: pinUrl,
          final_url: finalUrl,
          media_urls: mediaUrls,
        },
      }
    } catch (error: any) {
      return {
        status: false,
        code: error.response?.status || 500,
        result: { message: "Server error. Please try again later." },
      }
    }
  }
}

const pinterest = new Pinterest()

export default [
  {
    metode: "GET",
    endpoint: "/api/d/pinterest",
    name: "pinterest",
    category: "Downloader",
    description: "This API endpoint allows you to download various media types (images, videos, or GIFs) from Pinterest by providing a Pinterest URL. It supports all Pinterest domains and short URLs. The endpoint intelligently handles redirects and extracts the Pinterest Pin ID to fetch detailed information about the pin, including its title, description, creation date, and available media URLs in various qualities and sizes. It ensures that only valid Pinterest links are processed and provides comprehensive error handling for invalid URLs, missing pins, or server-side issues. The output includes structured data about the pin and an array of available media files, each with its type, quality, dimensions, URL, and file size (if available).",
    tags: ["DOWNLOADER", "Pinterest", "Media Downloader", "Video", "Image", "GIF"],
    example: "?url=https://pin.it/7jWBaQGhd",
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
        description: "Pinterest URL",
        example: "https://pin.it/7jWBaQGhd",
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
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      if (!pinterest.isUrl(url.trim())) {
        return {
          status: false,
          error: "This is not a valid URL.",
          code: 400,
        }
      }

      try {
        const result = await pinterest.download({ url: url.trim() })
        if (!result.status) {
          return {
            status: false,
            error: result.result.message,
            code: result.code,
          }
        }
        return {
          status: true,
          data: result.result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        console.error("Error in API:", error.message)
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
    endpoint: "/api/d/pinterest",
    name: "pinterest",
    category: "Downloader",
    description: "This API endpoint allows you to download various media types (images, videos, or GIFs) from Pinterest by providing a Pinterest URL in the request body. It supports all Pinterest domains and short URLs. The endpoint intelligently handles redirects and extracts the Pinterest Pin ID to fetch detailed information about the pin, including its title, description, creation date, and available media URLs in various qualities and sizes. It ensures that only valid Pinterest links are processed and provides comprehensive error handling for invalid URLs, missing pins, or server-side issues. The output includes structured data about the pin and an array of available media files, each with its type, quality, dimensions, URL, and file size (if available).",
    tags: ["DOWNLOADER", "Pinterest", "Media Downloader", "Video", "Image", "GIF"],
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
                description: "Pinterest URL",
                example: "https://pin.it/7jWBaQGhd",
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

      if (!pinterest.isUrl(url.trim())) {
        return {
          status: false,
          error: "This is not a valid URL.",
          code: 400,
        }
      }

      try {
        const result = await pinterest.download({ url: url.trim() })
        if (!result.status) {
          return {
            status: false,
            error: result.result.message,
            code: result.code,
          }
        }
        return {
          status: true,
          data: result.result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        console.error("Error in API:", error.message)
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]