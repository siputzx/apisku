import axios from "axios"
import * as canvafy from "canvafy"
import { fileTypeFromBuffer } from "file-type"

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

async function isValidImageUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return false
  }

  try {
    const parsed = new URL(url.trim())

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false
    }

    const response = await axios.head(proxy() + url, {
      timeout: 5000,
    })

    const contentType = response.headers["content-type"]
    return contentType ? contentType.startsWith("image/") : false
  } catch (error) {
    return false
  }
}

async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer)
  return type && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

async function generateShipImageFromUrl(
  avatar1: string,
  avatar2: string,
  background: string,
  persen: string,
) {
  const image = await new canvafy.Ship()
    .setAvatars(proxy() + avatar1, proxy() + avatar2)
    .setBackground("image", proxy() + background)
    .setBorder("#f0f0f0")
    .setCustomNumber(parseInt(persen, 10))
    .setOverlayOpacity(0.5)
    .build()
  return image
}

async function generateShipImageFromFile(
  avatar1Buffer: Buffer,
  avatar2Buffer: Buffer,
  backgroundBuffer: Buffer,
  persen: string,
) {
  const image = await new canvafy.Ship()
    .setAvatars(avatar1Buffer, avatar2Buffer)
    .setBackground("image", backgroundBuffer)
    .setBorder("#f0f0f0")
    .setCustomNumber(parseInt(persen, 10))
    .setOverlayOpacity(0.5)
    .build()
  return image
}

