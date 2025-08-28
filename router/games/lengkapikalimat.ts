import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/qisyana/scrape/main/lengkapikalimat.json",
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
    endpoint: "/api/games/lengkapikalimat",
    name: "lengkapi kalimat",
    category: "Games",
    description: "This API endpoint provides a random 'Lengkapi Kalimat' (complete the sentence) question. Each request retrieves a new incomplete sentence, requiring users to fill in the missing word or phrase to complete it logically and grammatically. This endpoint is ideal for language learning applications, educational games, or any platform focused on improving sentence construction and vocabulary skills. The response will be a JSON object containing the incomplete sentence and its correct completion.",
    tags: ["Games", "Language", "Education", "Sentence Completion"],
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
    endpoint: "/api/games/lengkapikalimat",
    name: "lengkapi kalimat",
    category: "Games",
    description: "This API endpoint provides a random 'Lengkapi Kalimat' (complete the sentence) question. Each request retrieves a new incomplete sentence, requiring users to fill in the missing word or phrase to complete it logically and grammatically. This endpoint is ideal for language learning applications, educational games, or any platform focused on improving sentence construction and vocabulary skills. The response will be a JSON object containing the incomplete sentence and its correct completion.",
    tags: ["Games", "Language", "Education", "Sentence Completion"],
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