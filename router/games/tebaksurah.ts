import axios from "axios"

declare const proxy: () => string | null

async function scrape() {
  try {
    const getRandomAyah = () => Math.floor(Math.random() * 6236) + 1
    const response = await axios.get(
      `${proxy()}https://api.alquran.cloud/v1/ayah/${getRandomAyah()}/ar.alafasy`,
      {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )

    if (response.status === 200 && response.data && response.data.data) {
      return response.data.data
    } else {
      throw new Error("Data not found")
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(error.message || "Internal Server Error")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/surah",
    name: "tebak surah",
    category: "Games",
    description: "This API endpoint provides a random ayah (verse) from the Quran for a guessing game. Each request delivers an ayah, challenging users to identify the surah (chapter) it belongs to. This endpoint is ideal for religious educational applications, Islamic quizzes, or any platform focused on testing knowledge of the Quran. The response will be a JSON object containing the ayah text, its surah information, and potentially audio for recitation.",
    tags: ["Games", "Quran", "Islam", "Religion", "Quiz", "Education"],
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
    endpoint: "/api/games/surah",
    name: "tebak surah",
    category: "Games",
    description: "This API endpoint provides a random ayah (verse) from the Quran for a guessing game. Each request delivers an ayah, challenging users to identify the surah (chapter) it belongs to. This endpoint is ideal for religious educational applications, Islamic quizzes, or any platform focused on testing knowledge of the Quran. The response will be a JSON object containing the ayah text, its surah information, and potentially audio for recitation.",
    tags: ["Games", "Quran", "Islam", "Religion", "Quiz", "Education"],
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