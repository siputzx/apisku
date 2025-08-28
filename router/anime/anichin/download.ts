import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function scrapeDownloadLinks(url: string) {
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const downloads: { resolution: string, links: { host: string, link: string }[] }[] = []

    $(".mctnx .soraddlx").each((_, element) => {
      const resolution = $(element).find(".soraurlx strong").first().text().trim()
      const links: { host: string, link: string }[] = []
      $(element).find(".soraurlx a").each((_, linkElement) => {
        const host = $(linkElement).text().trim()
        const link = $(linkElement).attr("href")
        links.push({
          host: host,
          link: link,
        })
      })
      downloads.push({
        resolution: resolution,
        links: links,
      })
    })
    return downloads
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/anichin-download",
    name: "anichin download",
    category: "Anime",
    description: "This API endpoint allows you to extract download links for various resolutions from an Anichin anime detail page by providing its URL. It scrapes the page to find available resolutions and their corresponding download links from different hosts. This can be used by applications or services that need to provide direct download options for anime episodes from Anichin.",
    tags: ["ANIME", "DOWNLOAD", "SCRAPING"],
    example: "?url=https://anichin.forum/renegade-immortal-episode-69-subtitle-indonesia/",
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
        description: "Anime detail page URL",
        example: "https://anichin.forum/renegade-immortal-episode-69-subtitle-indonesia/",
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
          error: "URL is required",
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
        const data = await scrapeDownloadLinks(url.trim())

        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
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
    endpoint: "/api/anime/anichin-download",
    name: "anichin download",
    category: "Anime",
    description: "This API endpoint allows you to extract download links for various resolutions from an Anichin anime detail page by providing its URL in the request body. It scrapes the page to find available resolutions and their corresponding download links from different hosts. This can be used by applications or services that need to provide direct download options for anime episodes from Anichin.",
    tags: ["ANIME", "DOWNLOAD", "SCRAPING"],
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
                description: "Anime detail page URL",
                example: "https://anichin.forum/renegade-immortal-episode-69-subtitle-indonesia/",
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
          error: "URL is required",
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
        const data = await scrapeDownloadLinks(url.trim())

        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]