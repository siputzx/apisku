import axios from "axios"
import * as cheerio from "cheerio"

declare const proxy: () => string | null

async function tiktokStalk(user: string) {
  try {
    const url = await axios.get(proxy() + `https://tiktok.com/@${user}`, {
      headers: {
        "User-Agent": "PostmanRuntime/7.32.2",
      },
      timeout: 30000,
    })
    const html = url.data
    const $ = cheerio.load(html)
    const data = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text()
    const result = JSON.parse(data)
    if (result["__DEFAULT_SCOPE__"]["webapp.user-detail"].statusCode !== 0) {
      throw new Error("User not found!")
    }
    return result["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"]
  } catch (err: any) {
    throw new Error(`Error stalking TikTok user: ${err.message || err}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/tiktok",
    name: "tiktok",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a specified TikTok user using their username as a query parameter. It fetches detailed user information, including statistics and other publicly available data. This is useful for applications requiring TikTok user data for display, analysis, or integration.",
    tags: ["Stalker", "TikTok", "User", "Profile"],
    example: "?username=mrbeast",
    parameters: [
      {
        name: "username",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The TikTok username to stalk",
        example: "mrbeast",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username } = req.query || {}

      if (!username) {
        return {
          status: false,
          error: "Username parameter is required",
          code: 400,
        }
      }

      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await tiktokStalk(username.trim())
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
    endpoint: "/api/stalk/tiktok",
    name: "tiktok",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a specified TikTok user using their username in a JSON request body. It fetches detailed user information, including statistics and other publicly available data. This is useful for applications requiring TikTok user data for display, analysis, or integration.",
    tags: ["Stalker", "TikTok", "User", "Profile"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            required: ["username"],
            properties: {
              username: {
                type: "string",
                description: "The TikTok username to stalk",
                example: "mrbeast",
                minLength: 1,
                maxLength: 255,
              },
            },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username } = req.body || {}

      if (!username) {
        return {
          status: false,
          error: "Username parameter is required",
          code: 400,
        }
      }

      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await tiktokStalk(username.trim())
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