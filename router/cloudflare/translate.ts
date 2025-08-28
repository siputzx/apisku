import axios from "axios"

declare const CloudflareAi: () => string | null

const translateText = async (text: string, sourceLang: string, targetLang: string, model: string) => {
  try {
    const { data } = await axios.post(
      CloudflareAi() + "/translation",
      {
        model: model,
        text: text,
        source_lang: sourceLang,
        target_lang: targetLang,
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
    throw new Error("Failed to translate text from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/cf/translation",
    name: "translation",
    category: "CloudflareAi",
    description: "This API endpoint provides text translation services using a Cloudflare AI model. Users can translate text from a specified source language to a target language by providing the text, source language code, and target language code as query parameters. This is highly useful for internationalization, communication across different linguistic backgrounds, and building multilingual applications. The default model is '@cf/meta/m2m100-1.2b', which supports translation between many languages. You can also specify a custom AI model for translation.",
    tags: ["AI", "Translation", "Cloudflare", "NLP", "Language"],
    example: "?text=Hello%20world&sourceLang=en&targetLang=id&model=@cf/meta/m2m100-1.2b",
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
        description: "The text to translate",
        example: "The quick brown fox jumps over the lazy dog.",
      },
      {
        name: "sourceLang",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 2,
          maxLength: 10,
        },
        description: "The source language code (e.g., en, id)",
        example: "en",
      },
      {
        name: "targetLang",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 2,
          maxLength: 10,
        },
        description: "The target language code (e.g., id, es)",
        example: "id",
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
        description: "Custom AI model to use for translation",
        example: "@cf/meta/m2m100-1.2b",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, sourceLang, targetLang, model } = req.query || {}

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

      if (typeof sourceLang !== "string" || sourceLang.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter 'sourceLang' is required and must be a non-empty string",
          code: 400,
        }
      }

      if (typeof targetLang !== "string" || targetLang.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter 'targetLang' is required and must be a non-empty string",
          code: 400,
        }
      }

      const translationModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/meta/m2m100-1.2b"

      try {
        const result = await translateText(text.trim(), sourceLang.trim(), targetLang.trim(), translationModel)

        if (!result) {
          return {
            status: false,
            error: "No translation result for the provided text",
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
    endpoint: "/api/cf/translation",
    name: "translation",
    category: "CloudflareAi",
    description: "This API endpoint provides text translation services using a Cloudflare AI model. It accepts the text, source language code, target language code, and an optional custom model in a JSON request body. This is highly useful for internationalization, communication across different linguistic backgrounds, and building multilingual applications. The default model is '@cf/meta/m2m100-1.2b', which supports translation between many languages.",
    tags: ["AI", "Translation", "Cloudflare", "NLP", "Language"],
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
                description: "The text to translate",
                example: "Bonjour le monde",
                minLength: 1,
                maxLength: 5000,
              },
              sourceLang: {
                type: "string",
                description: "The source language code (e.g., fr)",
                example: "fr",
                minLength: 2,
                maxLength: 10,
              },
              targetLang: {
                type: "string",
                description: "The target language code (e.g., en)",
                example: "en",
                minLength: 2,
                maxLength: 10,
              },
              model: {
                type: "string",
                description: "Custom AI model to use for translation",
                example: "@cf/meta/m2m100-1.2b",
                minLength: 1,
                maxLength: 100,
              },
            },
            required: ["text", "sourceLang", "targetLang"],
            additionalProperties: false,
          },
          example: {
            text: "Guten Tag",
            sourceLang: "de",
            targetLang: "en",
            model: "@cf/meta/m2m100-1.2b",
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, sourceLang, targetLang, model } = req.body || {}

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

      if (typeof sourceLang !== "string" || sourceLang.trim().length === 0) {
        return {
          status: false,
          error: "Request body must contain 'sourceLang' and it must be a non-empty string",
          code: 400,
        }
      }

      if (typeof targetLang !== "string" || targetLang.trim().length === 0) {
        return {
          status: false,
          error: "Request body must contain 'targetLang' and it must be a non-empty string",
          code: 400,
        }
      }

      const translationModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/meta/m2m100-1.2b"

      try {
        const result = await translateText(text.trim(), sourceLang.trim(), targetLang.trim(), translationModel)

        if (!result) {
          return {
            status: false,
            error: "No translation result for the provided text",
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