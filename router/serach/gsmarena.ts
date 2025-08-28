import axios from "axios"
import * as cheerio from "cheerio"

async function gsmSearch(query: string) {
  try {
    const response = await axios({
      method: "get",
      url: `https://gsmarena.com/results.php3?sQuickSearch=yes&sName=${query}`,
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(response.data)
    const result: { id: string; name: string; thumbnail: string | undefined; description: string | undefined }[] = []

    const device = $(".makers").find("li")
    device.each((i, e) => {
      const img = $(e).find("img")
      const id = $(e).find("a").attr("href")?.replace(".php", "")
      const name = $(e).find("span").html()?.split("<br>").join(" ")
      const thumbnail = img.attr("src")
      const description = img.attr("title")

      if (id && name) {
        result.push({
          id,
          name,
          thumbnail,
          description,
        })
      }
    })
    return result
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(error.message || "Failed to fetch data from GSMArena")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/gsmarena",
    name: "gsmarena",
    category: "Search",
    description: "This API endpoint allows users to search for mobile phone information on GSMArena.com. By providing a search query, users can retrieve a list of devices matching the query, including their ID, name, thumbnail image, and a brief description. This is useful for developers building applications that require device specifications or for users who want to quickly look up phone models and their basic details.",
    tags: ["Search", "Tech", "Mobile", "Phone"],
    example: "?query=iphone",
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
        description: "The search query for mobile phones (e.g., 'iphone', 'samsung galaxy')",
        example: "iphone",
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
        const result = await gsmSearch(query.trim())
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
    endpoint: "/api/s/gsmarena",
    name: "gsmarena",
    category: "Search",
    description: "This API endpoint allows users to search for mobile phone information on GSMArena.com by providing a search query in the request body. Users can retrieve a list of devices matching the query, including their ID, name, thumbnail image, and a brief description. This is useful for developers building applications that require device specifications or for users who want to quickly look up phone models and their basic details.",
    tags: ["Search", "Tech", "Mobile", "Phone"],
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
                description: "The search query for mobile phones (e.g., 'iphone', 'samsung galaxy')",
                example: "iphone",
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
        const result = await gsmSearch(query.trim())
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