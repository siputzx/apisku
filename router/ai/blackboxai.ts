import axios from "axios"

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/blackboxai",
    name: "blackboxai",
    category: "AI",
    description: "This API endpoint allows you to interact with the BlackboxAI model by sending text content as a query parameter. BlackboxAI is designed to process and generate responses based on the provided input, making it suitable for various natural language processing tasks such as chatbots, content generation, and summarization. The endpoint expects a 'content' parameter and returns the AI's generated 'result'. This is a straightforward method for integrating basic AI conversational capabilities into your applications using GET requests.",
    tags: ["AI", "BlackboxAI", "Chatbot", "NLP", "Text Generation"],
    example: "?content=hai",
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
        description: "The text content to process with BlackboxAI",
        example: "Hello, how are you today?",
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
        const response = await axios.post("https://luminai.my.id/", {
          content: content.trim(),
          model: "blackboxai",
        })

        const result = response.data.result

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
    endpoint: "/api/ai/blackboxai",
    name: "blackboxai",
    category: "AI",
    description: "This API endpoint enables you to interact with the BlackboxAI model by sending text content within the JSON request body. BlackboxAI is designed for processing natural language and generating responses, making it suitable for tasks such as chatbots, intelligent assistants, and automated content creation. By using a POST request, you can securely send more complex or longer content inputs. The endpoint expects a 'content' field in the JSON body and returns the AI's generated 'result', providing a flexible way to integrate AI capabilities into your applications.",
    tags: ["AI", "BlackboxAI", "Chatbot", "NLP", "Text Generation"],
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
                description: "The text content to process with BlackboxAI",
                example: "Tell me a short story about a robot and a cat.",
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
        const response = await axios.post("https://luminai.my.id/", {
          content: content.trim(),
          model: "blackboxai",
        })

        const result = response.data.result

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