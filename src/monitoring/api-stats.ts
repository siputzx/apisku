import type { ApiStats } from "../types/index"

export class ApiStatsManager {
  private stats = new Map<string, ApiStats>()

  update(endpoint: string, statusCode: number, duration: number): void {
    const now = Date.now()
    const data = this.stats.get(endpoint) || {
      success: 0,
      errors: 0,
      totalTime: 0,
      requests: 0,
      responseTimes: [],
    }

    data.requests = (data.requests || 0) + 1
    data.totalTime = (data.totalTime || 0) + duration

    if (statusCode >= 200 && statusCode < 300) {
      data.success = (data.success || 0) + 1
    } else if (statusCode >= 500) {
      data.errors = (data.errors || 0) + 1
    }

    data.responseTimes.push({ timestamp: now, duration })

    const oneHourAgo = now - 60 * 60 * 1000
    data.responseTimes = data.responseTimes.filter((rt) => rt.timestamp > oneHourAgo).slice(-1000)

    this.stats.set(endpoint, data)
  }

  cleanup(now: number): void {
    const oneHourAgo = now - 60 * 60 * 1000
    let cleanedCount = 0

    for (const [endpoint, data] of this.stats) {
      const originalLength = data.responseTimes.length
      data.responseTimes = data.responseTimes.filter((rt) => rt.timestamp > oneHourAgo)

      if (data.responseTimes.length === 0 && data.requests === 0) {
        this.stats.delete(endpoint)
        cleanedCount++
      }
    }
  }

  getProcessed(): { processed: Record<string, any>; overallAvg: string } {
    const processed: Record<string, any> = {}
    const validStats: Array<{ totalRequests: number; avgResponseTime: number }> = []

    for (const [endpoint, stats] of this.stats.entries()) {
      try {
        const validDurations = stats.responseTimes
          .map((rt) => rt.duration)
          .filter((d) => d !== undefined && !isNaN(d) && d >= 0)

        const totalRequests = stats.requests || 0
        const successCount = stats.success || 0
        const errorCount = stats.errors || 0

        const avgResponseTime = validDurations.length > 0
          ? (validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length).toFixed(2)
          : "0.00"

        const errorRate = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : "0.00"
        const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(2) : "0.00"

        processed[endpoint] = {
          success: successCount,
          errors: errorCount,
          totalRequests,
          avgResponseTime,
          errorRate,
          successRate,
          lastActivity: stats.responseTimes.length > 0
            ? new Date(Math.max(...stats.responseTimes.map((rt) => rt.timestamp))).toISOString()
            : null,
        }

        if (totalRequests > 0 && !isNaN(Number.parseFloat(avgResponseTime))) {
          validStats.push({ totalRequests, avgResponseTime: Number.parseFloat(avgResponseTime) })
        }
      } catch (error) {
        // Skip invalid stats
      }
    }

    const totalApiTime = validStats.reduce(
      (sum, stat) => sum + stat.avgResponseTime * stat.totalRequests,
      0
    )
    const totalApiRequests = validStats.reduce((sum, stat) => sum + stat.totalRequests, 0)
    const overallAvg = totalApiRequests > 0 ? (totalApiTime / totalApiRequests).toFixed(2) : "0.00"

    return { processed, overallAvg }
  }

  clear(): void {
    this.stats.clear()
  }

  getSize(): number {
    return this.stats.size
  }
}