import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkata.json",
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
    endpoint: "/api/games/tebakkata",
    name: "tebak kata",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Kata' (guess the word) question. Each request delivers a clue or a set of jumbled letters, challenging users to identify the correct word. This endpoint is ideal for word puzzle games, vocabulary-building applications, or any platform designed to test linguistic skills. The response will be a JSON object containing the clue/jumbled letters and the correct word.",
    tags: ["Games", "Word Puzzle", "Vocabulary", "Guessing Game", "Language"],
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
    endpoint: "/api/games/tebakkata",
    name: "tebak kata",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Kata' (guess the word) question. Each request delivers a clue or a set of jumbled letters, challenging users to identify the correct word. This endpoint is ideal for word puzzle games, vocabulary-building applications, or any platform designed to test linguistic skills. The response will be a JSON object containing the clue/jumbled letters and the correct word.",
    tags: ["Games", "Word Puzzle", "Vocabulary", "Guessing Game", "Language"],
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