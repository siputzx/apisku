import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/siputzx/Databasee/refs/heads/main/games/butawarna.json",
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
    endpoint: "/api/games/tebakwarna",
    name: "tebak warna",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Warna' (guess the color) question. Each request delivers a challenge related to color identification, often used in games designed to test color perception or knowledge. This endpoint is ideal for interactive quizzes, educational tools focused on colors, or any platform that aims to engage users with visual color-based puzzles. The response will be a JSON object containing the color hint (e.g., color code, description) and its correct name.",
    tags: ["Games", "Color", "Quiz", "Guessing Game", "Visual"],
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
    endpoint: "/api/games/tebakwarna",
    name: "tebak warna",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Warna' (guess the color) question. Each request delivers a challenge related to color identification, often used in games designed to test color perception or knowledge. This endpoint is ideal for interactive quizzes, educational tools focused on colors, or any platform that aims to engage users with visual color-based puzzles. The response will be a JSON object containing the color hint (e.g., color code, description) and its correct name.",
    tags: ["Games", "Color", "Quiz", "Guessing Game", "Visual"],
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