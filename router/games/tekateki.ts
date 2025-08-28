import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/tekateki.json",
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
    endpoint: "/api/games/tekateki",
    name: "teka teki",
    category: "Games",
    description: "This API endpoint provides a random 'Teka Teki' (riddle) question. Each request delivers a new riddle designed to challenge wits and critical thinking. This endpoint is ideal for interactive riddle games, casual entertainment applications, or any platform focused on engaging users with clever and humorous puzzles. The response will be a JSON object containing the riddle and its correct answer.",
    tags: ["Games", "Riddle", "Brain Teaser", "Puzzle", "Entertainment"],
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
    endpoint: "/api/games/tekateki",
    name: "teka teki",
    category: "Games",
    description: "This API endpoint provides a random 'Teka Teki' (riddle) question. Each request delivers a new riddle designed to challenge wits and critical thinking. This endpoint is ideal for interactive riddle games, casual entertainment applications, or any platform focused on engaging users with clever and humorous puzzles. The response will be a JSON object containing the riddle and its correct answer.",
    tags: ["Games", "Riddle", "Brain Teaser", "Puzzle", "Entertainment"],
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