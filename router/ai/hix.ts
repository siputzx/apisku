import axios from "axios"
import * as crypto from "crypto"

interface HikaResponse {
  text: string
  topicId?: string
  references?: any[]
  rid?: string
}

const hika = {
  api: {
    base: "https://api.hika.fyi/api/",
    kbase: "kbase/web",
    advanced: "kbase/web/advanced",
    mindmap: "answer/transform/mindmap",
    keywords: "answer/transform/keywords",
  },

  headers: {
    "Content-Type": "application/json",
    Origin: "https://hika.fyi",
    Referer: "https://hika.fyi/",
    "User-Agent": "Postify/1.0.0",
  },

  types: ["chat", "advanced", "mindmap", "keywords"],

  generateId: async () => {
    const uid = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const hashId = await crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(`#${uid}*`))
      .then((hash) =>
        Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      )
    return { uid, hashId }
  },

  checkPayload: (payload: any, fields: string[]) =>
    fields.filter(
      (field) =>
        !payload[field] || (Array.isArray(payload[field]) && !payload[field].length),
    ),

  parse: (response: any): HikaResponse => {
    let result: HikaResponse = { text: "" }
    if (typeof response.data === "string") {
      response.data.split("\n").forEach((line: string) => {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.chunk) result.text += data.chunk
            if (data.topic_id) result.topicId = data.topic_id
            if (data.references) result.references = data.references
            if (data.response_id) result.rid = data.response_id
          } catch (e) {}
        }
      })
    }
    return result
  },

  chat: async (type: string = "", options: any = {}) => {
    if (!type || !hika.types.includes(type)) {
      return {
        status: false,
        code: 400,
        type: "error",
        message: "Sorry bree, tipe yang lu masukin kagak valid 😬",
        required: {
          type: `Tipe yang available: ${hika.types.join(", ")}`,
          options: {
            chat: {
              keyword: "Keyword buat search (minimal 2 karakter) ya bree",
              language: "Language code yang lu mau pake",
            },
            advanced: {
              keyword: "Keyword buat search (minimal 2 karakter) ya bree",
              language: "Language code yang lu mau pake",
            },
            mindmap: {
              rid: "Response ID dari hasil search sebelumnya",
              keywords: "Array Keyword buat mindmap",
              language: "Language code yang lu mau pake",
            },
            keywords: {
              rid: "Response ID dari hasil search sebelumnya",
              language: "Language code yang lu mau pake",
            },
          },
        },
      }
    }

    try {
      const { uid, hashId } = await hika.generateId()
      const headers = { ...hika.headers, "x-hika": hashId, "x-uid": uid }

      const handlers: { [key: string]: () => Promise<any> } = {
        chat: async () => {
          const payload = {
            keyword: options.keyword,
            language: options.language || "id",
            stream: true,
          }
          const mf = hika.checkPayload(payload, ["keyword"])

          if (mf.length)
            return {
              status: false,
              code: 400,
              type,
              message: "Waduh bree, parameter wajibnya belum lengkap nih 😌",
              required: {
                missing: mf,
                payload: {
                  keyword: "Keyword buat search (minimal 2 karakter) ya bree",
                  language: "Language code yang lu mau pake, default: id",
                  stream: "Boolean, default: true",
                },
              },
            }

          if (payload.keyword.length < 2)
            return {
              status: false,
              code: 400,
              type,
              message:
                "Keywordnya kependekkan bree, minimal 2 karakter dong biar resultnya lebih gacor 😂",
              payload: { current: payload, required: { keyword: "Minimal 2 karakter" } },
            }

          const response = await axios.post(
            `${hika.api.base}${type === "chat" ? hika.api.kbase : hika.api.advanced}`,
            payload,
            { headers },
          )
          if (!response.data)
            return {
              status: false,
              code: 404,
              type,
              message: "Sorry bree, gak nemu konten yang lu cari nih 🤔",
            }

          const result = hika.parse(response)
          return {
            status: true,
            code: 200,
            data: {
              type,
              query: payload.keyword,
              language: payload.language,
              timestamp: new Date().toISOString(),
              text: result.text.replace(/<[^>]*>/g, "").trim(),
              topicId: result.topicId,
              references: result.references,
              rid: result.rid,
            },
          }
        },

        mindmap: async () => {
          const payload = {
            response_id: options.rid,
            keywords: options.keywords,
            language: options.language || "id",
            stream: true,
          }
          const mf = hika.checkPayload(payload, ["response_id", "keywords"])

          if (mf.length)
            return {
              status: false,
              code: 400,
              type,
              message: "Waduh bree, parameter wajibnya belum lengkap nih 😌",
              required: {
                missing: mf,
                payload: {
                  response_id: "Response ID dari hasil search sebelumnya",
                  keywords: "Array Keyword buat mindmap",
                  language: "Language code yang lu mau pake, default: id",
                  stream: "Boolean, default: true",
                },
              },
            }

          const response = await axios.post(
            `${hika.api.base}${hika.api.mindmap}`,
            payload,
            { headers },
          )
          const result = hika.parse(response)
          return { status: true, code: 200, data: { type, text: result.text } }
        },

        keywords: async () => {
          const payload = {
            response_id: options.rid,
            language: options.language || "id",
            stream: true,
          }
          const mf = hika.checkPayload(payload, ["response_id"])

          if (mf.length)
            return {
              status: false,
              code: 400,
              type,
              message: "Waduh bree, parameter wajibnya belum lengkap nih 😌",
              required: {
                missing: mf,
                payload: {
                  response_id: "Response ID dari hasil search sebelumnya",
                  language: "Language code yang lu mau pake, default: id",
                  stream: "Boolean, default: true",
                },
              },
            }

          const response = await axios.post(
            `${hika.api.base}${hika.api.keywords}`,
            payload,
            { headers },
          )
          const result = hika.parse(response)
          return { status: true, code: 200, data: { type, text: result.text } }
        },
      }

      handlers.advanced = handlers.chat
      return await (
        handlers[type] ||
        (() => ({
          status: false,
          code: 400,
          type: "error",
          message: "Sorry bree, tipe yang lu masukin kagak valid 😬",
        }))
      )()
    } catch (error: any) {
      return {
        status: false,
        code: error.response?.status || 500,
        type: type || "error",
        message:
          error.response?.data?.message ||
          "Error bree, coba lagi nanti aja yak 🌝 Kalau bisa mah fix sendiri ...",
      }
    }
  },
}

