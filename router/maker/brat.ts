import axios from "axios"

const createImageResponse = (buffer: Buffer, filename: string | null = null, contentType: string = "image/png") => {
  const headers = {
    "Content-Type": contentType,
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function generateBrat(text: string, isAnimated: boolean, delayMs: number) {
  try {
    const words = text.trim().split(/\s+/).slice(0, 10)
    const limitedText = words.join(" ")

    if (limitedText.length > 800) {
      throw new Error("Text maksimal 800 karakter")
    }

    // Encode text untuk URL
    const encodedText = encodeURIComponent(limitedText)
    
    // Pilih endpoint berdasarkan isAnimated
    const apiUrl = isAnimated 
      ? `https://brat.siputzx.my.id/gif?text=${encodedText}&delay=${delayMs}`
      : `https://brat.siputzx.my.id/image?text=${encodedText}`
    
    // Request ke API eksternal
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 detik timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const buffer = Buffer.from(response.data)
    
    if (isAnimated) {
      return { buffer, contentType: "image/gif" }
    } else {
      return buffer // Return buffer langsung untuk static image
    }

  } catch (error: any) {
    console.error("Error calling external Brat API:", error)
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      throw new Error("Request timeout - API eksternal tidak merespon")
    } else if (error.response) {
      throw new Error(`API eksternal error: ${error.response.status} - ${error.response.statusText}`)
    } else if (error.request) {
      throw new Error("Tidak dapat terhubung ke API eksternal")
    } else {
      throw new Error(`Error: ${error.message}`)
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/brat",
    name: "brat",
    category: "Maker",
    description: "Generate a Brat image or animated GIF from text. This API allows users to create visual representations of text, either as a static image (WEBP format) or an animated GIF. The text input will be processed and rendered by the Brat Generator tool, with options for animation and delay between words in the GIF. This can be used for creative content, social media posts, or dynamic text displays.",
    tags: ["MAKER", "IMAGE", "GIF"],
    example: "?text=hello+world&isAnimated=true&delay=300",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 800,
        },
        description: "The text content",
        example: "Hello world!",
      },
      {
        name: "isAnimated",
        in: "query",
        required: false,
        schema: {
          type: "boolean",
          default: false,
        },
        description: "Animated GIF",
        example: false,
      },
      {
        name: "delay",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 100,
          maximum: 1500,
          default: 500,
        },
        description: "Delay between words (ms)",
        example: 500,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, isAnimated: isAnimatedParam = "false", delay = "500" } = req.query || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter text is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Parameter text must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 800) {
        return {
          status: false,
          error: "Text must be less than or equal to 800 characters",
          code: 400,
        }
      }

      const isAnimated = String(isAnimatedParam).toLowerCase() === "true"
      const delayMs = Math.max(100, Math.min(1500, parseInt(String(delay)) || 500))

      try {
        const result = await generateBrat(text.trim(), isAnimated, delayMs)
        
        if (isAnimated && typeof result === "object" && "buffer" in result && "contentType" in result) {
          return createImageResponse(result.buffer as Buffer, null, result.contentType as string)
        } else if (result instanceof Buffer) {
          return createImageResponse(result, null, "image/png") // API eksternal return PNG untuk static
        } else {
          return {
            status: false,
            error: "Unexpected result format from Brat generator",
            code: 500,
          }
        }
      } catch (error: any) {
        console.error("Error in brat generator:", error)
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
    endpoint: "/api/m/brat",
    name: "brat",
    category: "Maker",
    description: "Generate a Brat image or animated GIF from text. This API allows users to create visual representations of text, either as a static image (WEBP format) or an animated GIF. The text input will be processed and rendered by the Brat Generator tool, with options for animation and delay between words in the GIF. This can be used for creative content, social media posts, or dynamic text displays.",
    tags: ["MAKER", "IMAGE", "GIF"],
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
                description: "The text content for the Brat image/GIF (max 800 characters)",
                example: "Hello world!",
                minLength: 1,
                maxLength: 800,
              },
              isAnimated: {
                type: "boolean",
                description: "Set to true to generate an animated GIF, false for a static image (default: false)",
                example: false,
              },
              delay: {
                type: "integer",
                description: "Delay between words in milliseconds for GIF generation (min 100, max 1500, default: 500)",
                example: 500,
                minimum: 100,
                maximum: 1500,
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
      const { text, isAnimated: isAnimatedParam = false, delay = 500 } = req.body || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter text is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Parameter text must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 800) {
        return {
          status: false,
          error: "Text must be less than or equal to 800 characters",
          code: 400,
        }
      }

      const isAnimated = String(isAnimatedParam).toLowerCase() === "true"
      const delayMs = Math.max(100, Math.min(1500, parseInt(String(delay)) || 500))

      try {
        const result = await generateBrat(text.trim(), isAnimated, delayMs)
        
        if (isAnimated && typeof result === "object" && "buffer" in result && "contentType" in result) {
          return createImageResponse(result.buffer as Buffer, null, result.contentType as string)
        } else if (result instanceof Buffer) {
          return createImageResponse(result, null, "image/png") // API eksternal return PNG untuk static
        } else {
          return {
            status: false,
            error: "Unexpected result format from Brat generator",
            code: 500,
          }
        }
      } catch (error: any) {
        console.error("Error in brat generator:", error)
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]