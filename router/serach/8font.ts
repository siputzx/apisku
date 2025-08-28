import axios from "axios"
import * as cheerio from "cheerio"

async function scrape8Font(query: string, page?: number) {
  try {
    const headers = {
      "Accept": "*/*",
      "User-Agent": "Postify/1.0.0",
      "Content-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json",
    }

    const { data } = await axios.get(
      `https://8font.com/page/${page || 1}/?s=${encodeURIComponent(query)}`,
      {
        headers,
        timeout: 30000,
      },
    )
    const $ = cheerio.load(data)
    const fonts = $(".card-body")
      .map((_, el) => ({
        title: $(el).find(".entry-title a").text(),
        link: $(el).find(".btn-primary").attr("href"),
        categories: $(el)
          .find(".post-info a")
          .map((_, e) => $(e).text())
          .get(),
        date: $(el).find(".post-info").contents().first().text().trim(),
        image: $(el).closest(".card").find("img").attr("src"),
      }))
      .get()

    return fonts.length
      ? { status: true, fonts }
      : { status: false, message: "No fonts found" }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/8font",
    name: "8 font",
    category: "Search",
    description: "This API endpoint allows you to search for fonts available on 8font.com. You can specify a search query to find fonts matching your criteria and also paginate through the results. This is useful for developers who need to integrate font search capabilities into their applications or for designers looking for specific font styles.",
    tags: ["Search", "Font", "8font"],
    example: "?query=cartoon&page=1",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "Search query",
        example: "cartoon",
      },
      {
        name: "page",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        description: "Page number",
        example: 1,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query, page } = req.query || {}

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

      if (query.length > 255) {
        return {
          status: false,
          error: "Query must be less than 255 characters",
          code: 400,
        }
      }

      const pageNumber = page ? parseInt(page as string) : 1
      if (isNaN(pageNumber) || pageNumber < 1) {
        return {
          status: false,
          error: "Page must be a positive integer",
          code: 400,
        }
      }

      try {
        const result = await scrape8Font(query.trim(), pageNumber)

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: result.fonts,
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
    endpoint: "/api/s/8font",
    name: "8 font",
    category: "Search",
    description: "This API endpoint allows you to search for fonts available on 8font.com. You can specify a search query to find fonts matching your criteria and also paginate through the results. This is useful for developers who need to integrate font search capabilities into their applications or for designers looking for specific font styles.",
    tags: ["Search", "Font", "8font"],
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
                description: "The search query for fonts (e.g., \"cartoon\")",
                example: "cartoon",
                minLength: 1,
                maxLength: 255,
              },
              page: {
                type: "integer",
                description: "The page number for search results (default: 1)",
                default: 1,
                example: 1,
                minimum: 1,
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
      const { query, page } = req.body || {}

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

      if (query.length > 255) {
        return {
          status: false,
          error: "Query must be less than 255 characters",
          code: 400,
        }
      }

      const pageNumber = page ? parseInt(page as string) : 1
      if (isNaN(pageNumber) || pageNumber < 1) {
        return {
          status: false,
          error: "Page must be a positive integer",
          code: 400,
        }
      }

      try {
        const result = await scrape8Font(query.trim(), pageNumber)

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: result.fonts,
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