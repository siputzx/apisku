import { createCanvas, loadImage } from "canvas"
import { fileTypeFromBuffer } from "file-type"

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

async function generateLevelUpImageFromURL(
  backgroundURL: string,
  avatarURL: string,
  fromLevel: string,
  toLevel: string,
  name: string,
): Promise<Buffer> {
  const width = 600
  const height = 150
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, width, height)

  const background = await loadImage(proxy() + backgroundURL)
  ctx.drawImage(background, 0, 0, width, height)

  const overlayX = 10
  const overlayY = 10
  const overlayWidth = width - 20
  const overlayHeight = height - 20
  const overlayRadius = 40

  ctx.save()
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
  ctx.beginPath()
  ctx.moveTo(overlayX + overlayRadius, overlayY)
  ctx.arcTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX, overlayY + overlayHeight, overlayX, overlayY, overlayRadius)
  ctx.arcTo(overlayX, overlayY, overlayX + overlayWidth, overlayY, overlayRadius)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.restore()

  const avatar = await loadImage(proxy() + avatarURL)
  const avatarSize = 100
  const avatarX = overlayX + overlayRadius + 10
  ctx.save()
  ctx.beginPath()
  ctx.arc(avatarX + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(avatar, avatarX, height / 2 - avatarSize / 2, avatarSize, avatarSize)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(avatarX + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 28px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "left"
  ctx.fillText(name, avatarX + avatarSize + 20, height / 2 + 10)

  const circleSize = 55
  const circleX1 = width - circleSize * 4 + 10
  const circleX2 = width - circleSize * 2 - 8
  const arrowX = circleX1 + circleSize + 10

  ctx.beginPath()
  ctx.arc(circleX1 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = "rgba(255, 204, 51, 0.3)"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(circleX1 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 24px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "center"
  ctx.fillText(fromLevel, circleX1 + circleSize / 2, height / 2 + 8)

  ctx.beginPath()
  ctx.moveTo(arrowX, height / 2 - 8)
  ctx.lineTo(arrowX + 20, height / 2)
  ctx.lineTo(arrowX, height / 2 + 8)
  ctx.closePath()
  ctx.fillStyle = "#FFCC33"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(circleX2 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = "rgba(255, 204, 51, 0.3)"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(circleX2 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 24px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "center"
  ctx.fillText(toLevel, circleX2 + circleSize / 2, height / 2 + 8)

  ctx.globalCompositeOperation = "destination-in"
  ctx.beginPath()
  ctx.moveTo(overlayX + overlayRadius, overlayY)
  ctx.arcTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX, overlayY + overlayHeight, overlayX, overlayY, overlayRadius)
  ctx.arcTo(overlayX, overlayY, overlayX + overlayWidth, overlayY, overlayRadius)
  ctx.closePath()
  ctx.fill()

  return canvas.toBuffer("image/png")
}

async function generateLevelUpImageFromFile(
  backgroundBuffer: Buffer,
  avatarBuffer: Buffer,
  fromLevel: string,
  toLevel: string,
  name: string,
): Promise<Buffer> {
  const width = 600
  const height = 150
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, width, height)

  const background = await loadImage(backgroundBuffer)
  ctx.drawImage(background, 0, 0, width, height)

  const overlayX = 10
  const overlayY = 10
  const overlayWidth = width - 20
  const overlayHeight = height - 20
  const overlayRadius = 40

  ctx.save()
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
  ctx.beginPath()
  ctx.moveTo(overlayX + overlayRadius, overlayY)
  ctx.arcTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX, overlayY + overlayHeight, overlayX, overlayY, overlayRadius)
  ctx.arcTo(overlayX, overlayY, overlayX + overlayWidth, overlayY, overlayRadius)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.restore()

  const avatar = await loadImage(avatarBuffer)
  const avatarSize = 100
  const avatarX = overlayX + overlayRadius + 10
  ctx.save()
  ctx.beginPath()
  ctx.arc(avatarX + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(avatar, avatarX, height / 2 - avatarSize / 2, avatarSize, avatarSize)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(avatarX + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 28px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "left"
  ctx.fillText(name, avatarX + avatarSize + 20, height / 2 + 10)

  const circleSize = 55
  const circleX1 = width - circleSize * 4 + 10
  const circleX2 = width - circleSize * 2 - 8
  const arrowX = circleX1 + circleSize + 10

  ctx.beginPath()
  ctx.arc(circleX1 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = "rgba(255, 204, 51, 0.3)"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(circleX1 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 24px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "center"
  ctx.fillText(fromLevel, circleX1 + circleSize / 2, height / 2 + 8)

  ctx.beginPath()
  ctx.moveTo(arrowX, height / 2 - 8)
  ctx.lineTo(arrowX + 20, height / 2)
  ctx.lineTo(arrowX, height / 2 + 8)
  ctx.closePath()
  ctx.fillStyle = "#FFCC33"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(circleX2 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = "rgba(255, 204, 51, 0.3)"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(circleX2 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 24px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "center"
  ctx.fillText(toLevel, circleX2 + circleSize / 2, height / 2 + 8)

  ctx.globalCompositeOperation = "destination-in"
  ctx.beginPath()
  ctx.moveTo(overlayX + overlayRadius, overlayY)
  ctx.arcTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX, overlayY + overlayHeight, overlayX, overlayY, overlayRadius)
  ctx.arcTo(overlayX, overlayY, overlayX + overlayWidth, overlayY, overlayRadius)
  ctx.closePath()
  ctx.fill()

  return canvas.toBuffer("image/png")
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/level-up",
    name: "level up",
    category: "Canvas",
    description:
      "Generate a dynamic level-up notification card with a background, user avatar, username, and a visual representation of the level transition. This API is ideal for gaming applications, community platforms, or bots that need to celebrate user achievements with a custom image. The card clearly shows the 'from' and 'to' levels with an arrow, making the progression clear. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Level Up", "Gaming", "User Progression"],
    example:
      "backgroundURL=https://i.ibb.co.com/2jMjYXK/IMG-20250103-WA0469.jpg&avatarURL=https://avatars.githubusercontent.com/u/159487561?v=4&fromLevel=0&toLevel=1&name=putu",
    parameters: [
      {
        name: "backgroundURL",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
        },
        description: "URL of the background image.",
        example: "https://i.ibb.co.com/2jMjYXK/IMG-20250103-WA0469.jpg",
      },
      {
        name: "avatarURL",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
        },
        description: "URL of the user's avatar.",
        example: "https://avatars.githubusercontent.com/u/159487561?v=4",
      },
      {
        name: "fromLevel",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "The level the user leveled up from.",
        example: "0",
      },
      {
        name: "toLevel",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "The level the user leveled up to.",
        example: "1",
      },
      {
        name: "name",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        description: "The user's name.",
        example: "putu",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { backgroundURL, avatarURL, fromLevel, toLevel, name } = req.query || {}

      if (typeof backgroundURL !== "string" || backgroundURL.trim().length === 0) {
        return {
          status: false,
          error: "Background URL is required and must be a non-empty string",
          code: 400,
        }
      }
      if (typeof avatarURL !== "string" || avatarURL.trim().length === 0) {
        return {
          status: false,
          error: "Avatar URL is required and must be a non-empty string",
          code: 400,
        }
      }
      if (typeof fromLevel !== "string" || fromLevel.trim().length === 0) {
        return {
          status: false,
          error: "From level is required and must be a non-empty string",
          code: 400,
        }
      }
      if (typeof toLevel !== "string" || toLevel.trim().length === 0) {
        return {
          status: false,
          error: "To level is required and must be a non-empty string",
          code: 400,
        }
      }
      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name is required and must be a non-empty string",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateLevelUpImageFromURL(
          backgroundURL as string,
          avatarURL as string,
          fromLevel as string,
          toLevel as string,
          name as string,
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
    endpoint: "/api/canvas/level-up",
    name: "level up",
    category: "Canvas",
    description:
      "Generate a dynamic level-up notification card with uploaded background and user avatar files, along with the username and a visual representation of the level transition. This API is ideal for gaming applications, community platforms, or bots that need to celebrate user achievements with a custom image, especially when direct file uploads are preferred. The card clearly shows the 'from' and 'to' levels with an arrow, making the progression clear. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Level Up", "Gaming", "User Progression", "Upload"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              background: {
                type: "string",
                format: "binary",
                description: "Image file for the background.",
              },
              avatar: {
                type: "string",
                format: "binary",
                description: "Image file for the user's avatar.",
              },
              fromLevel: {
                type: "string",
                description: "The level the user leveled up from.",
                example: "0",
                minLength: 1,
                maxLength: 10,
              },
              toLevel: {
                type: "string",
                description: "The level the user leveled up to.",
                example: "1",
                minLength: 1,
                maxLength: 10,
              },
              name: {
                type: "string",
                description: "The user's name.",
                example: "putu",
                minLength: 1,
                maxLength: 50,
              },
            },
            required: ["background", "avatar", "fromLevel", "toLevel", "name"],
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      const { fromLevel, toLevel, name } = req.body || {}

      if (typeof fromLevel !== "string" || fromLevel.trim().length === 0) {
        return {
          status: false,
          error: "From level is required and must be a non-empty string",
          code: 400,
        }
      }
      if (typeof toLevel !== "string" || toLevel.trim().length === 0) {
        return {
          status: false,
          error: "To level is required and must be a non-empty string",
          code: 400,
        }
      }
      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name is required and must be a non-empty string",
          code: 400,
        }
      }

      const backgroundFile = await guf(req, "background")
      const avatarFile = await guf(req, "avatar")

      if (!backgroundFile || !backgroundFile.file || !(await isValidImageBuffer(backgroundFile.file))) {
        return {
          status: false,
          error: "Valid background image file is required",
          code: 400,
        }
      }
      if (!avatarFile || !avatarFile.file || !(await isValidImageBuffer(avatarFile.file))) {
        return {
          status: false,
          error: "Valid avatar image file is required",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateLevelUpImageFromFile(
          backgroundFile.file,
          avatarFile.file,
          fromLevel,
          toLevel,
          name,
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