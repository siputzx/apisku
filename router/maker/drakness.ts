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

async function generateDarknessImageFromURL(imageURL: string, amount: string | number | undefined): Promise<Buffer> {
  try {
    const proxiedURL = proxy() + imageURL
    const img = await loadImage(proxiedURL)
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const darknessAmount = parseInt(String(amount), 10) || 50

    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = Math.max(0, imgData.data[i] - darknessAmount)
      imgData.data[i + 1] = Math.max(0, imgData.data[i + 1] - darknessAmount)
      imgData.data[i + 2] = Math.max(0, imgData.data[i + 2] - darknessAmount)
    }

    ctx.putImageData(imgData, 0, 0)

    return canvas.toBuffer("image/png")
  } catch (error: any) {
    throw new Error(`Failed to process the image from URL: ${error.message}`)
  }
}

async function generateDarknessImageFromFile(imageBuffer: Buffer, amount: string | number | undefined): Promise<Buffer> {
  try {
    const img = await loadImage(imageBuffer)
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const darknessAmount = parseInt(String(amount), 10) || 50

    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = Math.max(0, imgData.data[i] - darknessAmount)
      imgData.data[i + 1] = Math.max(0, imgData.data[i + 1] - darknessAmount)
      imgData.data[i + 2] = Math.max(0, imgData.data[i + 2] - darknessAmount)
    }

    ctx.putImageData(imgData, 0, 0)

    return canvas.toBuffer("image/png")
  } catch (error: any) {
    throw new Error(`Failed to process the image from file: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/darkness",
    name: "darkness",
    category: "Maker",
    description: "Apply a darkness effect to an image fetched from a URL. This API takes an image URL and an optional darkness 'amount' as input. It downloads the image (via a proxy if configured), adjusts the RGB values of each pixel to decrease brightness, and returns the modified image as a PNG. This can be used for artistic effects, creating mood, or correcting overexposed images.",
    tags: ["MAKER", "IMAGE", "EFFECT"],
    example: "?image=https://i.ibb.co/9rtTrVy/download-1.jpg&amount=30",
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
        description: "The URL of the image to apply the darkness effect to.",
        example: "https://i.ibb.co/9rtTrVy/download-1.jpg",
      },
      {
        name: "amount",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 0,
          maximum: 255,
          default: 50,
        },
        description: "The amount of darkness to apply (0-255).",
        example: 50,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { image, amount } = req.query || {}

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

      const parsedAmount = parseInt(String(amount), 10)
      if (amount !== undefined && (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > 255)) {
        return {
          status: false,
          error: "Amount must be an integer between 0 and 255",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateDarknessImageFromURL(image.trim(), parsedAmount)
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
    endpoint: "/api/m/darkness",
    name: "darkness",
    category: "Maker",
    description: "Apply a darkness effect to an uploaded image file. This API takes an image file directly (via multipart/form-data) and an optional darkness 'amount'. It adjusts the brightness of the uploaded image and returns the modified image as a PNG. This is useful for in-app image processing where users upload their images for artistic enhancements or corrections.",
    tags: ["MAKER", "IMAGE", "EFFECT"],
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
                description: "The image file to apply the darkness effect to (JPG, JPEG, PNG, GIF, WEBP).",
              },
              amount: {
                type: "integer",
                description: "The amount of darkness to apply (0-255, default: 50).",
                example: 50,
                minimum: 0,
                maximum: 255,
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
        const { amount } = req.body || {}

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

        const parsedAmount = parseInt(String(amount), 10)
        if (amount !== undefined && (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > 255)) {
          return {
            status: false,
            error: "Amount must be an integer between 0 and 255",
            code: 400,
          }
        }

        const imageBuffer = await generateDarknessImageFromFile(file, parsedAmount)
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