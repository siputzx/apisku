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

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    return validExtensions.some((ext) => path.endsWith(ext))
  } catch {
    return false
  }
}

async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer)
  return type !== undefined && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

async function generateWelcomeV3ImageFromURL(username: string, avatar: string): Promise<Buffer> {
  const canvas = createCanvas(650, 300)
  const ctx = canvas.getContext("2d")
  const bg = assets.image.get("WELCOME3")

  const [background, avatarImg] = await Promise.all([
    loadImage(bg).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
    loadImage(proxy() + avatar).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
  ])

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

async function generateWelcomeV3ImageFromFile(username: string, avatarBuffer: Buffer): Promise<Buffer> {
  const canvas = createCanvas(650, 300)
  const ctx = canvas.getContext("2d")
  const bg = assets.image.get("WELCOME3")

  const [background, avatarImg] = await Promise.all([
    loadImage(bg).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
    loadImage(avatarBuffer).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
  ])

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
    endpoint: "/api/canvas/welcomev3",
    name: "welcome v3",
    category: "Canvas",
    description:
      "Generate a simple welcome image (version 3) featuring a username and an avatar using query parameters. This API provides a straightforward way to create visual greetings for new users or members, ideal for various applications, including Discord bots or web platforms. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Welcome Image", "Utility"],
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
        description: "The username to display.",
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
        description: "URL of the user's avatar.",
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
      if (!isValidImageUrl(avatar as string)) {
        return {
          status: false,
          error: `Invalid image URL: ${avatar}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateWelcomeV3ImageFromURL(username.trim(), avatar as string)
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
    endpoint: "/api/canvas/welcomev3",
    name: "welcome v3",
    category: "Canvas",
    description:
      "Generate a simple welcome image (version 3) by uploading an avatar image file and providing a username. This API is designed for applications that require direct file uploads to create straightforward visual greetings for new users or members. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Welcome Image", "Upload", "Utility"],
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
                description: "The username to display (max 25 characters).",
                example: "John",
                minLength: 1,
                maxLength: 25,
              },
              avatar: {
                type: "string",
                format: "binary",
                description: "Image file for the user's avatar (JPG, JPEG, PNG, GIF, WEBP).",
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
          error: `Invalid avatar file: ${avatarFile.name}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateWelcomeV3ImageFromFile(username.trim(), avatarFile.file)
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