import type { ApiStats, SystemStats, MonitoringData } from "../types/index"
import { Stats } from "../models/index"
import { Logger } from "../utils/logger"
import { SystemMonitor } from "./system-monitor"
import { NetworkMonitor } from "./network-monitor"
import { PM2Monitor } from "./pm2-monitor"
import { StatsCache } from "./stats-cache"
import { ApiStatsManager } from "./api-stats"
import { EnhancedStats } from "./enhanced-stats"
import moment from "moment-timezone"

export class StatsService {
  private logger = new Logger("Stats")
  private sysMonitor: SystemMonitor
  private netMonitor: NetworkMonitor
  private pm2Monitor: PM2Monitor
  private cache: StatsCache
  private apiStats: ApiStatsManager
  private enhanced: EnhancedStats
  private totalEndpoints = 0

  constructor() {
    this.sysMonitor = new SystemMonitor()
    this.netMonitor = new NetworkMonitor()
    this.pm2Monitor = new PM2Monitor()
    this.cache = new StatsCache()
    this.apiStats = new ApiStatsManager()
    this.enhanced = new EnhancedStats()
    
    this.init()
  }

  private async init(): Promise<void> {
    await this.initStats()
    this.sysMonitor.start()
    this.netMonitor.start()
    this.pm2Monitor.start()
    this.setupPeriodicUpdate()
  }

  private async initStats(): Promise<void> {
    try {
      const stats = await Stats.findOne()
      if (stats) {
        this.cache.init(stats)
        this.logger.success(`Stats initialized: ${this.cache.getTotal()} total requests`)
      } else {
        this.logger.info("No existing stats found, starting fresh")
      }
    } catch (error) {
      this.logger.error("Failed to initialize stats:", error)
    }
  }

  updateTotalEndpoints(count: number): void {
    this.totalEndpoints = count
  }

  updateStats(endpoint: string, method: string, statusCode: number, duration: number, ip: string, userAgent: string, keyData?: string, userId?: number): void {
    if (!endpoint || !method || !ip) return

    const maskedIp = this.maskIpAddress(ip)
    const simplifiedUA = this.simplifyUserAgent(userAgent)
    
    this.cache.updateRequest()
    this.enhanced.updateStats(endpoint, method, statusCode, duration, simplifiedUA)
    
    if (endpoint.startsWith("/api/")) {
      this.cache.updateApi(statusCode >= 500)
      this.apiStats.update(endpoint, statusCode, duration)
      
      const requestData = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        endpoint,
        method,
        statusCode,
        duration,
        maskedIp,
        timestamp: Date.now(),
        userAgent: simplifiedUA,
      }
      
      this.enhanced.addRecentRequest(requestData)
    }

    this.enhanced.addMonitoring({
      timestamp: Date.now(),
      endpoint,
      method,
      statusCode,
      duration,
      ip: maskedIp,
      userAgent: simplifiedUA,
    })

    this.pm2Monitor.updateMetrics(duration)
    
    if (this.cache.shouldSave()) {
      this.saveStats().catch(err => this.logger.error("Auto-save failed:", err))
    }
  }

  private maskIpAddress(ip: string): string {
    if (!ip || ip === "unknown") return "***.***.***"

    if (ip.includes(".")) {
      const parts = ip.split(".")
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.**`
      }
    }

    if (ip.includes(":")) {
      const parts = ip.split(":")
      if (parts.length >= 4) {
        return `${parts[0]}:${parts[1]}:****:****`
      }
    }

    return "***.***.***"
  }

  private simplifyUserAgent(ua: string): string {
    if (!ua) return "Unknown"
    if (ua.includes("Chrome")) return "Chrome"
    if (ua.includes("Firefox")) return "Firefox"
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
    if (ua.includes("Edge")) return "Edge"
    if (ua.includes("bot") || ua.includes("Bot")) return "Bot"
    if (ua.includes("curl")) return "cURL"
    if (ua.includes("Postman")) return "Postman"
    return "Other"
  }

  async getCurrentStats(): Promise<SystemStats> {
    try {
      const sysStats = await this.sysMonitor.getStats()
      const netStats = this.netMonitor.getStats()
      const pm2Stats = this.pm2Monitor.getStats()
      const apiData = this.apiStats.getProcessed()
      const enhancedData = this.enhanced.getStats()
      const cacheData = this.cache.getStats()

      return {
        requests: cacheData,
        system: {
          ...sysStats,
          totalEndpoints: this.totalEndpoints,
        },
        network: netStats,
        apiStats: apiData.processed,
        overallAvgResponseTime: apiData.overallAvg,
        enhanced: {
          ...enhancedData,
          pm2Metrics: pm2Stats,
        },
      }
    } catch (error) {
      this.logger.error("Failed to get current stats:", error)
      return this.getFallbackStats()
    }
  }

  private getFallbackStats(): SystemStats {
    return {
      requests: this.cache.getStats(),
      system: this.sysMonitor.getFallback(),
      network: this.netMonitor.getFallback(),
      apiStats: {},
      overallAvgResponseTime: "0.00",
      enhanced: {
        methodDistribution: {},
        topUserAgents: {},
        responseTimeDistribution: { fast: 0, medium: 0, slow: 0, verySlow: 0 },
        statusCodeDistribution: {},
        topEndpoints: [],
        endpointsWithErrors: [],
        slowestEndpoints: [],
        recentRequests: [],
        pm2Metrics: this.pm2Monitor.getFallback(),
      },
    }
  }

  async saveStats(): Promise<void> {
    try {
      const stats = {
        ...this.cache.getForSave(),
        lastUpdate: moment().tz("Asia/Jakarta").toISOString(),
      }

      await Stats.findOneAndUpdate({}, stats, { upsert: true })
      this.cache.markSaved()
      this.logger.debug("Stats saved to database")
    } catch (error) {
      this.logger.error("Failed to save stats:", error)
      throw error
    }
  }

  private setupPeriodicUpdate(): void {
    setInterval(async () => {
      try {
        await this.saveStats()
      } catch (error) {
        this.logger.error("Periodic stats save failed:", error)
      }
    }, 10 * 60 * 1000)

    setInterval(() => {
      this.cache.updatePerSecond()
      this.apiStats.cleanup(Date.now())
    }, 1000)

    setInterval(() => {
      this.enhanced.cleanup()
    }, 60 * 60 * 1000)
  }

  getMonitoringData(): MonitoringData[] {
    return this.enhanced.getMonitoringData()
  }

  getRecentRequests(limit = 5): any[] {
    return this.enhanced.getRecentRequests(limit)
  }

  resetDailyStats(): void {
    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD")
    this.cache.resetDaily(today)
    this.apiStats.clear()
    this.logger.info("Daily stats reset")
  }

  getDetailedStats(): any {
    return {
      requestStats: this.cache.getStats(),
      apiStatsCount: this.apiStats.getSize(),
      monitoringDataCount: this.enhanced.getMonitoringCount(),
      recentRequestsCount: this.enhanced.getRecentCount(),
      networkSupported: this.netMonitor.isSupported(),
      totalEndpoints: this.totalEndpoints,
      systemCache: this.sysMonitor.getCache(),
      enhancedStats: this.enhanced.getStats(),
      pm2Metrics: this.pm2Monitor.getStats(),
    }
  }
}