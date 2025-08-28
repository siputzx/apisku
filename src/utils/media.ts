import fs from "fs"
import path from "path"
import { Logger } from "./logger"

export class MediaUtils {
  private static logger = new Logger("Media")

  static async saveMedia(buffer: Buffer, fileType = "bin"): Promise<string> {
    try {
      const tmpDir = path.join(process.cwd(), "tmp")

      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }

      const filename = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileType}`
      const filePath = path.join(tmpDir, filename)

      fs.writeFileSync(filePath, buffer)

      const publicUrl = `${process.env.BASE_URL || "http://localhost:3000"}/tmpfiles/${filename}`

      MediaUtils.logger.success(`Media saved: ${filename}`)
      return publicUrl
    } catch (error) {
      MediaUtils.logger.error("Media save failed:", error)
      throw new Error("Failed to save media")
    }
  }

  static setupFileExpiration(): void {
    setInterval(() => {
      const tmpDir = path.join(process.cwd(), "tmp")
      if (!fs.existsSync(tmpDir)) return

      fs.readdir(tmpDir, (err, files) => {
        if (err) {
          MediaUtils.logger.error("Tmp dir read error:", err)
          return
        }

        files.forEach((file) => {
          const filePath = path.join(tmpDir, file)
          fs.stat(filePath, (err, stats) => {
            if (err) {
              MediaUtils.logger.error(`File stat error: ${file}`, err)
              return
            }

            if (Date.now() - stats.birthtimeMs > 5 * 60 * 1000) {
              fs.rm(filePath, { recursive: true, force: true }, (err) => {
                if (err) MediaUtils.logger.error(`File delete error: ${file}`, err)
                else MediaUtils.logger.info(`Expired file deleted: ${file}`)
              })
            }
          })
        })
      })
    }, 60000) // Check every minute
  }
}