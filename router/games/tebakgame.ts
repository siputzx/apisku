import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/qisyana/scrape/main/tebakgame.json",
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
    endpoint: "/api/games/tebakgame",
    name: "tebak game",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Game' (guess the game) question. Each request delivers an image or description related to a video game, challenging users to identify the correct game title. This endpoint is ideal for gaming quizzes, entertainment applications, or any platform focused on testing knowledge of video games across various genres and platforms. The response will be a JSON object containing the game hint (e.g., image URL, text) and its correct answer.",
    tags: ["Games", "Guessing Game", "Gaming Quiz", "Entertainment", "Video Games"],
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
    endpoint: "/api/games/tebakgame",
    name: "tebak game",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Game' (guess the game) question. Each request delivers an image or description related to a video game, challenging users to identify the correct game title. This endpoint is ideal for gaming quizzes, entertainment applications, or any platform focused on testing knowledge of video games across various genres and platforms. The response will be a JSON object containing the game hint (e.g., image URL, text) and its correct answer.",
    tags: ["Games", "Guessing Game", "Gaming Quiz", "Entertainment", "Video Games"],
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