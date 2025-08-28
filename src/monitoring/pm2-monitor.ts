import { Logger } from "../utils/logger"
import pm2 from "@pm2/io"

export class PM2Monitor {
  private logger = new Logger("PM2Mon")
  private metrics = {
    httpLatency: null,
    activeRequests: null,
    networkIn: null,
    networkOut: null,
    heapUsage: null
  } as any

  constructor() {
    this.initializeMetrics()
  }

  private initializeMetrics(): void {
    if (process.isBun) {
      this.logger.warn("Running in Bun environment, PM2 metrics disabled")
      return
    }

    try {
      pm2.init({
        name: 'api-monitor',
        metrics: {
          http: true,
          network: false
        }
      })

      this.metrics = {
        httpLatency: pm2.histogram({
          name: 'HTTP Latency',
          measurement: 'mean',
          unit: 'ms'
        }),
        activeRequests: pm2.counter({
          name: 'Active Requests'
        }),
        networkIn: pm2.metric({
          name: 'Network In',
          unit: 'KB/s'
        }),
        networkOut: pm2.metric({
          name: 'Network Out',
          unit: 'KB/s'
        }),
        heapUsage: pm2.metric({
          name: 'Heap Usage',
          unit: 'MB'
        })
      }

      this.logger.debug("PM2 metrics initialized")
    } catch (error) {
      this.logger.error("Failed to initialize PM2 metrics:", error)
      this.resetMetrics()
    }
  }

  private resetMetrics(): void {
    this.metrics = {
      httpLatency: null,
      activeRequests: null,
      networkIn: null,
      networkOut: null,
      heapUsage: null
    }
  }

  start(): void {
    if (process.isBun || !this.metrics.httpLatency) return

    setInterval(() => {
      this.updateSystemMetrics()
    }, 5000)
  }

  private updateSystemMetrics(): void {
    if (process.isBun || !this.metrics.httpLatency) return

    try {
      const heapStats = process.memoryUsage()
      this.metrics.heapUsage.set(heapStats.heapUsed / 1024 / 1024)
    } catch (error) {
      this.logger.debug("Failed to update PM2 metrics:", error)
    }
  }

  updateMetrics(duration: number): void {
    if (process.isBun || !this.metrics.httpLatency) return

    try {
      this.metrics.activeRequests.inc()
      this.metrics.httpLatency.update(duration)
    } catch (error) {
      this.logger.debug("Failed to update PM2 request metrics:", error)
    }
  }

  private formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond === 0 || isNaN(bytesPerSecond)) return "0 B/s"
    const k = 1024
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"]
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
    const speed = bytesPerSecond / Math.pow(k, i)
    return `${speed.toFixed(2)} ${sizes[i]}`
  }

  getStats(): any {
    if (process.isBun || !this.metrics.httpLatency) {
      return this.getFallback()
    }

    try {
      return {
        httpLatency: this.metrics.httpLatency.val().toFixed(2),
        activeRequests: this.metrics.activeRequests.val(),
        networkIn: this.formatSpeed(this.metrics.networkIn ? this.metrics.networkIn.val() * 1024 : 0),
        networkOut: this.formatSpeed(this.metrics.networkOut ? this.metrics.networkOut.val() * 1024 : 0),
        heapUsage: this.metrics.heapUsage ? this.metrics.heapUsage.val().toFixed(2) : "0.00"
      }
    } catch (error) {
      return this.getFallback()
    }
  }

  getFallback(): any {
    return {
      httpLatency: "0.00",
      activeRequests: 0,
      networkIn: "0 B/s",
      networkOut: "0 B/s",
      heapUsage: "0.00"
    }
  }
}