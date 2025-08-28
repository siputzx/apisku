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

async function isValidImageUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  try {
    const parsed = new URL(url.trim());
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const response = await fetch(proxy+url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    return contentType ? contentType.startsWith('image/') : false;
    
  } catch (error) {
    return false;
  }
}


async function generateProfileImageFromURL(
  backgroundURL: string,
  avatarURL: string,
  rankName: string,
  rankId: string,
  exp: number,
  requireExp: number,
  level: number,
  name: string,
): Promise<Buffer> {
  const width = 850
  const height = 300
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, width, height)
  const background = await loadImage(proxy() + backgroundURL)
  ctx.drawImage(background, 0, 0, width, height)

  const overlayX = 20
  const overlayY = 20
  const overlayWidth = width - 40
  const overlayHeight = height - 40
  const overlayRadius = 30

  ctx.save()
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.beginPath()
  ctx.moveTo(overlayX + overlayRadius, overlayY)
  ctx.arcTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX, overlayY + overlayHeight, overlayX, overlayY, overlayRadius)
  ctx.arcTo(overlayX, overlayY, overlayX + overlayWidth, overlayY, overlayRadius)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()

  const avatar = await loadImage(proxy() + avatarURL)
  const avatarSize = 120
  ctx.save()
  ctx.beginPath()
  ctx.arc(100, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(avatar, 40, height / 2 - avatarSize / 2, avatarSize, avatarSize)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(100, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 36px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "left"
  ctx.fillText(name, 180, height / 2 - 20)

  ctx.font = "bold 28px Arial"
  ctx.fillText(`LEVEL ${level}`, width - 180, 80)

  ctx.font = "bold 22px Arial"
  ctx.fillText(`${rankName} ${rankId}`, width - 180, 120)

  const barWidth = 600
  const barHeight = 30
  const barX = 180
  const barY = height / 2 + 20
  const progress = Math.min(1, Math.max(0, exp / requireExp))
  const barRadius = 15

  ctx.fillStyle = "#363636"
  ctx.beginPath()
  ctx.moveTo(barX + barRadius, barY)
  ctx.arcTo(barX + barWidth, barY, barX + barWidth, barY + barHeight, barRadius)
  ctx.arcTo(barX + barWidth, barY + barHeight, barX, barY + barHeight, barRadius)
  ctx.arcTo(barX, barY + barHeight, barX, barY, barRadius)
  ctx.arcTo(barX, barY, barX + barWidth, barY, barRadius)
  ctx.closePath()
  ctx.fill()

  const fillWidth = barWidth * progress
  if (fillWidth > 0) {
    ctx.fillStyle = "#FFCC33"
    ctx.beginPath()
    ctx.moveTo(barX + barRadius, barY)
    ctx.arcTo(barX + fillWidth, barY, barX + fillWidth, barY + barHeight, barRadius)
    ctx.arcTo(barX + fillWidth, barY + barHeight, barX, barY + barHeight, barRadius)
    ctx.arcTo(barX, barY + barHeight, barX, barY, barRadius)
    ctx.arcTo(barX, barY, barX + fillWidth, barY, barRadius)
    ctx.closePath()
    ctx.fill()
  }

  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(barX + barRadius, barY)
  ctx.arcTo(barX + barWidth, barY, barX + barWidth, barY + barHeight, barRadius)
  ctx.arcTo(barX + barWidth, barY + barHeight, barX, barY + barHeight, barRadius)
  ctx.arcTo(barX, barY + barHeight, barX, barY, barRadius)
  ctx.arcTo(barX, barY, barX + barWidth, barY, barRadius)
  ctx.closePath()
  ctx.stroke()

  ctx.font = "bold 18px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "center"
  ctx.fillText(`${exp} / ${requireExp} XP`, barX + barWidth / 2, barY + barHeight / 2 + 6)

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

async function generateProfileImageFromFile(
  backgroundBuffer: Buffer,
  avatarBuffer: Buffer,
  rankName: string,
  rankId: string,
  exp: number,
  requireExp: number,
  level: number,
  name: string,
): Promise<Buffer> {
  const width = 850
  const height = 300
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, width, height)
  const background = await loadImage(backgroundBuffer)
  ctx.drawImage(background, 0, 0, width, height)

  const overlayX = 20
  const overlayY = 20
  const overlayWidth = width - 40
  const overlayHeight = height - 40
  const overlayRadius = 30

  ctx.save()
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.beginPath()
  ctx.moveTo(overlayX + overlayRadius, overlayY)
  ctx.arcTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX, overlayY + overlayHeight, overlayRadius)
  ctx.arcTo(overlayX, overlayY + overlayHeight, overlayX, overlayY, overlayRadius)
  ctx.arcTo(overlayX, overlayY, overlayX + overlayWidth, overlayY, overlayRadius)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()

  const avatar = await loadImage(avatarBuffer)
  const avatarSize = 120
  ctx.save()
  ctx.beginPath()
  ctx.arc(100, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(avatar, 40, height / 2 - avatarSize / 2, avatarSize, avatarSize)
  ctx.restore()

  ctx.beginPath()
  ctx.arc(100, height / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = "bold 36px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "left"
  ctx.fillText(name, 180, height / 2 - 20)

  ctx.font = "bold 28px Arial"
  ctx.fillText(`LEVEL ${level}`, width - 180, 80)

  ctx.font = "bold 22px Arial"
  ctx.fillText(`${rankName} ${rankId}`, width - 180, 120)

  const barWidth = 600
  const barHeight = 30
  const barX = 180
  const barY = height / 2 + 20
  const progress = Math.min(1, Math.max(0, exp / requireExp))
  const barRadius = 15

  ctx.fillStyle = "#363636"
  ctx.beginPath()
  ctx.moveTo(barX + barRadius, barY)
  ctx.arcTo(barX + barWidth, barY, barX + barWidth, barY + barHeight, barRadius)
  ctx.arcTo(barX + barWidth, barY + barHeight, barX, barY + barHeight, barRadius)
  ctx.arcTo(barX, barY + barHeight, barX, barY, barRadius)
  ctx.arcTo(barX, barY, barX + barWidth, barY, barRadius)
  ctx.closePath()
  ctx.fill()

  const fillWidth = barWidth * progress
  if (fillWidth > 0) {
    ctx.fillStyle = "#FFCC33"
    ctx.beginPath()
    ctx.moveTo(barX + barRadius, barY)
    ctx.arcTo(barX + fillWidth, barY, barX + fillWidth, barY + barHeight, barRadius)
    ctx.arcTo(barX + fillWidth, barY + barHeight, barX, barY + barHeight, barRadius)
    ctx.arcTo(barX, barY + barHeight, barX, barY, barRadius)
    ctx.arcTo(barX, barY, barX + fillWidth, barY, barRadius)
    ctx.closePath()
    ctx.fill()
  }

  ctx.strokeStyle = "#FFCC33"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(barX + barRadius, barY)
  ctx.arcTo(barX + barWidth, barY, barX + barWidth, barY + barHeight, barRadius)
  ctx.arcTo(barX + barWidth, barY + barHeight, barX, barY + barHeight, barRadius)
  ctx.arcTo(barX, barY + barHeight, barX, barY, barRadius)
  ctx.arcTo(barX, barY, barX + barWidth, barY, barRadius)
  ctx.closePath()
  ctx.stroke()

  ctx.font = "bold 18px Arial"
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "center"
  ctx.fillText(`${exp} / ${requireExp} XP`, barX + barWidth / 2, barY + barHeight / 2 + 6)

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
    endpoint: "/api/canvas/profile",
    name: "profile",
    category: "Canvas",
    description:
      "Generate a personalized user profile card with a customizable background, avatar, rank details, experience progress, level, and user name using query parameters. This API is perfect for gaming platforms, community hubs, or any application needing to display user progression and stats in an appealing visual format. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Profile Card", "Gaming", "User Stats"],
    example:
      "backgroundURL=https://i.ibb.co.com/2jMjYXK/IMG-20250103-WA0469.jpg&avatarURL=https://avatars.githubusercontent.com/u/159487561?v=4&rankName=epik&rankId=0&requireExp=1000&level=10&name=siputzx&exp=500",
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
        name: "rankName",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
        },
        description: "The name of the user's rank.",
        example: "epik",
      },
      {
        name: "rankId",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
        },
        description: "The ID or identifier of the user's rank.",
        example: "0",
      },
      {
        name: "exp",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "The user's current experience points.",
        example: "500",
      },
      {
        name: "requireExp",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "The experience points required for the next level.",
        example: "1000",
      },
      {
        name: "level",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "The user's current level.",
        example: "10",
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
        example: "siputzx",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { backgroundURL, avatarURL, rankName, rankId, exp, requireExp, level, name } = req.query || {}

      if (
        typeof backgroundURL !== "string" ||
        backgroundURL.trim().length === 0 ||
        !isValidImageUrl(backgroundURL)
      ) {
        return {
          status: false,
          error: "Valid backgroundURL is required",
          code: 400,
        }
      }
      if (typeof avatarURL !== "string" || avatarURL.trim().length === 0 || !isValidImageUrl(avatarURL)) {
        return {
          status: false,
          error: "Valid avatarURL is required",
          code: 400,
        }
      }
      if (typeof rankName !== "string" || rankName.trim().length === 0) {
        return {
          status: false,
          error: "rankName is required",
          code: 400,
        }
      }
      if (typeof rankId !== "string" || rankId.trim().length === 0) {
        return {
          status: false,
          error: "rankId is required",
          code: 400,
        }
      }
      const parsedExp = parseInt(exp as string)
      if (isNaN(parsedExp) || parsedExp < 0) {
        return {
          status: false,
          error: "exp must be a non-negative integer",
          code: 400,
        }
      }
      const parsedRequireExp = parseInt(requireExp as string)
      if (isNaN(parsedRequireExp) || parsedRequireExp < 0) {
        return {
          status: false,
          error: "requireExp must be a non-negative integer",
          code: 400,
        }
      }
      const parsedLevel = parseInt(level as string)
      if (isNaN(parsedLevel) || parsedLevel < 0) {
        return {
          status: false,
          error: "level must be a non-negative integer",
          code: 400,
        }
      }
      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "name is required",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateProfileImageFromURL(
          backgroundURL as string,
          avatarURL as string,
          rankName,
          rankId,
          parsedExp,
          parsedRequireExp,
          parsedLevel,
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
  {
    metode: "POST",
    endpoint: "/api/canvas/profile",
    name: "profile",
    category: "Canvas",
    description:
      "Generate a personalized user profile card with a customizable background and avatar files, along with rank details, experience progress, level, and user name using multipart/form-data. This API is perfect for gaming platforms, community hubs, or any application needing to display user progression and stats in an appealing visual format, especially when direct file uploads are preferred. The output is a PNG image file.",
    tags: ["CANVAS", "Image Generation", "Profile Card", "Gaming", "User Stats", "Upload"],
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
              rankName: {
                type: "string",
                description: "The name of the user's rank.",
                example: "epik",
                minLength: 1,
              },
              rankId: {
                type: "string",
                description: "The ID or identifier of the user's rank.",
                example: "0",
                minLength: 1,
              },
              exp: {
                type: "integer",
                description: "The user's current experience points.",
                example: 100,
                minimum: 0,
              },
              requireExp: {
                type: "integer",
                description: "The experience points required for the next level.",
                example: 0,
                minimum: 0,
              },
              level: {
                type: "integer",
                description: "The user's current level.",
                example: 0,
                minimum: 0,
              },
              name: {
                type: "string",
                description: "The user's name.",
                example: "siputzx",
                minLength: 1,
                maxLength: 50,
              },
            },
            required: ["background", "avatar", "rankName", "rankId", "exp", "requireExp", "level", "name"],
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      const { rankName, rankId, exp, requireExp, level, name } = req.body || {}

      if (typeof rankName !== "string" || rankName.trim().length === 0) {
        return {
          status: false,
          error: "rankName is required",
          code: 400,
        }
      }
      if (typeof rankId !== "string" || rankId.trim().length === 0) {
        return {
          status: false,
          error: "rankId is required",
          code: 400,
        }
      }
      const parsedExp = parseInt(exp as string)
      if (isNaN(parsedExp) || parsedExp < 0) {
        return {
          status: false,
          error: "exp must be a non-negative integer",
          code: 400,
        }
      }
      const parsedRequireExp = parseInt(requireExp as string)
      if (isNaN(parsedRequireExp) || parsedRequireExp < 0) {
        return {
          status: false,
          error: "requireExp must be a non-negative integer",
          code: 400,
        }
      }
      const parsedLevel = parseInt(level as string)
      if (isNaN(parsedLevel) || parsedLevel < 0) {
        return {
          status: false,
          error: "level must be a non-negative integer",
          code: 400,
        }
      }
      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "name is required",
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
        const imageBuffer = await generateProfileImageFromFile(
          backgroundFile.file,
          avatarFile.file,
          rankName,
          rankId,
          parsedExp,
          parsedRequireExp,
          parsedLevel,
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