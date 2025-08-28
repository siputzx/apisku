import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/siapakahaku.json",
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
    endpoint: "/api/games/siapakahaku",
    name: "siapakah aku",
    category: "Games",
    description: "This API endpoint provides a random 'Siapakah Aku' (Who Am I?) riddle. Each request delivers a series of clues or characteristics, challenging users to guess the person, object, or concept being described. This endpoint is ideal for interactive riddle games, educational tools that encourage deductive reasoning, or any platform designed to engage users with thought-provoking puzzles. The response will be a JSON object containing the riddle and its correct answer.",
    tags: ["Games", "Riddle", "Who Am I", "Guessing Game", "Brain Teaser"],
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
    endpoint: "/api/games/siapakahaku",
    name: "siapakah aku",
    category: "Games",
    description: "This API endpoint provides a random 'Siapakah Aku' (Who Am I?) riddle. Each request delivers a series of clues or characteristics, challenging users to guess the person, object, or concept being described. This endpoint is ideal for interactive riddle games, educational tools that encourage deductive reasoning, or any platform designed to engage users with thought-provoking puzzles. The response will be a JSON object containing the riddle and its correct answer.",
    tags: ["Games", "Riddle", "Who Am I", "Guessing Game", "Brain Teaser"],
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