import axios from "axios"
import * as cheerio from "cheerio"
import { Jimp } from "jimp"
import { fileTypeFromBuffer } from "file-type"
import path from "path"
import { Buffer } from "buffer"
import FormData from "form-data"

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

class CompressImageAPI {
  api: import("axios").AxiosInstance | null
  server: string | null
  taskId: string | null
  token: string | null
  height: number | null
  width: number | null

  constructor() {
    this.api = null
    this.server = null
    this.taskId = null
    this.token = null
    this.height = null
    this.width = null
  }

  async getTaskId() {
    try {
      const { data: html } = await axios.get("https://www.iloveimg.com/compress-image", {
        timeout: 10000,
      })

      const tokenMatches = html.match(/(ey[a-zA-Z0-9?%-_/]+)/g)
      if (!tokenMatches || tokenMatches.length < 2) {
        throw new Error("Token not found.")
      }
      this.token = tokenMatches[1]

      const configMatch = html.match(/var ilovepdfConfig = ({.*?});/s)
      if (!configMatch) {
        throw new Error("Server configuration not found.")
      }

      const configJson = JSON.parse(configMatch[1])
      const servers = configJson.servers
      if (!Array.isArray(servers) || servers.length === 0) {
        throw new Error("Server list is empty.")
      }

      this.server = servers[Math.floor(Math.random() * servers.length)]
      this.taskId = html.match(/taskId\s*=\s*'(\w+)/)?.[1]

      if (!this.taskId) {
        throw new Error("Task ID not found!")
      }

      this.api = axios.create({
        baseURL: `https://${this.server}.iloveimg.com`,
        timeout: 30000,
      })
      this.api.defaults.headers.common["Authorization"] = `Bearer ${this.token}`

      return { taskId: this.taskId }
    } catch (error: any) {
      throw new Error(`Failed to get Task ID: ${error.message}`)
    }
  }

  async uploadFromUrl(imageUrl: string) {
    if (!this.taskId || !this.api) {
      throw new Error("Task ID or API not available. Run getTaskId() first.")
    }

    try {
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
      })

      const fileType = await fileTypeFromBuffer(imageResponse.data)
      if (!fileType || !fileType.mime.startsWith("image/")) {
        throw new Error("File type is not a supported image.")
      }

      const image = await Jimp.read(imageResponse.data)
      this.width = image.bitmap.width
      this.height = image.bitmap.height

      const buffer = Buffer.from(imageResponse.data)
      const urlPath = new URL(imageUrl).pathname
      const fileName = path.basename(urlPath) || `image.${fileType.ext}`

      const form = new FormData()
      form.append("name", fileName)
      form.append("chunk", "0")
      form.append("chunks", "1")
      form.append("task", this.taskId)
      form.append("preview", "1")
      form.append("pdfinfo", "0")
      form.append("pdfforms", "0")
      form.append("pdfresetforms", "0")
      form.append("v", "web.0")
      form.append("file", buffer, { filename: fileName, contentType: fileType.mime })

      const response = await this.api.post("/v1/upload", form, {
        headers: form.getHeaders(),
        data: form,
      })

      return response.data
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async uploadFromFile(fileBuffer: Buffer, fileName: string) {
    if (!this.taskId || !this.api) {
      throw new Error("Task ID or API not available. Run getTaskId() first.")
    }

    try {
      const fileType = await fileTypeFromBuffer(fileBuffer)
      if (!fileType || !fileType.mime.startsWith("image/")) {
        throw new Error("File type is not a supported image.")
      }

      const image = await Jimp.read(fileBuffer)
      this.width = image.bitmap.width
      this.height = image.bitmap.height

      const form = new FormData()
      form.append("name", fileName)
      form.append("chunk", "0")
      form.append("chunks", "1")
      form.append("task", this.taskId)
      form.append("preview", "1")
      form.append("pdfinfo", "0")
      form.append("pdfforms", "0")
      form.append("pdfresetforms", "0")
      form.append("v", "web.0")
      form.append("file", fileBuffer, { filename: fileName, contentType: fileType.mime })

      const response = await this.api.post("/v1/upload", form, {
        headers: form.getHeaders(),
        data: form,
      })

      return response.data
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async convertImage(serverFilename: string, originalFilename: string) {
    if (!this.taskId || !this.api) {
      throw new Error("Task ID or API not available. Run getTaskId() first.")
    }

    const form = new FormData()
    form.append("convert_to", "png")
    form.append("width", this.width)
    form.append("height", this.height)
    form.append("gif_time", "100")
    form.append("task", this.taskId)
    form.append("tool", "convertimage")
    form.append("packaged_filename", "iloveimg-converted")
    form.append("files[0][server_filename]", serverFilename)
    form.append("files[0][filename]", originalFilename)

    try {
      await this.api.post("/v1/process", form, {
        headers: form.getHeaders(),
        data: form,
      })

      const downloadResponse = await this.api.get(`/v1/download/${this.taskId}`, {
        responseType: "arraybuffer",
      })

      return downloadResponse.data
    } catch (error: any) {
      throw new Error(`Failed to perform conversion: ${error.message}`)
    }
  }
}

async function scrapeImageToPngFromUrl(imageUrl: string) {
  const converter = new CompressImageAPI()
  await converter.getTaskId()
  const uploadResult = await converter.uploadFromUrl(imageUrl)
  if (!uploadResult?.server_filename) {
    throw new Error("Failed to upload image: Server filename not found.")
  }

  const originalFilename = path.basename(new URL(imageUrl).pathname) || "image.jpg"
  const convertedImage = await converter.convertImage(
    uploadResult.server_filename,
    originalFilename,
  )
  return convertedImage
}

async function scrapeImageToPngFromFile(fileBuffer: Buffer, fileName: string) {
  const converter = new CompressImageAPI()
  await converter.getTaskId()
  const uploadResult = await converter.uploadFromFile(fileBuffer, fileName)
  if (!uploadResult?.server_filename) {
    throw new Error("Failed to upload image: Server filename not found.")
  }

  const convertedImage = await converter.convertImage(
    uploadResult.server_filename,
    fileName,
  )
  return convertedImage
}

export default [
  {
    metode: "GET",
    endpoint: "/api/iloveimg/image2png",
    name: "image2png",
    category: "Iloveimg",
    description: "Convert an image to PNG format by providing its URL. This API endpoint allows you to transform various image formats into a standardized PNG format. It supports common image formats like JPG, GIF, and WEBP, converting them into a high-quality PNG image. The converted image will be returned as a binary response. This is useful for ensuring image compatibility across different platforms or for applications requiring transparent backgrounds.",
    tags: ["ILOVEIMG", "Image Conversion", "PNG"],
    example: "?image=https://i.pinimg.com/736x/0b/9f/0a/0b9f0a92a598e6c22629004c1027d23f.jpg",
    parameters: [
      {
        name: "image",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2000,
        },
        description: "Image URL",
        example: "https://i.pinimg.com/736x/0b/9f/0a/0b9f0a92a598e6c22629004c1027d23f.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { image } = req.query || {}

      if (!image) {
        return {
          status: false,
          error: "Parameter 'image' is required.",
          code: 400,
        }
      }

      if (typeof image !== "string" || image.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'image' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const convertedImageBuffer = await scrapeImageToPngFromUrl(image.trim())
        const fileType = await fileTypeFromBuffer(convertedImageBuffer)
        const contentType = fileType ? fileType.mime : "image/png"

        return createImageResponse(convertedImageBuffer, `converted_image.png`)
      } catch (error: any) {
        console.error("Error:", error)
        return {
          status: false,
          error: error.message || "An error occurred while processing the image.",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/iloveimg/image2png",
    name: "image2png",
    category: "Iloveimg",
    description: "Convert an image to PNG format by uploading a file via multipart/form-data. This API endpoint allows you to transform various uploaded image formats into a standardized PNG format. It supports common image formats like JPG, GIF, and WEBP, converting them into a high-quality PNG image. The converted image will be returned as a binary response. This is ideal for applications where users upload images directly for conversion and require PNG output.",
    tags: ["ILOVEIMG", "Image Conversion", "Image Upload"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["image"],
            properties: {
              image: {
                type: "string",
                format: "binary",
                description: "The image file to convert to PNG.",
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
      try {
        const { file: fileBuffer, name: fileName, isImage, isValid, type } = await guf(req, "image")

        if (!fileBuffer) {
          return {
            status: false,
            error: "File 'image' is required in multipart/form-data.",
            code: 400,
          }
        }

        if (!isValid) {
          return {
            status: false,
            error: `Invalid file: ${fileName}. Size must be between 1 byte and 10MB`,
            code: 400,
          }
        }

        if (!isImage) {
          return {
            status: false,
            error: `Invalid file type: ${type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
            code: 400,
          }
        }

        const convertedImageBuffer = await scrapeImageToPngFromFile(fileBuffer, fileName)

        return createImageResponse(convertedImageBuffer, `converted_image.png`)
      } catch (error: any) {
        console.error("Error:", error)
        return {
          status: false,
          error: error.message || "An error occurred while processing the image.",
          code: 500,
        }
      }
    },
  },
]