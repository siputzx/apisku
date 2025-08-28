import mongoose from "mongoose"

const apiKeySchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,  // This already creates an index
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  totalRequests: { type: Number, default: 0 },
})

// Add index only for expiresAt (key is already indexed by the unique constraint)
apiKeySchema.index({ expiresAt: 1 })

const statsSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  daily: { type: Object, default: {} },
  apiRequests: {
    total: { type: Number, default: 0 },
    daily: { type: Object, default: {} },
  },
  lastUpdate: { type: Date, default: Date.now },
})

const donationSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  comment: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "success", "failed"], 
    default: "pending" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
})

const monitoringDataSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  endpoint: { type: String, required: true, maxlength: 200 },
  method: { type: String, required: true, maxlength: 10 },
  statusCode: { type: Number, required: true },
  duration: { type: Number, required: true },
  ip: { type: String, required: true, maxlength: 45 },
  userAgent: { type: String, required: true, maxlength: 200 },
  createdAt: { type: Date, default: Date.now },
})

// Add indexes for better query performance
monitoringDataSchema.index({ createdAt: -1 })
monitoringDataSchema.index({ endpoint: 1, createdAt: -1 })
monitoringDataSchema.index({ timestamp: -1 })

export const ApiKey = mongoose.model("ApiKey", apiKeySchema)
export const Stats = mongoose.model("Stats", statsSchema)
export const Donation = mongoose.model("Donation", donationSchema)
export const MonitoringData = mongoose.model("MonitoringData", monitoringDataSchema)