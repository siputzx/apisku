import axios from "axios"
import * as Canvas from "canvas"
import { fileTypeFromBuffer } from "file-type"
import assets from "@putuofc/assetsku"

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

class Gay {
  private bg: Buffer
  private fm: Buffer
  private pp: string | Buffer
  private nama: string
  private num: string

  constructor() {
    this.bg = assets.image.get("BGAY")
    this.fm = assets.image.get("GYF")
    this.pp = "https://files.catbox.moe/g45kly.jpg"
    this.nama = "siputzx"
    this.num = "87"
  }

  setName(value: string) {
    this.nama = value
    return this
  }

  setAvatar(value: string | Buffer) {
    this.pp = value
    return this
  }

  setNum(value: string) {
    this.num = value
    return this
  }

  async toAttachment(): Promise<Canvas.Canvas> {
    let pp: Canvas.Image

    if (Buffer.isBuffer(this.pp)) {
      const type = await fileTypeFromBuffer(this.pp)
      if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type.mime)) {
        throw new Error("Unsupported image type")
      }
      const dataURI = `data:${type.mime};base64,${this.pp.toString("base64")}`
      pp = await Canvas.loadImage(dataURI)
    } else {
      const response = await axios.get(this.pp, { responseType: "arraybuffer" })
      const buffer = Buffer.from(response.data)
      const type = await fileTypeFromBuffer(buffer)
      if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type.mime)) {
        throw new Error("Unsupported image type")
      }
      pp = await Canvas.loadImage(buffer)
    }

    const canvas = Canvas.createCanvas(600, 450)
    const ctx = canvas.getContext("2d")

    let iyga = await Canvas.loadImage(this.bg)
    ctx.drawImage(iyga, 0, 0, 600, 450)

    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 3
    ctx.arc(300, 160, 100, 0, Math.PI * 2, true)
    ctx.stroke()
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(pp, 200, 60, 200, 200)
    let frame = await Canvas.loadImage(this.fm)
    ctx.drawImage(frame, 200, 60, 200, 200)
    ctx.strokeRect(200, 60, 200, 200)
    ctx.restore()

    let usr = this.nama
    let name = usr.length > 16 ? usr.substring(0, 16) + " " : usr
    ctx.font = "30px Bryndan"
    ctx.textAlign = "center"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(`~${name}~`, 300, 300)

    ctx.font = "bold 48px Bryndan"
    ctx.textAlign = "center"
    ctx.fillStyle = "#ff4b74"
    ctx.fillText(`~ ${this.num} ~`, 300, 370)

    return canvas
  }
}

