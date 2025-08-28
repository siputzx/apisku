import axios from "axios"
declare const proxy: () => string | null

async function stickerlySearch(query: string) {
  try {
    const { data } = await axios.post(
      proxy() + "https://api.sticker.ly/v4/stickerPack/smartSearch",
      {
        keyword: query,
        enabledKeywordSearch: true,
        filter: {
          extendSearchResult: false,
          sortBy: "RECOMMENDED",
          languages: ["ALL"],
          minStickerCount: 5,
          searchBy: "ALL",
          stickerType: "ALL",
        },
      },
      {
        headers: {
          "user-agent": "androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)",
          "content-type": "application/json",
          "accept-encoding": "gzip",
        },
        timeout: 30000,
      },
    )

    if (!data.result || !data.result.stickerPacks) {
      return []
    }

    return data.result.stickerPacks.map((pack: any) => ({
      name: pack.name,
      author: pack.authorName,
      stickerCount: pack.resourceFiles.length,
      viewCount: pack.viewCount,
      exportCount: pack.exportCount,
      isPaid: pack.isPaid,
      isAnimated: pack.isAnimated,
      thumbnailUrl: `${pack.resourceUrlPrefix}${pack.resourceFiles[pack.trayIndex]}`,
      url: pack.shareUrl,
    }))
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/sticker/stickerly-search",
    name: "stickerly search",
    category: "Sticker",
    description:
      "This API allows you to search for sticker packs on Sticker.ly using a query parameter. It returns a list of sticker packs matching the query, including details such as the pack name, author, number of stickers, view count, export count, whether it's paid or animated, a thumbnail URL, and its share URL.",
    tags: ["Sticker", "Search", "Stickerly"],
    example: "?query=love",
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
        description: "Search keyword for sticker packs",
        example: "love",
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
        const result = await stickerlySearch(query.trim())
        if (result.length === 0) {
          return {
            status: false,
            error: "No sticker packs found for the given query",
            code: 404,
          }
        }
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
    endpoint: "/api/sticker/stickerly-search",
    name: "stickerly search",
    category: "Sticker",
    description:
      "This API allows you to search for sticker packs on Sticker.ly by providing a search keyword in the JSON request body. It returns a comprehensive list of sticker packs that match your query, including details such as the pack's name, author, total number of stickers, view and export counts, whether the pack is paid or animated, a URL for its thumbnail, and a shareable link to the sticker pack.",
    tags: ["Sticker", "Search", "Stickerly"],
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
                description: "Search keyword for sticker packs",
                example: "love",
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
          error: "Query is required in the request body",
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
        const result = await stickerlySearch(query.trim())
        if (result.length === 0) {
          return {
            status: false,
            error: "No sticker packs found for the given query",
            code: 404,
          }
        }
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