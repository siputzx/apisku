import * as Canvas from "canvas"
import moment from "moment"
import assets from "@putuofc/assetsku"

declare const proxy: () => string | null

Canvas.registerFont(assets.font.get("POPPINS-MEDIUM"), { family: "Poppins" })
Canvas.registerFont(assets.font.get("POPPINS-BOLD"), { family: "Poppins-Bold" })

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

async function generateFakeXNXX(name: string, quote: string, likes: string, dislikes: string) {
  try {
    const currentDate = moment().format("MMM D, YYYY, h:mm A")

    const canvas = Canvas.createCanvas(650, 320)
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#00008B"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "rgba(10, 35, 81, 1)")
    gradient.addColorStop(1, "rgba(8, 28, 65, 1)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#FF0000"
    ctx.fillRect(35, 50, 40, 15)
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(35, 65, 40, 15)

    ctx.font = "bold 24px Poppins-Bold"
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "left"
    ctx.fillText(name, 85, 75)

    ctx.font = "16px Poppins"
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.textAlign = "right"
    ctx.fillText(currentDate, canvas.width - 45, 75)

    ctx.font = "22px Poppins"
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "left"

    const maxWidth = canvas.width - 90
    const lineHeight = 32
    wrapText(ctx, quote, 45, 140, maxWidth, lineHeight)

    ctx.font = "bold 20px Poppins-Bold"
    ctx.fillStyle = "#FFFFFF"
    drawThumbUp(ctx, 60, 245, 24)
    ctx.fillText(likes, 90, 265)

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    drawThumbDown(ctx, 130, 246, 24)
    ctx.fillText(dislikes, 160, 265)

    ctx.font = "20px Poppins"
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.fillText("Reply", 200, 265)
    ctx.fillText("Report", 290, 265)

    return canvas.toBuffer()
  } catch (error: any) {
    console.error("Error generating fake xnxx:", error)
    throw new Error("Failed to generate fake xnxx image")
  }
}

function wrapText(context: Canvas.CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ")
  let line = ""

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = context.measureText(testLine)
    const testWidth = metrics.width

    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y)
      line = words[n] + " "
      y += lineHeight
    } else {
      line = testLine
    }
  }

  context.fillText(line, x, y)
  return y
}

function drawThumbUp(ctx: Canvas.CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.beginPath()

  const scale = size / 24

  ctx.moveTo(x + 7 * scale, y + 10 * scale)
  ctx.lineTo(x + 7 * scale, y + 22 * scale)

  ctx.moveTo(x + 15 * scale, y + 5.88 * scale)
  ctx.lineTo(x + 14 * scale, y + 10 * scale)
  ctx.lineTo(x + 19.83 * scale, y + 10 * scale)
  ctx.quadraticCurveTo(
    x + 21.83 * scale,
    y + 10 * scale,
    x + 21.83 * scale,
    y + 12.56 * scale,
  )
  ctx.lineTo(x + 19.5 * scale, y + 20.56 * scale)
  ctx.quadraticCurveTo(
    x + 19.5 * scale,
    y + 22 * scale,
    x + 17.5 * scale,
    y + 22 * scale,
  )
  ctx.lineTo(x + 4 * scale, y + 22 * scale)
  ctx.quadraticCurveTo(
    x + 2 * scale,
    y + 22 * scale,
    x + 2 * scale,
    y + 20 * scale,
  )
  ctx.lineTo(x + 2 * scale, y + 12 * scale)
  ctx.quadraticCurveTo(
    x + 2 * scale,
    y + 10 * scale,
    x + 4 * scale,
    y + 10 * scale,
  )
  ctx.lineTo(x + 6.76 * scale, y + 10 * scale)
  ctx.quadraticCurveTo(
    x + 8.55 * scale,
    y + 10 * scale,
    x + 8.55 * scale,
    y + 8.89 * scale,
  )
  ctx.lineTo(x + 12 * scale, y + 2 * scale)
  ctx.quadraticCurveTo(
    x + 15 * scale,
    y + 2 * scale,
    x + 15 * scale,
    y + 5.88 * scale,
  )

  ctx.fill()
  ctx.strokeStyle = "#FFFFFF"
  ctx.lineWidth = 2 * scale
  ctx.stroke()
  ctx.restore()
}

