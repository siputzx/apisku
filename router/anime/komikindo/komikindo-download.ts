import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function getBaseUrl() {
  const url = "https://komikindo.cz/"
  try {
    const { data } = await axios.get(proxy() + url)
    const $ = cheerio.load(data)
    const href = $(".elementskit-btn.whitespace--normal").attr("href")
    if (!href) {
      throw new Error("Base URL not found on the page")
    }
    return href
  } catch (error: any) {
    throw new Error("Error fetching base URL: " + error.message)
  }
}

async function scrapeDownloadLinks(urlToScrape: string) {
  try {
    const baseUrl = await getBaseUrl()
    const finalUrl = urlToScrape.startsWith("http") ? urlToScrape : `${baseUrl}${urlToScrape}`
    const { data } = await axios.get(proxy() + finalUrl, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const downloadLinks = $(".chapter-image img").map((_, el) => $(el).attr("src")).get()
    if (downloadLinks.length === 0) {
      throw new Error("No download links found for the provided URL")
    }
    return downloadLinks
  } catch (error: any) {
    throw new Error("Failed to scrape download links: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/komikindo-download",
    name: "komikindo download",
    category: "Anime",
    description: "This API endpoint is designed to retrieve all image download links for a specific comic chapter from the Komikindo website. Users provide the URL of the chapter page, and the API scrapes the page to find and extract the source URLs of all images within that chapter. This functionality is useful for applications that need to programmatically access and download comic pages for offline reading or archival purposes. The endpoint is robust, handling both full and relative URLs, and returns a JSON array of image links. It includes thorough error handling for cases where the URL is missing or invalid, or if no download links can be found on the page. This ensures a reliable and predictable response for developers.",
    tags: ["ANIME", "MANGA", "DOWNLOAD"],
    example: "?url=https://komikindo.pw/solo-leveling-chapter-1/",
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
        description: "The URL of the Komikindo chapter page",
        example: "https://komikindo.pw/solo-leveling-chapter-1/",
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
        const result = await scrapeDownloadLinks(url.trim())
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
    endpoint: "/api/anime/komikindo-download",
    name: "komikindo download",
    category: "Anime",
    description: "This API endpoint is designed to retrieve all image download links for a specific comic chapter from the Komikindo website. Users provide the URL of the chapter page, and the API scrapes the page to find and extract the source URLs of all images within that chapter. This functionality is useful for applications that need to programmatically access and download comic pages for offline reading or archival purposes. The endpoint is robust, handling both full and relative URLs, and returns a JSON array of image links. It includes thorough error handling for cases where the URL is missing or invalid, or if no download links can be found on the page. This ensures a reliable and predictable response for developers.",
    tags: ["ANIME", "MANGA", "DOWNLOAD"],
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
                description: "The URL of the Komikindo chapter page",
                example: "https://komikindo.pw/solo-leveling-chapter-1/",
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
          error: "URL must be a non-empty string",
          code: 400,
        }
      }
      try {
        const result = await scrapeDownloadLinks(url.trim())
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