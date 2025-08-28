import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function scrape(query: string) {
  try {
    const url = `${proxy() + "https://anichin.cafe/"}?s=${encodeURIComponent(query)}`
    const { data } = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const results: { title: string; type: string; status: string; link: string | undefined; image: string | undefined }[] = []

    $(".listupd article").each((_, el) => {
      const title = $(el).find(".tt h2").text().trim()
      const type = $(el).find(".typez").text().trim()
      const status = $(el).find(".bt .epx").text().trim()
      const link = $(el).find("a").attr("href")
      const image = $(el).find("img").attr("src")
      results.push({
        title: title,
        type: type,
        status: status,
        link: link,
        image: image,
      })
    })
    return results
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/anichin-search",
    name: "anichin search",
    category: "Anime",
    description: "This API endpoint allows users to search for anime on the Anichin website. By providing a search query, users can retrieve a list of anime titles along with their type, current status, a direct link to the anime page, and an image thumbnail. This is useful for quickly finding information about specific anime or exploring available titles on Anichin. The endpoint handles various anime categories and provides relevant details for each search result.",
    tags: ["Anime", "Search", "Anichin"],
    example: "?query=naga",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Anime search query",
        example: "naga",
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
          error: "Query is required",
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
        const results = await scrape(query.trim())

        if (!results || results.length === 0) {
          return {
            status: false,
            error: "No results found for your query",
            code: 404,
          }
        }

        return {
          status: true,
          data: results,
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
    endpoint: "/api/anime/anichin-search",
    name: "anichin search",
    category: "Anime",
    description: "This API endpoint allows users to search for anime on the Anichin website by sending a search query in the request body. Upon successful execution, it returns a list of anime titles, including their type, status, direct link, and image thumbnail. This is ideal for applications requiring structured data submission for anime searches, providing a flexible and robust method to query the Anichin database and retrieve detailed results for various use cases.",
    tags: ["Anime", "Search", "Anichin"],
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
                description: "The search term for anime",
                example: "naga",
                minLength: 1,
                maxLength: 100,
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
          error: "Query is required",
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
        const results = await scrape(query.trim())

        if (!results || results.length === 0) {
          return {
            status: false,
            error: "No results found for your query",
            code: 404,
          }
        }

        return {
          status: true,
          data: results,
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