import axios from "axios"

declare const CloudflareAi: () => string | null

const generateEmbedding = async (text: string, model: string) => {
  try {
    const { data } = await axios.post(
      CloudflareAi() + "/embedding",
      {
        model: model,
        text: text,
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
    return data.data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to generate embedding from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/cf/embedding",
    name: "embedding",
    category: "CloudflareAi",
    description: "This API endpoint generates a numerical embedding for a given text input using a Cloudflare AI model. Text embeddings are vector representations of text that capture semantic meaning, making them useful for tasks like semantic search, text classification, and clustering. Users can provide the text as a query parameter and optionally specify a custom AI model for embedding generation. The default model is '@cf/baai/bge-base-en-v1.5', which is optimized for English text embeddings.",
    tags: ["AI", "Embedding", "Cloudflare", "NLP"],
    example: "?text=Sample%20text&model=@cf/baai/bge-base-en-v1.5",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 5000,
        },
        description: "The text to generate embedding for",
        example: "The quick brown fox jumps over the lazy dog.",
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
        description: "Custom AI model to use for embedding",
        example: "@cf/baai/bge-base-en-v1.5",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, model } = req.query || {}

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter 'text' is required and must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 5000) {
        return {
          status: false,
          error: "Text must be less than 5000 characters",
          code: 400,
        }
      }

      const embeddingModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/baai/bge-base-en-v1.5"

      try {
        const result = await generateEmbedding(text.trim(), embeddingModel)

        if (!result) {
          return {
            status: false,
            error: "No embedding generated for the provided text",
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
    endpoint: "/api/cf/embedding",
    name: "embedding",
    category: "CloudflareAi",
    description: "This API endpoint generates a numerical embedding for a given text input using a Cloudflare AI model. It accepts the text and an optional custom model in a JSON request body. Text embeddings are vector representations of text that capture semantic meaning, making them useful for tasks like semantic search, text classification, and clustering. The default model is '@cf/baai/bge-base-en-v1.5', which is optimized for English text embeddings.",
    tags: ["AI", "Embedding", "Cloudflare", "NLP"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The text to generate embedding for",
                example: "Sample text for embedding.",
                minLength: 1,
                maxLength: 5000,
              },
              model: {
                type: "string",
                description: "Custom AI model to use for embedding",
                example: "@cf/baai/bge-base-en-v1.5",
                minLength: 1,
                maxLength: 100,
              },
            },
            required: ["text"],
            additionalProperties: false,
          },
          example: {
            text: "This is an example sentence for embedding generation.",
            model: "@cf/baai/bge-base-en-v1.5",
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, model } = req.body || {}

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Request body must contain 'text' and it must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 5000) {
        return {
          status: false,
          error: "Text must be less than 5000 characters",
          code: 400,
        }
      }

      const embeddingModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/baai/bge-base-en-v1.5"

      try {
        const result = await generateEmbedding(text.trim(), embeddingModel)

        if (!result) {
          return {
            status: false,
            error: "No embedding generated for the provided text",
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