import axios from "axios"
import crypto from "crypto"
import FormData from "form-data"
import { Buffer } from "buffer"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function scrape(prompt: string) {
  const generateClientId = (): string => {
    return crypto.randomBytes(32).toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  const form = new FormData()
  form.append("prompt", prompt)
  form.append("output_format", "bytes")
  form.append("user_profile_id", "null")
  form.append("anonymous_user_id", crypto.randomUUID())
  form.append("request_timestamp", (Date.now() / 1000).toFixed(3))
  form.append("user_is_subscribed", "false")
  form.append("client_id", generateClientId())

  try {
    const response = await axios.post(
      "https://ai-api.magicstudio.com/api/ai-art-generator",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "accept": "application/json, text/plain, */*",
          "origin": "https://magicstudio.com",
          "referer": "https://magicstudio.com/ai-art-generator/",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
        },
        responseType: "arraybuffer",
        timeout: 30000,
      },
    )
    return response.data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(`Failed to get response from API: ${error.message || "Unknown error"}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/magicstudio",
    name: "magicstudio",
    category: "AI Image",
    description: "This API endpoint generates AI-powered art from a given text prompt. Users can describe the image they want to create, and the AI will generate a corresponding piece of art. This is useful for artists, designers, or anyone looking to quickly generate unique visual content. The endpoint returns the generated image directly as a JPEG file.",
    tags: ["AI", "Image Generation", "Art"],
    example: "?prompt=portrait of a wizard with a long beard",
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
        description: "The text prompt for generating the AI art",
        example: "portrait of a wizard with a long beard",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { prompt } = req.query || {}

      if (!prompt) {
        return {
          status: false,
          error: "Parameter 'prompt' is required",
          code: 400,
        }
      }

      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'prompt' must be a non-empty string",
          code: 400,
        }
      }

      if (prompt.length > 1000) {
        return {
          status: false,
          error: "Parameter 'prompt' must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(prompt.trim())
        return createImageResponse(result)
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
    endpoint: "/api/ai/magicstudio",
    name: "magicstudio",
    category: "AI Image",
    description: "This API endpoint allows users to generate AI-powered art by sending a text prompt in the request body. It's designed for applications where the prompt is submitted as part of a JSON payload. The AI interprets the prompt and generates a unique image, which is returned as a JPEG file. This is ideal for integrating AI art generation into web services, creative tools, or automated content pipelines.",
    tags: ["AI", "Image Generation", "Art"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["prompt"],
            properties: {
              prompt: {
                type: "string",
                description: "The text prompt for generating the AI art",
                example: "portrait of a wizard with a long beard",
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
      const { prompt } = req.body || {}

      if (!prompt) {
        return {
          status: false,
          error: "Parameter 'prompt' is required",
          code: 400,
        }
      }

      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'prompt' must be a non-empty string",
          code: 400,
        }
      }

      if (prompt.length > 1000) {
        return {
          status: false,
          error: "Parameter 'prompt' must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(prompt.trim())
        return createImageResponse(result)
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