import { Logger } from "../utils/logger"
import os from "os"
import osUtils from "os-utils"
import { exec } from "child_process"

export class SystemMonitor {
  private logger = new Logger("SysMon")
  private cache = {
    cpuUsage: 0,
    lastCpuUpdate: 0,
    cpuUpdateInterval: 2000,
    loadAverage: [0, 0, 0],
    diskUsage: { total: 0, used: 0, free: 0 },
    processCount: 0,
  }

  start(): void {
    this.updateCpuUsage()
    this.updateSystemInfo()

    setInterval(() => {
      this.updateCpuUsage()
    }, this.cache.cpuUpdateInterval)

    setInterval(() => {
      this.updateSystemInfo()
    }, 5000)
  }

  private async updateCpuUsage(): Promise<void> {
    try {
      const usage = await new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("CPU timeout")), 5000)
        osUtils.cpuUsage((usage) => {
          clearTimeout(timeout)
          resolve(usage * 100)
        })
      })

      this.cache.cpuUsage = usage
      this.cache.lastCpuUpdate = Date.now()
    } catch (error) {
      this.logger.warn("Failed to get CPU usage, using cached value")
    }
  }

  private async updateSystemInfo(): Promise<void> {
    try {
      this.cache.loadAverage = os.loadavg()

      exec("ps aux | wc -l", (error, stdout) => {
        if (!error) {
          this.cache.processCount = Number.parseInt(stdout.trim()) || 0
        }
      })

      exec("df -h / | tail -1", (error, stdout) => {
        if (!error) {
          const parts = stdout.trim().split(/\s+/)
          if (parts.length >= 4) {
            this.cache.diskUsage = {
              total: this.parseSize(parts[1]),
              used: this.parseSize(parts[2]),
              free: this.parseSize(parts[3]),
            }
          }
        }
      })
    } catch (error) {
      this.logger.debug("Failed to update system info:", error)
    }
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)(K|M|G|T)?/)
    if (!match) return 0

    const size = Number.parseFloat(match[1])
    const unit = match[2] || ""

    switch (unit) {
      case "K": return size * 1024
      case "M": return size * 1024 * 1024
      case "G": return size * 1024 * 1024 * 1024
      case "T": return size * 1024 * 1024 * 1024 * 1024
      default: return size
    }
  }

  async getStats(): Promise<any> {
    let cpuUsage = this.cache.cpuUsage
    if (Date.now() - this.cache.lastCpuUpdate > this.cache.cpuUpdateInterval * 2) {
      await this.updateCpuUsage()
      cpuUsage = this.cache.cpuUsage
    }

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsagePercent = totalMem > 0 ? ((usedMem / totalMem) * 100).toFixed(2) : "0.00"

    return {
      cpu: {
        usage: cpuUsage.toFixed(2),
        cores: os.cpus().length,
        loadAverage: this.cache.loadAverage,
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent: memUsagePercent,
        heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
      },
      disk: this.cache.diskUsage,
      uptime: Math.floor(os.uptime()),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      processCount: this.cache.processCount,
      missingModules: [],
    }
  }

  getFallback(): any {
    return {
      cpu: { usage: "0.00", cores: os.cpus().length, loadAverage: [0, 0, 0] },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: "0.00",
        heapUsed: "0.00",
        heapTotal: "0.00",
      },
      disk: { total: 0, used: 0, free: 0 },
      uptime: Math.floor(os.uptime()),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      processCount: 0,
      missingModules: [],
    }
  }

  getCache(): any {
    return this.cache
  }
}