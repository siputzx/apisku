import axios from "axios"

async function fetchSoundCloudData(q: string) {
  try {
    const baseUrl = "https://api-mobi.soundcloud.com/search"
    const params = {
      q: q,
      client_id: "KKzJxmw11tYpCs6T24P4uUYhqmjalG6M",
      stage: "",
    }

    const headers = {
      Accept: "application/json, text/javascript, */*; q=0.1",
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      Referer: `https://m.soundcloud.com/search?q=${encodeURIComponent(q)}`,
    }

    const response = await axios({
      method: "get",
      url: baseUrl,
      params: params,
      headers: headers,
      timeout: 30000,
    })

    const data = response.data.collection

    const filteredData = data.map((item: any) => ({
      genre: item.genre,
      created_at: item.created_at,
      duration: item.duration,
      permalink: cleanFilename(item.permalink),
      comment_count: item.comment_count,
      artwork_url: item.artwork_url,
      permalink_url: item.permalink_url,
      playback_count: item.playback_count,
    }))

    return filteredData
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

function cleanFilename(filename: string) {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/soundcloud",
    name: "soundcloud",
    category: "Search",
    description:
      "This API allows users to search for music tracks on SoundCloud. By providing a search query, users can retrieve a list of tracks with details such as genre, creation date, duration, permalink, comment count, artwork URL, and playback count. This endpoint is useful for applications that need to integrate SoundCloud search functionality or display track information.",
    tags: ["Search", "Music", "Audio"],
    example: "?query=duka",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 200,
        },
        description: "SoundCloud search query",
        example: "duka",
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

      if (query.length > 200) {
        return {
          status: false,
          error: "Query must be less than 200 characters",
          code: 400,
        }
      }

      try {
        const result = await fetchSoundCloudData(query.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
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
    endpoint: "/api/s/soundcloud",
    name: "soundcloud",
    category: "Search",
    description:
      "This API allows users to search for music tracks on SoundCloud using a JSON request body. By providing a search query, users can retrieve a list of tracks with details such as genre, creation date, duration, permalink, comment count, artwork URL, and playback count. This endpoint is useful for applications that need to integrate SoundCloud search functionality or display track information.",
    tags: ["Search", "Music", "Audio"],
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
                description: "SoundCloud search query",
                example: "duka",
                minLength: 1,
                maxLength: 200,
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

      if (query.length > 200) {
        return {
          status: false,
          error: "Query must be less than 200 characters",
          code: 400,
        }
      }

      try {
        const result = await fetchSoundCloudData(query.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
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