function drawThumbDown(ctx: Canvas.CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.beginPath()

  const scale = size / 24

  ctx.moveTo(x + 17 * scale, y + 14 * scale)
  ctx.lineTo(x + 17 * scale, y + 2 * scale)

  ctx.moveTo(x + 9 * scale, y + 18.12 * scale)
  ctx.lineTo(x + 10 * scale, y + 14 * scale)
  ctx.lineTo(x + 4.17 * scale, y + 14 * scale)
  ctx.quadraticCurveTo(
    x + 2.25 * scale,
    y + 14 * scale,
    x + 2.25 * scale,
    y + 11.44 * scale,
  )
  ctx.lineTo(x + 4.58 * scale, y + 3.44 * scale)
  ctx.quadraticCurveTo(
    x + 4.58 * scale,
    y + 2 * scale,
    x + 6.5 * scale,
    y + 2 * scale,
  )
  ctx.lineTo(x + 20 * scale, y + 2 * scale)
  ctx.quadraticCurveTo(
    x + 22 * scale,
    y + 2 * scale,
    x + 22 * scale,
    y + 4 * scale,
  )
  ctx.lineTo(x + 22 * scale, y + 12 * scale)
  ctx.quadraticCurveTo(
    x + 22 * scale,
    y + 14 * scale,
    x + 20 * scale,
    y + 14 * scale,
  )
  ctx.lineTo(x + 17.24 * scale, y + 14 * scale)
  ctx.quadraticCurveTo(
    x + 15.45 * scale,
    y + 14 * scale,
    x + 15.45 * scale,
    y + 15.11 * scale,
  )
  ctx.lineTo(x + 12 * scale, y + 22 * scale)
  ctx.quadraticCurveTo(
    x + 9 * scale,
    y + 22 * scale,
    x + 9 * scale,
    y + 18.12 * scale,
  )

  ctx.fill()
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
  ctx.lineWidth = 2 * scale
  ctx.stroke()
  ctx.restore()
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/fake-xnxx",
    name: "fake xnxx",
    category: "Canvas",
    description: "Generate a fake XNXX comment image with a specified name, quote, and optional like/dislike counts. This API endpoint allows users to create humorous or satirical images resembling XNXX comments, ideal for social media content or creative projects. Input parameters include the commenter's name, the comment text (quote), and the number of likes and dislikes. The output is a PNG image buffer.",
    tags: ["Canvas", "Image Generation", "Humor"],
    example: "?name=Nelson Mandela&quote=Keberanian bukanlah tidak adanya ketakutan, tetapi kemenangan atas ketakutan itu.&likes=2&dislikes=0",
    parameters: [
      {
        name: "name",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 40,
        },
        description: "The name to display",
        example: "Nelson Mandela",
      },
      {
        name: "quote",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 300,
        },
        description: "The quote text",
        example: "Keberanian bukanlah tidak adanya ketakutan, tetapi kemenangan atas ketakutan itu.",
      },
      {
        name: "likes",
        in: "query",
        required: false,
        schema: {
          type: "string",
          pattern: "^[0-9]+$",
          default: "0",
        },
        description: "Number of likes",
        example: "2",
      },
      {
        name: "dislikes",
        in: "query",
        required: false,
        schema: {
          type: "string",
          pattern: "^[0-9]+$",
          default: "0",
        },
        description: "Number of dislikes",
        example: "0",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { name, quote, likes, dislikes } = req.query || {}

      if (!name) {
        return {
          status: false,
          error: "Name parameter is required",
          code: 400,
        }
      }

      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name must be a non-empty string",
          code: 400,
        }
      }

      if (name.length > 40) {
        return {
          status: false,
          error: "Name must be less than or equal to 40 characters",
          code: 400,
        }
      }

      if (!quote) {
        return {
          status: false,
          error: "Quote parameter is required",
          code: 400,
        }
      }

      if (typeof quote !== "string" || quote.trim().length === 0) {
        return {
          status: false,
          error: "Quote must be a non-empty string",
          code: 400,
        }
      }

      if (quote.length > 300) {
        return {
          status: false,
          error: "Quote must be less than or equal to 300 characters",
          code: 400,
        }
      }

      const parsedLikes = likes ? String(likes) : "0"
      if (!/^\d+$/.test(parsedLikes)) {
        return {
          status: false,
          error: "Likes must be a valid number string",
          code: 400,
        }
      }

      const parsedDislikes = dislikes ? String(dislikes) : "0"
      if (!/^\d+$/.test(parsedDislikes)) {
        return {
          status: false,
          error: "Dislikes must be a valid number string",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateFakeXNXX(name.trim(), quote.trim(), parsedLikes, parsedDislikes)

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
    endpoint: "/api/canvas/fake-xnxx",
    name: "fake xnxx",
    category: "Canvas",
    description: "Generate a fake XNXX comment image using a name, quote, and optional like/dislike counts provided in the request body. This endpoint is designed for applications needing to programmatically create humorous or satirical images resembling XNXX comments, suitable for various content creation purposes. Input parameters are sent as JSON in the request body, including the commenter's name, the comment text (quote), and the number of likes and dislikes. The API returns the generated image as a PNG buffer.",
    tags: ["Canvas", "Image Generation", "Humor"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "quote"],
            properties: {
              name: {
                type: "string",
                description: "The name to display",
                example: "Nelson Mandela",
                minLength: 1,
                maxLength: 40,
              },
              quote: {
                type: "string",
                description: "The quote text",
                example: "Keberanian bukanlah tidak adanya ketakutan, tetapi kemenangan atas ketakutan itu.",
                minLength: 1,
                maxLength: 300,
              },
              likes: {
                type: "string",
                description: "Number of likes",
                default: "0",
                example: "2",
                pattern: "^[0-9]+$",
              },
              dislikes: {
                type: "string",
                description: "Number of dislikes",
                default: "0",
                example: "0",
                pattern: "^[0-9]+$",
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { name, quote, likes, dislikes } = req.body || {}

      if (!name) {
        return {
          status: false,
          error: "Name parameter is required in the request body",
          code: 400,
        }
      }

      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name must be a non-empty string in the request body",
          code: 400,
        }
      }

      if (name.length > 40) {
        return {
          status: false,
          error: "Name in request body must be less than or equal to 40 characters",
          code: 400,
        }
      }

      if (!quote) {
        return {
          status: false,
          error: "Quote parameter is required in the request body",
          code: 400,
        }
      }

      if (typeof quote !== "string" || quote.trim().length === 0) {
        return {
          status: false,
          error: "Quote must be a non-empty string in the request body",
          code: 400,
        }
      }

      if (quote.length > 300) {
        return {
          status: false,
          error: "Quote in request body must be less than or equal to 300 characters",
          code: 400,
        }
      }

      const parsedLikes = likes ? String(likes) : "0"
      if (!/^\d+$/.test(parsedLikes)) {
        return {
          status: false,
          error: "Likes must be a valid number string in the request body",
          code: 400,
        }
      }

      const parsedDislikes = dislikes ? String(dislikes) : "0"
      if (!/^\d+$/.test(parsedDislikes)) {
        return {
          status: false,
          error: "Dislikes must be a valid number string in the request body",
          code: 400,
        }
      }

      try {
        const imageBuffer = await generateFakeXNXX(name.trim(), quote.trim(), parsedLikes, parsedDislikes)

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