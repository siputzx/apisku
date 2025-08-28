import axios from "axios"
import * as cheerio from "cheerio"

interface McpedlResult {
  title: string
  link: string
  image: string
  rating: string
}

async function scrapeMcpedlSearch(query: string, max: number = 10): Promise<{ status: boolean; data: McpedlResult[] }> {
  try {
    const { data } = await axios.get(`https://mcpedl.org/?s=${encodeURIComponent(query)}`, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const result: McpedlResult[] = []

    $(".g-block.size-20 article").each((i, el) => {
      if (i >= max) {
        return
      }
      const title = $(el).find(".entry-title a").text().trim() || "No title"
      const link = $(el).find(".entry-title a").attr("href") || "No link"
      let image = $(el).find(".post-thumbnail img").attr("data-srcset") || $(el).find(".post-thumbnail img").attr("src") || "No image"
      
      if (image.includes(",")) {
        image = image.split(",")[0].split(" ")[0]
      }
      const rating = $(el).find(".rating-wrapper span").text().trim() || "No rating"

      result.push({ title, link, image, rating })
    })

    return {
      status: true,
      data: result,
    }
  } catch (error: any) {
    console.error("Error during MCPEDL search:", error.message)
    throw new Error("Failed to search MCPEDL.")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/mcpedl",
    name: "mcpedlsearch",
    category: "Search",
    description: "This API endpoint allows users to search for Minecraft Pocket Edition (MCPE) content on MCPEDL.org using a search query. It scrapes information such as the title, direct link, image thumbnail, and rating for each relevant result. This endpoint is useful for developers building tools or applications for Minecraft players, allowing them to easily discover and access mods, maps, textures, and other add-ons for MCPE.",
    tags: ["Search", "Minecraft", "MCPE"],
    example: "?q=shaders",
    parameters: [
      {
        name: "q",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The search query for MCPEDL",
        example: "shaders",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.query || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await scrapeMcpedlSearch(q.trim())
        return {
          status: true,
          data: data.data,
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
    endpoint: "/api/s/mcpedl",
    name: "mcpedlsearch",
    category: "Search",
    description: "This API endpoint allows users to search for Minecraft Pocket Edition (MCPE) content on MCPEDL.org using a search query provided in the request body. It scrapes information such as the title, direct link, image thumbnail, and rating for each relevant result. This endpoint is useful for developers building tools or applications for Minecraft players, allowing them to easily discover and access mods, maps, textures, and other add-ons for MCPE.",
    tags: ["Search", "Minecraft", "MCPE"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["q"],
            properties: {
              q: {
                type: "string",
                description: "The search query for MCPEDL",
                example: "shaders",
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
      const { q } = req.body || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await scrapeMcpedlSearch(q.trim())
        return {
          status: true,
          data: data.data,
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