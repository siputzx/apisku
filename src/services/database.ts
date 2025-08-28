import mongoose from "mongoose"
import { config } from "../config/index"
import { Logger } from "../utils/logger"

export class DatabaseService {
  private logger = new Logger("Database")

  async connect(): Promise<void> {
    try {
      await mongoose.connect(config.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      this.logger.success("MongoDB connected successfully")
    } catch (error) {
      this.logger.error("MongoDB connection failed:", error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close()
      this.logger.info("MongoDB disconnected")
    } catch (error) {
      this.logger.error("MongoDB disconnection failed:", error)
      throw error
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1
  }
}
