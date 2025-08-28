import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

const baseUrl = "https://oploverz.org"

async function scrapeOploverzSearch(query: string) {
  try {
    const searchUrl = `${baseUrl}/?q=${encodeURIComponent(query)}`
    const { data } = await axios.get(proxy() + searchUrl, {
      headers: {
        "authority": "oploverz.org",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "max-age=0",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
      timeout: 30000,
    })
    const $ = cheerio.load(data)

    return $(".bg-white.shadow.xrelated.relative")
      .map((_, el) => ({
        title: $(el).find(".titlelist.tublok").text().trim(),
        link: $(el).find("a").attr("href"),
        image: $(el).find("img").attr("src"),
        episodes: $(el).find(".eplist").text().trim(),
        rating: $(el).find(".starlist").text().trim() || "N/A",
      }))
      .get()
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/oploverz-search",
    name: "oploverz search",
    category: "Anime",
    description: "This API endpoint allows users to search for anime series on Oploverz. It takes a search query and returns a list of matching anime titles, their respective links, cover images, number of episodes, and ratings. This is useful for applications that need to implement search functionality for Oploverz's anime catalog, enabling users to quickly find specific series.",
    tags: ["Anime", "Search", "Oploverz"],
    example: "?query=romace",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Anime search query",
        example: "romance",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query } = req.query || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const results = await scrapeOploverzSearch(query.trim())

        if (!results) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: results,
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
    endpoint: "/api/anime/oploverz-search",
    name: "oploverz search",
    category: "Anime",
    description: "This API endpoint allows users to search for anime series on Oploverz. It takes a search query and returns a list of matching anime titles, their respective links, cover images, number of episodes, and ratings. This is useful for applications that need to implement search functionality for Oploverz's anime catalog, enabling users to quickly find specific series.",
    tags: ["Anime", "Search", "Oploverz"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "Anime search query",
                example: "romance",
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
      const { query } = req.body || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const results = await scrapeOploverzSearch(query.trim())

        if (!results) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: results,
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