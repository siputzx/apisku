import axios from "axios"
import jsQR from "jsqr"
import { createCanvas, loadImage } from "canvas"
import { Buffer } from "buffer"

async function readQrCodeFromUrl(url: string) {
  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const image = await loadImage(Buffer.from(response.data))
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(image, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const code = jsQR(
      imageData.data,
      imageData.width,
      imageData.height,
    )

    if (!code) {
      throw new Error("No QR code found in the image")
    }
    return code.data
  } catch (error: any) {
    console.error("QR Code API Error:", error.message)
    throw new Error(`Failed to read QR code from URL: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/qr2text",
    name: "qr2text",
    category: "Tools",
    description: "This API endpoint allows you to extract text from a QR code provided as an image URL. It is useful for quickly decoding QR codes without needing a dedicated scanner. Simply provide the URL of an image containing a QR code, and the API will return the embedded text. This can be used in various applications, such as integrating QR code scanning into web applications, automating data extraction from QR codes, or verifying QR code content programmatically. The API supports standard image formats where QR codes are typically found.",
    tags: ["TOOLS", "QR", "Utility"],
    example: "?url=https://files.catbox.moe/uegf8m.png",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2048,
        },
        description: "Image URL",
        example: "https://files.catbox.moe/uegf8m.png",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "Image URL is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "Image URL must be a non-empty string",
          code: 400,
        }
      }

      try {
        const text = await readQrCodeFromUrl(url.trim())

        return {
          status: true,
          data: {
            text: text,
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Failed to read QR code",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/qr2text",
    name: "qr2text",
    category: "Tools",
    description: "This API endpoint allows you to extract text from a QR code provided as an image URL in the request body. It is useful for quickly decoding QR codes without needing a dedicated scanner. Simply provide the URL of an image containing a QR code, and the API will return the embedded text. This can be used in various applications, such as integrating QR code scanning into web applications, automating data extraction from QR codes, or verifying QR code content programmatically. The API supports standard image formats where QR codes are typically found.",
    tags: ["TOOLS", "QR", "Utility"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                format: "url",
                description: "Image URL",
                example: "https://files.catbox.moe/uegf8m.png",
                minLength: 1,
                maxLength: 2048,
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
      const { url } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "Image URL is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "Image URL must be a non-empty string",
          code: 400,
        }
      }

      try {
        const text = await readQrCodeFromUrl(url.trim())

        return {
          status: true,
          data: {
            text: text,
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Failed to read QR code",
          code: 500,
        }
      }
    },
  },
]