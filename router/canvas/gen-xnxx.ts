import axios from "axios"
import { fileTypeFromBuffer } from "file-type"
import { createCanvas, loadImage, Image } from "canvas"

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

class XnxxCanvasGenerator {
  private bg: string
  private image: string | Buffer
  private title: string

  constructor() {
    this.bg = "https://files.catbox.moe/d4moy2.png"
    this.image = "https://files.catbox.moe/g45kly.jpg"
    this.title = "lari ada wibu"
  }

  setImage(value: string | Buffer): this {
    this.image = value
    return this
  }

  setTitle(value: string): this {
    this.title = value
    return this
  }

  async toAttachment(): Promise<Buffer> {
    const canvas = createCanvas(720, 790)
    const ctx = canvas.getContext("2d")

    const bg = await loadImage(this.bg)
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

    let img: Image
    if (Buffer.isBuffer(this.image)) {
      const type = await fileTypeFromBuffer(this.image)
      if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type.mime)) {
        throw new Error("Unsupported image type")
      }
      const dataURI = `data:${type.mime};base64,${this.image.toString("base64")}`
      img = await loadImage(dataURI)
    } else {
      const response = await axios.get(this.image, { responseType: "arraybuffer" })
      const buffer = Buffer.from(response.data)
      const type = await fileTypeFromBuffer(buffer)
      if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type.mime)) {
        throw new Error("Unsupported image type")
      }
      img = await loadImage(buffer)
    }

    ctx.drawImage(img, 0, 20, 720, 457)

    const title = this.title.length > 20 ? this.title.substring(0, 20) + "..." : this.title
    ctx.font = "700 45px Arial"
    ctx.textAlign = "left"
    ctx.fillStyle = "white"
    ctx.fillText(title, 30, 535)

    return canvas.toBuffer("image/png")
  }
}

async function generateXnxxCanvas(title: string, image: string | Buffer): Promise<Buffer> {
  try {
    const canvasImage = await new XnxxCanvasGenerator()
      .setTitle(title)
      .setImage(image)
      .toAttachment()
    return canvasImage
  } catch (error: any) {
    throw new Error(`Failed to create image: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/xnxx",
    name: "xnxx",
    category: "Canvas",
    description: "Generate a fake XNXX image with a title using query parameters. This API allows users to create a custom image that mimics the style of a video thumbnail, displaying a provided title and an image from a URL. It's useful for generating memes or custom content with a distinct visual style. The output is an image file in PNG format.",
    tags: ["Canvas", "Image Generation", "Meme", "Utility"],
    example: "?title=Lari%20ada%20wibu&image=https://files.catbox.moe/zhsks3.jpg",
    parameters: [
      {
        name: "title",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        description: "The title to display on the image",
        example: "Lari ada wibu",
      },
      {
        name: "image",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "uri",
        },
        description: "URL of the image to display",
        example: "https://files.catbox.moe/zhsks3.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { title, image } = req.query || {}

      if (typeof title !== "string" || title.trim().length === 0) {
        return {
          status: false,
          error: "Title is required and must be a non-empty string",
          code: 400,
        }
      }

      if (title.length > 50) {
        return {
          status: false,
          error: "Title must be 50 characters or less",
          code: 400,
        }
      }

      if (typeof image !== "string" || image.trim().length === 0) {
        return {
          status: false,
          error: "Image URL is required and must be a non-empty string",
          code: 400,
        }
      }

      const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
      try {
        const parsedUrl = new URL(image)
        if (!validExtensions.some((ext) => parsedUrl.pathname.toLowerCase().endsWith(ext))) {
          return {
            status: false,
            error: "Image URL must have a valid extension (jpg, jpeg, png, gif, webp)",
            code: 400,
          }
        }
      } catch (error) {
        return {
          status: false,
          error: "Invalid image URL format",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateXnxxCanvas(title.trim(), image.trim())

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
    endpoint: "/api/canvas/xnxx",
    name: "xnxx",
    category: "Canvas",
    description: "Generate a fake XNXX image with a title and an uploaded image file. This endpoint allows users to upload an image and provide a title to create a custom image that mimics the style of a video thumbnail. It is ideal for generating unique memes or custom content with a specific visual aesthetic, where direct image uploads are preferred over URLs. The API returns the generated image in PNG format.",
    tags: ["Canvas", "Image Generation", "Meme", "Upload"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["title", "image"],
            properties: {
              title: {
                type: "string",
                description: "The title to display on the image",
                example: "Lari ada wibu",
                minLength: 1,
                maxLength: 50,
              },
              image: {
                type: "string",
                format: "binary",
                description: "The image file to display (JPG, JPEG, PNG, WEBP, GIF)",
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
      const { title } = req.body || {}
      const { file, type, isValid, isImage, name } = (await guf(req, "image")) || {}

      if (typeof title !== "string" || title.trim().length === 0) {
        return {
          status: false,
          error: "Title is required and must be a non-empty string",
          code: 400,
        }
      }

      if (title.length > 50) {
        return {
          status: false,
          error: "Title must be 50 characters or less",
          code: 400,
        }
      }

      if (!file) {
        return {
          status: false,
          error: "Image file is required",
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

      try {
        const imageBuffer = await generateXnxxCanvas(title.trim(), file)

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