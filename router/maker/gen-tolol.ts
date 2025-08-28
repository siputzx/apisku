import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

registerFont(assets.font.get("HELVETICANEUEMED"), { family: "HelveticaNeueMed" })

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

async function generateSertifikatTololImage(text = "lorem ipsum!") {
  try {
    const image = await loadImage(assets.image.get("SERTIFIKATTOLOL"))

    const width = image.width
    const height = image.height

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    ctx.drawImage(image, 0, 0, width, height)

    const fontSize = 50
    ctx.font = `${fontSize}px "HelveticaNeueMed"`
    ctx.fillStyle = "white"
    ctx.textAlign = "center"

    const metrics = ctx.measureText(text)
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

    const x = width / 2
    const y = height / 2 + textHeight / 2 - 10

    ctx.fillText(text, x, y)

    return canvas.toBuffer("image/jpeg")
  } catch (error: any) {
    throw new Error("Failed to generate 'Sertifikat Tolol' image: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/sertifikat-tolol",
    name: "sertifikat tolol",
    category: "Maker",
    description:
      "This API endpoint generates a 'Sertifikat Tolol' (Fool's Certificate) image with custom text. Users can provide a string of text via a query parameter, which will be rendered onto a pre-designed certificate template. This feature is primarily for entertainment purposes, allowing users to create humorous or ironic 'certificates' for various scenarios. The generated image is returned in JPEG format.",
    tags: ["MAKER", "IMAGE", "FUNNY", "MEME"],
    example: "?text=lorem ipsum!",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Text to display on the certificate",
        example: "lorem ipsum!",
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
          error: "Text parameter must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 100) {
        return {
          status: false,
          error: "Text cannot exceed 100 characters",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateSertifikatTololImage(text.trim())

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
    endpoint: "/api/m/sertifikat-tolol",
    name: "sertifikat tolol",
    category: "Maker",
    description:
      "This API endpoint generates a 'Sertifikat Tolol' (Fool's Certificate) image with custom text. Users can provide a string of text via a JSON request body, which will be rendered onto a pre-designed certificate template. This feature is primarily for entertainment purposes, allowing users to create humorous or ironic 'certificates' for various scenarios, especially when integrating with applications that prefer JSON payloads. The generated image is returned in JPEG format.",
    tags: ["MAKER", "IMAGE", "FUNNY", "MEME"],
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
                description: "Text to display on the certificate",
                example: "Lorem Ipsum",
                minLength: 1,
                maxLength: 100,
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
          error: "Text parameter must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 100) {
        return {
          status: false,
          error: "Text cannot exceed 100 characters",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateSertifikatTololImage(text.trim())

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