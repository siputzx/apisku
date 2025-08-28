import axios from "axios"

async function translateText(text: string, source: string, target: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`

  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = response.data
    return data?.[0]?.[0]?.[0] || "Translation not found."
  } catch (error: any) {
    console.error("Translation API Error:", error.message)
    throw new Error(`Failed to translate text: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/translate",
    name: "translate",
    category: "Tools",
    description: "This API endpoint provides text translation services, allowing you to convert text from one language to another. It supports auto-detection of the source language and a wide range of target languages. This tool is invaluable for applications requiring multi-language support, content localization, or quick personal translations. It offers a reliable and efficient way to break down language barriers by providing accurate translations for various use cases, from simple phrases to longer sentences.",
    tags: ["TOOLS", "Translate", "Language"],
    example: "?text=I%20love%20you&source=auto&target=id",
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
        description: "Text to translate",
        example: "I love you",
      },
      {
        name: "source",
        in: "query",
        required: false,
        schema: {
          type: "string",
          default: "auto",
        },
        description: "Source language code",
        example: "en",
      },
      {
        name: "target",
        in: "query",
        required: false,
        schema: {
          type: "string",
          default: "id",
        },
        description: "Target language code",
        example: "id",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, source = "auto", target = "id" } = req.query || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter 'text' is required.",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string.",
          code: 400,
        }
      }

      if (typeof source !== "string" || source.trim().length === 0) {
        return {
          status: false,
          error: "Source language must be a non-empty string.",
          code: 400,
        }
      }

      if (typeof target !== "string" || target.trim().length === 0) {
        return {
          status: false,
          error: "Target language must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const translatedText = await translateText(text.trim(), source.trim(), target.trim())
        return {
          status: true,
          data: {
            translatedText: translatedText,
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "An error occurred during translation.",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/translate",
    name: "translate",
    category: "Tools",
    description: "This API endpoint provides text translation services, allowing you to convert text from one language to another using a JSON request body. It supports auto-detection of the source language and a wide range of target languages. This tool is invaluable for applications requiring multi-language support, content localization, or quick personal translations. It offers a reliable and efficient way to break down language barriers by providing accurate translations for various use cases, from simple phrases to longer sentences.",
    tags: ["TOOLS", "Translate", "Language"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["text"],
            properties: {
              text: {
                type: "string",
                description: "Text to translate",
                example: "I love you",
                minLength: 1,
                maxLength: 5000,
              },
              source: {
                type: "string",
                default: "auto",
                description: "Source language code",
                example: "en",
              },
              target: {
                type: "string",
                default: "id",
                description: "Target language code",
                example: "id",
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
      const { text, source = "auto", target = "id" } = req.body || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter 'text' is required.",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string.",
          code: 400,
        }
      }

      if (typeof source !== "string" || source.trim().length === 0) {
        return {
          status: false,
          error: "Source language must be a non-empty string.",
          code: 400,
        }
      }

      if (typeof target !== "string" || target.trim().length === 0) {
        return {
          status: false,
          error: "Target language must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const translatedText = await translateText(text.trim(), source.trim(), target.trim())
        return {
          status: true,
          data: {
            translatedText: translatedText,
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "An error occurred during translation.",
          code: 500,
        }
      }
    },
  },
]