async function scrapeHikaChat(keyword: string, language: string = "id") {
  try {
    const response = await hika.chat("chat", { keyword, language })
    if (response.status) {
      return response.data.text
    } else {
      throw new Error(response.message)
    }
  } catch (error: any) {
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/hikachat",
    name: "hikachat",
    category: "AI",
    description:
      "This API endpoint allows users to get AI-generated responses from the Hika Chat API. It functions as a conversational AI, providing answers based on a given keyword. This can be used for various purposes such as information retrieval, content generation, or as a component in a larger AI application. The endpoint requires a 'keyword' query parameter, which should be at least 2 characters long, and it will return a text-based response from the AI. The default language for the response is Indonesian ('id'), but it can be specified with a 'language' parameter.",
    tags: ["AI", "Chat", "NLP"],
    example: "?keyword=siapa itu siputzx",
    parameters: [
      {
        name: "keyword",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 2,
          maxLength: 1000,
        },
        description: "The keyword to search for (minimum 2 characters)",
        example: "aplikasi terbaik",
      },
      {
        name: "language",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 2,
          maxLength: 10,
        },
        description: "The language code for the response (e.g., 'en', 'id')",
        example: "en",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { keyword, language } = req.query || {}

      if (!keyword) {
        return {
          status: false,
          error: "Parameter 'keyword' is required.",
          code: 400,
        }
      }

      if (typeof keyword !== "string" || keyword.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'keyword' must be a non-empty string.",
          code: 400,
        }
      }

      if (keyword.length < 2) {
        return {
          status: false,
          error: "Parameter 'keyword' must be at least 2 characters long.",
          code: 400,
        }
      }

      if (language && typeof language !== "string") {
        return {
          status: false,
          error: "Parameter 'language' must be a string.",
          code: 400,
        }
      }

      try {
        const result = await scrapeHikaChat(
          keyword.trim(),
          (language as string) || "id",
        )

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
    endpoint: "/api/ai/hikachat",
    name: "hikachat",
    category: "AI",
    description:
      "This API endpoint allows users to obtain AI-generated responses from the Hika Chat API by providing a keyword in the request body. This method is suitable for applications that prefer sending data as a JSON object rather than URL parameters. The AI acts as a conversational agent, delivering answers based on the provided keyword, which can be leveraged for informational purposes, content generation, or as part of a larger AI-driven system. The endpoint requires a 'keyword' property in the JSON body, which must be at least 2 characters long. An optional 'language' parameter can also be included to specify the desired response language (defaulting to Indonesian if not provided).",
    tags: ["AI", "Chat", "Conversational AI"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["keyword"],
            properties: {
              keyword: {
                type: "string",
                description: "The keyword to search for (minimum 2 characters)",
                example: "manfaat tidur",
                minLength: 2,
                maxLength: 1000,
              },
              language: {
                type: "string",
                description: "The language code for the response (e.g., 'en', 'id')",
                example: "en",
                minLength: 2,
                maxLength: 10,
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
      const { keyword, language } = req.body || {}

      if (!keyword) {
        return {
          status: false,
          error: "Parameter 'keyword' is required.",
          code: 400,
        }
      }

      if (typeof keyword !== "string" || keyword.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'keyword' must be a non-empty string.",
          code: 400,
        }
      }

      if (keyword.length < 2) {
        return {
          status: false,
          error: "Parameter 'keyword' must be at least 2 characters long.",
          code: 400,
        }
      }

      if (language && typeof language !== "string") {
        return {
          status: false,
          error: "Parameter 'language' must be a string.",
          code: 400,
        }
      }

      try {
        const result = await scrapeHikaChat(
          keyword.trim(),
          (language as string) || "id",
        )

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