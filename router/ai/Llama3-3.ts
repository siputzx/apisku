import axios from "axios"

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/llama33",
    name: "Llama3.3",
    category: "AI",
    description: "This API endpoint provides access to the Llama 3.3 AI model, allowing users to generate responses by providing a system prompt and user text via query parameters. It is ideal for building conversational AI, content generation tools, or integrating advanced natural language understanding into applications. The 'prompt' parameter defines the AI's role or initial instructions, while the 'text' parameter is the actual user input the AI will respond to. The response will be the AI's generated message.",
    tags: ["AI", "Llama", "Natural Language Processing", "Generative AI", "Chatbot"],
    example: "?prompt=Be%20a%20helpful%20assistant&text=hai",
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
        description: "Prompt for Llama 3.3",
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
        description: "Text input for Llama 3.3",
        example: "hi",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { prompt, text } = req.query || {}

      if (!prompt || !text) {
        return {
          status: false,
          error: "Prompt and text are required",
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

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      const payload = {
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages: [
          { role: "system", content: prompt.trim() },
          { role: "user", content: text.trim() },
        ],
        stream: false,
      }

      const headers = {
        "Content-Type": "application/json",
        "X-Deepinfra-Source": "web-page",
        "accept": "text/event-stream",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Referer": "https://deepinfra.com/chat",
      }

      try {
        const response = await axios.post(
          "https://api.deepinfra.com/v1/openai/chat/completions",
          payload,
          { headers },
        )

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
          return {
            status: false,
            error: "No valid response from Llama 3.3 API",
            code: 500,
          }
        }

        return {
          status: true,
          data: response.data.choices[0].message.content,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.response ? error.response.data : error.message,
          code: error.response ? error.response.status : 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/ai/llama33",
    name: "Llama3.3",
    category: "AI",
    description: "This API endpoint enables interaction with the Llama 3.3 AI model through a JSON request body. It is suitable for applications requiring structured and programmatic communication with the AI, such as advanced conversational interfaces, automated content creation, or intelligent data processing. The request body must include 'prompt' to define the AI's role and 'text' for the user's input. The API will return the AI's generated response.",
    tags: ["AI", "Llama", "Natural Language Processing", "Generative AI", "Chatbot"],
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
                description: "Prompt for Llama 3.3",
                example: "Be a helpful assistant",
                minLength: 1,
                maxLength: 1000,
              },
              text: {
                type: "string",
                description: "Text input for Llama 3.3",
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

      if (!prompt || !text) {
        return {
          status: false,
          error: "Prompt and text are required",
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

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      const payload = {
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages: [
          { role: "system", content: prompt.trim() },
          { role: "user", content: text.trim() },
        ],
        stream: false,
      }

      const headers = {
        "Content-Type": "application/json",
        "X-Deepinfra-Source": "web-page",
        "accept": "text/event-stream",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        "Referer": "https://deepinfra.com/chat",
      }

      try {
        const response = await axios.post(
          "https://api.deepinfra.com/v1/openai/chat/completions",
          payload,
          { headers },
        )

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
          return {
            status: false,
            error: "No valid response from Llama 3.3 API",
            code: 500,
          }
        }

        return {
          status: true,
          data: response.data.choices[0].message.content,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.response ? error.response.data : error.message,
          code: error.response ? error.response.status : 500,
        }
      }
    },
  },
]
