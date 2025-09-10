import { Client, IntentsBitField, MessageFlags } from "discord.js"
import { config } from "../config/index"
import { Logger } from "../utils/logger"
import { ApiKey } from "../models/index"
import moment from "moment-timezone"

export class DiscordService {
  private client: Client
  private logger = new Logger("Discord")
  private isReady = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
      ],
      rest: { timeout: 15000, retries: 3 },
    })
    this.setupEvents()
    this.registerSlashCommands()
  }

  private async registerSlashCommands(): Promise<void> {
    const commands = [
      {
        name: "menu",
        description: "Show available commands",
        type: 1,
      },
      {
        name: "genkey",
        description: "Generate new API key (Admin only)",
        type: 1,
        options: [
          {
            name: "days",
            description: "Number of days (1-365)",
            type: 4,
            required: true,
            min_value: 1,
            max_value: 365,
          },
        ],
      },
      {
        name: "listkey",
        description: "List all API keys (Admin only)",
        type: 1,
      },
      {
        name: "delkey",
        description: "Delete API key (Admin only)",
        type: 1,
        options: [
          {
            name: "key",
            description: "API key to delete",
            type: 3,
            required: true,
          },
        ],
      },
      {
        name: "ping",
        description: "Check bot latency",
        type: 1,
      },
    ]

    this.client.on("clientReady", async () => {
      try {
        await this.client.application?.commands.set(commands)
        this.logger.success("Slash commands registered")
      } catch (error) {
        this.logger.error("Failed to register commands:", error)
      }
    })
    
  }

  private isAdmin(member: any): boolean {
    return (
      member?.permissions?.has("Administrator") ||
      member?.roles?.cache?.some((role: any) => role.name.toLowerCase() === "admin")
    )
  }

  private setupEvents(): void {
    this.client.on("clientReady", () => {
      this.isReady = true
      this.reconnectAttempts = 0
      this.logger.success(`Discord bot ready: ${this.client.user?.tag}`)
    })

    this.client.on("error", (error) => {
      this.logger.error("Discord error:", error)
      this.isReady = false
      setTimeout(() => {
        this.handleReconnection()
      }, 5000)
    })

    this.client.on("disconnect", () => {
      this.logger.warn("Discord bot disconnected")
      this.isReady = false
      setTimeout(() => {
        this.handleReconnection()
      }, 5000)
    })

    // Slash Command Handler
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return

      const { commandName, member } = interaction

      if (["genkey", "listkey", "delkey"].includes(commandName) && !this.isAdmin(member)) {
        await interaction.reply({ content: "❌ Admin only", flags: MessageFlags.Ephemeral })
        return
      }

      try {
        // Defer reply for commands that might take longer
        if (["genkey", "listkey", "delkey"].includes(commandName)) {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        }

        switch (commandName) {
          case "menu":
            await interaction.reply({ content: this.getMenuText(), flags: MessageFlags.Ephemeral })
            break
          case "genkey":
            await this.handleGenKey(interaction)
            break
          case "listkey":
            await this.handleListKey(interaction)
            break
          case "delkey":
            await this.handleDelKey(interaction)
            break
          case "ping":
            await this.handlePing(interaction)
            break
        }
      } catch (error) {
        this.logger.error(`Command ${commandName} error:`, error)
        const errorMsg = "❌ Command failed"
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMsg })
        } else if (!interaction.replied) {
          await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral })
        }
      }
    })

    // Message Command Handler (Legacy)
    this.client.on("messageCreate", async (message) => {
      if (message.author.bot || !message.content.startsWith("/") || message.channel.id !== config.DISCORD_CHANNEL_ID)
        return
      if (!this.isReady) {
        await message.reply("⚠️ Bot not ready, try again").catch(() => {})
        return
      }

      const args = message.content.slice(1).trim().split(/ +/)
      const command = args.shift()?.toLowerCase()

      if (["genkey", "listkey", "delkey"].includes(command!) && !this.isAdmin(message.member)) {
        return message.reply("❌ Admin only")
      }

      try {
        await message.channel.sendTyping().catch(() => {})

        switch (command) {
          case "menu":
            await message.reply(this.getMenuText())
            break
          case "genkey":
            await this.handleGenKey(message, args)
            break
          case "listkey":
            await this.handleListKey(message)
            break
          case "delkey":
            await this.handleDelKey(message, args)
            break
          case "ping":
            await this.handlePing(message)
            break
          default:
            await message.reply("❌ Unknown command. Use /menu")
        }
      } catch (error) {
        this.logger.error("Command error:", error)
        await message.reply("❌ Error occurred").catch(() => {})
      }
    })
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error("Max reconnect attempts reached, Discord bot will remain offline")
      return
    }

    this.reconnectAttempts++
    this.logger.info(`Reconnecting Discord bot... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    await new Promise((resolve) => setTimeout(resolve, 5000 * this.reconnectAttempts))

    try {
      if (this.client.isReady()) await this.client.destroy()
      await this.client.login(config.DISCORD_BOT_TOKEN)
    } catch (error) {
      this.logger.error("Discord reconnection failed:", error)
      setTimeout(() => {
        this.handleReconnection()
      }, 10000)
    }
  }

  private getMenuText(): string {
    return `**📋 Available Commands:**

**🔑 API Key Management:**
\`/genkey <days>\` - Generate new API key (1-365 days)
\`/listkey\` - List all API keys with status
\`/delkey <key>\` - Delete specific API key

**🛠️ Utility Commands:**
\`/ping\` - Check bot latency and status
\`/menu\` - Show this command list

**📝 Examples:**
\`/genkey 30\` - Create key valid for 30 days
\`/delkey SPTZX-ABC123...\` - Delete specific key

**Note:** Only administrators can use key management commands.`
  }

  private async handleGenKey(context: any, args?: string[]): Promise<void> {
    let days = 30

    // Handle slash command vs message command
    if ("options" in context) {
      days = context.options.getInteger("days") || 30
    } else if (args && args[0]) {
      days = Number.parseInt(args[0]) || 30
    }

    if (days < 1 || days > 365) {
      const reply = "❌ Days must be between 1-365"
      return this.sendResponse(context, reply)
    }

    try {
      const key = this.generateKey()
      const expires = moment().add(days, "days").toDate()

      await ApiKey.create({
        key,
        expiresAt: expires,
        totalRequests: 0,
        createdAt: new Date(),
      })

      const expiryFormatted = moment(expires).format("YYYY-MM-DD HH:mm")
      const reply = `✅ **New API Key Generated**\n\n\`${key}\`\n\n⏰ **Expires:** ${expiryFormatted} (${days} days)\n📊 **Requests:** 0/unlimited\n\n**Usage:** Add to header as \`x-api-key\` or query param \`?apikey=\``
      return this.sendResponse(context, reply)
    } catch (error) {
      this.logger.error("Key generation failed:", error)
      const reply = "❌ Failed to generate API key"
      return this.sendResponse(context, reply)
    }
  }

  private async handleListKey(context: any): Promise<void> {
    try {
      // Refresh data dari database untuk memastikan request count terbaru
      const keys = await ApiKey.find().limit(15).sort({ createdAt: -1 }).lean()
      if (!keys.length) {
        return this.sendResponse(context, "📋 No API keys found")
      }

      const keyList = await Promise.all(
        keys.map(async (k: any, i: number) => {
          // Refresh request count dari database
          const updatedKey = await ApiKey.findById(k._id).lean()
          const requestCount = updatedKey?.totalRequests || 0
          const expiryText = moment(k.expiresAt).fromNow()
          const statusIcon = moment().isAfter(moment(k.expiresAt)) ? "❌" : "✅"

          return `${i + 1}. ${statusIcon} \`${k.key.slice(0, 20)}...\`\n   📊 **${requestCount}** requests | ⏰ Expires ${expiryText}`
        }),
      )

      const reply = `📋 **API Keys (${keys.length}/15):**\n\n${keyList.join("\n\n")}`
      return this.sendResponse(context, reply)
    } catch (error) {
      this.logger.error("List keys failed:", error)
      const reply = "❌ Failed to fetch API keys"
      return this.sendResponse(context, reply)
    }
  }

  private async handleDelKey(context: any, args?: string[]): Promise<void> {
    let keyToDelete = ""

    // Handle slash command vs message command
    if ("options" in context) {
      keyToDelete = context.options.getString("key") || ""
    } else if (args && args[0]) {
      keyToDelete = args[0]
    }

    if (!keyToDelete) {
      const reply = "❌ Please specify the API key to delete\n**Usage:** `/delkey <api-key>`"
      return this.sendResponse(context, reply)
    }

    try {
      const keyData = await ApiKey.findOne({ key: keyToDelete }).lean()
      if (!keyData) {
        const reply = "❌ API key not found"
        return this.sendResponse(context, reply)
      }

      const requestCount = keyData.totalRequests || 0
      await ApiKey.findOneAndDelete({ key: keyToDelete })

      const reply = `✅ **API Key Deleted**\n\n\`${keyToDelete.slice(0, 20)}...\`\n📊 Total requests made: **${requestCount}**`
      return this.sendResponse(context, reply)
    } catch (error) {
      this.logger.error("Delete key failed:", error)
      const reply = "❌ Failed to delete API key"
      return this.sendResponse(context, reply)
    }
  }

  private async handlePing(context: any): Promise<void> {
    try {
      const start = Date.now()
      const wsPing = this.client.ws.ping

      if ("reply" in context) {
        // Message command
        const latency = Date.now() - start
        await context.reply(
          `🏓 **Pong!**\n📡 Latency: **${latency}ms**\n🌐 WebSocket: **${wsPing}ms**\n✅ Status: **${this.isReady ? "Online" : "Reconnecting"}`,
        )
      } else {
        // Slash command
        const latency = Date.now() - start
        if (context.deferred) {
          await context.editReply(
            `🏓 **Pong!**\n📡 Latency: **${latency}ms**\n🌐 WebSocket: **${wsPing}ms**\n✅ Status: **${this.isReady ? "Online" : "Reconnecting"}`,
          )
        } else {
          await context.reply({
            content: `🏓 **Pong!**\n📡 Latency: **${latency}ms**\n🌐 WebSocket: **${wsPing}ms**\n✅ Status: **${this.isReady ? "Online" : "Reconnecting"}`,
            flags: MessageFlags.Ephemeral,
          })
        }
      }
    } catch (error) {
      this.logger.error("Ping failed:", error)
      const reply = "❌ Ping failed"
      return this.sendResponse(context, reply)
    }
  }

  private async sendResponse(context: any, content: string): Promise<void> {
    try {
      if ("editReply" in context && (context.deferred || context.replied)) {
        await context.editReply({ content })
      } else if ("reply" in context) {
        // Message command
        await context.reply(content)
      } else {
        // Slash command not yet replied
        await context.reply({ content, flags: MessageFlags.Ephemeral })
      }
    } catch (error) {
      this.logger.error("Failed to send response:", error)
    }
  }

  private generateKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const random = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    return `SPTZX-${random}`
  }

  async connect(): Promise<void> {
    try {
      this.logger.info("Connecting to Discord...")
      await this.client.login(config.DISCORD_BOT_TOKEN)

      await Promise.race([
        new Promise((resolve) => {
          if (this.isReady) resolve(true)
          else this.client.once("ready", resolve)
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 30000)),
      ])

      const channel = await this.client.channels.fetch(config.DISCORD_CHANNEL_ID!)
      if (!channel?.isTextBased()) {
        throw new Error("Channel not found or not text-based")
      }

      this.logger.success("Discord bot connected successfully")
    } catch (error) {
      this.logger.error("Discord connection failed, but continuing server operation:", error)
      this.isReady = false
      // Tidak throw error agar tidak restart seluruh program
      setTimeout(() => {
        this.handleReconnection()
      }, 10000)
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.isReady = false
      await this.client.destroy()
      this.logger.info("Discord bot disconnected")
    } catch (error) {
      this.logger.error("Disconnect failed:", error)
    }
  }

  async sendMessage(message: string | { embeds: any[] }): Promise<void> {
    const maxRetries = 3
    let retries = 0

    while (retries < maxRetries) {
      try {
        const channel = await this.client.channels.fetch(config.DISCORD_CHANNEL_ID!)
        if (channel?.isTextBased()) {
          await channel.send(message)
          return
        } else {
          throw new Error("Channel not accessible")
        }
      } catch (error: any) {
        retries++
        this.logger.error(`Send message failed (attempt ${retries}):`, error)

        if (retries >= maxRetries) {
          throw error
        }
        await new Promise((resolve) => setTimeout(resolve, 2000 * retries))
      }
    }
  }

  public getStatus(): { isReady: boolean; ping: number; reconnectAttempts: number } {
    return {
      isReady: this.isReady,
      ping: this.client.ws.ping,
      reconnectAttempts: this.reconnectAttempts,
    }
  }
}
