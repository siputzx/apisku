import axios from "axios"

async function scrape(query: string) {
  const headers = {
    Accept: "*/*",
    "User-Agent": "Postify/1.0.0",
    "Content-Encoding": "gzip, deflate, br, zstd",
    "Content-Type": "application/json",
  }

  const payload = {
    query,
    search_uuid: Date.now().toString(),
    search_options: { langcode: "id-MM" },
    search_video: true,
  }

  interface FeloResult {
    answer: string;
    source: any[];
  }

  const request = (badi: string): FeloResult => {
    const result: FeloResult = { answer: "", source: [] }
    badi.split("\n").forEach((line) => {
      if (line.startsWith("data:")) {
        try {
          const data = JSON.parse(line.slice(5).trim())
          if (data.data) {
            if (data.data.text) {
              result.answer = data.data.text.replace(/\d+/g, "")
            }
            if (data.data.sources) {
              result.source = data.data.sources
            }
          }
        } catch (e: any) {
          console.error(e.message)
        }
      }
    })
    return result
  }

  try {
    const response = await axios.post(
      "https://api.felo.ai/search/threads",
      payload,
      {
        headers,
        timeout: 30000,
        responseType: "text",
      },
    )
    return request(response.data)
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/felo",
    name: "felo",
    category: "AI",
    description: "This API endpoint allows you to get an AI-generated response from Felo using query parameters. Felo is an AI service capable of processing natural language queries and providing structured answers, including potential sources. This endpoint is suitable for quick, text-based interactions, such as question-answering, summarization, or general information retrieval. The response includes the AI's answer and a list of sources if available.",
    tags: ["AI", "Felo", "Natural Language Processing", "Information Retrieval", "Chatbot"],
    example: "?query=What is the capital of Indonesia?",
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
        description: "The query to process with Felo",
        example: "Tell me about the history of Jakarta.",
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
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 1000) {
        return {
          status: false,
          error: "Query must be less than 1000 characters",
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
    endpoint: "/api/ai/felo",
    name: "felo",
    category: "AI",
    description: "This API endpoint enables you to get an AI-generated response from Felo by sending a query in the JSON request body. Felo is an advanced AI service designed for natural language processing, capable of understanding complex questions and providing comprehensive answers, often accompanied by source information. This POST route is suitable for applications requiring more robust or longer text inputs for AI interaction, such as detailed Q&A systems, content summarizers, or research tools.",
    tags: ["AI", "Felo", "Natural Language Processing", "Information Retrieval", "Chatbot"],
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
                description: "The query to process with Felo",
                example: "Explain the importance of cybersecurity in modern society.",
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
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 1000) {
        return {
          status: false,
          error: "Query must be less than 1000 characters",
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
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]