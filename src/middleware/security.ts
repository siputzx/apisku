import type { Context } from 'elysia'

interface SecurityConfig {
  rateLimiting: {
    windowMs: number
    maxRequests: number
    cooldownMs: number
    burstThreshold: number
    suspiciousThreshold: number
  }
}

interface EndpointRecord {
  count: number
  resetTime: number
  isBlocked: boolean
  blockedUntil: number
  totalRequests: number
  lastRequestTime: number
  burstCount: number
  cooldownStart: number
}

export class EndpointRateLimiter {
  private config: SecurityConfig
  private endpointRecords = new Map<string, EndpointRecord>()
  private cleanupInterval: Timer

  constructor(config: SecurityConfig) {
    this.config = config
    // A less frequent cleanup for non-blocked, inactive records to prevent memory leaks.
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [endpoint, record] of this.endpointRecords.entries()) {
        // Remove old, inactive records that are not blocked.
        if (!record.isBlocked && now > record.lastRequestTime + (this.config.rateLimiting.windowMs * 5)) {
          this.endpointRecords.delete(endpoint)
        }
      }
    }, 60000) // Run every minute
  }

  private shouldProtectEndpoint(endpoint: string): boolean {
    return endpoint.startsWith('/api/')
  }

  async middleware(context: Context): Promise<boolean> {
    const { request, set } = context
    const endpoint = new URL(request.url).pathname
    const now = Date.now()

    // Block direct access to sensitive files/directories
    if (endpoint.startsWith('/router/') || 
        endpoint.startsWith('/src/') ||
        endpoint.includes('.env') ||
        endpoint.startsWith('/.env') ||
        endpoint.includes('package.json') ||
        endpoint.includes('bun.lockb')) {
      set.status = 403
      set.headers["X-Security-Blocked"] = "true"
      set.headers["X-Block-Reason"] = "Direct access to sensitive files is not allowed"
      throw new Error(`Direct access to ${endpoint} is not allowed`)
    }

    if (!this.shouldProtectEndpoint(endpoint)) {
      return true
    }

    let record = this.endpointRecords.get(endpoint)

    if (!record) {
      record = {
        count: 0,
        resetTime: now + this.config.rateLimiting.windowMs,
        isBlocked: false,
        blockedUntil: 0,
        totalRequests: 0,
        lastRequestTime: now,
        burstCount: 0,
        cooldownStart: 0
      }
      this.endpointRecords.set(endpoint, record)
    }

    if (record.isBlocked && now < record.blockedUntil) {
      const remainingTime = Math.ceil((record.blockedUntil - now) / 1000)
      set.status = 503
      set.headers["Retry-After"] = remainingTime.toString()
      set.headers["X-Endpoint-Blocked"] = "true"
      set.headers["X-Block-Type"] = "endpoint-cooldown"
      throw new Error(`Endpoint ${endpoint} is in cooldown`)
    }

    if (now > record.resetTime) {
      record.count = 1
      record.burstCount = 0
      record.resetTime = now + this.config.rateLimiting.windowMs
    } else {
      record.count++

      if (now - record.lastRequestTime < 1000) {
        record.burstCount++
      } else {
        record.burstCount = Math.max(0, record.burstCount - 1)
      }
    }

    record.totalRequests++
    record.lastRequestTime = now

    const isBurstAttack = record.burstCount > this.config.rateLimiting.burstThreshold
    const isOverLimit = record.count > this.config.rateLimiting.maxRequests

    if (isOverLimit || isBurstAttack) {
      record.isBlocked = true
      record.blockedUntil = now + this.config.rateLimiting.cooldownMs

      setTimeout(() => {
        const currentRecord = this.endpointRecords.get(endpoint)
        if (currentRecord && currentRecord.isBlocked) {
          this.resetEndpoint(endpoint)
        }
      }, this.config.rateLimiting.cooldownMs)

      const blockReason = isBurstAttack ? "Burst attack detected" : "Rate limit exceeded"

      set.status = 503
      set.headers["Retry-After"] = Math.ceil(this.config.rateLimiting.cooldownMs / 1000).toString()
      set.headers["X-Endpoint-Blocked"] = "true"
      set.headers["X-Block-Reason"] = blockReason
      throw new Error(`Endpoint ${endpoint} blocked: ${blockReason}`)
    }

    set.headers["X-RateLimit-Endpoint"] = endpoint
    set.headers["X-RateLimit-Limit"] = this.config.rateLimiting.maxRequests.toString()
    set.headers["X-RateLimit-Remaining"] = Math.max(0, this.config.rateLimiting.maxRequests - record.count).toString()
    set.headers["X-RateLimit-Reset"] = Math.ceil(record.resetTime / 1000).toString()
    set.headers["X-Burst-Count"] = record.burstCount.toString()

    return true
  }

  securityHeadersMiddleware(context: any): void {
    const { set } = context
    
    set.headers["X-Content-Type-Options"] = "nosniff"
    set.headers["X-Frame-Options"] = "DENY"
    set.headers["X-XSS-Protection"] = "1; mode=block"
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    set.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    set.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    set.headers["X-Security-System"] = "Endpoint-Rate-Limiter"
  }

  getEndpointStats() {
    const stats = new Map<string, any>()
    
    for (const [endpoint, record] of this.endpointRecords) {
      stats.set(endpoint, {
        isBlocked: record.isBlocked,
        blockedUntil: record.blockedUntil,
        currentCount: record.count,
        burstCount: record.burstCount,
        maxRequests: this.config.rateLimiting.maxRequests,
        resetTime: record.resetTime,
        totalRequests: record.totalRequests,
        remaining: Math.max(0, this.config.rateLimiting.maxRequests - record.count)
      })
    }
    
    return Object.fromEntries(stats)
  }

  getSystemStats() {
    let totalBlocked = 0
    let totalActive = 0
    let totalRequests = 0
    let highBurstEndpoints = 0

    for (const record of this.endpointRecords.values()) {
      if (record.isBlocked) totalBlocked++
      if (record.count > 0) totalActive++
      if (record.burstCount > this.config.rateLimiting.burstThreshold / 2) highBurstEndpoints++
      totalRequests += record.totalRequests
    }

    return {
      totalEndpoints: this.endpointRecords.size,
      blockedEndpoints: totalBlocked,
      activeEndpoints: totalActive,
      highBurstEndpoints,
      totalRequests,
      maxRequests: this.config.rateLimiting.maxRequests,
      windowMs: this.config.rateLimiting.windowMs,
      cooldownMs: this.config.rateLimiting.cooldownMs
    }
  }

  getEndpointAnalytics(endpoint?: string) {
    if (endpoint) {
      const record = this.endpointRecords.get(endpoint)
      if (!record) return null
      
      return {
        isBlocked: record.isBlocked,
        blockedUntil: record.blockedUntil,
        currentCount: record.count,
        burstCount: record.burstCount,
        totalRequests: record.totalRequests,
        remaining: Math.max(0, this.config.rateLimiting.maxRequests - record.count),
        resetTime: record.resetTime,
        lastRequestTime: record.lastRequestTime
      }
    }
    
    return this.getEndpointStats()
  }

  unblockEndpoint(endpoint: string): boolean {
    const record = this.endpointRecords.get(endpoint)
    if (record && record.isBlocked) {
      record.isBlocked = false
      record.blockedUntil = 0
      record.count = 0
      record.burstCount = 0
      record.cooldownStart = 0
      record.resetTime = Date.now() + this.config.rateLimiting.windowMs
      return true
    }
    return false
  }

  resetEndpoint(endpoint: string): boolean {
    const record = this.endpointRecords.get(endpoint)
    if (record) {
      record.count = 0
      record.burstCount = 0
      record.isBlocked = false
      record.blockedUntil = 0
      record.cooldownStart = 0
      record.resetTime = Date.now() + this.config.rateLimiting.windowMs
      return true
    }
    return false
  }

  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval)
    this.endpointRecords.clear()
  }
}