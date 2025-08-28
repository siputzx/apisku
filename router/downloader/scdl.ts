import axios from "axios"
import * as querystring from "querystring"

const clientID = "KKzJxmw11tYpCs6T24P4uUYhqmjalG6M"

class SoundCloudAPI {
  clientID: string
  logLevel: {
    dump: (req: { method: string; url: string }) => void
  }

  constructor() {
    this.clientID = clientID
    this.logLevel = {
      dump: (req: { method: string; url: string }) => {
        // console.log(`${req.method} ${req.url}`);
      },
    }
  }

  async resolve(addr: string): Promise<Track> {
    const params = querystring.stringify({
      client_id: this.clientID,
      url: addr,
    })

    const url = `https://api-v2.soundcloud.com/resolve?${params}`

    try {
      this.logLevel.dump({ method: "GET", url })
      const response = await axios.get(url, { timeout: 30000 })

      if (response.data.kind === "track") {
        return new Track(response.data)
      }

      const userTracksResponse = await this.userTracks(response.data.id)
      return userTracksResponse[0] // Assuming the first track is the desired one
    } catch (error: any) {
      throw new Error(`Failed to resolve URL: ${error.message}`)
    }
  }

  async userTracks(id: string): Promise<Track[]> {
    const params = querystring.stringify({
      client_id: this.clientID,
      limit: "1",
    })

    const url = `https://api-v2.soundcloud.com/users/${id}/tracks?${params}`

    try {
      this.logLevel.dump({ method: "GET", url })
      const response = await axios.get(url, { timeout: 30000 })

      return response.data.collection.map((track: any) => new Track(track))
    } catch (error: any) {
      throw new Error(`Failed to fetch user tracks: ${error.message}`)
    }
  }
}

class Track {
  artwork_url?: string
  user: { avatar_url?: string; username: string }
  media: { transcodings: { format: { protocol: string }; url: string }[] }
  title: string
  full_duration?: number
  duration: number
  description?: string
  [key: string]: any

  constructor(data: any) {
    Object.assign(this, data)
  }

  artwork(): string | null {
    let artworkUrl = this.artwork_url
    if (!artworkUrl) {
      artworkUrl = this.user.avatar_url
    }
    return artworkUrl ? artworkUrl.replace("large", "t500x") : null
  }

  async progressive(): Promise<any> {
    let progressiveUrl: string | null = null

    for (const coding of this.media.transcodings) {
      if (coding.format.protocol === "progressive") {
        progressiveUrl = coding.url
        break
      }
    }

    if (!progressiveUrl) {
      throw new Error("No progressive streaming URL found")
    }

    const url = `${progressiveUrl}?client_id=${clientID}`

    try {
      const response = await axios.get(url, { timeout: 30000 })
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to get progressive URL: ${error.message}`)
    }
  }
}

async function scrapeSoundCloud(url: string) {
  try {
    const soundcloud = new SoundCloudAPI()
    const trackData = await soundcloud.resolve(url)

    if (!trackData) {
      return null
    }

    const media = await trackData.progressive()

    if (!media || !media.url) {
      return null
    }

    return {
      title: trackData.title,
      url: media.url,
      thumbnail: trackData.artwork(),
      duration: trackData.full_duration || trackData.duration,
      user: trackData.user.username,
      description: trackData.description || "",
    }
  } catch (error: any) {
    console.error("SoundCloud scraping error:", error)
    return null
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/soundcloud",
    name: "soundCloud",
    category: "Downloader",
    description: "This API endpoint allows you to download audio from a SoundCloud track by providing its URL as a query parameter. It uses the SoundCloud API to resolve the track information, including its title, artist, duration, thumbnail, and the direct progressive download link. The endpoint handles various SoundCloud URL formats, including mobile links, and provides robust error handling for invalid URLs, tracks not found, or issues during the download link retrieval process. The output is a structured JSON object containing all relevant track details and the direct audio download URL.",
    tags: ["DOWNLOADER", "SoundCloud", "Audio", "Music"],
    example: "?url=https://m.soundcloud.com/teguh-hariyadi-652597010/anji-dia",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "SoundCloud track URL",
        example: "https://m.soundcloud.com/teguh-hariyadi-652597010/anji-dia",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required.",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string.",
          code: 400,
        }
      }

      let parsedUrl: URL
      try {
        parsedUrl = new URL(url.trim())
      } catch (e) {
        return {
          status: false,
          error: "Invalid URL format.",
          code: 400,
        }
      }

      if (!parsedUrl.hostname.includes("soundcloud.com")) {
        return {
          status: false,
          error: "Invalid SoundCloud URL.",
          code: 400,
        }
      }

      if (parsedUrl.hostname.startsWith("m.")) {
        parsedUrl.hostname = parsedUrl.hostname.replace(/^m\./, "")
      }

      try {
        const result = await scrapeSoundCloud(parsedUrl.toString())

        if (!result) {
          return {
            status: false,
            error: "Track not found or download link not available.",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (err: any) {
        console.error("SoundCloud downloader error:", err)
        return {
          status: false,
          error: err.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/d/soundcloud",
    name: "soundCloud",
    category: "Downloader",
    description: "This API endpoint allows you to download audio from a SoundCloud track by providing its URL in the request body. It uses the SoundCloud API to resolve the track information, including its title, artist, duration, thumbnail, and the direct progressive download link. The endpoint handles various SoundCloud URL formats, including mobile links, and provides robust error handling for invalid URLs, tracks not found, or issues during the download link retrieval process. The output is a structured JSON object containing all relevant track details and the direct audio download URL.",
    tags: ["DOWNLOADER", "SoundCloud", "Audio", "Music"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                description: "SoundCloud track URL",
                example: "https://m.soundcloud.com/teguh-hariyadi-652597010/anji-dia",
                minLength: 1,
                maxLength: 1000,
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
      const { url } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required.",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string.",
          code: 400,
        }
      }

      let parsedUrl: URL
      try {
        parsedUrl = new URL(url.trim())
      } catch (e) {
        return {
          status: false,
          error: "Invalid URL format.",
          code: 400,
        }
      }

      if (!parsedUrl.hostname.includes("soundcloud.com")) {
        return {
          status: false,
          error: "Invalid SoundCloud URL.",
          code: 400,
        }
      }

      if (parsedUrl.hostname.startsWith("m.")) {
        parsedUrl.hostname = parsedUrl.hostname.replace(/^m\./, "")
      }

      try {
        const result = await scrapeSoundCloud(parsedUrl.toString())

        if (!result) {
          return {
            status: false,
            error: "Track not found or download link not available.",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (err: any) {
        console.error("SoundCloud downloader error:", err)
        return {
          status: false,
          error: err.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]