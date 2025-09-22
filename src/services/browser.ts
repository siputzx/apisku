import { Logger } from "../utils/logger"
import { connect } from "puppeteer-real-browser"
import os from "os"

interface BrowserOptions {
  width?: number
  height?: number
}

interface BrowserStats {
  totalContexts: number
  activeContexts: number
  memoryUsage: number
  cpuUsage: number
  lastCleanup: number
}

export class BrowserService {
  private logger = new Logger("Browser")
  private browser: any = null
  private browserContexts = new Set<any>()
  private cleanupTimer: NodeJS.Timeout | null = null
  private isShuttingDown = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private contextLimit: number
  private cleanupInterval = 30000 // 30 seconds
  private contextTimeout = 300000 // 5 minutes
  private contextCreationTimes = new Map<any, number>()
  private stats: BrowserStats = {
    totalContexts: 0,
    activeContexts: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    lastCleanup: Date.now(),
  }

  constructor() {
    // Calculate optimal context limit based on CPU cores
    const cpuCores = os.cpus().length
    this.contextLimit = Math.max(cpuCores * 4, 16) // Minimum 16, scale with CPU
    this.logger.info(`Browser service initialized with context limit: ${this.contextLimit}`)

    this.setupGracefulShutdown()
    this.startPeriodicCleanup()
  }

