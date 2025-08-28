import { Elysia } from "elysia"
import type { StatsService } from "../monitoring/stats"
import { ValidationUtils } from "../utils/validation"
import type { EmailService } from "../services/email"
import type { DiscordService } from "../services/discord"
import { config } from "../config/index"

export function createApiRoutes(
  statsService: StatsService,
  emailService: EmailService,
  discordService: DiscordService,
) {
  return new Elysia({ prefix: "/api" })
    .get("/stats", async () => {
      try {
        const stats = await statsService.getCurrentStats()
        return {
          status: true,
          stats: ValidationUtils.sanitizeInput(stats),
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error("Stats fetch error:", error)
        return {
          status: false,
          error: "Failed to fetch stats",
          timestamp: new Date().toISOString(),
        }
      }
    })

    .get("/stats/detailed", async () => {
      try {
        const stats = await statsService.getCurrentStats()
        const detailedStats = statsService.getDetailedStats()
        const monitoringData = statsService.getMonitoringData()

        return {
          status: true,
          stats: ValidationUtils.sanitizeInput(stats),
          detailed: ValidationUtils.sanitizeInput(detailedStats),
          monitoring: ValidationUtils.sanitizeInput(monitoringData),
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error("Detailed stats fetch error:", error)
        return {
          status: false,
          error: "Failed to fetch detailed stats",
          timestamp: new Date().toISOString(),
        }
      }
    })

    .get("/health", () => ({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    }))

    .get("/database/stats", async () => {
      try {
        const MonitoringData = require("../models/index").MonitoringData

        const [totalRecords, oldestRecord, newestRecord] = await Promise.all([
          MonitoringData.countDocuments(),
          MonitoringData.findOne().sort({ createdAt: 1 }).lean(),
          MonitoringData.findOne().sort({ createdAt: -1 }).lean(),
        ])

        return {
          status: true,
          data: {
            totalMonitoringRecords: totalRecords,
            oldestRecord: oldestRecord?.createdAt || null,
            newestRecord: newestRecord?.createdAt || null,
            dataRetention: "Permanent (no auto-delete)",
          },
        }
      } catch (error) {
        console.error("Database stats fetch error:", error)
        return {
          status: false,
          error: "Failed to fetch database stats",
        }
      }
    })

    .post("/database/cleanup", async ({ body }) => {
      try {
        const { daysToKeep = 30, confirmCleanup } = body as any

        if (!confirmCleanup) {
          return {
            status: false,
            error: "Please confirm cleanup by setting confirmCleanup: true",
          }
        }

        if (daysToKeep < 1) {
          return {
            status: false,
            error: "daysToKeep must be at least 1",
          }
        }

        // Perform cleanup using stats service
        const result = await statsService.cleanupOldDatabaseData(daysToKeep)

        return {
          status: true,
          message: `Successfully cleaned up old monitoring data`,
          recordsDeleted: result.deletedCount,
          daysToKeep,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error("Database cleanup error:", error)
        return {
          status: false,
          error: "Failed to cleanup database",
        }
      }
    })

    .get("/monitoring/recent", async ({ query }) => {
      try {
        const limit = Math.min(Number.parseInt(query.limit as string) || 50, 200)
        const monitoringData = statsService.getMonitoringData().slice(0, limit)

        return {
          status: true,
          data: ValidationUtils.sanitizeInput(monitoringData),
          count: monitoringData.length,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error("Recent monitoring fetch error:", error)
        return {
          status: false,
          error: "Failed to fetch recent monitoring data",
        }
      }
    })

    .post("/stats/reset", async ({ body }) => {
      try {
        const { confirmReset, type } = body as any

        if (!confirmReset) {
          return {
            status: false,
            error: "Please confirm reset by setting confirmReset: true",
          }
        }

        if (type === "daily") {
          statsService.resetDailyStats()
          return {
            status: true,
            message: "Daily stats reset successfully",
            timestamp: new Date().toISOString(),
          }
        }

        return {
          status: false,
          error: "Invalid reset type. Use 'daily'",
        }
      } catch (error) {
        console.error("Stats reset error:", error)
        return {
          status: false,
          error: "Failed to reset stats",
        }
      }
    })

    .post("/support", async ({ body }) => {
      try {
        const input = ValidationUtils.sanitizeInput(body)

        if (!ValidationUtils.validateInput(input)) {
          return {
            success: false,
            error: "Missing required fields",
          }
        }

        const isValidToken = await ValidationUtils.verifyTurnstileToken(
          input.token,
          config.TURNSTILE_SECRET_KEY!,
          config.TURNSTILE_VERIFY_URL,
        )

        if (!isValidToken) {
          return {
            success: false,
            error: "Security verification failed",
          }
        }

        const emailTemplate = emailService.generateEmailTemplate(input, input.type)
        await emailService.sendEmail(input.email, `Support Request - ${input.type}`, emailTemplate)

        const discordMessage = formatDiscordMessage(input, input.type)
        await discordService.sendMessage(discordMessage)

        return {
          success: true,
          message: "Request submitted successfully",
        }
      } catch (error) {
        console.error("Support request error:", error)
        return {
          success: false,
          error: "Failed to process request",
        }
      }
    })
}

function formatDiscordMessage(data: any, type: string): string {
  const { name, email, whatsapp, featureName, description } = data
  const time = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })

  const messages = {
    feature: `**🆕 New Feature Request**\n\n**👤 From:**\nName: \`${name}\`\nEmail: \`${email}\`\n${whatsapp ? `WhatsApp: \`${whatsapp}\`\n` : ""}\n**📝 Request Details:**\nFeature: \`${featureName}\`\n\nDescription:\n\`\`\`${description}\`\`\`\n\n**⏰ Time:** ${time}`,
    complaint: `**⚠️ New Issue Report**\n\n**👤 From:**\nName: \`${name}\`\nEmail: \`${email}\`\n${whatsapp ? `WhatsApp: \`${whatsapp}\`\n` : ""}\n**📝 Issue Details:**\nAffected Feature: \`${featureName}\`\n\nDescription:\n\`\`\`${description}\`\`\`\n\n**⏰ Time:** ${time}`,
    feedback: `**❓ New Feedback**\n\n**👤 From:**\nName: \`${name}\`\nEmail: \`${email}\`\n${whatsapp ? `WhatsApp: \`${whatsapp}\`\n` : ""}\n**📝 Feedback:**\n\`\`\`${description}\`\`\`\n\n**⏰ Time:** ${time}`,
  }

  return messages[type as keyof typeof messages] || messages.feedback
}
