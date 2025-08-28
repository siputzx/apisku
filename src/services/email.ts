import nodemailer, { type Transporter } from "nodemailer"
import { config } from "../config/index"
import { Logger } from "../utils/logger"

export class EmailService {
  private transporter: Transporter
  private logger = new Logger("Email")

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    })
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const mailOptions = {
        from: '"API Siputzx" <reply.api.siputzx@gmail.com>',
        to,
        subject,
        html,
        replyTo: "reply.api.siputzx@gmail.com",
      }

      await this.transporter.sendMail(mailOptions)
      this.logger.success(`Email sent to ${to}`)
    } catch (error) {
      this.logger.error("Email send failed:", error)
      throw error
    }
  }

  generateEmailTemplate(data: any, type: string): string {
    const time = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, sans-serif; background: #fafafa; padding: 20px; line-height: 1.6; color: #333; }
        .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 24px rgba(0,0,0,0.04); }
        .header { padding: 32px; text-align: center; border-bottom: 1px solid #eee; }
        .status-badge { display: inline-flex; align-items: center; background: rgba(251, 146, 60, 0.1); color: #fb923c; padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 500; }
        .content { padding: 32px; }
        .section { margin-bottom: 32px; padding: 24px; background: #fafafa; border-radius: 12px; }
        .section-title { display: flex; align-items: center; gap: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #eee; }
        .info-label { width: 100px; font-size: 13px; color: #666; }
        .info-value { flex: 1; font-size: 13px; font-weight: 500; }
        .description { margin-top: 16px; padding: 16px; background: #fff; border-radius: 8px; font-size: 13px; }
        .footer { padding: 24px 32px; background: #fafafa; border-top: 1px solid #eee; text-align: center; }
        .timestamp { display: flex; align-items: center; justify-content: center; gap: 8px; color: #666; font-size: 13px; margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status-badge">
                <span>${{ feature: "🆕", complaint: "⚠️", feedback: "❓" }[type]}</span>
                <span>${{ feature: "Feature Request", complaint: "Issue Report", feedback: "Feedback" }[type]}</span>
            </div>
        </div>
        <div class="content">
            <div class="section">
                <div class="section-title">
                    <span>👤</span>
                    <span>User Information</span>
                </div>
                <div class="info-row">
                    <div class="info-label">Name</div>
                    <div class="info-value">${data.name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Email</div>
                    <div class="info-value">${data.email}</div>
                </div>
                ${data.whatsapp ? `<div class="info-row"><div class="info-label">WhatsApp</div><div class="info-value">${data.whatsapp}</div></div>` : ""}
            </div>
            <div class="section">
                <div class="section-title">
                    <span>📝</span>
                    <span>${type === "feedback" ? "Feedback" : type === "feature" ? "Feature Request" : "Issue Details"}</span>
                </div>
                ${data.featureName ? `<div class="info-row"><div class="info-label">Feature</div><div class="info-value">${data.featureName}</div></div>` : ""}
                <div class="description">${data.description}</div>
            </div>
        </div>
        <footer class="footer">
            <div class="timestamp">
                <span>⏰</span>
                <span>Submitted at ${time}</span>
            </div>
        </footer>
    </div>
</body>
</html>`
  }
}
