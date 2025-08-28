import QRCode from "qrcode"
import { Buffer } from "buffer"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function generateQrCodeBuffer(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    QRCode.toBuffer(
      text,
      {
        errorCorrectionLevel: "H",
        type: "png",
        quality: 1,
        width: 1024,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      (err, buffer) => {
        if (err) {
          return reject(new Error("Failed to generate QR code"))
        }
        resolve(buffer)
      },
    )
  })
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/text2qr",
    name: "text2qr",
    category: "Tools",
    description: "This API endpoint generates a high-quality QR code image from any provided text string. It uses a high error correction level and outputs a large PNG image, ensuring readability and versatility. This tool is perfect for creating QR codes for URLs, contact information, plain text messages, or any data that needs to be easily scanned. It can be integrated into various applications for dynamic QR code generation, marketing, or information sharing.",
    tags: ["TOOLS", "QR Code", "Generator"],
    example: "?text=Hello%20World",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "Text for QR code",
        example: "Hello World",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text } = req.query || {}

      if (!text) {
        return {
          status: false,
          error: "Text parameter is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      try {
        const qrBuffer = await generateQrCodeBuffer(text.trim())

        return createImageResponse(qrBuffer)
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
    endpoint: "/api/tools/text2qr",
    name: "text2qr",
    category: "Tools",
    description: "This API endpoint generates a high-quality QR code image from any provided text string, sent in the request body. It uses a high error correction level and outputs a large PNG image, ensuring readability and versatility. This tool is perfect for creating QR codes for URLs, contact information, plain text messages, or any data that needs to be easily scanned. It can be integrated into various applications for dynamic QR code generation, marketing, or information sharing.",
    tags: ["TOOLS", "QR Code", "Generator"],
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
                description: "Text for QR code",
                example: "Hello World",
                minLength: 1,
                maxLength: 2000,
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
      const { text } = req.body || {}

      if (!text) {
        return {
          status: false,
          error: "Text parameter is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      try {
        const qrBuffer = await generateQrCodeBuffer(text.trim())

        return createImageResponse(qrBuffer)
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