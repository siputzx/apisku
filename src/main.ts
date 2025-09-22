import "./config/global"
import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { staticPlugin } from "@elysiajs/static"
import { DatabaseService } from "./services/database"
import { DiscordService } from "./services/discord"
import { EmailService } from "./services/email"
import { EndpointRateLimiter } from "./middleware/security"
import { AuthMiddleware } from "./middleware/auth"
import { StatsService } from "./monitoring/stats"
import { createApiRoutes } from "./routes/api"
import { createDonationRoutes } from "./routes/donation"
import { MediaUtils } from "./utils/media"
import { GetUploadFile } from "./utils/guf"
import { Logger } from "./utils/logger"
import { config } from "./config/index"
import chokidar from "chokidar"
import fs from "fs"
import path from "path"
import type { ApiRoute } from "./types/index"
import { BrowserService } from "./services/browser"
import { BypassService } from "./services/bypass"
import { BypassUtils } from "./utils/bypass"

export class ElysiaServer {
  private app: Elysia
  private databaseService: DatabaseService
  private discordService: DiscordService
  private emailService: EmailService
  private securityMiddleware: SecurityMiddleware
  private authMiddleware: AuthMiddleware
  private statsService: StatsService
  private logger = new Logger("Server")
  private routeCache = new Map<string, ApiRoute>()
  private wsConnections = new Set<any>()
  private loadedFiles = new Set<string>()
  private routeHandlers = new Map<string, Function>()
  private browserService: BrowserService
  private bypassService: BypassService

