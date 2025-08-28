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
    endpoint: "/api/ai/nous-hermes",
    name: "nous hermes",
    category: "AI",
    description: "This API endpoint provides access to the Nous Hermes 2 Mixtral 8x7B DPO AI model, allowing users to generate AI responses by supplying text content through query parameters. It is designed for various natural language processing tasks, including creative writing, code generation, and complex conversational AI. The 'content' parameter is the primary input, representing the text that the AI will process and respond to. A successful response will return the AI's generated message.",
    tags: ["AI", "Nous Hermes", "Natural Language Processing", "Generative AI", "Chatbot"],
    example: "?content=Write%20a%20short%20story%20about%20a%20detective%20and%20a%20mystery.",
    parameters: [
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "Text content for AI processing",
        example: "Tell me a joke.",
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
        const result = await scrape(content.trim(), "Nous-Hermes-2-Mixtral-8x7B-DPO", "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO")

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
    endpoint: "/api/ai/nous-hermes",
    name: "nous hermes",
    category: "AI",
    description: "This API endpoint allows users to interact with the Nous Hermes 2 Mixtral 8x7B DPO AI model by sending text content within a JSON request body. It is ideal for applications that require structured and programmatic input to the AI, such as integrating with backend systems for content generation, advanced conversational agents, or complex data analysis. The JSON request body must include a 'content' field, which represents the input text for the AI to process. A successful request will provide the AI's generated response.",
    tags: ["AI", "Nous Hermes", "Natural Language Processing", "Generative AI", "Chatbot"],
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
                example: "Explain the concept of quantum entanglement.",
                minLength: 1,
                maxLength: 2000,
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
        const result = await scrape(content.trim(), "Nous-Hermes-2-Mixtral-8x7B-DPO", "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO")

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