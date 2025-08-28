import * as Canvas from "canvas"
import * as FileType from "file-type"
import assets from "@putuofc/assetsku"

declare const proxy: () => string | null

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

async function isValidImageBuffer(buffer: Buffer) {
  const type = await FileType.fromBuffer(buffer)
  return type && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

async function generateFacepalmImageFromURL(imageURL: string) {
  try {
    const proxiedURL = proxy() + imageURL
    const avatar = await Canvas.loadImage(proxiedURL)
    const layer = await Canvas.loadImage(assets.image.get("FACEPALM"))
    const canvas = Canvas.createCanvas(632, 357)
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, 632, 357)
    ctx.drawImage(avatar, 199, 112, 235, 235)
    ctx.drawImage(layer, 0, 0, 632, 357)
    return canvas.toBuffer()
  } catch (error: any) {
    throw new Error("Failed to process the image from URL: " + error.message)
  }
}

async function generateFacepalmImageFromFile(imageBuffer: Buffer) {
  try {
    const avatar = await Canvas.loadImage(imageBuffer)
    const layer = await Canvas.loadImage(assets.image.get("FACEPALM"))
    const canvas = Canvas.createCanvas(632, 357)
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, 632, 357)
    ctx.drawImage(avatar, 199, 112, 235, 235)
    ctx.drawImage(layer, 0, 0, 632, 357)
    return canvas.toBuffer()
  } catch (error: any) {
    throw new Error("Failed to process the image from file: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/facepalm",
    name: "facepalm",
    category: "Maker",
    description:
      "This API endpoint applies a 'facepalm' effect to an image provided via a URL. Users can submit a direct image URL, and the API will fetch the image, overlay a facepalm graphic onto it, and return the modified image. This can be used for humorous content creation, memes, or satirical purposes. The output is always a PNG image.",
    tags: ["MAKER", "IMAGE", "EFFECT", "FUN"],
    example: "?image=https://i.ibb.co/9rtTrVy/download-1.jpg",
    parameters: [
      {
        name: "image",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2048,
        },
        description: "Image URL",
        example: "https://i.ibb.co/9rtTrVy/download-1.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { image } = req.query || {}

      if (!image) {
        return {
          status: false,
          error: "Image URL parameter is required",
          code: 400,
        }
      }

      if (typeof image !== "string" || image.trim().length === 0) {
        return {
          status: false,
          error: "Image parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateFacepalmImageFromURL(image.trim())

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
    endpoint: "/api/m/facepalm",
    name: "facepalm",
    category: "Maker",
    description:
      "This API endpoint applies a 'facepalm' effect to an image uploaded as a file. Users can send an image file (JPG, JPEG, PNG, GIF, WEBP), and the API will overlay a facepalm graphic onto it, returning the modified image. This is ideal for applications where users upload images directly for editing, such as custom meme generators or social media tools. The output is always a PNG image.",
    tags: ["MAKER", "IMAGE", "EFFECT", "FUN"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["image"],
            properties: {
              image: {
                type: "string",
                format: "binary",
                description: "Upload image file",
              },
            },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      try {
        const { file, type, isValid, isImage, name } = await guf(req, "image")

        if (!file) {
          return {
            status: false,
            error: "Missing image file in form data",
            code: 400,
          }
        }

        if (!isValid) {
          return {
            status: false,
            error: `Invalid file: ${name}. Size must be between 1 byte and 10MB`,
            code: 400,
          }
        }

        if (!isImage || !["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type)) {
          return {
            status: false,
            error: `Invalid file type: ${type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
            code: 400,
          }
        }

        const imageBuffer = await generateFacepalmImageFromFile(file)

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