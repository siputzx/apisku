import axios from "axios"

async function scrapeLlama33(prompt: string, text: string) {
  try {
    const payload = {
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      stream: false,
    }

    const headers = {
      "Content-Type": "application/json",
      "X-Deepinfra-Source": "web-page",
      accept: "text/event-stream",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      Referer: "https://deepinfra.com/chat",
    }

    const response = await axios.post(
      "https://api.deepinfra.com/v1/openai/chat/completions",
      payload,
      { headers },
    )
    return response.data.choices[0].message.content
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(error.response ? error.response.data.error : "Failed to get response from Llama 3.3 API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/llama33",
    name: "Llama3.3",
    category: "AI",
    description: "This API endpoint allows users to interact with the Llama 3.3 AI model by providing a system prompt and user text through query parameters. It's designed to facilitate conversational AI experiences, enabling applications to leverage the advanced language generation capabilities of Llama 3.3 for tasks such as content creation, answering questions, or engaging in dynamic dialogues. The endpoint processes the input, sends it to the Llama 3.3 model, and returns the generated AI response, making it suitable for integrations requiring real-time AI interactions.",
    tags: ["AI", "Llama", "Language Model"],
    example: "?prompt=Be a helpful assistant&text=hi",
    parameters: [
      {
        name: "prompt",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The system prompt for the Llama 3.3 model",
        example: "Be a helpful assistant",
      },
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "The text input for the Llama 3.3 model",
        example: "hi",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { prompt, text } = req.query || {}

      if (!prompt) {
        return {
          status: false,
          error: "Prompt is required",
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

      if (prompt.length > 1000) {
        return {
          status: false,
          error: "Prompt must be less than 1000 characters",
          code: 400,
        }
      }

      if (!text) {
        return {
          status: false,
          error: "Text is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 2000) {
        return {
          status: false,
          error: "Text must be less than 2000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrapeLlama33(prompt.trim(), text.trim())

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
    endpoint: "/api/ai/llama33",
    name: "Llama3.3",
    category: "AI",
    description: "This API endpoint enables interaction with the Llama 3.3 AI model by accepting a system prompt and user text within a JSON request body. It's ideal for applications that require structured data input for AI conversations, such as chatbots, virtual assistants, or automated content generation systems. The endpoint facilitates the transmission of conversational data to the Llama 3.3 model and returns the AI-generated response, ensuring efficient and reliable integration of advanced AI capabilities.",
    tags: ["AI", "Llama", "Language Model"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["prompt", "text"],
            properties: {
              prompt: {
                type: "string",
                description: "The system prompt for the Llama 3.3 model",
                example: "Be a helpful assistant",
                minLength: 1,
                maxLength: 1000,
              },
              text: {
                type: "string",
                description: "The text input for the Llama 3.3 model",
                example: "hi",
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
      const { prompt, text } = req.body || {}

      if (!prompt) {
        return {
          status: false,
          error: "Prompt is required",
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

      if (prompt.length > 1000) {
        return {
          status: false,
          error: "Prompt must be less than 1000 characters",
          code: 400,
        }
      }

      if (!text) {
        return {
          status: false,
          error: "Text is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 2000) {
        return {
          status: false,
          error: "Text must be less than 2000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrapeLlama33(prompt.trim(), text.trim())

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