  async initialize(options: BrowserOptions = {}): Promise<void> {
    if (this.isShuttingDown) return

    try {
      await this.closeBrowser()

      this.logger.info("Launching browser...")

      const defaultWidth = 1024
      const defaultHeight = 768
      const width = options.width || defaultWidth
      const height = options.height || defaultHeight

      const { browser } = await connect({
        headless: false, // Keep headless false for turnstile
        turnstile: true,
        connectOption: {
          defaultViewport: { width, height },
          timeout: 120000,
          protocolTimeout: 300000,
          args: [
            `--window-size=${width},${height}`,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--disable-extensions",
            "--disable-sync",
            "--disable-translate",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
        },
        disableXvfb: false, // Keep false for better compatibility
      })

      if (!browser) {
        throw new Error("Failed to connect to browser")
      }

      this.browser = browser
      this.reconnectAttempts = 0
      this.setupBrowserEventHandlers()
      this.wrapBrowserMethods()

      this.logger.success("Browser launched successfully")
    } catch (error: any) {
      this.logger.error("Browser initialization failed:", error)

      if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isShuttingDown) {
        this.reconnectAttempts++
        this.logger.warn(`Retrying browser initialization (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        await new Promise((resolve) => setTimeout(resolve, 5000 * this.reconnectAttempts))
        return this.initialize(options)
      }

      throw error
    }
  }

  private setupBrowserEventHandlers(): void {
    if (!this.browser) return

    this.browser.on("disconnected", async () => {
      if (this.isShuttingDown) return

      this.logger.warn("Browser disconnected, attempting to reconnect...")
      await this.handleBrowserDisconnection()
    })

    this.browser.on("targetcreated", () => {
      this.updateStats()
    })

    this.browser.on("targetdestroyed", () => {
      this.updateStats()
    })
  }

  private wrapBrowserMethods(): void {
    if (!this.browser) return

    const originalCreateContext = this.browser.createBrowserContext.bind(this.browser)

    this.browser.createBrowserContext = async (...args: any[]) => {
      // Check context limit
      if (this.browserContexts.size >= this.contextLimit) {
        await this.forceCleanupOldContexts()

        if (this.browserContexts.size >= this.contextLimit) {
          throw new Error(`Browser context limit reached (${this.contextLimit})`)
        }
      }

      const context = await originalCreateContext(...args)

      if (context) {
        this.browserContexts.add(context)
        this.contextCreationTimes.set(context, Date.now())
        this.stats.totalContexts++

        // Wrap context close method
        const originalClose = context.close.bind(context)
        context.close = async () => {
          try {
            await originalClose()
          } catch (error: any) {
            this.logger.warn("Error closing context:", error.message)
          } finally {
            this.browserContexts.delete(context)
            this.contextCreationTimes.delete(context)
            this.updateStats()
          }
        }

        // Set context timeout
        setTimeout(async () => {
          if (this.browserContexts.has(context)) {
            this.logger.debug("Force closing expired context")
            try {
              await context.close()
            } catch (error) {
              // Context might already be closed
            }
          }
        }, this.contextTimeout)
      }

      this.updateStats()
      return context
    }
  }

  private async handleBrowserDisconnection(): Promise<void> {
    try {
      // Clean up all contexts
      const cleanupPromises = Array.from(this.browserContexts).map((context) => context.close().catch(() => {}))
      await Promise.allSettled(cleanupPromises)

      this.browserContexts.clear()
      this.contextCreationTimes.clear()

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        await this.initialize()
      } else {
        this.logger.error("Max reconnection attempts reached")
      }
    } catch (error: any) {
      this.logger.error("Error handling browser disconnection:", error)
    }
  }

  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      if (this.isShuttingDown) return

      try {
        await this.performCleanup()
        this.updateStats()
      } catch (error: any) {
        this.logger.error("Periodic cleanup error:", error)
      }
    }, this.cleanupInterval)
  }

  private async performCleanup(): Promise<void> {
    const now = Date.now()
    const contextsToCleanup: any[] = []

    // Find contexts older than timeout
    for (const [context, creationTime] of this.contextCreationTimes.entries()) {
      if (now - creationTime > this.contextTimeout) {
        contextsToCleanup.push(context)
      }
    }

    // Clean up old contexts
    if (contextsToCleanup.length > 0) {
      this.logger.debug(`Cleaning up ${contextsToCleanup.length} expired contexts`)

      const cleanupPromises = contextsToCleanup.map((context) => context.close().catch(() => {}))
      await Promise.allSettled(cleanupPromises)
    }

    // Force cleanup if we're near the limit
    if (this.browserContexts.size > this.contextLimit * 0.8) {
      await this.forceCleanupOldContexts()
    }

    this.stats.lastCleanup = now
  }

  private async forceCleanupOldContexts(): Promise<void> {
    const contextsArray = Array.from(this.browserContexts)
    const sortedContexts = contextsArray.sort((a, b) => {
      const timeA = this.contextCreationTimes.get(a) || 0
      const timeB = this.contextCreationTimes.get(b) || 0
      return timeA - timeB // Oldest first
    })

    const toCleanup = sortedContexts.slice(0, Math.floor(sortedContexts.length * 0.3))

    if (toCleanup.length > 0) {
      this.logger.warn(`Force cleaning up ${toCleanup.length} contexts due to limit`)

      const cleanupPromises = toCleanup.map((context) => context.close().catch(() => {}))
      await Promise.allSettled(cleanupPromises)
    }
  }

  private updateStats(): void {
    this.stats.activeContexts = this.browserContexts.size
    this.stats.memoryUsage = process.memoryUsage().heapUsed

    // Simple CPU usage estimation
    const usage = process.cpuUsage()
    this.stats.cpuUsage = (usage.user + usage.system) / 1000000 // Convert to seconds
  }

  async createContext(options: any = {}): Promise<any> {
    if (!this.browser) {
      await this.initialize()
    }

    if (!this.browser) {
      throw new Error("Browser not available")
    }

    return await this.browser.createBrowserContext({
      ...options,
      ignoreHTTPSErrors: true,
    })
  }

  async withBrowserContext<T>(callback: (context: any) => Promise<T>): Promise<T> {
    let context: any | null = null
    try {
      context = await this.createContext()
      return await callback(context)
    } finally {
      if (context) {
        try {
          await context.close()
        } catch (error: any) {
          this.logger.warn(`Failed to close context: ${error.message}`)
        }
      }
    }
  }

  getBrowserStats(): BrowserStats {
    return { ...this.stats }
  }

  isReady(): boolean {
    return this.browser !== null && !this.isShuttingDown
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        // Close all contexts first
        const cleanupPromises = Array.from(this.browserContexts).map((context) => context.close().catch(() => {}))
        await Promise.allSettled(cleanupPromises)

        this.browserContexts.clear()
        this.contextCreationTimes.clear()

        // Close browser
        await this.browser.close()
        this.logger.info("Browser closed successfully")
      } catch (error: any) {
        this.logger.error("Error closing browser:", error)
      } finally {
        this.browser = null
      }
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      this.logger.warn(`Received ${signal}, shutting down browser service...`)
      this.isShuttingDown = true

      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer)
      }

      await this.closeBrowser()
      this.logger.success("Browser service shutdown complete")
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    await this.closeBrowser()
  }
}
