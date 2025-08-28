import axios from "axios"

async function scrape(content: string) {
  try {
    const url = "https://www.teach-anything.com/api/generate"
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
      "Referer": "https://www.teach-anything.com/",
    }
    const body = JSON.stringify({
      prompt: content,
    })
    const response = await axios.post(url, body, { headers, timeout: 30000 })
    return response.data
  } catch (error: any) {
    console.error("Scraping error:", error.message)
    throw new Error("Failed to get response from Teach Anything API.")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/teachanything",
    name: "teach anything",
    category: "AI",
    description: "This API endpoint provides access to the 'Teach Anything' AI service, enabling users to get explanations or information on various topics by providing text content via query parameters. It's designed for educational applications, quick knowledge retrieval, or any platform that needs to explain complex subjects in a simple manner. The 'content' parameter is mandatory and should contain the topic or question you want the AI to explain. The API will return the AI's generated explanation.",
    tags: ["AI", "Education", "Knowledge", "Learning", "Explanation"],
    example: "?content=explain%20quantum%20physics%20to%20a%20beginner",
    parameters: [
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Text content for AI explanation",
        example: "Explain how photosynthesis works.",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { content } = req.query || {}

      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await scrape(content.trim())
        if (!data) {
          return {
            status: false,
            error: "No data returned from the API",
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
    endpoint: "/api/ai/teachanything",
    name: "teach anything",
    category: "AI",
    description: "This API endpoint allows users to get AI-generated explanations from the 'Teach Anything' service by providing text content within a JSON request body. It's ideal for applications that require programmatic integration for obtaining detailed and understandable explanations on various topics, suitable for e-learning platforms, research tools, or content creation. The JSON request body must include a 'content' field, which is the topic or question for the AI to explain. The API will respond with the AI's generated explanation.",
    tags: ["AI", "Education", "Knowledge", "Learning", "Explanation"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["content"],
            properties: {
              content: {
                type: "string",
                description: "The text content to process with teach anything",
                example: "Explain the concept of blockchain technology.",
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
      const { content } = req.body || {}
      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await scrape(content.trim())
        if (!data) {
          return {
            status: false,
            error: "No data returned from the API",
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