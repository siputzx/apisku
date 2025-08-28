import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/caklontong.json",
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
    endpoint: "/api/games/caklontong",
    name: "cak lontong",
    category: "Games",
    description: "This API endpoint provides a random 'Cak Lontong' question, a popular Indonesian comedic quiz format known for its tricky and often illogical answers. Each request retrieves a new question and its corresponding unique answer, designed to challenge conventional thinking. This endpoint is ideal for developing quiz applications, entertainment platforms, or any scenario where engaging and humorous brain teasers are desired. The response will be a JSON object containing the question and its answer.",
    tags: ["Games", "Cak Lontong", "Quiz", "Entertainment"],
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
    endpoint: "/api/games/caklontong",
    name: "cak lontong",
    category: "Games",
    description: "This API endpoint provides a random 'Cak Lontong' question, a popular Indonesian comedic quiz format known for its tricky and often illogical answers. Each request retrieves a new question and its corresponding unique answer, designed to challenge conventional thinking. This endpoint is ideal for developing quiz applications, entertainment platforms, or any scenario where engaging and humorous brain teasers are desired. The response will be a JSON object containing the question and its answer.",
    tags: ["Games", "Cak Lontong", "Quiz", "Entertainment"],
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