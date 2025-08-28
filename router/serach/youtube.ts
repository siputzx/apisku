import yts from "yt-search"

async function youtubeSearch(query: string) {
  try {
    const results = await yts(query)
    return results.all
  } catch (error: any) {
    throw new Error(`Error searching YouTube: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/youtube",
    name: "youtube",
    category: "Search",
    description: "This API endpoint allows you to search for videos and channels on YouTube. Users can provide a search query as a parameter, and the API will return relevant results, including videos and channel information. This is useful for applications requiring Youtube integration, such as custom video players, content aggregators, or research tools. The API aims to provide comprehensive search results from YouTube, making it easier to find specific content programmatically.",
    tags: ["Search", "YouTube", "Video", "Channel", "API"],
    example: "?query=sc%20bot",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 500,
        },
        description: "Youtube query",
        example: "sc bot",
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
          error: "Parameter 'query' is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'query' must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 500) {
        return {
          status: false,
          error: "Parameter 'query' must be less than 500 characters",
          code: 400,
        }
      }

      try {
        const results = await youtubeSearch(query.trim())

        if (!results || results.length === 0) {
          return {
            status: false,
            error: "No results found for the given query",
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
    endpoint: "/api/s/youtube",
    name: "youtube",
    category: "Search",
    description: "This API endpoint allows you to search for videos and channels on YouTube using a JSON request body. Users can provide a search query, and the API will return relevant results, including videos and channel information. This is useful for applications requiring Youtube integration, such as custom video players, content aggregators, or research tools, especially when sending data via a POST request for structured queries. The API aims to provide comprehensive search results from YouTube, making it easier to find specific content programmatically.",
    tags: ["Search", "YouTube", "Video", "Channel", "API"],
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
                description: "The search query for YouTube (e.g., 'sc bot', 'music video').",
                example: "sc bot",
                minLength: 1,
                maxLength: 500,
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
          error: "Parameter 'query' is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'query' must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 500) {
        return {
          status: false,
          error: "Parameter 'query' must be less than 500 characters",
          code: 400,
        }
      }

      try {
        const results = await youtubeSearch(query.trim())

        if (!results || results.length === 0) {
          return {
            status: false,
            error: "No results found for the given query",
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