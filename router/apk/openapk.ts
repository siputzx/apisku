import axios from "axios"
import * as cheerio from "cheerio"

async function searchOpenAPK(query: string) {
  try {
    const searchUrl = `https://www.openapk.net/search/?q=${encodeURIComponent(query)}`

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)

    const results: any[] = []

    $("#search_results .content-list .list-item").each((index, element) => {
      const $item = $(element)

      const href = 'https://www.openapk.net'+ $item.attr("href")
      const title = $item.attr("title")
      const iconSrc = 'https://www.openapk.net'+ $item.find("img").attr("src")
      const iconAlt = $item.find("img").attr("alt")
      const name = $item.find(".name").text().trim()
      const descriptions = $item.find(".desc").map((i, el) => $(el).text().trim()).get()

      const description = descriptions.find(desc => !desc.startsWith("★")) || ""
      const rating = descriptions.find(desc => desc.startsWith("★")) || ""

      results.push({
        href,
        title,
        icon: {
          src: iconSrc,
          alt: iconAlt,
        },
        name,
        description,
        rating,
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
    endpoint: "/api/apk/openapk",
    name: "openapk",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on OpenAPK.net. You can provide a search query, and the API will return a list of relevant applications, including their title, icon, description, and rating. This is useful for developers or users looking to find information about specific APKs or discover new applications.",
    tags: ["APK", "Search", "Android", "Apps", "OpenAPK"],
    example: "?query=free fire",
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
        description: "Search query for applications",
        example: "free fire",
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

      if (query.length > 255) {
        return {
          status: false,
          error: "Query must be less than 255 characters",
          code: 400,
        }
      }

      try {
        const result = await searchOpenAPK(query.trim())

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
    endpoint: "/api/apk/openapk",
    name: "openapk",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on OpenAPK.net using a POST request. You can send a search query in the request body, and the API will return a list of relevant applications, including their title, icon, description, and rating. This is useful for developers or automated systems that need to programmatically search for APKs.",
    tags: ["APK", "Search", "Android", "Apps", "OpenAPK"],
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
                description: "The search query for applications on OpenAPK.net",
                example: "free fire",
                minLength: 1,
                maxLength: 255,
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

      if (query.length > 255) {
        return {
          status: false,
          error: "Query must be less than 255 characters",
          code: 400,
        }
      }

      try {
        const result = await searchOpenAPK(query.trim())

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