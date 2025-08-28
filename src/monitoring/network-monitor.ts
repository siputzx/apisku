import { Logger } from "../utils/logger"
import { exec } from "child_process"
import fs from "fs"

export class NetworkMonitor {
  private logger = new Logger("NetMon")
  private stats = {
    lastBytes: { rx: 0, tx: 0 },
    currentSpeed: { download: 0, upload: 0 },
    totalBytes: { rx: 0, tx: 0 },
    lastUpdateTime: Date.now(),
    isSupported: false,
    initialized: false,
  }

  start(): void {
    this.testNetworkSupport().then((supported) => {
      this.stats.isSupported = supported
      this.stats.initialized = true

      if (supported) {
        this.logger.success("Network monitoring initialized")
        setInterval(() => this.updateNetworkStats(), 1000)
      } else {
        this.logger.warn("Network monitoring not supported on this system")
      }
    })
  }

  private async testNetworkSupport(): Promise<boolean> {
    try {
      const result = await this.getNetworkUsage()
      return result.rx >= 0 && result.tx >= 0
    } catch (error) {
      return false
    }
  }

  private async updateNetworkStats(): Promise<void> {
    if (!this.stats.isSupported) return

    try {
      const networkData = await this.getNetworkUsage()
      const currentTime = Date.now()
      const timeDiff = (currentTime - this.stats.lastUpdateTime) / 1000

      if (this.stats.lastBytes.rx > 0 && this.stats.lastBytes.tx > 0 && timeDiff > 0) {
        const rxDiff = Math.max(0, networkData.rx - this.stats.lastBytes.rx)
        const txDiff = Math.max(0, networkData.tx - this.stats.lastBytes.tx)

        this.stats.currentSpeed.download = rxDiff / timeDiff
        this.stats.currentSpeed.upload = txDiff / timeDiff
      }

      this.stats.lastBytes = { rx: networkData.rx, tx: networkData.tx }
      this.stats.totalBytes = { rx: networkData.rx, tx: networkData.tx }
      this.stats.lastUpdateTime = currentTime
    } catch (error) {
      this.stats.currentSpeed = { download: 0, upload: 0 }
    }
  }

  private async getNetworkUsage(): Promise<{ rx: number; tx: number }> {
    return new Promise((resolve, reject) => {
      if (process.platform === "linux") {
        try {
          const data = fs.readFileSync("/proc/net/dev", "utf8")
          const lines = data.split("\n")
          let totalRx = 0, totalTx = 0

          for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line && !line.includes("lo:") && line.includes(":")) {
              const parts = line.split(/\s+/)
              if (parts.length >= 10) {
                const rx = Number.parseInt(parts[1]) || 0
                const tx = Number.parseInt(parts[9]) || 0
                totalRx += rx
                totalTx += tx
              }
            }
          }

          resolve({ rx: totalRx, tx: totalTx })
          return
        } catch (error) {
          // Fall through
        }
      }

      exec(
        'find /sys/class/net -name "rx_bytes" -o -name "tx_bytes" 2>/dev/null | head -20 | xargs cat 2>/dev/null',
        { timeout: 3000 },
        (err, stdout) => {
          if (err) {
            reject(new Error("Network stats not available"))
            return
          }

          try {
            const lines = stdout.trim().split("\n").filter(line => line.trim())
            if (lines.length === 0) {
              reject(new Error("No network data"))
              return
            }

            let totalRx = 0, totalTx = 0
            const midPoint = Math.floor(lines.length / 2)

            for (let i = 0; i < midPoint; i++) {
              totalRx += Number.parseInt(lines[i]) || 0
            }

            for (let i = midPoint; i < lines.length; i++) {
              totalTx += Number.parseInt(lines[i]) || 0
            }

            resolve({ rx: totalRx, tx: totalTx })
          } catch (parseError) {
            reject(new Error("Failed to parse network data"))
          }
        }
      )
    })
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0 || isNaN(bytes)) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)
    return `${size.toFixed(2)} ${sizes[i]}`
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
    if (!this.stats.initialized) {
      return {
        download: { speed: "Initializing...", speedRaw: 0, total: "0 B", totalRaw: 0 },
        upload: { speed: "Initializing...", speedRaw: 0, total: "0 B", totalRaw: 0 },
        supported: false,
      }
    }

    if (!this.stats.isSupported) {
      return {
        download: { speed: "Not supported", speedRaw: 0, total: "N/A", totalRaw: 0 },
        upload: { speed: "Not supported", speedRaw: 0, total: "N/A", totalRaw: 0 },
        supported: false,
      }
    }

    return {
      download: {
        speed: this.formatSpeed(this.stats.currentSpeed.download),
        speedRaw: this.stats.currentSpeed.download,
        total: this.formatBytes(this.stats.totalBytes.rx),
        totalRaw: this.stats.totalBytes.rx,
      },
      upload: {
        speed: this.formatSpeed(this.stats.currentSpeed.upload),
        speedRaw: this.stats.currentSpeed.upload,
        total: this.formatBytes(this.stats.totalBytes.tx),
        totalRaw: this.stats.totalBytes.tx,
      },
      supported: true,
    }
  }

  getFallback(): any {
    return {
      download: { speed: "Error", speedRaw: 0, total: "0 B", totalRaw: 0 },
      upload: { speed: "Error", speedRaw: 0, total: "0 B", totalRaw: 0 },
    }
  }

  isSupported(): boolean {
    return this.stats.isSupported
  }
}