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
    endpoint: "/api/ai/latukam",
    name: "latukam",
    category: "AI",
    description: "This API endpoint allows you to interact with the latukam AI model by providing text content as a query parameter. The AI will process the input and return a generated response. This can be used for various applications such as chatbots, content generation, or smart assistants. The API expects a 'content' parameter, which should be a string containing the text you want the AI to process. Upon successful processing, it will return a JSON object containing the AI's response.",
    tags: ["AI", "Natural Language Processing", "Chatbot"],
    example: "?content=Hello%20AI,%20how%20are%20you?",
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
        description: "Text content for AI",
        example: "Hello AI, how are you?",
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
        const result = await scrape(content.trim(), "latukam", "latukam")

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
    endpoint: "/api/ai/latukam",
    name: "latukam",
    category: "AI",
    description: "This API endpoint facilitates interaction with the latukam AI model by accepting text content via a JSON request body. It is designed for applications requiring structured input for AI processing, such as advanced chatbot interfaces or programmatic content generation. The API expects a 'content' field in the JSON body, which should be a string containing the text for the AI to analyze and respond to. A successful request will return the AI's generated response in a JSON object.",
    tags: ["AI", "Natural Language Processing", "Chatbot"],
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
                description: "Text content for AI",
                example: "What is the capital of France?",
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
        const result = await scrape(content.trim(), "latukam", "latukam")

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