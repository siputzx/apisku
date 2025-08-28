import axios from "axios"

declare const proxy: () => string | null

async function tiktoks(query: string): Promise<any> {
  try {
    const response = await axios({
      method: "POST",
      url: proxy() + "https://tikwm.com/api/feed/search",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: "current_language=en",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
      },
      data: {
        keywords: query,
        count: 10,
        cursor: 0,
        HD: 1,
      },
      timeout: 30000,
    })
    const videos = response.data.data.videos
    if (videos.length === 0) {
      throw new Error("Tidak ada video ditemukan.")
    } else {
      return videos
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(`Error fetching TikTok data: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/tiktok",
    name: "tiktok",
    category: "Search",
    description:
      "This API endpoint allows you to search for TikTok videos by providing a keyword. It returns a list of videos matching the search query, including details such as video URL, author, description, and other relevant metadata. This is useful for applications that want to integrate TikTok video search capabilities.",
    tags: ["Search", "TikTok", "Video", "Social Media"],
    example: "?query=sad",
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
        description: "The keyword to search for TikTok videos (e.g., 'sad', 'funny cats').",
        example: "sad",
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

      if (query.length > 100) {
        return {
          status: false,
          error: "Query must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await tiktoks(query.trim())
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
    endpoint: "/api/s/tiktok",
    name: "tiktok",
    category: "Search",
    description:
      "This API endpoint allows you to search for TikTok videos by providing a keyword in the JSON request body. It returns a list of videos matching the search query, including details such as video URL, author, description, and other relevant metadata. This is useful for applications that want to integrate TikTok video search capabilities using POST requests.",
    tags: ["Search", "TikTok", "Video", "Social Media"],
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
                description: "The keyword to search for TikTok videos (e.g., 'sad', 'funny cats').",
                example: "sad",
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

      if (query.length > 100) {
        return {
          status: false,
          error: "Query must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await tiktoks(query.trim())
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