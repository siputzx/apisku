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
    endpoint: "/api/ai/deepseek-llm-67b-chat",
    name: "deepseek llm 67b chat",
    category: "AI",
    description: "This API endpoint provides access to the DeepSeek LLM 67B Chat model, enabling users to interact with a powerful large language model by sending text content as a query parameter. The model is capable of generating detailed and contextually relevant responses for a wide range of conversational and text-based tasks, including question-answering, creative writing, and summarization. This GET route offers a simple way to integrate advanced AI chat capabilities into your applications.",
    tags: ["AI", "DeepSeek", "LLM", "Chatbot", "Text Generation"],
    example: "?content=Hello, how does a chatbot work?",
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
        description: "The text content to process with DeepSeek LLM 67B Chat",
        example: "What is the capital of France?",
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
        const result = await scrape(content.trim(), "DeepSeek-LLM-Chat-(67B)", "deepseek-ai/deepseek-llm-67b-chat")
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
    endpoint: "/api/ai/deepseek-llm-67b-chat",
    name: "deepseek llm 67b chat",
    category: "AI",
    description: "This API endpoint provides access to the DeepSeek LLM 67B Chat model, allowing users to send text content within the JSON request body and receive an AI-generated response. The DeepSeek LLM 67B Chat model is a powerful large language model capable of engaging in coherent conversations, generating creative text formats, and providing informative answers based on the input. This POST route is suitable for integrating advanced AI chat functionalities into applications that require more complex or longer text inputs.",
    tags: ["AI", "DeepSeek", "LLM", "Chatbot", "Text Generation"],
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
                description: "The text content to process with DeepSeek LLM 67B Chat",
                example: "Write a short story about a brave knight and a wise dragon.",
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
        const result = await scrape(content.trim(), "DeepSeek-LLM-Chat-(67B)", "deepseek-ai/deepseek-llm-67b-chat")
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