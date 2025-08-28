export interface ApiRoute {
  category: string
  name: string
  metode: "GET" | "POST"
  endpoint: string
  description?: string
  parameters?: any[]
  requestBody?: any
  example?: string
  isPremium?: boolean
  isMaintenance?: boolean
  isPublic?: boolean
  run: (context: RouteContext) => Promise<any>
}

export interface RouteContext {
  req: any
  res: any
  guf: any
  saveMedia: (buffer: Buffer, fileType?: string) => Promise<string>
  solveBypass: () => Promise<{
    wafSession: (url: string, proxy?: ProxyConfig) => Promise<any>
    solveTurnstileMin: (url: string, siteKey: string, proxy?: ProxyConfig) => Promise<any>
    solveTurnstileMax: (url: string, proxy?: ProxyConfig) => Promise<any>
    getSource: (url: string, proxy?: ProxyConfig) => Promise<any>
  }>
}

export interface ProxyConfig {
  host: string
  port: number
  username?: string
  password?: string
}

export interface RateLimitData {
  requests: Array<{ timestamp: number }>
  cooldownUntil: number | null
  blockUntil: number | null
  warningCount: number
}

export interface ApiStats {
  success: number
  errors: number
  totalTime: number
  requests: number
  responseTimes: Array<{ timestamp: number; duration: number }>
}

export interface SystemStats {
  requests: {
    total: number
    perSecond: number
    daily: Record<string, number>
    api: {
      total: number
      daily: Record<string, number>
    }
    error: {
      total: number
      daily: Record<string, number>
    }
  }
  system: {
    cpu: {
      usage: string
      cores: number
      loadAverage?: number[]
    }
    memory: {
      total: number
      free: number
      used: number
      usagePercent: string
    }
    disk?: {
      total: number
      used: number
      free: number
    }
    uptime: number
    platform: string
    arch: string
    hostname: string
    totalEndpoints: number
    processCount?: number
    missingModules: string[]
  }
  network: {
    download: {
      speed: string
      speedRaw: number
      total: string
      totalRaw: number
    }
    upload: {
      speed: string
      speedRaw: number
      total: string
      totalRaw: number
    }
    supported?: boolean
  }
  apiStats: Record<string, any>
  overallAvgResponseTime: string
  enhanced?: {
    requestsByCountry: Record<string, number>
    topUserAgents: Record<string, number>
    responseTimeDistribution: {
      fast: number
      medium: number
      slow: number
      verySlow: number
    }
    statusCodeDistribution: Record<string, number>
    topEndpoints: Array<{ endpoint: string; requests: number }>
    recentRequests: Array<{
      id: string
      endpoint: string
      method: string
      statusCode: number
      duration: number
      maskedIp: string
      timestamp: number
      userAgent: string
    }>
  }
}

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number
    maxRequests: number
    cooldownMs: number
    burstThreshold: number
    suspiciousThreshold: number
  }
  antiSpam: {
    enabled: boolean
    similarityThreshold: number
    ipReputationEnabled: boolean
  }
  ddosProtection: {
    enabled: boolean
    maxConnectionsPerIp: number
    blockDuration: number
  }
}

export interface MonitoringData {
  timestamp: number
  endpoint: string
  method: string
  statusCode: number
  duration: number
  ip: string
  userAgent: string
}
