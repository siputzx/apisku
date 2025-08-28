import axios from "axios"
import { Buffer } from "buffer"

declare const CloudflareAi: () => string | null

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

async function stable(prompt: string) {
  try {
    const response = await axios.post(
      CloudflareAi() + "/image-generation",
      {
        model: "@cf/bytedance/stable-diffusion-xl-lightning",
        prompt: prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        responseType: "arraybuffer",
        timeout: 30000,
      },
    )

    const base64Image = Buffer.from(response.data, "binary").toString("base64")
    return base64Image
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(`Stable Diffusion API Error: ${error.response?.data || error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/stable-diffusion",
    name: "stable diffusion",
    category: "AI Image",
    description: "This API endpoint leverages the Stable Diffusion model to generate images based on a textual prompt provided via query parameters. Users can specify a detailed description of the desired image, and the AI will create a corresponding visual output. This functionality is highly versatile, suitable for generating various types of images for creative projects, content creation, or visual design. The endpoint returns the generated image as a JPEG file.",
    tags: ["AI", "Image Generation", "Stable Diffusion"],
    example: "?prompt=a futuristic city at sunset",
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
        description: "The prompt to generate the image with stable diffusion",
        example: "a futuristic city at sunset",
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
        const base64Image = await stable(prompt.trim())
        const imageBuffer = Buffer.from(base64Image, "base64")
        return createImageResponse(imageBuffer)
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
    endpoint: "/api/ai/stable-diffusion",
    name: "stable diffusion",
    category: "AI Image",
    description: "This API endpoint utilizes the Stable Diffusion model to generate images based on a textual prompt provided in the JSON request body. It's designed for applications that require sending structured data for image generation tasks. Users can submit a detailed description, and the AI will produce a corresponding image, which is returned as a JPEG file. This is ideal for integrating powerful image generation capabilities into web services, automated workflows, and custom software solutions.",
    tags: ["AI", "Image Generation", "Stable Diffusion"],
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
                description: "The prompt to generate the image with stable diffusion",
                example: "a futuristic city at sunset",
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
        const base64Image = await stable(prompt.trim())
        const imageBuffer = Buffer.from(base64Image, "base64")
        return createImageResponse(imageBuffer)
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