import type { MonitoringData } from "../types/index"
import moment from "moment-timezone"

export class EnhancedStats {
  private data = {
    requestsByHour: {} as Record<string, number>,
    topUserAgents: {} as Record<string, number>,
    methodDistribution: {} as Record<string, number>,
    responseTimeDistribution: {
      fast: 0,
      medium: 0,
      slow: 0,
      verySlow: 0,
    },
    statusCodeDistribution: {} as Record<string, number>,
    endpointPopularity: {} as Record<string, number>,
    errorsByEndpoint: {} as Record<string, number>,
    avgResponseByEndpoint: {} as Record<string, { total: number; count: number }>,
  }

  private monitoringData: MonitoringData[] = []
  private recentRequests: Array<{
    id: string
    endpoint: string
    method: string
    statusCode: number
    duration: number
    maskedIp: string
    timestamp: number
    userAgent: string
  }> = []

  updateStats(endpoint: string, method: string, statusCode: number, duration: number, userAgent: string): void {
    const currentHour = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH")

    this.data.requestsByHour[currentHour] = (this.data.requestsByHour[currentHour] || 0) + 1
    this.data.methodDistribution[method] = (this.data.methodDistribution[method] || 0) + 1
    this.data.topUserAgents[userAgent] = (this.data.topUserAgents[userAgent] || 0) + 1

    if (duration < 10000) this.data.responseTimeDistribution.fast++
    else if (duration < 30000) this.data.responseTimeDistribution.medium++
    else if (duration < 60000) this.data.responseTimeDistribution.slow++
    else this.data.responseTimeDistribution.verySlow++

    const statusGroup = `${Math.floor(statusCode / 100)}xx`
    this.data.statusCodeDistribution[statusGroup] = (this.data.statusCodeDistribution[statusGroup] || 0) + 1

    this.data.endpointPopularity[endpoint] = (this.data.endpointPopularity[endpoint] || 0) + 1

    if (statusCode >= 500) {
      this.data.errorsByEndpoint[endpoint] = (this.data.errorsByEndpoint[endpoint] || 0) + 1
    }

    if (!this.data.avgResponseByEndpoint[endpoint]) {
      this.data.avgResponseByEndpoint[endpoint] = { total: 0, count: 0 }
    }
    this.data.avgResponseByEndpoint[endpoint].total += duration
    this.data.avgResponseByEndpoint[endpoint].count += 1
  }

  addRecentRequest(requestData: any): void {
    this.recentRequests.unshift(requestData)
    if (this.recentRequests.length > 50) {
      this.recentRequests = this.recentRequests.slice(0, 50)
    }
  }

  addMonitoring(data: MonitoringData): void {
    this.monitoringData.push(data)
    if (this.monitoringData.length > 2000) {
      this.monitoringData = this.monitoringData.slice(-1500)
    }
  }

  cleanup(): void {
    const twentyFourHoursAgo = moment().subtract(24, "hours").format("YYYY-MM-DD HH")

    for (const hour in this.data.requestsByHour) {
      if (hour < twentyFourHoursAgo) {
        delete this.data.requestsByHour[hour]
      }
    }

    const maxEntries = 50
    if (Object.keys(this.data.topUserAgents).length > maxEntries) {
      const sorted = Object.entries(this.data.topUserAgents)
        .sort(([, a], [, b]) => b - a)
        .slice(0, maxEntries)
      this.data.topUserAgents = Object.fromEntries(sorted)
    }

    const twentyFourHoursAgoMs = Date.now() - 24 * 60 * 60 * 1000
    const initialLength = this.monitoringData.length
    this.monitoringData = this.monitoringData.filter((data) => data.timestamp > twentyFourHoursAgoMs)
  }

  getStats(): any {
    const topEndpoints = Object.entries(this.data.endpointPopularity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, requests: count }))

    const endpointsWithErrors = Object.entries(this.data.errorsByEndpoint)
      .map(([endpoint, errors]) => {
        const total = this.data.endpointPopularity[endpoint] || 1
        const errorRate = ((errors / total) * 100).toFixed(2)
        return { endpoint, errors, total, errorRate: Number.parseFloat(errorRate) }
      })
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5)

    const slowestEndpoints = Object.entries(this.data.avgResponseByEndpoint)
      .map(([endpoint, data]) => ({
        endpoint,
        avgResponseTime: (data.total / data.count).toFixed(2),
        requests: data.count,
      }))
      .sort((a, b) => Number.parseFloat(b.avgResponseTime) - Number.parseFloat(a.avgResponseTime))
      .slice(0, 5)

    return {
      methodDistribution: this.data.methodDistribution,
      topUserAgents: this.data.topUserAgents,
      responseTimeDistribution: this.data.responseTimeDistribution,
      statusCodeDistribution: this.data.statusCodeDistribution,
      topEndpoints,
      endpointsWithErrors,
      slowestEndpoints,
      recentRequests: this.recentRequests.slice(0, 5),
    }
  }

  getMonitoringData(): MonitoringData[] {
    return this.monitoringData.slice(-100).sort((a, b) => b.timestamp - a.timestamp)
  }

  getRecentRequests(limit = 5): any[] {
    return this.recentRequests.slice(0, limit)
  }

  getMonitoringCount(): number {
    return this.monitoringData.length
  }

  getRecentCount(): number {
    return this.recentRequests.length
  }
}