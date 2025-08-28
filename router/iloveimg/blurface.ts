import axios from "axios"
import * as path from "path"
import { Jimp } from "jimp"
import { fileTypeFromBuffer } from "file-type"
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
  private api: any | null
  private server: string | null
  private taskId: string | null
  private token: string | null
  private height: number | null
  private width: number | null

  constructor() {
    this.api = null
    this.server = null
    this.taskId = null
    this.token = null
    this.height = null
    this.width = null
  }

  async getTaskId(): Promise<{ taskId: string }> {
    try {
      const { data: html } = await axios.get("https://www.iloveimg.com/blur-face", {
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

  async uploadFromUrl(imageUrl: string): Promise<any> {
    if (!this.taskId || !this.api) {
      throw new Error("Task ID or API is not available. Run getTaskId() first.")
    }

    try {
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
      })

      const fileType = await fileTypeFromBuffer(imageResponse.data)
      if (!fileType || !fileType.mime.startsWith("image/")) {
        throw new Error("Unsupported image file type.")
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
        headers: {
          ...form.getHeaders(),
          "Content-Length": form.getLengthSync(),
        },
      })

      return response.data
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async uploadFromFile(fileBuffer: Buffer, fileName: string): Promise<any> {
    if (!this.taskId || !this.api) {
      throw new Error("Task ID or API is not available. Run getTaskId() first.")
    }

    try {
      const fileType = await fileTypeFromBuffer(fileBuffer)
      if (!fileType || !fileType.mime.startsWith("image/")) {
        throw new Error("Unsupported image file type.")
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
        headers: {
          ...form.getHeaders(),
          "Content-Length": form.getLengthSync(),
        },
      })

      return response.data
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async faceDetection(serverFilename: string): Promise<any> {
    if (!this.taskId || !this.api) {
      throw new Error("Task ID or API is not available. Run getTaskId() first.")
    }

    const form = new FormData()
    form.append("task", this.taskId)
    form.append("level", "recommended")
    form.append("fileArray[0][server_filename]", serverFilename)

    try {
      const response = await this.api.post("/v1/detectfaces", form, {
        headers: {
          ...form.getHeaders(),
          "Content-Length": form.getLengthSync(),
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to perform face detection: ${error.message}`)
    }
  }

  async processImage(serverFilename: string, originalFilename: string): Promise<Buffer> {
    if (!this.taskId || !this.api) {
      throw new Error("Task ID or API is not available. Run getTaskId() first.")
    }

    const form = new FormData()
    form.append("packaged_filename", "iloveimg-blurred")
    form.append("width", this.width!)
    form.append("height", this.height!)
    form.append("level", "recommended")
    form.append("mode", "include")
    form.append("task", this.taskId)
    form.append("tool", "blurfaceimage")
    form.append("files[0][server_filename]", serverFilename)
    form.append("files[0][filename]", originalFilename)

    try {
      await this.api.post("/v1/process", form, {
        headers: {
          ...form.getHeaders(),
          "Content-Length": form.getLengthSync(),
        },
      })

      const downloadResponse = await this.api.get(`/v1/download/${this.taskId}`, {
        responseType: "arraybuffer",
      })

      return downloadResponse.data
    } catch (error: any) {
      throw new Error(`Failed to process image: ${error.message}`)
    }
  }
}

async function scrapeBlurFaceFromUrl(imageUrl: string): Promise<Buffer> {
  const compressor = new CompressImageAPI()

  await compressor.getTaskId()
  const uploadResult = await compressor.uploadFromUrl(imageUrl)
  if (!uploadResult?.server_filename) {
    throw new Error("Failed to upload image: Server filename not found.")
  }

  const originalFilename = path.basename(new URL(imageUrl).pathname) || "image.jpg"
  const blurredImageBuffer = await compressor.processImage(
    uploadResult.server_filename,
    originalFilename,
  )
  return blurredImageBuffer
}

async function scrapeBlurFaceFromFile(fileBuffer: Buffer, fileName: string): Promise<Buffer> {
  const compressor = new CompressImageAPI()

  await compressor.getTaskId()
  const uploadResult = await compressor.uploadFromFile(fileBuffer, fileName)
  if (!uploadResult?.server_filename) {
    throw new Error("Failed to upload image: Server filename not found.")
  }

  const blurredImageBuffer = await compressor.processImage(
    uploadResult.server_filename,
    fileName,
  )
  return blurredImageBuffer
}

export default [
  {
    metode: "GET",
    endpoint: "/api/iloveimg/blurface",
    name: "blurface",
    category: "Iloveimg",
    description:
      "This API blurs faces detected in an image provided via a URL. Users can submit a URL of an image, and the API will process it to identify and blur human faces, returning the modified image. This is useful for privacy protection in images. The API supports various image formats and ensures that sensitive information (faces) is obscured while maintaining the overall image quality for other purposes.",
    tags: ["ILOVEIMG", "Image Processing", "Privacy"],
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
        new URL(image.trim())
      } catch (e) {
        return {
          status: false,
          error: "Invalid URL format for 'image' parameter.",
          code: 400,
        }
      }

      try {
        const blurredImageBuffer = await scrapeBlurFaceFromUrl(image.trim())

        const fileType = await fileTypeFromBuffer(blurredImageBuffer)
        const contentType = fileType ? fileType.mime : "application/octet-stream"
        const filename = `blurred_image.${fileType?.ext || "png"}`

        return createImageResponse(blurredImageBuffer, filename)
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
    endpoint: "/api/iloveimg/blurface",
    name: "blurface",
    category: "Iloveimg",
    description:
      "This API blurs faces detected in an image uploaded as a file via multipart/form-data. Users can upload an image file, and the API will process it to identify and blur human faces, returning the modified image. This is ideal for applications requiring direct file uploads for privacy enhancement. The API supports various image formats and ensures faces are obscured while preserving other image details.",
    tags: ["ILOVEIMG", "Image Processing", "Privacy"],
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
                description: "The image file to blur faces from.",
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
      const { file, isValid, isImage, type, name } = await guf(req, "image")

      if (!file) {
        return {
          status: false,
          error: "File 'image' is required in multipart/form-data.",
          code: 400,
        }
      }

      if (!isValid) {
        return {
          status: false,
          error: `Invalid file: ${name}. Size must be between 1 byte and 10MB`,
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

      try {
        const blurredImageBuffer = await scrapeBlurFaceFromFile(file, name)

        const outputFileType = await fileTypeFromBuffer(blurredImageBuffer)
        const contentType = outputFileType ? outputFileType.mime : "application/octet-stream"
        const filename = `blurred_image.${outputFileType?.ext || "png"}`

        return createImageResponse(blurredImageBuffer, filename)
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