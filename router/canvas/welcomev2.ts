import axios from "axios"
import { fileTypeFromBuffer } from "file-type"
import Canvas, { createCanvas, loadImage, registerFont } from "canvas";
import assets from "@putuofc/assetsku"

declare const proxy: () => string | null

Canvas.registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" })

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

async function generateWelcomeV2ImageFromURL(
  username: string,
  guildName: string,
  memberCount: number,
  avatar: string,
  background: string,
): Promise<Buffer> {
  const canvas = createCanvas(512, 256)
  const ctx = canvas.getContext("2d")
  const fram = assets.image.get("WELCOME2")

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    loadImage(proxy() + background).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
    loadImage(fram).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
    loadImage(proxy() + avatar).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
  ])

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.beginPath()
  ctx.rotate((-17 * Math.PI) / 180)
  ctx.strokeStyle = "white"
  ctx.lineWidth = 3
  ctx.drawImage(avatarImg, -4, 110, 96, 96)
  ctx.strokeRect(-4, 110, 96, 96)
  ctx.restore()

  const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName
  ctx.globalAlpha = 1
  ctx.font = "18px CubestMedium"
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(name, 336, 158)

  ctx.font = "700 18px Courier New"
  ctx.textAlign = "left"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(`${memberCount}th member`, 214, 248)

  const namalu = username.length > 12 ? username.substring(0, 15) + "..." : username
  ctx.font = "700 24px Courier New"
  ctx.fillText(namalu, 208, 212)

  return canvas.toBuffer("image/png")
}

async function generateWelcomeV2ImageFromFile(
  username: string,
  guildName: string,
  memberCount: number,
  avatarBuffer: Buffer,
  backgroundBuffer: Buffer,
): Promise<Buffer> {
  const canvas = createCanvas(512, 256)
  const ctx = canvas.getContext("2d")
  const fram = assets.image.get("WELCOME2")

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    loadImage(backgroundBuffer).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
    loadImage(fram).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
    loadImage(avatarBuffer).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
  ])

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.beginPath()
  ctx.rotate((-17 * Math.PI) / 180)
  ctx.strokeStyle = "white"
  ctx.lineWidth = 3
  ctx.drawImage(avatarImg, -4, 110, 96, 96)
  ctx.strokeRect(-4, 110, 96, 96)
  ctx.restore()

  const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName
  ctx.globalAlpha = 1
  ctx.font = "18px CubestMedium"
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(name, 336, 158)

  ctx.font = "700 18px Courier New"
  ctx.textAlign = "left"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(`${memberCount}th member`, 214, 248)

  const namalu = username.length > 12 ? username.substring(0, 15) + "..." : username
  ctx.font = "700 24px Courier New"
  ctx.fillText(namalu, 208, 212)

  return canvas.toBuffer("image/png")
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/welcomev2",
    name: "welcome v2",
    category: "Canvas",
    description:
      "Generate a welcome image (version 2) with a user's avatar, username, guild name, and member count using query parameters. This API creates a visually appealing welcome banner, ideal for integration with Discord bots and other community management tools. The image features a unique design with rotated elements and specific font styles, and is output as a PNG file.",
    tags: ["CANVAS", "Image Generation", "Welcome Image", "Discord", "Utility"],
    example:
      "?username=John&guildName=Siputzx%20Api&memberCount=150&avatar=https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg&background=https://i.ibb.co/4YBNyvP/images-76.jpg",
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
        name: "guildName",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        description: "The guild name to display.",
        example: "Siputzx Api",
      },
      {
        name: "memberCount",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "The member count (positive number).",
        example: "150",
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
      {
        name: "background",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
        },
        description: "URL of the background image.",
        example: "https://i.ibb.co/4YBNyvP/images-76.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username, guildName, memberCount, avatar, background } = req.query || {}

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

      if (typeof guildName !== "string" || guildName.trim().length === 0) {
        return {
          status: false,
          error: "Guild name is required and must be a non-empty string",
          code: 400,
        }
      }
      if (guildName.length > 50) {
        return {
          status: false,
          error: "Guild name must be 50 characters or less",
          code: 400,
        }
      }

      if (typeof memberCount !== "string" || isNaN(parseInt(memberCount))) {
        return {
          status: false,
          error: "Member count is required and must be a number",
          code: 400,
        }
      }
      const parsedMemberCount = parseInt(memberCount)
      if (parsedMemberCount < 0) {
        return {
          status: false,
          error: "Member count must be a positive number",
          code: 400,
        }
      }

      const imageUrls = [avatar, background] as string[]
      const invalidUrls = imageUrls.filter((url) => !isValidImageUrl(url))
      if (invalidUrls.length > 0) {
        return {
          status: false,
          error: "Invalid image URL provided for avatar or background. Only JPG, JPEG, PNG, GIF, WEBP are supported.",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateWelcomeV2ImageFromURL(
          username.trim(),
          guildName.trim(),
          parsedMemberCount,
          avatar as string,
          background as string,
        )

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
    endpoint: "/api/canvas/welcomev2",
    name: "welcome v2",
    category: "Canvas",
    description:
      "Generate a welcome image (version 2) by uploading a user's avatar and background image files, along with the username, guild name, and member count. This API is designed for applications that require direct file uploads to create visually appealing welcome banners for new members joining a guild. The image features a unique design with rotated elements and specific font styles, and is output as a PNG file.",
    tags: ["CANVAS", "Image Generation", "Welcome Image", "Discord", "Utility", "Upload"],
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
              guildName: {
                type: "string",
                description: "The guild name to display (max 50 characters).",
                example: "Siputzx Api",
                minLength: 1,
                maxLength: 50,
              },
              memberCount: {
                type: "integer",
                minimum: 0,
                description: "The member count (positive number).",
                example: 150,
              },
              avatar: {
                type: "string",
                format: "binary",
                description: "Image file for the user's avatar (JPG, JPEG, PNG, GIF, WEBP).",
              },
              background: {
                type: "string",
                format: "binary",
                description: "Image file for the background (JPG, JPEG, PNG, GIF, WEBP).",
              },
            },
            required: ["username", "guildName", "memberCount", "avatar", "background"],
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      const { username, guildName, memberCount } = req.body || {}

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

      if (typeof guildName !== "string" || guildName.trim().length === 0) {
        return {
          status: false,
          error: "Guild name is required and must be a non-empty string",
          code: 400,
        }
      }
      if (guildName.length > 50) {
        return {
          status: false,
          error: "Guild name must be 50 characters or less",
          code: 400,
        }
      }

      if (typeof memberCount !== "string" || isNaN(parseInt(memberCount))) {
        return {
          status: false,
          error: "Member count is required and must be a number",
          code: 400,
        }
      }
      const parsedMemberCount = parseInt(memberCount)
      if (parsedMemberCount < 0) {
        return {
          status: false,
          error: "Member count must be a positive number",
          code: 400,
        }
      }

      const avatarFile = await guf(req, "avatar")
      const backgroundFile = await guf(req, "background")

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

      if (!backgroundFile || !backgroundFile.file) {
        return {
          status: false,
          error: "Background file is required",
          code: 400,
        }
      }
      if (!backgroundFile.isValid || !backgroundFile.isImage) {
        return {
          status: false,
          error: `Invalid background file: ${backgroundFile.name}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateWelcomeV2ImageFromFile(
          username.trim(),
          guildName.trim(),
          parsedMemberCount,
          avatarFile.file,
          backgroundFile.file,
        )

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