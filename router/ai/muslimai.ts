import axios from "axios"

async function scrape(query: string) {
  try {
    const responseSearch = await axios.post(
      "https://www.muslimai.io/api/search",
      { query: query },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
          "Referer": "https://www.muslimai.io/",
        },
        timeout: 30000,
      },
    )

    const ayatData = responseSearch.data
    const content = ayatData?.[0]?.content

    if (!content) {
      throw new Error("No data found for the query")
    }

    const prompt = `Use the following passages to answer the query in Indonesian, ensuring clarity and understanding, as a world-class expert in the Quran. Do not mention that you were provided any passages in your answer: ${query}\n\n${content}`

    const responseAnswer = await axios.post(
      "https://www.muslimai.io/api/answer",
      { prompt: prompt },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
          "Referer": "https://www.muslimai.io/",
        },
        timeout: 30000,
      },
    )

    const jawaban = responseAnswer.data

    if (!jawaban) {
      throw new Error("Error retrieving the answer")
    }

    return jawaban
  } catch (error: any) {
    console.error("Scraping error:", error.message)
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/muslimai",
    name: "muslimai",
    category: "AI",
    description: "This API endpoint allows users to get AI-powered responses related to Islamic knowledge by submitting a query as a URL parameter. It leverages the MuslimAI service to search relevant passages and generate clear, understandable answers in Indonesian, from the perspective of a Quran expert. This API is useful for educational applications, spiritual guidance tools, or any platform needing accurate Islamic information. The 'query' parameter is required and should contain the question or topic you want to ask MuslimAI.",
    tags: ["AI", "Islamic", "Quran", "Education", "MuslimAI"],
    example: "?query=apa%20itu%20sholat?",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The query to ask muslimai",
        example: "apa itu sholat?",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query } = req.query || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrape(query.trim())
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        const statusCode = error.message === "No data found for the query" ? 404 : 500
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: statusCode,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/ai/muslimai",
    name: "muslimai",
    category: "AI",
    description: "This API endpoint allows users to receive AI-generated responses from the MuslimAI service on Islamic topics by submitting a query within a JSON request body. It's designed for applications that require programmatic interaction for retrieving comprehensive and expert-level answers related to the Quran, delivered in Indonesian. The JSON request body must contain a 'query' field, which represents the question or topic for MuslimAI to process. The API will respond with the AI's generated answer.",
    tags: ["AI", "Islamic", "Quran", "Education", "MuslimAI"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "The query to ask muslimai",
                example: "apa itu puasa?",
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
      const { query } = req.body || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrape(query.trim())
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        const statusCode = error.message === "No data found for the query" ? 404 : 500
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: statusCode,
        }
      }
    },
  },
]