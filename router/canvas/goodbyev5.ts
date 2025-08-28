import axios from "axios"
import { fileTypeFromBuffer } from "file-type"
import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

declare const proxy: () => string | null

registerFont(assets.font.get("Montserrat-Bold"), { family: "Montserrat" })

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

function formatVariable(prefix: string, variable: string): string {
  const formattedVariable = variable
    .toLowerCase()
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1, word.length).toLowerCase())
    .join("")
  return prefix + formattedVariable
}

function applyText(
  canvas: ReturnType<typeof createCanvas>,
  text: string,
  defaultFontSize: number,
  width: number,
  font: string,
): string {
  const ctx = canvas.getContext("2d")
  do {
    defaultFontSize -= 1
    ctx.font = `${defaultFontSize}px ${font}`
  } while (ctx.measureText(text).width > width)
  return ctx.font
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

async function generateGoodbyeImageFromUrl(
  username: string,
  guildName: string,
  memberCount: number,
  avatar: string,
  background: string,
  quality: number,
): Promise<Buffer> {
  const canvas = createCanvas(1024, 450)
  const ctx = canvas.getContext("2d")

  const bg = await loadImage(proxy() + background)
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.beginPath()
  const avatarSize = 180
  const avatarX = canvas.width / 2
  const avatarY = 140
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const av = await loadImage(proxy() + avatar)
  ctx.drawImage(av, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2)
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 10
  ctx.stroke()

  ctx.font = `bold 60px Montserrat`
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"

  const usernameText = username
  const usernameWidth = ctx.measureText(usernameText).width
  if (usernameWidth > canvas.width - 100) {
    ctx.font = applyText(canvas, usernameText, 60, canvas.width - 100, "Montserrat")
  }
  ctx.fillText(usernameText, canvas.width / 2, 290)

  ctx.font = `bold 30px Montserrat`
  ctx.fillText(`Goodbye from ${guildName}`, canvas.width / 2, 340)

  ctx.font = `bold 24px Montserrat`
  ctx.fillText(`Member ${memberCount}`, canvas.width / 2, 380)

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 })
}

async function generateGoodbyeImageFromFile(
  username: string,
  guildName: string,
  memberCount: number,
  avatarBuffer: Buffer,
  backgroundBuffer: Buffer,
  quality: number,
): Promise<Buffer> {
  const canvas = createCanvas(1024, 450)
  const ctx = canvas.getContext("2d")

  const bg = await loadImage(backgroundBuffer)
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.beginPath()
  const avatarSize = 180
  const avatarX = canvas.width / 2
  const avatarY = 140
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const av = await loadImage(avatarBuffer)
  ctx.drawImage(av, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2)
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 10
  ctx.stroke()

  ctx.font = `bold 60px Montserrat`
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"

  const usernameText = username
  const usernameWidth = ctx.measureText(usernameText).width
  if (usernameWidth > canvas.width - 100) {
    ctx.font = applyText(canvas, usernameText, 60, canvas.width - 100, "Montserrat")
  }
  ctx.fillText(usernameText, canvas.width / 2, 290)

  ctx.font = `bold 30px Montserrat`
  ctx.fillText(`Goodbye from ${guildName}`, canvas.width / 2, 340)

  ctx.font = `bold 24px Montserrat`
  ctx.fillText(`Member ${memberCount}`, canvas.width / 2, 380)

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 })
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/goodbyev5",
    name: "goodbye v5",
    category: "Canvas",
    description:
      "Generate a stylized goodbye image (version 5) with a user's avatar, username, guild name, and member count using query parameters. This API creates a visually appealing farewell banner, perfect for Discord bots or other community platforms, to mark a user's departure. The image features a prominent circular avatar, a customizable background, and dynamic text sizing for optimal display. The output is a high-quality JPEG image with adjustable quality.",
    tags: ["CANVAS", "Image Generation", "Goodbye Image", "Discord", "Stylized"],
    example:
      "?username=Zero%20Two&guildName=Siputzx%20Community&memberCount=219&avatar=https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg&background=https://i.ibb.co/4YBNyvP/mountain-sunset.jpg&quality=90",
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
        description: "The username to display (max 25 characters).",
        example: "Zero Two",
      },
      {
        name: "guildName",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 30,
        },
        description: "The guild name to display (max 30 characters).",
        example: "Siputzx Community",
      },
      {
        name: "memberCount",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "The member count of the guild (positive number).",
        example: "219",
      },
      {
        name: "avatar",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
        },
        description: "URL of the user's avatar (JPG, JPEG, PNG, GIF, WEBP).",
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
        description: "URL of the background image (JPG, JPEG, PNG, GIF, WEBP).",
        example: "https://i.ibb.co/4YBNyvP/mountain-sunset.jpg",
      },
      {
        name: "quality",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 100,
        },
        description: "The quality of the generated image (1-100).",
        example: "90",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username, guildName, memberCount, avatar, background } = req.query || {}
      let quality = parseInt(req.query.quality as string) || 100

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
      if (guildName.length > 30) {
        return {
          status: false,
          error: "Guild name must be 30 characters or less",
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

      if (isNaN(quality) || quality < 1) {
        quality = 1
      } else if (quality > 100) {
        quality = 100
      }

      try {
        const imageBuffer = await generateGoodbyeImageFromUrl(
          username.trim(),
          guildName.trim(),
          parsedMemberCount,
          avatar as string,
          background as string,
          quality,
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
    endpoint: "/api/canvas/goodbyev5",
    name: "goodbye v5",
    category: "Canvas",
    description:
      "Generate a stylized goodbye image (version 5) by uploading a user's avatar and background image files, along with the username, guild name, and member count. This API is designed for applications that require direct file uploads to create visually appealing farewell banners for users leaving a guild. The image features a prominent circular avatar, a customizable background, and dynamic text sizing for optimal display. The output is a high-quality JPEG image with adjustable quality.",
    tags: ["CANVAS", "Image Generation", "Goodbye Image", "Discord", "Stylized", "Upload"],
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
                example: "Zero Two",
                minLength: 1,
                maxLength: 25,
              },
              guildName: {
                type: "string",
                description: "The guild name to display (max 30 characters).",
                example: "Siputzx Community",
                minLength: 1,
                maxLength: 30,
              },
              memberCount: {
                type: "integer",
                minimum: 0,
                description: "The member count of the guild (positive number).",
                example: 219,
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
              quality: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 100,
                description: "The quality of the generated image (1-100).",
                example: 90,
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
      let quality = parseInt(req.body.quality as string) || 100

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
      if (guildName.length > 30) {
        return {
          status: false,
          error: "Guild name must be 30 characters or less",
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

      if (isNaN(quality) || quality < 1) {
        quality = 1
      } else if (quality > 100) {
        quality = 100
      }

      try {
        const imageBuffer = await generateGoodbyeImageFromFile(
          username.trim(),
          guildName.trim(),
          parsedMemberCount,
          avatarFile.file,
          backgroundFile.file,
          quality,
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