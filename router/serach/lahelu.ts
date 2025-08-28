import needle from "needle"

interface PostInfo {
  postID: string
  media: string
  mediaThumbnail: string | null
  userUsername: string
  userAvatar: string
  createTime: number
  [key: string]: any
}

const formatPostInfo = (postInfo: PostInfo) => ({
  ...postInfo,
  postID: `https://lahelu.com/post/${postInfo.postID}`,
  media: `${postInfo.media}`,
  mediaThumbnail:
    postInfo.mediaThumbnail == null
      ? null
      : `https://cache.lahelu.com/${postInfo.mediaThumbnail}`,
  userUsername: `https://lahelu.com/user/${postInfo.userUsername}`,
  userAvatar: `https://cache.lahelu.com/${postInfo.userAvatar}`,
  createTime: new Date(postInfo.createTime).toISOString(),
})

const laheluSearch = async (query: string) => {
  try {
    const encodedQuery = encodeURIComponent(query)
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://lahelu.com",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "application/json, text/plain, */*",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        DNT: "1",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        TE: "Trailers",
        Host: "lahelu.com",
        Origin: "https://lahelu.com",
        "X-Requested-With": "XMLHttpRequest",
      },
      timeout: 30000,
    }

    const response = await needle(
      "get",
      `https://lahelu.com/api/post/get-search?query=${encodedQuery}`,
      options,
    )

    if (response.statusCode === 200 && response.body && response.body.postInfos) {
      return response.body.postInfos.map(formatPostInfo)
    } else {
      throw new Error(
        `Request failed with status code ${response.statusCode || "unknown"}`,
      )
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to search posts on Lahelu.com")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/lahelu",
    name: "lahelu",
    category: "Search",
    description: "This API endpoint allows users to search for posts on Lahelu.com, a social media platform, by providing a search query. It retrieves and formats information about relevant posts, including their unique ID, associated media (image or video), media thumbnail, the username and avatar of the user who posted it, and the creation timestamp. This endpoint is useful for integrating Lahelu's content into other applications, for content discovery, or for analyzing popular trends on the platform.",
    tags: ["Search", "Social Media", "Posts"],
    example: "?query=drak",
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
        description: "The search query for Lahelu posts",
        example: "drak",
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
        const result = await laheluSearch(query.trim())
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
    endpoint: "/api/s/lahelu",
    name: "lahelu",
    category: "Search",
    description: "This API endpoint allows users to search for posts on Lahelu.com, a social media platform, by providing a search query in the request body. It retrieves and formats information about relevant posts, including their unique ID, associated media (image or video), media thumbnail, the username and avatar of the user who posted it, and the creation timestamp. This endpoint is useful for integrating Lahelu's content into other applications, for content discovery, or for analyzing popular trends on the platform.",
    tags: ["Search", "Social Media", "Posts"],
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
                description: "The search query for Lahelu posts",
                example: "drak",
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

      try {
        const result = await laheluSearch(query.trim())
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