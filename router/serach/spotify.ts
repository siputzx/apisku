import axios from "axios"
import { Buffer } from "buffer"

function convert(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return minutes + ":" + (Number(seconds) < 10 ? "0" : "") + seconds
}

async function spotifyCreds(): Promise<{ status: boolean; access_token?: string; msg?: string }> {
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `7bbae52593da45c69a27c853cc22edff:88ae1f7587384f3f83f62a279e7f87af`,
            ).toString("base64"),
        },
        timeout: 30000,
      },
    )

    return response.data.access_token
      ? { status: true, access_token: response.data.access_token }
      : { status: false, msg: "Can't generate token!" }
  } catch (e: any) {
    console.error("API Error:", e.message)
    return { status: false, msg: e.message }
  }
}

async function searchSpotify(
  query: string,
  type: string = "track",
  limit: number = 20,
): Promise<{ status: boolean; data?: any; total_results?: number; msg?: string }> {
  try {
    const creds = await spotifyCreds()
    if (!creds.status) return creds

    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${creds.access_token}` },
      params: {
        q: query,
        type,
        limit: Math.min(limit, 50),
        market: "US",
      },
      timeout: 30000,
    })

    const tracks = response.data.tracks.items
    if (!tracks.length) return { status: false, msg: "No tracks found!" }

    const results = tracks.map((item: any) => ({
      track_url: item.external_urls.spotify,
      thumbnail: item.album.images[0]?.url || "No thumbnail available",
      title: `${item.artists[0].name} - ${item.name}`,
      artist: item.artists[0].name,
      duration: convert(item.duration_ms),
      preview_url: item.preview_url || "No preview available",
      album: item.album.name,
      release_date: item.album.release_date,
    }))

    return {
      status: true,
      data: results,
      total_results: response.data.tracks.total,
    }
  } catch (e: any) {
    console.error("API Error:", e.message)
    return { status: false, msg: e.message }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/spotify",
    name: "spotify",
    category: "Search",
    description:
      "This API endpoint allows you to search for tracks on Spotify. You can provide a search query as a parameter, and the API will return relevant track information including track URL, thumbnail, title, artist, duration, preview URL, album, and release date. This is useful for applications that need to integrate Spotify search functionality.",
    tags: ["Search", "Spotify", "Music"],
    example: "?query=serana",
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
        description: "Search query",
        example: "serana",
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
        const result = await searchSpotify(query.trim())

        if (!result.status) {
          return {
            status: false,
            error: result.msg || "No tracks found!",
            code: 404,
          }
        }

        return {
          status: true,
          data: result.data,
          total_results: result.total_results,
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
    endpoint: "/api/s/spotify",
    name: "spotify",
    category: "Search",
    description:
      "This API endpoint allows you to search for tracks on Spotify using a JSON request body. You must provide a search query, and the API will return relevant track information including track URL, thumbnail, title, artist, duration, preview URL, album, and release date. This is useful for applications that need to integrate Spotify search functionality with POST requests.",
    tags: ["Search", "Spotify", "Music"],
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
                description: "The search query for Spotify tracks.",
                example: "serana",
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
        const result = await searchSpotify(query.trim())

        if (!result.status) {
          return {
            status: false,
            error: result.msg || "No tracks found!",
            code: 404,
          }
        }

        return {
          status: true,
          data: result.data,
          total_results: result.total_results,
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