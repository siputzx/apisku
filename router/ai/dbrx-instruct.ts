import axios from "axios"

async function scrape(content: string, cName: string, cID: string) {
  try {
    const response = await axios.post("https://luminai.my.id/", {
      content: content,
      cName,
      cID,
    })
    return response.data.result
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/dbrx-instruct",
    name: "DBRX Instruct",
    category: "AI",
    description: "This API endpoint provides access to the DBRX Instruct AI model, allowing users to send text content via query parameters and receive an AI-generated response. DBRX Instruct is designed for a variety of natural language tasks, including generating human-like text, answering questions, and summarizing information. This endpoint offers a simple and direct way to integrate advanced AI capabilities into applications that require text-based interactions.",
    tags: ["AI", "DBRX", "Instruct", "Text Generation", "NLP"],
    example: "?content=Explain the concept of artificial intelligence.",
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
        description: "The text content to process with DBRX Instruct",
        example: "Tell me a fun fact about outer space.",
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
          error: "Content must be a non-empty string",
          code: 400,
        }
      }

      if (content.length > 1000) {
        return {
          status: false,
          error: "Content must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(content.trim(), "DBRX-Instruct", "databricks/dbrx-instruct")
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
    endpoint: "/api/ai/dbrx-instruct",
    name: "DBRX Instruct",
    category: "AI",
    description: "This API endpoint facilitates interaction with the DBRX Instruct AI model by accepting text content within the JSON request body. DBRX Instruct is capable of generating detailed and coherent responses based on the provided input, making it suitable for applications requiring sophisticated natural language understanding and generation. This method is ideal for sending longer or more complex prompts, enabling robust AI-driven functionalities such as content creation, conversational agents, or automated customer support.",
    tags: ["AI", "DBRX", "Instruct", "Text Generation", "NLP"],
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
                description: "The text content to process with DBRX Instruct",
                example: "Write a short poem about the beauty of nature.",
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
          error: "Content must be a non-empty string",
          code: 400,
        }
      }

      if (content.length > 1000) {
        return {
          status: false,
          error: "Content must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(content.trim(), "DBRX-Instruct", "databricks/dbrx-instruct")
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