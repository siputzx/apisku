import axios from "axios"
import { fileTypeFromBuffer } from "file-type"
import { createCanvas, loadImage } from "canvas"
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

async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer)
  return type !== undefined && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

async function generateGoodbyeImage(username: string, imageBuffer: Buffer): Promise<Buffer> {
  const canvas = createCanvas(650, 300)
  const ctx = canvas.getContext("2d")

  const bg = assets.image.get("GOODBYE3")

  const [background, avatarImg] = await Promise.all([loadImage(bg), loadImage(imageBuffer)])

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

  const name = username.length > 10 ? username.substring(0, 10) + "..." : username
  ctx.globalAlpha = 1
  ctx.font = "700 45px Courier New"
  ctx.textAlign = "left"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(name, 290, 338)

  ctx.font = "700 30px Courier New"
  ctx.textAlign = "center"
  ctx.fillStyle = "#000000"
  ctx.fillText(name, 325, 273)

  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = 6
  ctx.strokeStyle = "white"
  ctx.arc(325, 150, 75, 0, Math.PI * 2, true)
  ctx.stroke()
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(avatarImg, 250, 75, 150, 150)
  ctx.restore()

  return canvas.toBuffer("image/png")
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/goodbyev3",
    name: "goodbye v3",
    category: "Canvas",
    description:
      "Generate a customized goodbye image (version 3) using a username and an avatar URL. This API creates a visually distinct goodbye banner, ideal for various applications, including Discord bots or social media tools, to acknowledge a user's departure. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Goodbye Image", "Utility"],
    example: "?username=John&avatar=https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg",
    parameters: [
      {
        name: "username",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 25,
        },
        description: "The username to display on the image.",
        example: "John",
      },
      {
        name: "avatar",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
        },
        description: "URL of the avatar image.",
        example: "https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username, avatar } = req.query || {}

      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username is required and must be a non-empty string",
          code: 400,
        }
      }
      if (username.length > 25) {
        return {
          status: false,
          error: "Username must be 25 characters or less",
          code: 400,
        }
      }

      if (typeof avatar !== "string" || avatar.trim().length === 0) {
        return {
          status: false,
          error: "Avatar URL is required and must be a non-empty string",
          code: 400,
        }
      }

      try {
        const response = await axios.get(proxy() + avatar, { responseType: "arraybuffer" })
        const buffer = Buffer.from(response.data, "binary")

        if (!(await isValidImageBuffer(buffer))) {
          return {
            status: false,
            error: `Invalid image URL or type for avatar: ${avatar}. Supported: PNG, JPEG, JPG, WEBP, GIF`,
            code: 400,
          }
        }

        const imageBuffer = await generateGoodbyeImage(username.trim(), buffer)
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
    endpoint: "/api/canvas/goodbyev3",
    name: "goodbye v3",
    category: "Canvas",
    description:
      "Generate a customized goodbye image (version 3) by uploading an avatar image file and providing a username. This API is designed for applications that require direct file uploads to create visually distinct goodbye banners, ideal for acknowledging a user's departure in various digital environments. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Goodbye Image", "Upload", "Utility"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              username: {
                type: "string",
                description: "The username to display on the image",
                example: "John",
                minLength: 1,
                maxLength: 25,
              },
              avatar: {
                type: "string",
                format: "binary",
                description: "Image file to use as avatar (PNG, JPEG, JPG, WEBP, GIF)",
              },
            },
            required: ["username", "avatar"],
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      const { username } = req.body || {}

      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username is required and must be a non-empty string",
          code: 400,
        }
      }
      if (username.length > 25) {
        return {
          status: false,
          error: "Username must be 25 characters or less",
          code: 400,
        }
      }

      const avatarFile = await guf(req, "avatar")

      if (!avatarFile || !avatarFile.file) {
        return {
          status: false,
          error: "Avatar file is required",
          code: 400,
        }
      }
      if (!avatarFile.isValid || !avatarFile.isImage) {
        return {
          status: false,
          error: `Invalid avatar file: ${avatarFile.name}. Supported: PNG, JPEG, JPG, WEBP, GIF`,
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateGoodbyeImage(username.trim(), avatarFile.file)
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