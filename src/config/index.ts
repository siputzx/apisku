import type { SecurityConfig } from "../types/index"

export const config = {
  PORT: process.env.PORT || 3000,
  ROUTER_PATH: process.env.ROUTER_PATH || "./router",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/api",
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  TURNSTILE_VERIFY_URL: process.env.TURNSTILE_VERIFY_URL || "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number.parseInt(process.env.SMTP_PORT || "587"),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION === "true",
  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
  MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY,
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",

  DEBUG_ROUTES: process.env.DEBUG_ROUTES === "true",
  HOT_RELOAD_DELAY: Number.parseInt(process.env.HOT_RELOAD_DELAY || "200"),

  security: {
    rateLimiting: {
      windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
      maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // Increased from 15
      cooldownMs: Number.parseInt(process.env.RATE_LIMIT_COOLDOWN_MS || "60000"), // 1 minute cooldown
      burstThreshold: Number.parseInt(process.env.BURST_THRESHOLD || "10"), // Stricter burst limit
      suspiciousThreshold: Number.parseInt(process.env.SUSPICIOUS_THRESHOLD || "80"), // Lower threshold
    },
    antiSpam: {
      enabled: process.env.ANTI_SPAM_ENABLED !== "false",
      similarityThreshold: Number.parseFloat(process.env.SIMILARITY_THRESHOLD || "0.8"),
      ipReputationEnabled: process.env.IP_REPUTATION_ENABLED !== "false",
    },
    ddosProtection: {
      enabled: process.env.DDOS_PROTECTION_ENABLED !== "false",
      maxConnectionsPerIp: Number.parseInt(process.env.MAX_CONNECTIONS_PER_IP || "50"), // Reduced from 100
      blockDuration: Number.parseInt(process.env.BLOCK_DURATION || "600000"), // 10 minutes
    },
  } as SecurityConfig,
}