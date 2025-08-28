import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json",
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
    endpoint: "/api/games/tebakgambar",
    name: "tebak gambar",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Gambar' (guess the picture) question. Each request delivers an image that represents a hidden word or phrase, challenging users to decipher the visual puzzle. This endpoint is ideal for visual quiz games, entertainment applications, or any platform focused on engaging users with creative and challenging image-based riddles. The response will be a JSON object containing the image URL and the correct answer.",
    tags: ["Games", "Picture Quiz", "Riddle", "Visual Puzzle", "Entertainment"],
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
    endpoint: "/api/games/tebakgambar",
    name: "tebak gambar",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Gambar' (guess the picture) question. Each request delivers an image that represents a hidden word or phrase, challenging users to decipher the visual puzzle. This endpoint is ideal for visual quiz games, entertainment applications, or any platform focused on engaging users with creative and challenging image-based riddles. The response will be a JSON object containing the image URL and the correct answer.",
    tags: ["Games", "Picture Quiz", "Riddle", "Visual Puzzle", "Entertainment"],
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