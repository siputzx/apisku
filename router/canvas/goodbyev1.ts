import axios from "axios"
import { fileTypeFromBuffer } from "file-type"
import { createCanvas, loadImage, Image, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

declare const proxy: () => string | null

registerFont(assets.font.get("THEBOLDFONT"), { family: "Bold" })

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

async function processImage(image: string | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(image)) {
    const type = await fileTypeFromBuffer(image)
    if (!type || !["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)) {
      throw new Error("Unsupported image type")
    }
    return image
  } else if (typeof image === "string") {
    const response = await axios.get(proxy() + image, { responseType: "arraybuffer" })
    const buffer = Buffer.from(response.data)
    const type = await fileTypeFromBuffer(buffer)
    if (!type || !["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)) {
      throw new Error("Unsupported image type")
    }
    return buffer
  }
  throw new Error("Invalid image format")
}

async function generateGoodbyeImage(
  username: string,
  guildName: string,
  guildIcon: string | Buffer,
  memberCount: number,
  avatar: string | Buffer,
  background: string | Buffer,
  quality: number,
): Promise<Buffer> {
  const canvas = createCanvas(1024, 450)
  const ctx = canvas.getContext("2d")

  const colorUsername = "#ffffff"
  const colorMemberCount = "#ffffff"
  const colorMessage = "#ffffff"
  const colorAvatar = "#ffffff"
  const colorBackground = "#000000"
  const textMemberCount = "- {count}th member !"
  const assent = assets.image.get("GOODBYE")

  ctx.fillStyle = colorBackground
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const bg = await loadImage(await processImage(background))
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

  const b = await loadImage(assent)
  ctx.drawImage(b, 0, 0, canvas.width, canvas.height)

  ctx.globalAlpha = 1
  ctx.font = "45px Bold"
  ctx.textAlign = "center"
  ctx.fillStyle = colorUsername
  ctx.fillText(username, canvas.width - 890, canvas.height - 60)

  ctx.fillStyle = colorMemberCount
  ctx.font = "22px Bold"
  ctx.fillText(textMemberCount.replace(/{count}/g, memberCount.toString()), 90, canvas.height - 15)

  ctx.globalAlpha = 1
  ctx.font = "45px Bold"
  ctx.textAlign = "center"
  ctx.fillStyle = colorMessage
  const name = guildName.length > 13 ? guildName.substring(0, 10) + "..." : guildName
  ctx.fillText(name, canvas.width - 225, canvas.height - 44)

  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.strokeStyle = colorAvatar
  ctx.arc(180, 160, 110, 0, Math.PI * 2, true)
  ctx.stroke()
  ctx.closePath()
  ctx.clip()
  const av = await loadImage(await processImage(avatar))
  ctx.drawImage(av, 45, 40, 270, 270)
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.strokeStyle = colorAvatar
  ctx.arc(canvas.width - 150, canvas.height - 200, 80, 0, Math.PI * 2, true)
  ctx.stroke()
  ctx.closePath()
  ctx.clip()
  const guildIco = await loadImage(await processImage(guildIcon))
  ctx.drawImage(guildIco, canvas.width - 230, canvas.height - 280, 160, 160)
  ctx.restore()

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 })
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/goodbyev1",
    name: "goodbye v1",
    category: "Canvas",
    description:
      "Generate a customizable goodbye image for users leaving a guild. This API allows you to create a personalized goodbye banner featuring the user's avatar, username, the guild's name and icon, and the total member count. It's perfect for Discord bots or other applications that need to generate dynamic and engaging visual farewells. The output image is in JPEG format, with adjustable quality.",
    tags: ["CANVAS", "Image Generation", "Goodbye Image", "Discord"],
    example:
      "?username=John&guildName=Anime%20Club&memberCount=150&guildIcon=https://i.ibb.co/G5mJZxs/rin.jpg&avatar=https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg&background=https://i.ibb.co/4YBNyvP/images-76.jpg&quality=80",
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
          maxLength: 30,
        },
        description: "The guild name to display.",
        example: "Anime Club",
      },
      {
        name: "guildIcon",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
        },
        description: "URL of the guild icon.",
        example: "https://i.ibb.co/G5mJZxs/rin.jpg",
      },
      {
        name: "memberCount",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "The member count of the guild.",
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
        example: "80",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username, guildName, guildIcon, memberCount, avatar, background } = req.query || {}
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

      const imageUrls = [guildIcon, avatar, background] as string[]
      const invalidUrls = imageUrls.filter((url) => !isValidImageUrl(url))
      if (invalidUrls.length > 0) {
        return {
          status: false,
          error: "Invalid image URL provided for guildIcon, avatar, or background. Only JPG, JPEG, PNG, GIF, WEBP are supported.",
          code: 400,
        }
      }

      if (isNaN(quality) || quality < 1) {
        quality = 1
      } else if (quality > 100) {
        quality = 100
      }

      try {
        const imageBuffer = await generateGoodbyeImage(
          username.trim(),
          guildName.trim(),
          guildIcon as string,
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
    endpoint: "/api/canvas/goodbyev1",
    name: "goodbye v1",
    category: "Canvas",
    description:
      "Generate a customizable goodbye image for users leaving a guild by uploading image files. This API allows you to create a personalized goodbye banner featuring the user's avatar, username, the guild's name and icon, and the total member count. It's ideal for applications that need to generate dynamic and engaging visual farewells using directly uploaded image data. The output image is in JPEG format, with adjustable quality.",
    tags: ["CANVAS", "Image Generation", "Goodbye Image", "Discord", "Upload"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["username", "guildName", "guildIcon", "memberCount", "avatar", "background"],
            properties: {
              username: {
                type: "string",
                description: "The username to display (max 25 characters)",
                example: "John",
                minLength: 1,
                maxLength: 25,
              },
              guildName: {
                type: "string",
                description: "The guild name to display (max 30 characters)",
                example: "Anime Club",
                minLength: 1,
                maxLength: 30,
              },
              guildIcon: {
                type: "string",
                format: "binary",
                description: "The guild icon file (JPG, JPEG, PNG, GIF, WEBP)",
              },
              memberCount: {
                type: "integer",
                minimum: 0,
                description: "The member count of the guild",
                example: 150,
              },
              avatar: {
                type: "string",
                format: "binary",
                description: "The user's avatar file (JPG, JPEG, PNG, GIF, WEBP)",
              },
              background: {
                type: "string",
                format: "binary",
                description: "The background image file (JPG, JPEG, PNG, GIF, WEBP)",
              },
              quality: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 100,
                description: "The quality of the generated image (1-100)",
                example: 80,
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

      const guildIconFile = await guf(req, "guildIcon")
      const avatarFile = await guf(req, "avatar")
      const backgroundFile = await guf(req, "background")

      if (!guildIconFile || !guildIconFile.file) {
        return {
          status: false,
          error: "Guild icon file is required",
          code: 400,
        }
      }
      if (!guildIconFile.isValid || !guildIconFile.isImage) {
        return {
          status: false,
          error: `Invalid guild icon file: ${guildIconFile.name}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
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
        const imageBuffer = await generateGoodbyeImage(
          username.trim(),
          guildName.trim(),
          guildIconFile.file,
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