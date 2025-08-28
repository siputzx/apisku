import type { Context } from "elysia"
import { ApiKey } from "../models/index"
import moment from "moment-timezone"
import { Logger } from "../utils/logger"

export class AuthMiddleware {
  private logger = new Logger("Auth")
  private keyCache = new Map<string, { valid: boolean; expiry: number }>()

  async validateApiKey(context: Context): Promise<{ valid: boolean; keyData?: any }> {
    const apiKey =
      context.query.apiKey ||
      context.query.apikey ||
      context.request.headers.get("x-api-key") ||
      context.request.headers.get("api-key") ||
      context.request.headers.get("api_key")

    if (!apiKey) return { valid: false }

    // Check cache first
    const cached = this.keyCache.get(apiKey)
    if (cached && Date.now() < cached.expiry) {
      return { valid: cached.valid }
    }

    try {
      const keyData = await ApiKey.findOne({ key: apiKey })
      if (!keyData) {
        this.keyCache.set(apiKey, { valid: false, expiry: Date.now() + 60000 })
        return { valid: false }
      }

      const now = moment()
      const expiresAt = moment(keyData.expiresAt)

      if (now.isAfter(expiresAt)) {
        await ApiKey.deleteOne({ key: apiKey })
        this.keyCache.set(apiKey, { valid: false, expiry: Date.now() + 60000 })
        return { valid: false }
      }

      // Update request count IMMEDIATELY
      await ApiKey.updateOne({ key: apiKey }, { $inc: { totalRequests: 1 } })

      // Update cache
      this.keyCache.set(apiKey, { valid: true, expiry: Date.now() + 300000 })
      return { valid: true, keyData }
    } catch (error) {
      this.logger.error("API key validation error:", error)
      return { valid: false }
    }
  }

  async requireApiKey(context: Context): Promise<{ valid: boolean; keyData?: any }> {
    const result = await this.validateApiKey(context)
    if (!result.valid) {
      context.set.status = 403
    }
    return result
  }

  // Cleanup expired cache entries
  setupCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, data] of this.keyCache) {
        if (now >= data.expiry) {
          this.keyCache.delete(key)
        }
      }
    }, 300000) // Clean every 5 minutes
  }
}
