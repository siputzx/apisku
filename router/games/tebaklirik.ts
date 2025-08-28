import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebaklirik.json",
      {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )
    const src = response.data
    return src[Math.floor(Math.random() * src.length)]
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Error fetching data: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/tebaklirik",
    name: "tebak lirik",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Lirik' (guess the lyrics) question. Each request delivers a snippet of song lyrics, challenging users to identify the correct song title and/or artist. This endpoint is ideal for music quiz games, entertainment applications, or any platform focused on testing knowledge of popular song lyrics across various genres. The response will be a JSON object containing the lyrics excerpt and its correct song/artist information.",
    tags: ["Games", "Lyrics", "Music Quiz", "Guessing Game", "Entertainment"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: data,
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
    endpoint: "/api/games/tebaklirik",
    name: "tebak lirik",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Lirik' (guess the lyrics) question. Each request delivers a snippet of song lyrics, challenging users to identify the correct song title and/or artist. This endpoint is ideal for music quiz games, entertainment applications, or any platform focused on testing knowledge of popular song lyrics across various genres. The response will be a JSON object containing the lyrics excerpt and its correct song/artist information.",
    tags: ["Games", "Lyrics", "Music Quiz", "Guessing Game", "Entertainment"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: data,
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