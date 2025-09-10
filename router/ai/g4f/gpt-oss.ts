import axios from "axios"

interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

async function scrapeGptOss(messages: Message[]) {
  try {
    const response = await axios.post(
      "https://llm.siputzx.my.id/v1/chat/completions",
      { 
        messages,
        model: "gpt-oss-120b"
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    return response.data.choices[0].message.content
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/gpt-oss",
    name: "gpt-oss",
    category: "AI",
    description:
      "This API endpoint allows users to interact with the GPT-OSS-120B AI model by providing a system prompt and user content via query parameters. It's designed for simple, direct conversational interactions where the AI can be guided by an initial 'system' instruction (e.g., defining its persona or behavior) and then respond to a 'user' message. This is useful for building chat applications, virtual assistants, or generating creative content based on specific guidelines. The endpoint expects both 'prompt' and 'content' as string query parameters, representing the system's role and the user's input, respectively. The response will be the AI's generated text using the powerful GPT-OSS-120B model.",
    tags: ["AI", "Chatbot", "NLP", "GPT-OSS"],
    example: "?prompt=You are a cheerful AI assistant&content=Hello there!",
    parameters: [
      {
        name: "prompt",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "The system prompt for the GPT-OSS-120B model",
        example: "You are a helpful assistant.",
      },
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "The user message for the GPT-OSS-120B model",
        example: "Tell me a joke.",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { prompt, content } = req.query || {}

      if (!prompt) {
        return {
          status: false,
          error: "Prompt parameter is required",
          code: 400,
        }
      }

      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return {
          status: false,
          error: "Prompt must be a non-empty string",
          code: 400,
        }
      }

      if (prompt.length > 2000) {
        return {
          status: false,
          error: "Prompt must be less than 2000 characters",
          code: 400,
        }
      }

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

      if (content.length > 2000) {
        return {
          status: false,
          error: "Content must be less than 2000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrapeGptOss([
          { role: "system", content: prompt.trim() },
          { role: "user", content: content.trim() },
        ])

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
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
    endpoint: "/api/ai/gpt-oss",
    name: "gpt-oss",
    category: "AI",
    description:
      "This API endpoint facilitates advanced interaction with the GPT-OSS-120B AI model by accepting a direct array of message objects in the request body. This allows for multi-turn conversations and more complex scenarios, including defining system behavior, providing user input, and incorporating previous assistant responses to maintain context. It's ideal for building sophisticated conversational agents, interactive story generation, or any application requiring a detailed and contextualized dialogue with the powerful GPT-OSS-120B AI. The endpoint expects a JSON array of message objects, each with a 'role' (system, user, or assistant) and 'content' (the message text). The AI's response will be the generated text for the last turn.",
    tags: ["AI", "Chatbot", "Conversation", "GPT-OSS"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "array",
            description: "An array of message objects for the GPT-OSS-120B model",
            items: {
              type: "object",
              properties: {
                role: {
                  type: "string",
                  enum: ["system", "user", "assistant"],
                  example: "user",
                },
                content: {
                  type: "string",
                  example: "Hello, who are you?",
                },
              },
              required: ["role", "content"],
            },
            minItems: 1,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const messages: Message[] = req.body || []

      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          status: false,
          error: "Messages array is required and cannot be empty",
          code: 400,
        }
      }

      for (const message of messages) {
        if (!message.role || !message.content) {
          return {
            status: false,
            error: "Each message object must have 'role' and 'content' properties",
            code: 400,
          }
        }
        if (
          !["system", "user", "assistant"].includes(message.role.toLowerCase())
        ) {
          return {
            status: false,
            error: "Message role must be 'system', 'user', or 'assistant'",
            code: 400,
          }
        }
        if (typeof message.content !== "string" || message.content.trim().length === 0) {
          return {
            status: false,
            error: "Message content must be a non-empty string",
            code: 400,
          }
        }
        if (message.content.length > 2000) {
          return {
            status: false,
            error: "Message content must be less than 2000 characters",
            code: 400,
          }
        }
      }

      try {
        const result = await scrapeGptOss(messages)

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
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