  constructor() {
    this.databaseService = new DatabaseService()
    this.discordService = new DiscordService()
    this.emailService = new EmailService()
    this.securityMiddleware = new EndpointRateLimiter(config.security)
    this.authMiddleware = new AuthMiddleware()
    this.statsService = new StatsService()
    this.browserService = new BrowserService()
    this.bypassService = new BypassService(this.browserService)
    BypassUtils.setBypassService(this.bypassService)

    this.app = new Elysia({
      serve: {
        idleTimeout: 120,
      },
    })

    this.setupMiddleware()
    this.setupStaticRoutes()
    this.setupApiRoutes()
    this.setupDynamicRouting()
    this.setupWebSocket()
    this.loadInitialRoutes()
    this.setupSecurityRoutes()
    this.setupFileWatcher()
    this.setupGracefulShutdown()
  }

private setupMiddleware(): void {
  this.app
     .use(cors({
       origin: '*', 
       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
       allowedHeaders: ['Content-Type', 'Authorization']
     }))
    .use(staticPlugin({ assets: "public", prefix: "/"}))
    .use(staticPlugin({ assets: "tmp", prefix: "/tmpfiles" }))
    const blockAccess = (path: string, message: string) => {
      this.app
        .get(path, ({ set }) => {
          set.status = 403
          return new Response(message, {
            status: 403,
            headers: { "Content-Type": "text/plain" },
          })
        })
        .post(path, ({ set }) => {
          set.status = 403
          return new Response(message, {
            status: 403,
            headers: { "Content-Type": "text/plain" },
          })
        })
    }

    // Block direct access to sensitive directories and files
    blockAccess("/router/*", "403 - Forbidden: Direct access to source code is not allowed")
    blockAccess("/src/*", "403 - Forbidden: Direct access to source code is not allowed")
    blockAccess("/*.env*", "403 - Forbidden: Access to configuration files is not allowed")
    blockAccess("/.env*", "403 - Forbidden: Access to configuration files is not allowed")
    blockAccess("/package*.json", "403 - Forbidden: Access to package files is not allowed")
    blockAccess("/bun.lockb", "403 - Forbidden: Access to package files is not allowed")
    .derive(async ({ request, set }) => {
      const start = Date.now()
      const ip = this.getClientIP(request)
      const endpoint = new URL(request.url).pathname
      const method = request.method

      this.securityMiddleware.securityHeadersMiddleware({ set } as any)

      const isApiEndpoint = endpoint.startsWith('/api/')
      
      if (isApiEndpoint) {
        try {
          const authResult = await this.authMiddleware.validateApiKey({ 
            query: Object.fromEntries(new URL(request.url).searchParams),
            request: request 
          } as any)

          if (authResult.valid) {
            console.log(`🔑 UNLIMITED ${method} ${endpoint} | ${ip}`)
          } else {
            await this.securityMiddleware.middleware(
              { request, set } as any, 
              false, 
              null
            )
          }

          const analytics = authResult.valid ? null : this.securityMiddleware.getEndpointAnalytics(endpoint)

          return {
            startTime: start,
            clientIp: ip,
            endpoint: endpoint,
            method: method,
            isApiEndpoint: true,
            analytics: analytics,
            isUnlimited: authResult.valid,
            keyData: authResult.keyData,
            authValid: authResult.valid,
            userAgent: request.headers.get("user-agent") || "Unknown"
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error
          }
          throw new Error("Security check failed")
        }
      } else {
        return {
          startTime: start,
          clientIp: ip,
          endpoint: endpoint,
          method: method,
          isApiEndpoint: false,
          userAgent: request.headers.get("user-agent") || "Unknown"
        }
      }
    })
    .onAfterHandle(({ request, set, startTime, clientIp, endpoint, method, isApiEndpoint, analytics, isUnlimited, keyData, authValid, userAgent }) => {
      const duration = Date.now() - (startTime || Date.now())
      const statusCode = set.status || 200
      const statusEmoji = this.getStatusEmoji(statusCode)
      const durationColor = this.getDurationEmoji(duration)
      
      if (isApiEndpoint) {
        if (isUnlimited) {
          console.log(`✅ ${method} ${endpoint} | ${statusCode} | ${durationColor}${duration}ms | ${clientIp} | ♾️ UNLIMITED`)
        } else {
          const rateLimitInfo = this.getRateLimitInfo(analytics, set.headers, false)
          console.log(`${statusEmoji} ${method} ${endpoint} | ${statusCode} | ${durationColor}${duration}ms | ${clientIp}${rateLimitInfo}`)
        }
        
        try {
          this.statsService.updateStats(
            endpoint, 
            method, 
            statusCode, 
            duration, 
            clientIp, 
            userAgent,
            keyData?.key || "", 
            keyData?.userId || 0
          )
        } catch (error) {
          this.logger.error("Stats update failed:", error)
        }
      }
    })
    .onError(({ error, set, request }) => {
      const endpoint = new URL(request.url).pathname
      const method = request.method
      const ip = this.getClientIP(request)
      const isApiEndpoint = endpoint.startsWith('/api/')

      if (error.code === "NOT_FOUND" && error.status === 404) {
        set.status = 404
        if (isApiEndpoint) {
          console.log(`🔒❌ ${method} ${endpoint} | 404 | ${ip}`)
        }
        return new Response("404 - Page Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        })
      }

      if (isApiEndpoint) {
        if (error.message.includes("cooldown")) {
          set.status = 503
          console.log(`🛑 ${method} ${endpoint} | ENDPOINT_COOLDOWN | ${ip}`)
          return { 
            error: "Endpoint is in cooldown", 
            retryAfter: set.headers["Retry-After"]
          }
        }

        if (error.message.includes("blocked")) {
          set.status = 503
          console.log(`🚫 ${method} ${endpoint} | ENDPOINT_BLOCKED | ${ip}`)
          return { 
            error: "Endpoint temporarily blocked", 
            retryAfter: set.headers["Retry-After"]
          }
        }

        console.log(`🔒💥 ${method} ${endpoint} | ERROR | ${ip}`)
        this.logger.error("API Request error:", error)

        set.status = 500
        return {
          status: false,
          error: "Internal server error"
        }
      }

      this.logger.error("Request error:", error)
      set.status = 500
      return {
        status: false,
        error: "Internal server error"
      }
    })
}

private getStatusEmoji(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return '✅'
  if (statusCode >= 300 && statusCode < 400) return '↩️'
  if (statusCode === 503) return '🛑'
  if (statusCode >= 400 && statusCode < 500) return '❌'
  if (statusCode >= 500) return '💥'
  return '❓'
}

private getDurationEmoji(duration: number): string {
  if (duration < 100) return '🟢'
  if (duration < 300) return '🔵'
  if (duration < 500) return '🟡'
  if (duration < 1000) return '🟠'
  return '🔴'
}

private getRateLimitInfo(analytics: any, headers: any, isUnlimited?: boolean): string {
  if (isUnlimited) {
    return " | ♾️ UNLIMITED"
  }
  
  if (!analytics) return ""
  
  const parts: string[] = []
  
  if (analytics.currentCount !== undefined) {
    parts.push(`${analytics.currentCount}/${analytics.remaining + analytics.currentCount}`)
  }
  
  if (analytics.burstCount > 0) {
    parts.push(`B:${analytics.burstCount}`)
  }
  
  if (analytics.isBlocked) {
    parts.push("BLOCKED")
  }
  
  return parts.length > 0 ? ` | ${parts.join(' ')}` : ""
}

private getClientIP(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         request.headers.get("x-real-ip") ||
         request.headers.get("cf-connecting-ip") ||
         request.headers.get("x-client-ip") ||
         "unknown"
}

private logSecurityStats(): void {
  setInterval(() => {
    const stats = this.securityMiddleware.getSystemStats()
    
    if (stats.totalEndpoints > 0) {
      const parts: string[] = []
      
      if (stats.activeEndpoints > 0) parts.push(`${stats.activeEndpoints} active`)
      if (stats.blockedEndpoints > 0) parts.push(`${stats.blockedEndpoints} blocked`)
      if (stats.highBurstEndpoints > 0) parts.push(`${stats.highBurstEndpoints} burst`)
      
      const statusIndicator = stats.blockedEndpoints > 0 ? '🛑' : 
                             stats.highBurstEndpoints > 0 ? '⚠️' : '✅'
      
      console.log(`📊 Security: ${parts.join(', ')} | ${statusIndicator} Total Endpoints: ${stats.totalEndpoints}`)
    }
  }, 60000)
}

private setupSecurityRoutes(): void {
  this.app.get("/security/stats", async ({ set }) => {
    try {
      const stats = this.securityMiddleware.getSystemStats()
      set.headers["Content-Type"] = "application/json"
      return stats
    } catch (error) {
      set.status = 500
      return { error: "Failed to fetch security stats" }
    }
  })

  this.app.get("/security/endpoints", async ({ set }) => {
    try {
      const endpoints = this.securityMiddleware.getEndpointStats()
      set.headers["Content-Type"] = "application/json"
      return endpoints
    } catch (error) {
      set.status = 500
      return { error: "Failed to fetch endpoint stats" }
    }
  })

  this.app.get("/security/endpoint/:path", async ({ params, set }) => {
    try {
      const endpoint = `/${params.path}`
      const analytics = this.securityMiddleware.getEndpointAnalytics(endpoint)
      
      if (!analytics) {
        set.status = 404
        return { error: "Endpoint not found" }
      }
      
      set.headers["Content-Type"] = "application/json"
      return analytics
    } catch (error) {
      set.status = 500
      return { error: "Failed to fetch endpoint analytics" }
    }
  })

  this.app.post("/security/unblock/:path", async ({ params, set }) => {
    try {
      const endpoint = `/${params.path}`
      const success = this.securityMiddleware.unblockEndpoint(endpoint)
      
      if (success) {
        return { success: true, message: `Endpoint ${endpoint} unblocked` }
      } else {
        set.status = 404
        return { error: "Endpoint not found or not blocked" }
      }
    } catch (error) {
      set.status = 500
      return { error: "Failed to unblock endpoint" }
    }
  })

  this.app.post("/security/reset/:path", async ({ params, set }) => {
    try {
      const endpoint = `/${params.path}`
      const success = this.securityMiddleware.resetEndpoint(endpoint)
      
      if (success) {
        return { success: true, message: `Endpoint ${endpoint} reset` }
      } else {
        set.status = 404
        return { error: "Endpoint not found" }
      }
    } catch (error) {
      set.status = 500
      return { error: "Failed to reset endpoint" }
    }
  })
}

  private setupStaticRoutes(): void {
    this.app.get("/health", () => ({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      loaded_routes: this.routeCache.size,
      loaded_files: this.loadedFiles.size,
      memory_usage: process.memoryUsage(),
      browser_stats: this.browserService.getBrowserStats(),
    }))

    const staticPages = [
      { path: "/", file: "index.html" },
      { path: "/monitor", file: "stat.html" },
      { path: "/support", file: "support.html" },
      { path: "/contributor", file: "contributor.html" },
      { path: "/donasi", file: "donasi.html" },
      { path: "/get/documentation", file: "get-docs.html" },
      { path: "/post/documentation", file: "post-docs.html" },
      { path: "/tos", file: "tos.html" },
    ]

    staticPages.forEach(({ path, file }) => {
      this.app.get(path, async ({ set }) => {
        try {
          const filePath = `./public/${file}`

          if (!fs.existsSync(filePath)) {
            set.status = 404
            return new Response("404 - Page Not Found", {
              status: 404,
              headers: { "Content-Type": "text/plain" },
            })
          }

          const content = await fs.promises.readFile(filePath, "utf-8")
          set.status = 200
          return new Response(content, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        } catch (error) {
          this.logger.error(`Error serving ${file}:`, error)
          set.status = 404
          return new Response("404 - Page Not Found", {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          })
        }
      })
    })
  }

  private setupApiRoutes(): void {
    this.app.use(createApiRoutes(this.statsService, this.emailService, this.discordService))
    this.app.use(createDonationRoutes(this.emailService, this.discordService))

    this.app.get("/api/list/:type?", ({ params }) => {
      try {
        const { type } = params
        const swaggerSpec = this.generateSwaggerSpec(type)
        return swaggerSpec
      } catch (error) {
        return { status: false, error: "Failed to generate API documentation" }
      }
    })

    this.app.get("/api/get", () => {
      try {
        const customRoutes = this.generateCustomRoutes("get")
        return customRoutes
      } catch (error) {
        return { status: false, error: "Failed to fetch GET routes" }
      }
    })

    this.app.get("/api/post", () => {
      try {
        const customRoutes = this.generateCustomRoutes("post")
        return customRoutes
      } catch (error) {
        return { status: false, error: "Failed to fetch POST routes" }
      }
    })

    this.app.get("/get", () => {
      try {
        const routes = this.organizeRoutes()
        const getRoutes = routes
          .map((category) => ({
            ...category,
            endpoints: category.endpoints.filter((endpoint) => endpoint.methods.includes("GET")),
          }))
          .filter((category) => category.endpoints.length > 0)

        return { status: true, categories: getRoutes }
      } catch (error) {
        return { status: false, error: "Failed to fetch GET routes" }
      }
    })

    this.app.get("/post", () => {
      try {
        const routes = this.organizeRoutes()
        const postRoutes = routes
          .map((category) => ({
            ...category,
            endpoints: category.endpoints.filter((endpoint) => endpoint.methods.includes("POST")),
          }))
          .filter((category) => category.endpoints.length > 0)

        return { status: true, categories: postRoutes }
      } catch (error) {
        return { status: false, error: "Failed to fetch POST routes" }
      }
    })

    this.app.get("/debug/routes", () => {
      const routesList = Array.from(this.routeCache.entries()).map(([key, route]) => ({
        key,
        endpoint: route.endpoint,
        method: route.metode,
        name: route.name,
        category: route.category,
        file: key.split(":")[0],
      }))

      const handlersList = Array.from(this.routeHandlers.keys())

      return {
        status: true,
        total_routes: this.routeCache.size,
        total_handlers: this.routeHandlers.size,
        loaded_files: Array.from(this.loadedFiles),
        routes: routesList,
        handlers: handlersList,
        stats_detail: this.statsService.getDetailedStats(),
        timestamp: new Date().toISOString(),
      }
    })
  }

  private generateCustomRoutes(method: string | null = null): any {
    const routes = Array.from(this.routeCache.values())
    const customRoutes = { routes: {} as Record<string, any> }

    routes.forEach((route) => {
      if (method && route.metode.toLowerCase() !== method) return
      if (route.isPublic === false) return

      const { endpoint, metode, name, example, category } = route
      const categoryKey = category ? category.toLowerCase() : "default"

      if (!customRoutes.routes[categoryKey]) {
        customRoutes.routes[categoryKey] = {
          endpoints: [],
        }
      }

      let parsedExample
      if (example) {
        if (metode.toUpperCase() === "GET") {
          if (typeof example === "string") {
            if (example.includes("=")) {
              parsedExample = example
            } else {
              parsedExample = `text=${example}`
            }
          } else if (typeof example === "object") {
            const queryParts = Object.entries(example).map(([key, value]) => `${key}=${value}`)
            parsedExample = queryParts.join("&")
          }
        } else {
          if (typeof example === "string") {
            if (example.includes("=")) {
              const queryObject: Record<string, string> = {}
              const queryParts = example.split("&").map((part) => part.split("="))
              queryParts.forEach(([key, value]) => {
                if (key && value) {
                  queryObject[key] = value
                }
              })
              parsedExample = queryObject
            } else if (example.trim().startsWith("{")) {
              try {
                parsedExample = JSON.parse(example)
              } catch (e) {
                parsedExample = { text: example }
              }
            } else {
              parsedExample = { text: example }
            }
          } else if (typeof example === "object") {
            parsedExample = example
          }
        }
      }

      customRoutes.routes[categoryKey].endpoints.push({
        name: name || endpoint,
        method: metode.toUpperCase(),
        path: endpoint,
        example: parsedExample,
      })
    })

    return customRoutes
  }

  private setupDynamicRouting(): void {
    this.app.get("/api/*", async (context) => {
      return await this.handleDynamicRoute(context, "GET")
    })

    this.app.post("/api/*", async (context) => {
      return await this.handleDynamicRoute(context, "POST")
    })
  }

  private async handleDynamicRoute(context: any, method: string): Promise<any> {
    const { request, set } = context
    const url = new URL(request.url)
    const endpoint = url.pathname

    const routeKey = this.findMatchingRoute(endpoint, method)

    if (!routeKey) {
      set.status = 404
      return new Response("404 - API Endpoint Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    }

    const route = this.routeCache.get(routeKey)
    if (!route) {
      set.status = 404
      return new Response("404 - Route Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      })
    }

    try {
      if (route.isPremium) {
        const authResult = await this.authMiddleware.requireApiKey({
          query: context.query,
          request,
          set,
        } as any)

        if (!authResult.valid) {
          set.status = 403
          return { error: "Invalid or missing API key" }
        }
      }

      if (route.isMaintenance) {
        set.status = 503
        return { error: "Endpoint under maintenance" }
      }

      const routeContext = {
        req: {
          query: context.query,
          body: context.body,
          headers: request.headers,
          context: context,
        },
        res: { set },
        saveMedia: MediaUtils.saveMedia,
        guf: GetUploadFile.guf,
        solveBypass: () => BypassUtils.solveBypass(routeContext),
      }

      const result = await route.run(routeContext)

      if (result && typeof result === "object" && result.code && typeof result.code === "number") {
        set.status = result.code
      } else if (result && typeof result === "object" && result.status === false) {
        set.status = 500
      }

      return result
    } catch (error: any) {
      this.logger.error(`Error in route ${route.endpoint}:`, error)
      set.status = 500
      return {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        endpoint,
        method,
      }
    }
  }

  private findMatchingRoute(endpoint: string, method: string): string | null {
    const methodLower = method.toLowerCase()

    for (const [key, route] of this.routeCache.entries()) {
      if (route.endpoint === endpoint && route.metode.toLowerCase() === methodLower) {
        return key
      }
    }

    for (const [key, route] of this.routeCache.entries()) {
      if (route.metode.toLowerCase() === methodLower) {
        const routePattern = route.endpoint.replace(/:([^/]+)/g, "([^/]+)")
        const regex = new RegExp(`^${routePattern}$`)
        if (regex.test(endpoint)) {
          return key
        }
      }
    }

    return null
  }

  private loadInitialRoutes(): void {
    if (fs.existsSync(config.ROUTER_PATH)) {
      this.loadRoutesFromDirectory(config.ROUTER_PATH)
      this.updateEndpointCount()
    } else {
      this.logger.warn(`Routes directory does not exist: ${config.ROUTER_PATH}`)
    }
  }

  private updateEndpointCount(): void {
    const uniqueEndpoints = new Set()
    for (const [, route] of this.routeCache) {
      uniqueEndpoints.add(route.endpoint)
    }
    this.statsService.updateTotalEndpoints(uniqueEndpoints.size)
  }

  private loadRoutesFromDirectory(dir: string): void {
    try {
      const files = fs.readdirSync(dir)
      files.forEach((file) => {
        const fullPath = path.join(dir, file)
        const stats = fs.statSync(fullPath)

        if (stats.isDirectory()) {
          this.loadRoutesFromDirectory(fullPath)
        } else if (stats.isFile() && (file.endsWith(".js") || file.endsWith(".ts"))) {
          this.loadRouteFile(fullPath)
        }
      })
    } catch (error) {
      this.logger.error("Failed to load routes from directory:", error)
    }
  }

  private async loadRouteFile(filePath: string): Promise<void> {
    try {
      this.removeRoutesFromFile(filePath)

      this.clearModuleCache(filePath)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const timestamp = Date.now()
      const fileUrl = `file://${path.resolve(filePath)}?t=${timestamp}&r=${Math.random()}`

      const routeModule = await import(fileUrl)
      const routes = routeModule.default || routeModule

      if (!routes) {
        this.logger.error(`❌ No routes exported from ${path.basename(filePath)}`)
        this.logger.error(`💡 Make sure to export routes as default: export default routes`)
        return
      }

      const routeArray = Array.isArray(routes) ? routes : [routes]
      let loadedCount = 0
      const errors: string[] = []

      for (let index = 0; index < routeArray.length; index++) {
        const route = routeArray[index]
        const validation = this.validateRouteWithDetails(route, filePath, index)

        if (validation.isValid) {
          const routeKey = `${filePath}:${index}:${route.metode.toLowerCase()}`
          this.routeCache.set(routeKey, route)
          loadedCount++
        } else {
          errors.push(...validation.errors)
        }
      }

      if (errors.length > 0) {
        this.logger.error(`❌ Errors in ${path.basename(filePath)}:`)
        errors.forEach((error) => this.logger.error(`   ${error}`))
      }

      if (loadedCount > 0) {
        this.loadedFiles.add(filePath)
        this.logger.success(
          `✅ Loaded ${loadedCount} route${loadedCount > 1 ? "s" : ""} from ${path.basename(filePath)}`,
        )
        this.updateEndpointCount()
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to load ${path.basename(filePath)}:`)

      if (error.message.includes("SyntaxError") || error.message.includes("Unexpected")) {
        this.logger.error(`   💡 Syntax Error: Check your JavaScript/TypeScript syntax`)
        this.logger.error(`   💡 Common issues:`)
        this.logger.error(`      - Missing semicolons or commas`)
        this.logger.error(`      - Unclosed brackets or parentheses`)
        this.logger.error(`      - Invalid JavaScript syntax in .js files`)
      } else if (error.message.includes("Cannot resolve module")) {
        this.logger.error(`   💡 Import Error: Check your import statements`)
        this.logger.error(`   💡 Make sure all imported modules exist`)
      } else if (error.message.includes("TypeError")) {
        this.logger.error(`   💡 Type Error: Check your variable types and function calls`)
      } else {
        this.logger.error(`   💡 Error: ${error.message}`)
      }

      this.logger.error(`   📁 File: ${filePath}`)
    }
  }

  private removeRoutesFromFile(filePath: string): void {
    let removedCount = 0
    const keysToRemove: string[] = []

    for (const [key, route] of this.routeCache.entries()) {
      if (key.startsWith(filePath + ":")) {
        keysToRemove.push(key)
        removedCount++
      }
    }

    keysToRemove.forEach((key) => {
      this.routeCache.delete(key)
    })

    if (removedCount > 0) {
      this.logger.debug(`🗑️ Removed ${removedCount} old routes from ${path.basename(filePath)}`)
    }

    this.loadedFiles.delete(filePath)
  }

  private clearModuleCache(filePath: string): void {
    try {
      const resolvedPath = path.resolve(filePath)
      const jsPath = resolvedPath.replace(/\.ts$/, ".js")
      const tsPath = resolvedPath.replace(/\.js$/, ".ts")

      const pathsToDelete = [resolvedPath, jsPath, tsPath]

      for (const pathToDelete of pathsToDelete) {
        delete require.cache[pathToDelete]
      }

      this.logger.debug(`🧹 Cleared module cache for: ${filePath}`)
    } catch (error) {
      this.logger.error(`Failed to clear module cache for ${filePath}:`, error)
    }
  }

  private validateRoute(route: ApiRoute, file: string): boolean {
    const requiredFields = ["category", "name", "metode", "endpoint", "run"]
    const missing = requiredFields.filter((field) => !(field in route))

    if (missing.length > 0) {
      this.logger.error(`❌ Invalid route in ${file}, missing fields: ${missing.join(", ")}`)
      return false
    }

    if (!["GET", "POST"].includes(route.metode.toUpperCase())) {
      this.logger.error(`❌ Invalid method in ${file}: ${route.metode}`)
      return false
    }

    if (typeof route.run !== "function") {
      this.logger.error(`❌ Route run method is not a function in ${file}`)
      return false
    }

    return true
  }

  private setupFileWatcher(): void {
    if (!fs.existsSync(config.ROUTER_PATH)) {
      this.logger.warn(`Routes directory does not exist: ${config.ROUTER_PATH}`)
      return
    }

    chokidar
      .watch(config.ROUTER_PATH, {
        ignored: /(^|[/\\])\../,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100,
        },
      })
      .on("add", (file) => {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          this.logger.info(`📁 New route file: ${path.basename(file)}`)
          setTimeout(() => {
            this.loadRouteFile(file).then(() => {
              this.updateEndpointCount()
            })
          }, 500)
        }
      })
      .on("change", (file) => {
        if (file.endsWith(".ts")) {
          this.logger.info(`🔄 Reloading: ${path.basename(file)}`)
          setTimeout(() => {
            this.loadRouteFile(file).then(() => {
              this.updateEndpointCount()
            })
          }, 500)
        }
      })
      .on("unlink", (file) => {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          this.logger.info(`🗑️ Removed: ${path.basename(file)}`)
          this.removeRoutesFromFile(file)
          this.updateEndpointCount()
        }
      })
      .on("error", (error) => {
        this.logger.error("File watcher error:", error)
      })

    this.logger.success("🔍 Route file watcher initialized")
    MediaUtils.setupFileExpiration()
  }

  private organizeRoutes(): any[] {
    const categories = new Map()

    for (const [key, route] of this.routeCache.entries()) {
      if (route.isPublic !== false) {
        const {
          category,
          name,
          metode,
          endpoint,
          example,
          isPremium = false,
          isMaintenance = false,
          description,
          parameters,
          requestBody,
        } = route

        if (!categories.has(category)) {
          categories.set(category, {
            title: category.charAt(0).toUpperCase() + category.slice(1),
            endpoints: new Map(),
          })
        }

        const cat = categories.get(category)
        if (!cat.endpoints.has(endpoint)) {
          cat.endpoints.set(endpoint, {
            id: cat.endpoints.size + 1,
            name,
            methods: [],
            path: endpoint,
            example,
            isPremium,
            isMaintenance,
            description,
            parameters,
            requestBody,
          })
        }

        const endpointData = cat.endpoints.get(endpoint)
        if (!endpointData.methods.includes(metode.toUpperCase())) {
          endpointData.methods.push(metode.toUpperCase())
        }
      }
    }

    return Array.from(categories.entries()).map(([category, data]) => ({
      title: data.title,
      endpoints: Array.from(data.endpoints.values()),
    }))
  }

  private generateSwaggerSpec(type?: string): any {
    const swaggerDefinition = {
      openapi: "3.0.0",
      info: {
        title: "Siputzx API",
        version: "2.0.0",
        description:
          type === "get"
            ? "Welcome to the Siputzx API, this is documentation for GET endpoints"
            : type === "post"
              ? "Welcome to the Siputzx API, this is documentation for POST endpoints"
              : "API Documentation for Siputzx",
        contact: { email: "admin@siputzx.my.id" },
        license: { name: "Apache 2.0", url: "http://www.apache.org/licenses/LICENSE-2.0.html" },
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: "apiKey", name: "api_key", in: "header" },
        },
        schemas: {},
      },
      security: [{ ApiKeyAuth: [] }],
      paths: {},
    }

    for (const [key, route] of this.routeCache.entries()) {
      if (type && route.metode.toLowerCase() !== type) continue
      
      if (route.isPublic === false) continue

      const { endpoint, metode, description, parameters, requestBody, name, example, category } = route
      const pathKey = endpoint.replace(/:([^/]+)/g, "{$1}")

      swaggerDefinition.paths[pathKey] = swaggerDefinition.paths[pathKey] || {}

      const operation = {
        summary: name || description,
        description,
        tags: [category || "default"],
        parameters: parameters || [],
        requestBody,
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "200": { description: "Successful response" },
          "400": { description: "Bad request" },
          "429": { description: "Too many requests" },
          "500": { description: "Internal server error" },
        },
      }

      swaggerDefinition.paths[pathKey][metode.toLowerCase()] = operation
    }

    return swaggerDefinition
  }

  private setupWebSocket(): void {
    this.app.ws("/ws/monitor", {
      open: (ws) => {
        this.wsConnections.add(ws)
        this.logger.info("Monitor WebSocket connected")
        this.sendStatsToClient(ws)
      },
      close: (ws) => {
        this.wsConnections.delete(ws)
        this.logger.info("Monitor WebSocket disconnected")
      },
      message: (ws, message) => {
        try {
          const data = JSON.parse(message.toString())
          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }))
          }
        } catch (error) {
        }
      },
    })

    setInterval(async () => {
      if (this.wsConnections.size > 0) {
        try {
          const stats = await this.statsService.getCurrentStats()
          const monitoringData = this.statsService.getMonitoringData()

          const payload = {
            stats,
            monitoring: monitoringData,
            timestamp: Date.now(),
          }

          const deadConnections = new Set()
          for (const ws of this.wsConnections) {
            try {
              ws.send(JSON.stringify(payload))
            } catch (error) {
              deadConnections.add(ws)
            }
          }

          for (const ws of deadConnections) {
            this.wsConnections.delete(ws)
          }
        } catch (error) {
          this.logger.error("Failed to send WebSocket stats:", error)
        }
      }
    }, 1000)
  }

  private async sendStatsToClient(ws: any): Promise<void> {
    try {
      const stats = await this.statsService.getCurrentStats()
      const monitoringData = this.statsService.getMonitoringData()

      ws.send(
        JSON.stringify({
          stats,
          monitoring: monitoringData,
          timestamp: Date.now(),
        }),
      )
    } catch (error) {
      this.logger.error("Failed to send stats to WebSocket client:", error)
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      this.logger.warn(`Shutting down server: ${signal}`)

      try {
        this.logger.info("💾 Backing up all data...")
        await this.statsService.saveStats()
        this.logger.success("✅ All data backed up successfully")

        for (const ws of this.wsConnections) {
          try {
            ws.close()
          } catch (error) {
          }
        }
        this.logger.success("WebSocket connections closed")

        await this.browserService.shutdown()
        await this.discordService.disconnect()
        await this.databaseService.disconnect()

        this.logger.success("Graceful shutdown completed")
        process.exit(0)
      } catch (error) {
        this.logger.error("Error during shutdown:", error)
        process.exit(1)
      }
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
    process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2"))

    process.on("uncaughtException", (error) => {
      this.logger.error("Uncaught exception:", error)
      gracefulShutdown("uncaughtException")
    })

    process.on("unhandledRejection", (reason, promise) => {
      this.logger.error("Unhandled rejection:", reason)
      gracefulShutdown("unhandledRejection")
    })
  }

  async start(): Promise<void> {
    try {
      await this.browserService.initialize()
      await this.databaseService.connect()

      try {
        await this.discordService.connect()
      } catch (discordError) {
        this.logger.warn("Discord bot failed to connect, but server will continue:", discordError)
      }

      this.authMiddleware.setupCacheCleanup()

      this.app.listen(config.PORT, () => {
        this.logger.success(`🚀 Server running on port ${config.PORT}`)
        this.logger.info(`📊 Monitoring: http://localhost:${config.PORT}/monitor`)
        this.logger.info(`🐛 Debug routes: http://localhost:${config.PORT}/debug/routes`)
        this.logger.info(`🔄 Hot-reload enabled for route files`)
        this.logger.info(`📁 Routes directory: ${config.ROUTER_PATH}`)
        this.logger.info(`💡 Use .ts extension for TypeScript, .js for JavaScript`)

        const discordStatus = this.discordService.getStatus()
        if (discordStatus.isReady) {
          this.logger.success("🤖 Discord bot is ready")
        } else {
          this.logger.warn("🤖 Discord bot is offline, but server is running normally")
        }
      })
    } catch (error) {
      this.logger.error("Failed to start server:", error)
      process.exit(1)
    }
  }

  private validateRouteWithDetails(route: any, file: string, index: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const requiredFields = ["category", "name", "metode", "endpoint", "run"]

    const missing = requiredFields.filter((field) => !(field in route))
    if (missing.length > 0) {
      errors.push(`Route ${index + 1}: Missing required fields: ${missing.join(", ")}`)
    }

    if (route.metode && !["GET", "POST"].includes(route.metode.toUpperCase())) {
      errors.push(`Route ${index + 1}: Invalid method "${route.metode}". Use "GET" or "POST"`)
    }

    if (route.run && typeof route.run !== "function") {
      errors.push(`Route ${index + 1}: "run" must be a function`)
    }

    if (route.endpoint && typeof route.endpoint !== "string") {
      errors.push(`Route ${index + 1}: "endpoint" must be a string`)
    } else if (route.endpoint && !route.endpoint.startsWith("/")) {
      errors.push(`Route ${index + 1}: "endpoint" must start with "/" (e.g., "/api/example")`)
    }

    if (route.category && typeof route.category !== "string") {
      errors.push(`Route ${index + 1}: "category" must be a string`)
    }

    if (route.name && typeof route.name !== "string") {
      errors.push(`Route ${index + 1}: "name" must be a string`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

const server = new ElysiaServer()
server.start().catch((error) => {
  console.error("Failed to start server:", error)
  process.exit(1)
})