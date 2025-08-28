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

export interface RequestRecord {
  count: number
  timestamps: number[]
  firstRequest: number
  payload?: string
  lastPayload?: string
}

export interface EndpointStatus {
  isInCooldown: boolean
  cooldownUntil: number
  requestCount: number
  isThrottled: boolean
  throttleUntil: number
}

export interface IPStatus {
  isBlocked: boolean
  blockedUntil: number
  connections: number
  reputation: number
}
