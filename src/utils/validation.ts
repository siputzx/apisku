export class ValidationUtils {
  static validateInput(input: any): boolean {
    const { type, name, email, description } = input
    return !!(type && name && email && description)
  }

  static sanitizeInput(input: any): any {
    if (typeof input !== "object" || input === null) return input

    const sanitized: any = Array.isArray(input) ? [] : {}

    for (const [key, value] of Object.entries(input)) {
      const sanitizedKey = key.replace(/[.$#[\]/]/g, "_")
      sanitized[sanitizedKey] = typeof value === "string" ? value.trim().replace(/[<>]/g, "") : value
    }

    return sanitized
  }

  static async verifyTurnstileToken(token: string, secretKey: string, verifyUrl: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        secret: secretKey,
        response: token,
      })

      const response = await fetch(verifyUrl, {
        method: "POST",
        body: params,
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error("Turnstile verification error:", error)
      return false
    }
  }
}
