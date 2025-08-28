import axios from "axios"

declare const CloudflareAi: () => string | null

interface ChatMessage {
  role: "system" | "user",
  content: string,
}

const chatWithAI = async (messages: ChatMessage[], model: string) => {
  try {
    const response = await axios.post(
      CloudflareAi() + "/chat",
      {
        model: model,
        messages: messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          Referer: "https://ai.clauodflare.workers.dev/",
        },
        timeout: 30000,
      },
    )

    return response.data.data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/cf/chat",
    name: "chat",
    category: "CloudflareAi",
    description: "This API endpoint allows users to interact with a Cloudflare-powered AI model to get chat responses. Users can provide a 'prompt' for the AI to respond to, and an optional 'system' instruction to guide the AI's behavior or persona. This is useful for building conversational interfaces, chatbots, or AI-driven content generation tools where a simple text-based interaction is needed. The AI model used is '@cf/meta/llama-3.1-8b-instruct-fast', providing a fast and efficient response. You can also specify a custom AI model.",
    tags: ["AI", "Chatbot", "Cloudflare"],
    example: "?prompt=hello&system=you are a helpful assistant&model=@cf/meta/llama-3.1-8b-instruct-fast",
    parameters: [
      {
        name: "prompt",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "User's message to AI",
        example: "What is the capital of France?",
      },
      {
        name: "system",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "System instruction for AI",
        example: "You are a helpful assistant.",
      },
      {
        name: "model",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Custom AI model to use",
        example: "@cf/meta/llama-3.1-8b-instruct-fast",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { prompt, system, model } = req.query || {}

      if (!prompt && !system) {
        return {
          status: false,
          error: "At least one query parameter (prompt or system) is required",
          code: 400,
        }
      }

      const messages: ChatMessage[] = []
      if (typeof system === "string" && system.trim().length > 0) {
        messages.push({ role: "system", content: system.trim() })
      }
      if (typeof prompt === "string" && prompt.trim().length > 0) {
        messages.push({ role: "user", content: prompt.trim() })
      }

      if (messages.length === 0) {
        return {
          status: false,
          error: "Provided prompt and system parameters are empty or invalid",
          code: 400,
        }
      }

      const aiModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/meta/llama-3.1-8b-instruct-fast"

      try {
        const result = await chatWithAI(messages, aiModel)

        if (!result) {
          return {
            status: false,
            error: "No result returned from AI chat",
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
    endpoint: "/api/cf/chat",
    name: "chat",
    category: "CloudflareAi",
    description: "This API endpoint facilitates AI chat interactions by accepting a JSON array of messages in the request body. Each message object should specify a 'role' (either 'system' or 'user') and 'content' (the actual text). This approach is ideal for managing multi-turn conversations or providing a more structured chat history to the AI. The Cloudflare AI model '@cf/meta/llama-3.1-8b-instruct-fast' processes these messages to generate a coherent and contextually relevant response, making it suitable for advanced conversational AI applications. You can also specify a custom AI model.",
    tags: ["AI", "Chatbot", "Cloudflare"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              messages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    role: {
                      type: "string",
                      enum: ["system", "user"],
                      description: "The role of the message sender",
                      example: "user",
                    },
                    content: {
                      type: "string",
                      description: "The content of the message",
                      example: "Hello, how are you?",
                      minLength: 1,
                      maxLength: 2000,
                    },
                  },
                  required: ["role", "content"],
                  additionalProperties: false,
                },
                minItems: 1,
              },
              model: {
                type: "string",
                description: "Custom AI model to use",
                example: "@cf/meta/llama-3.1-8b-instruct-fast",
                minLength: 1,
                maxLength: 100,
              },
            },
            required: ["messages"],
            additionalProperties: false,
          },
          example: {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Can you tell me a joke?" },
            ],
            model: "@cf/meta/llama-3.1-8b-instruct-fast",
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { messages, model } = req.body || {}

      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          status: false,
          error: "Request body must contain a non-empty array of messages",
          code: 400,
        }
      }

      const hasUserMessage = messages.some(
        (msg: ChatMessage) => msg.role === "user" && typeof msg.content === "string" && msg.content.trim().length > 0,
      )
      if (!hasUserMessage) {
        return {
          status: false,
          error: "At least one message with role 'user' and non-empty content is required",
          code: 400,
        }
      }

      for (const msg of messages) {
        if (!["system", "user"].includes(msg.role)) {
          return {
            status: false,
            error: "Each message must have a valid 'role' (system or user)",
            code: 400,
          }
        }
        if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
          return {
            status: false,
            error: "Each message must have non-empty 'content' as a string",
            code: 400,
          }
        }
        if (msg.content.length > 2000) {
          return {
            status: false,
            error: "Message content must be less than 2000 characters",
            code: 400,
          }
        }
      }

      const aiModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/meta/llama-3.1-8b-instruct-fast"

      try {
        const result = await chatWithAI(messages, aiModel)

        if (!result) {
          return {
            status: false,
            error: "No result returned from AI chat",
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