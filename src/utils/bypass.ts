import type { RouteContext } from "../types/index"
import type { BypassService } from "../services/bypass"

interface ProxyConfig {
  host: string
  port: number
  username?: string
  password?: string
}

export class BypassUtils {
  private static bypassService: BypassService

  static setBypassService(service: BypassService): void {
    this.bypassService = service
  }

  static async solveBypass(context: RouteContext): Promise<{
    wafSession: (url: string, proxy?: ProxyConfig) => Promise<any>
    solveTurnstileMin: (url: string, siteKey: string, proxy?: ProxyConfig) => Promise<any>
    solveTurnstileMax: (url: string, proxy?: ProxyConfig) => Promise<any>
    getSource: (url: string, proxy?: ProxyConfig) => Promise<any>
  }> {
    if (!this.bypassService) {
      throw new Error("Bypass service not initialized")
    }

    return {
      wafSession: async (url: string, proxy?: ProxyConfig) => {
        const result = await this.bypassService.wafSession(url, proxy)
        if (!result.success) {
          throw new Error(result.error || "WAF session failed")
        }
        return result.data
      },

      solveTurnstileMin: async (url: string, siteKey: string, proxy?: ProxyConfig) => {
        const result = await this.bypassService.solveTurnstileMin(url, siteKey, proxy)
        if (!result.success) {
          throw new Error(result.error || "Turnstile solve failed")
        }
        return result.data
      },

      solveTurnstileMax: async (url: string, proxy?: ProxyConfig) => {
        const result = await this.bypassService.solveTurnstileMax(url, proxy)
        if (!result.success) {
          throw new Error(result.error || "Turnstile solve failed")
        }
        return result.data
      },

      getSource: async (url: string, proxy?: ProxyConfig) => {
        const result = await this.bypassService.getSource(url, proxy)
        if (!result.success) {
          throw new Error(result.error || "Get source failed")
        }
        return result.data
      },
    }
  }
}
