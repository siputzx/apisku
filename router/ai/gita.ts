import axios from "axios"

async function scrapeGita(q: string) {
  try {
    const response = await axios.get(
      `https://gitagpt.org/api/ask/gita?q=${encodeURIComponent(q)}&email=null&locale=id`,
      {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
          Referer: "https://gitagpt.org/#",
        },
      },
    )
    return response.data.response
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/gita",
    name: "gita",
    category: "AI",
    description:
      "This API endpoint provides AI-powered responses from GitaGPT, an AI model based on the Bhagavad Gita. Users can send natural language queries related to life, spirituality, philosophy, and personal dilemmas, and the AI will provide answers derived from the teachings of the Bhagavad Gita. This can be used for spiritual guidance, philosophical insights, or general knowledge about Vedic wisdom. The endpoint expects a query parameter 'q' containing the user's question and returns the AI's response in a structured JSON format. This is ideal for applications requiring quick access to spiritual or philosophical advice.",
    tags: ["AI", "Spiritual", "Philosophy"],
    example: "?q=What is the meaning of life?",
    parameters: [
      {
        name: "q",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The query for Gita AI",
        example: "What is karma?",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.query || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (q.length > 1000) {
        return {
          status: false,
          error: "Query must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const data = await scrapeGita(q.trim())

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
    endpoint: "/api/ai/gita",
    name: "gita",
    category: "AI",
    description:
      "This API endpoint allows users to submit queries to GitaGPT, an AI model based on the Bhagavad Gita, using a JSON request body. It is designed for applications where the query might be more complex or needs to be sent as part of a structured request. The AI processes questions related to life, spirituality, philosophy, and ethical dilemmas, providing responses rooted in Vedic wisdom. This method is suitable for programmatic access where the client prefers sending data in a JSON format. The response will be the AI's answer, formatted as a string.",
    tags: ["AI", "Spiritual", "Philosophy"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["q"],
            properties: {
              q: {
                type: "string",
                description: "The query to ask gita",
                example: "What is dharma?",
                minLength: 1,
                maxLength: 1000,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.body || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (q.length > 1000) {
        return {
          status: false,
          error: "Query must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const data = await scrapeGita(q.trim())

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