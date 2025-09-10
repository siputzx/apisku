import { Elysia } from "elysia"
import { Donation } from "../models/index"
import { ValidationUtils } from "../utils/validation"
import type { EmailService } from "../services/email"
import type { DiscordService } from "../services/discord"
import { config } from "../config/index"
import Midtrans from "midtrans-client"

export function createDonationRoutes(emailService: EmailService, discordService: DiscordService) {
  const snap = new Midtrans.Snap({
    isProduction: config.MIDTRANS_IS_PRODUCTION,
    serverKey: config.MIDTRANS_SERVER_KEY!,
    clientKey: config.MIDTRANS_CLIENT_KEY!,
  })

  return new Elysia({ prefix: "/api/donasi" })
    .post("/", async ({ body }) => {
      const { name, email, amount, comment, turnstileToken } = body as any
      const orderId = `DONASI-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

      if (!name || !email || !amount || !turnstileToken) {
        return {
          error: "Nama, email, jumlah donasi, dan token keamanan diperlukan",
        }
      }

      if (amount < 1000) {
        return {
          error: "Minimal donasi adalah Rp1.000",
        }
      }

      const isValidToken = await ValidationUtils.verifyTurnstileToken(
        turnstileToken,
        config.TURNSTILE_SECRET_KEY!,
        config.TURNSTILE_VERIFY_URL,
      )

      if (!isValidToken) {
        return {
          error: "Verifikasi keamanan gagal",
        }
      }

      const parameter = {
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: { first_name: name, email },
        item_details: [
          {
            id: "DONASI",
            price: amount,
            quantity: 1,
            name: "Donasi untuk Siputzx API",
          },
        ],
        expiry: { duration: 24, unit: "hours" },
        custom_field1: comment || "Tidak ada komentar",
      }

      try {
        const transaction = await snap.createTransaction(parameter)

        await Donation.create({
          orderId,
          name,
          email,
          amount: Number(amount),
          comment: comment || "Tidak ada komentar",
          status: "pending",
        })

        return {
          status: true,
          token: transaction.token,
          orderId,
        }
      } catch (error: any) {
        // Log the actual error for debugging but don't expose it to the client
        console.error("Midtrans transaction error:", error)
        
        // Return a generic error message to prevent exposing sensitive information
        return {
          status: false,
          error: "Gagal membuat transaksi donasi. Silakan coba lagi nanti.",
        }
      }
    })

    .post("/notify", async ({ body }) => {
      const { order_id, transaction_status, gross_amount } = body as any
      const status =
        transaction_status === "capture" || transaction_status === "settlement"
          ? "success"
          : transaction_status === "pending"
            ? "pending"
            : "failed"

      try {
        const donationData = await Donation.findOne({ orderId: order_id })
        if (!donationData) {
          return new Response("Not found", { status: 404 })
        }

        const { name, email, comment } = donationData

        await Donation.updateOne(
          { orderId: order_id },
          {
            status,
            updatedAt: new Date(),
          },
        )

        // Send email notification
        const emailHtml = generateDonationEmailTemplate(name, order_id, gross_amount, comment, status)
        await emailService.sendEmail(email, `Status Donasi Anda - ${status.toUpperCase()}`, emailHtml)

        // Send Discord notification for successful donations
        if (status === "success") {
          const discordMessage = `**💰 Donasi Baru!**\n\n**👤 Dari:** ${name}\n**💸 Jumlah:** Rp ${Number(gross_amount).toLocaleString("id-ID")}\n**💬 Komentar:** ${comment}\n**🕒 Waktu:** ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`
          await discordService.sendMessage(discordMessage)
        }

        return new Response("OK", { status: 200 })
      } catch (error: any) {
        // Log the actual error for debugging but don't expose it to the client
        console.error("Donation notification error:", error)
        
        return new Response("Internal Server Error", { status: 500 })
      }
    })

    .get("/list", async () => {
      try {
        const donations = await Donation.find()
        return {
          status: true,
          donations,
        }
      } catch (error: any) {
        // Log the actual error for debugging but don't expose it to the client
        console.error("Donation list error:", error)
        
        return {
          status: false,
          error: "Gagal mengambil daftar donasi. Silakan coba lagi nanti.",
        }
      }
    })
}

function generateDonationEmailTemplate(
  name: string,
  orderId: string,
  amount: number,
  comment: string,
  status: string,
): string {
  const statusColor = status === "success" ? "#22c55e" : status === "pending" ? "#facc15" : "#ef4444"
  const statusMessage =
    status === "success"
      ? "Terima kasih atas donasi Anda! Dukungan Anda sangat berarti bagi kami."
      : status === "pending"
        ? "Pembayaran sedang diproses. Harap selesaikan dalam 24 jam."
        : "Pembayaran gagal. Silakan coba lagi."

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 10px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6; text-align: center;">Status Donasi</h2>
      <p style="color: #6b7280;">Order ID: <strong>${orderId}</strong></p>
      <p style="color: #6b7280;">Nama: <strong>${name}</strong></p>
      <p style="color: #6b7280;">Jumlah: <strong>Rp ${Number(amount).toLocaleString("id-ID")}</strong></p>
      <p style="color: #6b7280;">Komentar: <strong>${comment}</strong></p>
      <p style="color: #6b7280;">Status: <span style="color: ${statusColor}">${status.toUpperCase()}</span></p>
      <p style="color: #6b7280;">${statusMessage}</p>
      <hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        Support: <a href="mailto:support@siputzx.com" style="color: #3b82f6;">support@siputzx.com</a>
      </p>
    </div>
  `
}