export default [
  {
    metode: "GET",
    endpoint: "/api/canvas/ship",
    name: "ship",
    category: "Canvas",
    description:
      "This API generates a personalized 'ship' image, visually representing compatibility or a relationship between two individuals based on a percentage. Users provide URLs for two avatar images, a background image, and a numerical percentage. The API fetches these images, processes them using the Canvafy library to overlay the avatars on the background, applies a border, and integrates the custom percentage into the design. This can be used for fun social features, relationship compatibility tests, or creative visual content generation.",
    tags: ["CANVAS", "IMAGE", "GENERATOR", "AVATAR", "RELATIONSHIP"],
    example:
      "?avatar1=https://i.ibb.co.com/Yc4MVdV/images.jpg&avatar2=https://i.ibb.co.com/KKYxYQr/download.jpg&background=https://i.ibb.co/4YBNyvP/images-76.jpg&persen=20",
    parameters: [
      {
        name: "avatar1",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2048,
        },
        description: "URL of the first avatar image.",
        example: "https://i.ibb.co.com/Yc4MVdV/images.jpg",
      },
      {
        name: "avatar2",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2048,
        },
        description: "URL of the second avatar image.",
        example: "https://i.ibb.co.com/KKYxYQr/download.jpg",
      },
      {
        name: "background",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2048,
        },
        description: "URL of the background image.",
        example: "https://i.ibb.co/4YBNyvP/images-76.jpg",
      },
      {
        name: "persen",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 3,
        },
        description: "The percentage value for the ship image.",
        example: "20",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { avatar1, avatar2, background, persen } = req.query || {}

      if (!avatar1 || !avatar2 || !background || !persen) {
        const missingParams = []
        if (!avatar1) missingParams.push("avatar1")
        if (!avatar2) missingParams.push("avatar2")
        if (!background) missingParams.push("background")
        if (!persen) missingParams.push("persen")

        return {
          status: false,
          error: `Missing required parameters: ${missingParams.join(", ")}`,
          code: 400,
        }
      }

      if (typeof avatar1 !== "string" || avatar1.trim().length === 0) {
        return { status: false, error: "Avatar1 must be a non-empty string", code: 400 }
      }
      if (typeof avatar2 !== "string" || avatar2.trim().length === 0) {
        return { status: false, error: "Avatar2 must be a non-empty string", code: 400 }
      }
      if (typeof background !== "string" || background.trim().length === 0) {
        return { status: false, error: "Background must be a non-empty string", code: 400 }
      }
      if (typeof persen !== "string" || persen.trim().length === 0) {
        return { status: false, error: "Persen must be a non-empty string", code: 400 }
      }

      const parsedPersen = parseInt(persen.trim(), 10)
      if (isNaN(parsedPersen) || parsedPersen < 0 || parsedPersen > 100) {
        return { status: false, error: "Persen must be a number between 0 and 100", code: 400 }
      }

      try {
        const imageUrls = [avatar1, avatar2, background]
        const invalidUrls: string[] = []

        for (const url of imageUrls) {
          if (!(await isValidImageUrl(url.trim()))) {
            invalidUrls.push(url)
          }
        }

        if (invalidUrls.length > 0) {
          return {
            status: false,
            error: `Invalid image URL or unsupported image format for: ${invalidUrls.join(", ")}`,
            code: 400,
          }
        }

        const image = await generateShipImageFromUrl(
          avatar1.trim(),
          avatar2.trim(),
          background.trim(),
          persen.trim(),
        )

        return createImageResponse(image as Buffer)
      } catch (error) {
        console.error("Error:", error)
        return {
          status: false,
          error: error.message || "Failed to create ship image",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/canvas/ship",
    name: "ship",
    category: "Canvas",
    description:
      "This API generates a personalized 'ship' image, visually representing compatibility or a relationship between two individuals based on a percentage. Users upload two avatar image files, a background image file, and provide a numerical percentage via multipart/form-data. The API receives these image files, processes them using the Canvafy library to overlay the avatars on the background, applies a border, and integrates the custom percentage into the design. This can be used for dynamic content generation where users directly upload their media.",
    tags: ["CANVAS", "IMAGE", "GENERATOR", "AVATAR", "RELATIONSHIP", "UPLOAD"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              avatar1: {
                type: "string",
                format: "binary",
                description: "The first avatar image file (JPG, JPEG, PNG, GIF, WEBP).",
              },
              avatar2: {
                type: "string",
                format: "binary",
                description: "The second avatar image file (JPG, JPEG, PNG, GIF, WEBP).",
              },
              background: {
                type: "string",
                format: "binary",
                description: "The background image file (JPG, JPEG, PNG, GIF, WEBP).",
              },
              persen: {
                type: "string",
                description: "The percentage value for the ship image.",
                example: "20",
              },
            },
            required: ["avatar1", "avatar2", "background", "persen"],
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      const { persen } = req.body || {}

      if (!persen) {
        return { status: false, error: "Missing percentage value.", code: 400 }
      }
      if (typeof persen !== "string" || persen.trim().length === 0) {
        return { status: false, error: "Persen must be a non-empty string", code: 400 }
      }

      const parsedPersen = parseInt(persen.trim(), 10)
      if (isNaN(parsedPersen) || parsedPersen < 0 || parsedPersen > 100) {
        return { status: false, error: "Persen must be a number between 0 and 100", code: 400 }
      }

      try {
        const avatar1File = await guf(req, "avatar1")
        const avatar2File = await guf(req, "avatar2")
        const backgroundFile = await guf(req, "background")

        if (!avatar1File || !avatar1File.file) {
          return { status: false, error: "Missing avatar1 file in form data.", code: 400 }
        }
        if (!avatar2File || !avatar2File.file) {
          return { status: false, error: "Missing avatar2 file in form data.", code: 400 }
        }
        if (!backgroundFile || !backgroundFile.file) {
          return { status: false, error: "Missing background file in form data.", code: 400 }
        }

        if (!avatar1File.isImage) {
          return { status: false, error: `Invalid avatar1 file type: ${avatar1File.type}. Supported: JPG, JPEG, PNG, GIF, WEBP`, code: 400 }
        }
        if (!avatar2File.isImage) {
          return { status: false, error: `Invalid avatar2 file type: ${avatar2File.type}. Supported: JPG, JPEG, PNG, GIF, WEBP`, code: 400 }
        }
        if (!backgroundFile.isImage) {
          return { status: false, error: `Invalid background file type: ${backgroundFile.type}. Supported: JPG, JPEG, PNG, GIF, WEBP`, code: 400 }
        }

        if (!avatar1File.isValid) {
          return { status: false, error: `Invalid avatar1 file: ${avatar1File.name}. Size must be between 1 byte and 10MB`, code: 400 }
        }
        if (!avatar2File.isValid) {
          return { status: false, error: `Invalid avatar2 file: ${avatar2File.name}. Size must be between 1 byte and 10MB`, code: 400 }
        }
        if (!backgroundFile.isValid) {
          return { status: false, error: `Invalid background file: ${backgroundFile.name}. Size must be between 1 byte and 10MB`, code: 400 }
        }

        const image = await generateShipImageFromFile(
          avatar1File.file,
          avatar2File.file,
          backgroundFile.file,
          persen.trim(),
        )

        return createImageResponse(image as Buffer)
      } catch (error) {
        console.error("Error:", error)
        return {
          status: false,
          error: error.message || "Failed to create ship image",
          code: 500,
        }
      }
    },
  },
]