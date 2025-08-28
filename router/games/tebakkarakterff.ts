import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/siputzx/karakter-freefire/refs/heads/main/data.json",
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
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/karakter-freefire",
    name: "tebak karakter freefire",
    category: "Games",
    description: "This API endpoint provides a random Free Fire character for a guessing game. Each request delivers details about a character, such as their name, image, or a brief description, challenging users to identify the correct character. This endpoint is ideal for Free Fire fan quizzes, entertainment applications, or any platform focused on testing knowledge about the popular battle royale game's characters. The response will be a JSON object containing information about the randomly selected character.",
    tags: ["Games", "Free Fire", "Character", "Quiz", "Battle Royale"],
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
    endpoint: "/api/games/karakter-freefire",
    name: "tebak karakter freefire",
    category: "Games",
    description: "This API endpoint provides a random Free Fire character for a guessing game. Each request delivers details about a character, such as their name, image, or a brief description, challenging users to identify the correct character. This endpoint is ideal for Free Fire fan quizzes, entertainment applications, or any platform focused on testing knowledge about the popular battle royale game's characters. The response will be a JSON object containing information about the randomly selected character.",
    tags: ["Games", "Free Fire", "Character", "Quiz", "Battle Royale"],
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