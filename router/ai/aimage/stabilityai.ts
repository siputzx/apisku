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

async function generateFluxImage(prompt: string) {
  try {
    const response = await axios.post(
      CloudflareAi() + "/image-generation",
      {
        model: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
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
    throw new Error(`StabilityAI API Error: ${error.response?.data || error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/stabilityai",
    name: "stabilityai",
    category: "AI Image",
    description: "This API endpoint allows users to generate images using the StabilityAI model. By providing a descriptive prompt, users can create diverse images, from realistic photos to artistic illustrations. The API processes the prompt and returns the generated image in JPEG format. This functionality is ideal for creative applications, content generation, and prototyping, enabling quick visual asset creation.",
    tags: ["AI", "Image Generation", "Stable Diffusion"],
    example: "?prompt=a cute cat sitting on a couch",
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
        description: "The prompt for generating the image",
        example: "a cute cat sitting on a couch",
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
        const base64Image = await generateFluxImage(prompt.trim())
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
    endpoint: "/api/ai/stabilityai",
    name: "stabilityai",
    category: "AI Image",
    description: "This API endpoint enables users to generate images using the StabilityAI model by sending a text prompt in the request body. It's suitable for applications that require sending structured data for image generation. Users can provide detailed prompts to create a wide array of images, which are returned in JPEG format. This is beneficial for integrating advanced image generation capabilities into web services, automated content pipelines, or custom applications.",
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
                description: "The prompt for generating the image",
                example: "a cute cat sitting on a couch",
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
        const base64Image = await generateFluxImage(prompt.trim())
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