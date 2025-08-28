import axios from "axios"

async function scrape(content: string, cName: string, cID: string) {
  try {
    const response = await axios.post(
      "https://luminai.my.id/",
      {
        content: `${content}`,
        cName,
        cID,
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )
    return response.data.result
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/qwq-32b-preview",
    name: "Qwen QwQ 32B Preview",
    category: "AI",
    description: "This API endpoint provides access to the Qwen QwQ 32B Preview AI model, allowing users to generate responses by providing text content via query parameters. It's suitable for various natural language processing tasks, including creative writing, summarization, and conversational AI. The API requires a 'content' parameter, which should be the input text for the AI. Upon successful execution, it will return the AI's generated response.",
    tags: ["AI", "Qwen", "Natural Language Processing", "Text Generation", "Chatbot"],
    example: "?content=Write%20a%20haiku%20about%20a%20sunset.",
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
        description: "Text content for AI processing",
        example: "Tell me about the history of computers.",
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
        const result = await scrape(content.trim(), "Qwen-QwQ-32B-Preview", "Qwen/QwQ-32B-Preview")

        if (!result) {
          return {
            status: false,
            error: "No result returned from the API",
            code: 500,
          }
        }

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
    endpoint: "/api/ai/qwq-32b-preview",
    name: "Qwen QwQ 32B Preview",
    category: "AI",
    description: "This API endpoint allows users to interact with the Qwen QwQ 32B Preview AI model by sending text content within a JSON request body. It's ideal for applications that require structured and programmatic input to the AI, such as integrating with backend systems, complex content generation pipelines, or advanced conversational agents. The JSON request body must include a 'content' field, which is the text input for the AI to process. A successful request will provide the AI's generated response.",
    tags: ["AI", "Qwen", "Natural Language Processing", "Text Generation", "Chatbot"],
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
                description: "Text content for AI processing",
                example: "Explain the benefits of renewable energy sources.",
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
        const result = await scrape(content.trim(), "Qwen-QwQ-32B-Preview", "Qwen/QwQ-32B-Preview")

        if (!result) {
          return {
            status: false,
            error: "No result returned from the API",
            code: 500,
          }
        }

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