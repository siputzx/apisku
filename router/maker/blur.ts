import * as Canvas from "canvas"
import * as path from "path"
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

async function generateBlurImageFromURL(imageURL: string) {
  try {
    const proxiedURL = proxy() + imageURL
    const img = await Canvas.loadImage(proxiedURL)
    const canvas = Canvas.createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width / 4, canvas.height / 4)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(canvas, 0, 0, canvas.width / 4, canvas.height / 4, 0, 0, canvas.width + 5, canvas.height + 5)

    return canvas.toBuffer()
  } catch (error: any) {
    throw new Error("Failed to process the image from URL")
  }
}

async function generateBlurImageFromFile(imageBuffer: Buffer) {
  try {
    const img = await Canvas.loadImage(imageBuffer)
    const canvas = Canvas.createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width / 4, canvas.height / 4)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(canvas, 0, 0, canvas.width / 4, canvas.height / 4, 0, 0, canvas.width + 5, canvas.height + 5)

    return canvas.toBuffer()
  } catch (error: any) {
    throw new Error("Failed to process the image from file")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/blur",
    name: "blur",
    category: "Maker",
    description:
      "This API endpoint allows you to apply a blur effect to an image provided via a URL. The image will be fetched through a proxy to handle potential cross-origin issues. The processed image will be returned as a PNG buffer. This can be used for various creative applications, such as creating background effects, artistic filters, or to obscure sensitive information in images.",
    tags: ["Maker", "Image", "Blur"],
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
    async run({ req, res }) {
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
        const imageBuffer = await generateBlurImageFromURL(image.trim())
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
    endpoint: "/api/m/blur",
    name: "blur",
    category: "Maker",
    description:
      "This API endpoint allows you to apply a blur effect to an image uploaded as a file. The image will be processed and returned as a PNG buffer. This is suitable for applications where users upload images directly for manipulation, such as profile picture editing or image effect tools. Supported image formats include JPG, JPEG, PNG, GIF, and WEBP.",
    tags: ["Maker", "Image", "Blur"],
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
                description: "The image file to blur.",
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
        const { file: imageFile, type, isValid, isImage } = await guf(req, "image")

        if (!imageFile) {
          return {
            status: false,
            error: "Missing image file in form data",
            code: 400,
          }
        }

        if (!isValid) {
          return {
            status: false,
            error: "Invalid file: image. Size must be between 1 byte and 10MB",
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

        const imageBuffer = await generateBlurImageFromFile(imageFile)
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