import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function scrapeDetail(url: string) {
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)

    const result = {
      title: $('.entry-title[itemprop="name"]').text().trim(),
      image:
        $('.thumb img[itemprop="image"]').attr('data-src') ||
        $('.thumb img[itemprop="image"]').attr('src'),
      status: $('span:contains("Status:")')
        .text()
        .replace('Status:', '')
        .trim(),
      studio: $('span:contains("Studio:")')
        .text()
        .replace('Studio:', '')
        .trim(),
      episodes: $('span:contains("Episodes:")')
        .text()
        .replace('Episodes:', '')
        .trim(),
      duration: $('span:contains("Duration:")')
        .text()
        .replace('Duration:', '')
        .trim(),
      type: $('span:contains("Type:")').text().replace('Type:', '').trim(),
      releaseYear: $('span:contains("Released:")')
        .text()
        .replace('Released:', '')
        .trim(),
      producers: $('span:contains("Producers:")')
        .nextUntil('span')
        .map((_, el) => $(el).text().trim())
        .get()
        .join(', '),
      genres: $('.genxed a')
        .map((_, el) => $(el).text().trim())
        .get()
        .join(', '),
      synopsis: $('.entry-content[itemprop="description"] p')
        .map((_, el) => $(el).text().trim())
        .get()
        .join('\n'),
    }
    return result
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/auratail-detail",
    name: "auratail detail",
    category: "Anime",
    description: "This API endpoint allows you to retrieve detailed information about an anime from Auratail by providing its URL. It scrapes various attributes like title, image, status, studio, number of episodes, duration, type, release year, producers, genres, and synopsis. This is useful for building applications that require rich anime data directly from Auratail.",
    tags: ["ANIME", "Scraping", "Detail"],
    example: "?url=https://auratail.vip/the-war-of-cards/",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
        },
        description: "Anime detail page URL",
        example: "https://auratail.vip/the-war-of-cards/",
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

      try {
        const result = await scrapeDetail(url.trim())

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
    endpoint: "/api/anime/auratail-detail",
    name: "auratail detail",
    category: "Anime",
    description: "This API endpoint allows you to retrieve detailed information about an anime from Auratail by providing its URL in the request body. It scrapes various attributes like title, image, status, studio, number of episodes, duration, type, release year, producers, genres, and synopsis. This is useful for building applications that require rich anime data directly from Auratail, especially when sending data via a POST request.",
    tags: ["ANIME", "Scraping", "Detail"],
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
                description: "The URL of the anime detail page on Auratail",
                example: "https://auratail.vip/the-war-of-cards/",
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
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeDetail(url.trim())

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