async function generateGayCanvas(nama: string, avatar: string | Buffer, num: string) {
  try {
    const canvasImage = await new Gay()
      .setName(nama)
      .setAvatar(avatar)
      .setNum(num)
      .toAttachment()
    return canvasImage.toBuffer("image/png")
  } catch (error: any) {
    throw new Error(`Gagal membuat gambar: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/gay",
    name: "gay",
    category: "Canvas",
    description: "Generate a stylized 'gay' image with a given name, avatar URL, and a number. This API endpoint creates a unique graphic featuring a circular avatar frame, a background image, a customized name, and a prominent number. It is designed for humorous or artistic purposes. The input parameters include the name, a URL to the avatar image (supports JPG, JPEG, PNG, WEBP, GIF), and a positive numerical string. The output is a PNG image.",
    tags: ["Canvas", "Image Generation", "Stylized Image", "Humor", "Profile"],
    example: "?nama=Lendra&avatar=https://files.catbox.moe/g45kly.jpg&num=87",
    parameters: [
      {
        name: "nama",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        description: "Name to display",
        example: "Lendra",
      },
      {
        name: "avatar",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "uri",
        },
        description: "URL of the avatar image (JPG, JPEG, PNG, WEBP, GIF)",
        example: "https://files.catbox.moe/g45kly.jpg",
      },
      {
        name: "num",
        in: "query",
        required: true,
        schema: {
          type: "string",
          pattern: "^[0-9]+$",
        },
        description: "Positive number to display",
        example: "87",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { nama, avatar, num } = req.query || {}

      if (!nama) {
        return {
          status: false,
          error: "Name parameter is required",
          code: 400,
        }
      }

      if (typeof nama !== "string" || nama.trim().length === 0) {
        return {
          status: false,
          error: "Name must be a non-empty string",
          code: 400,
        }
      }

      if (nama.length > 50) {
        return {
          status: false,
          error: "Name must be less than or equal to 50 characters",
          code: 400,
        }
      }

      if (!avatar) {
        return {
          status: false,
          error: "Avatar URL parameter is required",
          code: 400,
        }
      }

      if (typeof avatar !== "string" || avatar.trim().length === 0) {
        return {
          status: false,
          error: "Avatar must be a non-empty string URL",
          code: 400,
        }
      }

      const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
      try {
        const parsedUrl = new URL(avatar)
        if (!validExtensions.some((ext) => parsedUrl.pathname.toLowerCase().endsWith(ext))) {
          return {
            status: false,
            error: "Invalid avatar image URL. Supported formats: JPG, JPEG, PNG, WEBP, GIF",
            code: 400,
          }
        }
      } catch (e: any) {
        return {
          status: false,
          error: "Invalid avatar URL format",
          code: 400,
        }
      }

      if (!num) {
        return {
          status: false,
          error: "Number parameter is required",
          code: 400,
        }
      }

      if (typeof num !== "string" || num.trim().length === 0) {
        return {
          status: false,
          error: "Number must be a non-empty string",
          code: 400,
        }
      }

      if (isNaN(parseInt(num)) || parseInt(num) < 0) {
        return {
          status: false,
          error: "Number must be a positive numeric string",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateGayCanvas(nama.trim(), avatar.trim(), num.trim())

        if (!imageBuffer) {
          return {
            status: false,
            error: "Failed to generate image buffer",
            code: 500,
          }
        }

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
    endpoint: "/api/canvas/gay",
    name: "gay",
    category: "Canvas",
    description: "Generate a stylized 'gay' image by uploading an avatar file along with a name and a number via multipart/form-data. This API endpoint allows users to create a custom graphic featuring a circular avatar, a decorative background, a personalized name, and a prominent number. It's intended for humorous or creative content generation. Input parameters include the name, an uploaded avatar image file (supports JPG, JPEG, PNG, WEBP, GIF), and a positive numerical string. The output is a PNG image.",
    tags: ["Canvas", "Image Generation", "Stylized Image", "Humor", "Profile", "File Upload"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["nama", "avatar", "num"],
            properties: {
              nama: {
                type: "string",
                description: "Name to display",
                example: "Lendra",
                minLength: 1,
                maxLength: 50,
              },
              avatar: {
                type: "string",
                format: "binary",
                description: "Avatar image file (JPG, JPEG, PNG, WEBP, GIF)",
              },
              num: {
                type: "string",
                description: "Positive number to display",
                example: "87",
                pattern: "^[0-9]+$",
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
      const { nama, num } = req.body || {}
      const avatarFile = await guf(req, "avatar")

      if (!nama) {
        return {
          status: false,
          error: "Name parameter is required in the request body",
          code: 400,
        }
      }

      if (typeof nama !== "string" || nama.trim().length === 0) {
        return {
          status: false,
          error: "Name must be a non-empty string in the request body",
          code: 400,
        }
      }

      if (nama.length > 50) {
        return {
          status: false,
          error: "Name in request body must be less than or equal to 50 characters",
          code: 400,
        }
      }

      if (!avatarFile || !avatarFile.file) {
        return {
          status: false,
          error: "Avatar file is required",
          code: 400,
        }
      }

      if (!avatarFile.isValid) {
        return {
          status: false,
          error: `Invalid avatar file: ${avatarFile.name}. Size must be between 1 byte and 10MB`,
          code: 400,
        }
      }

      if (!avatarFile.isImage) {
        return {
          status: false,
          error: `Invalid file type: ${avatarFile.type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
          code: 400,
        }
      }

      if (!num) {
        return {
          status: false,
          error: "Number parameter is required in the request body",
          code: 400,
        }
      }

      if (typeof num !== "string" || num.trim().length === 0) {
        return {
          status: false,
          error: "Number must be a non-empty string in the request body",
          code: 400,
        }
      }

      if (isNaN(parseInt(num)) || parseInt(num) < 0) {
        return {
          status: false,
          error: "Number must be a positive numeric string in the request body",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateGayCanvas(nama.trim(), avatarFile.file, num.trim())

        if (!imageBuffer) {
          return {
            status: false,
            error: "Failed to generate image buffer",
            code: 500,
          }
        }

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