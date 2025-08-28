import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas"
import path from "path"
import * as FileType from 'file-type';

declare const proxy: () => string | null

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

async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  const type = await FileType.fromBuffer(buffer)
  return type !== undefined && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

function applyCircleMask(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.globalCompositeOperation = "destination-in"
  ctx.beginPath()
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fill()
}

async function generateCircleImageFromURL(imageURL: string): Promise<Buffer> {
  try {
    const proxiedURL = proxy() + imageURL
    const img = await loadImage(proxiedURL)
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)
    applyCircleMask(ctx, canvas.width, canvas.height)
    return canvas.toBuffer("image/png")
  } catch (error: any) {
    throw new Error(`Failed to process the image from URL: ${error.message}`)
  }
}

async function generateCircleImageFromFile(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const img = await loadImage(imageBuffer)
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)
    applyCircleMask(ctx, canvas.width, canvas.height)
    return canvas.toBuffer("image/png")
  } catch (error: any) {
    throw new Error(`Failed to process the image from file: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/circle",
    name: "circle",
    category: "Maker",
    description: "Apply a circle mask to an image fetched from a URL. This API takes an image URL as input, downloads the image (via a proxy if configured), applies a circular mask to it, and returns the modified image as a PNG. This can be used for creating profile pictures, avatars, or any other circular image design from existing rectangular images.",
    tags: ["MAKER", "IMAGE", "UTILITY"],
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
        description: "The URL of the image to apply the circle mask to.",
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
        const imageBuffer = await generateCircleImageFromURL(image.trim())
        return createImageResponse(imageBuffer, null, "image/png")
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
    endpoint: "/api/m/circle",
    name: "circle",
    category: "Maker",
    description: "Apply a circle mask to an uploaded image file. This API takes an image file directly as input (via multipart/form-data), applies a circular mask to it, and returns the modified image as a PNG. This is suitable for scenarios where users need to upload an image directly for processing, such as in web applications for profile picture uploads.",
    tags: ["MAKER", "IMAGE", "UTILITY"],
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
                description: "The image file to apply the circle mask to (JPG, JPEG, PNG, GIF, WEBP).",
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
        const { file, isValid, type, name } = await guf(req, "image")

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
            error: `Invalid file: ${name}. Only images (JPG, JPEG, PNG, GIF, WEBP) are allowed.`,
            code: 400,
          }
        }

        const imageBuffer = await generateCircleImageFromFile(file)
        return createImageResponse(imageBuffer, null, "image/png")
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