import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"
import * as FileType from "file-type"
declare const proxy: () => string | null

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers = {
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

async function generateBeautifulImageFromURL(imageURL: string) {
  try {
    const proxiedURL = proxy() + imageURL
    const img = await loadImage(proxiedURL)
    const base = await loadImage(assets.image.get("BEAUTIFUL"))
    const canvas = createCanvas(376, 400)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 258, 28, 84, 95)
    ctx.drawImage(img, 258, 229, 84, 95)
    return canvas.toBuffer()
  } catch (error: any) {
    throw new Error("Failed to process the image from URL: " + error.message)
  }
}

async function generateBeautifulImageFromFile(imageBuffer: Buffer) {
  try {
    const img = await loadImage(imageBuffer)
    const base = await loadImage(assets.image.get("BEAUTIFUL"))
    const canvas = createCanvas(376, 400)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 258, 28, 84, 95)
    ctx.drawImage(img, 258, 229, 84, 95)
    return canvas.toBuffer()
  } catch (error: any) {
    throw new Error("Failed to process the image from file: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/beautiful",
    name: "beautiful",
    category: "Maker",
    description:
      "This API endpoint applies a 'beautiful' effect to an image provided via a URL. It fetches the image, overlays it onto a base image, and returns the modified image. This effect can be used to add an artistic or decorative touch to user-submitted images, making them appear more visually appealing for various creative applications.",
    tags: ["Maker", "Image", "Effect", "Art", "Filter"],
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
          maxLength: 2000,
        },
        description: "The URL of the image to apply the beautiful effect to.",
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
          error: "Image URL must be a non-empty string",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateBeautifulImageFromURL(image.trim())
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
    endpoint: "/api/m/beautiful",
    name: "beautiful",
    category: "Maker",
    description:
      "This API endpoint applies a 'beautiful' effect to an image uploaded as a file. Users can send an image file in multipart/form-data, and the API will process it by overlaying it onto a base image, returning the modified image. This functionality is ideal for applications where users need to upload images directly from their device to apply visual enhancements or effects.",
    tags: ["Maker", "Image", "Effect", "Art", "Upload"],
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
                description: "The image file to apply the beautiful effect to (JPG, JPEG, PNG, GIF, WEBP).",
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
        const { file, type, isImage, isValid, name } = await guf(req, "image")

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

        if (!isImage) {
          return {
            status: false,
            error: `Invalid file type: ${type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
            code: 400,
          }
        }

        const imageBuffer = await generateBeautifulImageFromFile(file)

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