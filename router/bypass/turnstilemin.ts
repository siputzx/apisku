export default [
  {
    metode: "GET",
    endpoint: "/api/solver/turnstile",
    name: "Turnstile Solver",
    category: "Solver",
    description: "This API endpoint solves Cloudflare Turnstile CAPTCHA challenges. It takes a website URL and the Turnstile site key, then returns a valid token that can be used to bypass the CAPTCHA verification. This is useful for automating processes that encounter Turnstile protection.",
    tags: ["SOLVER", "CAPTCHA", "TURNSTILE", "CLOUDFLARE"],
    example: "?url=https://spotimate.io&sitekey=0x4AAAAAAA_b5m4iQN755mZw",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Website URL where Turnstile challenge is located",
        example: "https://spotimate.io/",
      },
      {
        name: "sitekey",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Turnstile site key (usually starts with 0x4AAAAAAA)",
        example: "0x4AAAAAAA_b5m4iQN755mZw",
      },
    ],
    isPremium: true,
    isMaintenance: false,
    isPublic: false,
    async run({ req, solveBypass }) {
      const { url, sitekey } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (!sitekey) {
        return {
          status: false,
          error: "Sitekey parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      if (typeof sitekey !== "string" || sitekey.trim().length === 0) {
        return {
          status: false,
          error: "Sitekey parameter must be a non-empty string",
          code: 400,
        }
      }

      // Validasi format URL
      try {
        new URL(url.trim())
      } catch {
        return {
          status: false,
          error: "Invalid URL format",
          code: 400,
        }
      }

      try {
        const bypass = await solveBypass()
        const token = await bypass.solveTurnstileMin(url.trim(), sitekey.trim())

        if (!token) {
          return {
            status: false,
            error: "Failed to solve Turnstile challenge",
            code: 500,
          }
        }

        return {
          status: true,
          data: {
            url: url.trim(),
            sitekey: sitekey.trim(),
            token: token,
            solvedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Failed to solve Turnstile challenge",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/solver/turnstile",
    name: "Turnstile Solver",
    category: "Solver",
    description: "This API endpoint solves Cloudflare Turnstile CAPTCHA challenges. It takes a website URL and the Turnstile site key via JSON request body, then returns a valid token that can be used to bypass the CAPTCHA verification. This is useful for automating processes that encounter Turnstile protection.",
    tags: ["SOLVER", "CAPTCHA", "TURNSTILE", "CLOUDFLARE"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url", "sitekey"],
            properties: {
              url: {
                type: "string",
                description: "Website URL where Turnstile challenge is located",
                example: "https://spotimate.io/",
                minLength: 1,
                maxLength: 1000,
              },
              sitekey: {
                type: "string",
                description: "Turnstile site key (usually starts with 0x4AAAAAAA)",
                example: "0x4AAAAAAA_b5m4iQN755mZw",
                minLength: 1,
                maxLength: 100,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: true,
    isMaintenance: false,
    isPublic: false,
    async run({ req, solveBypass }) {
      const { url, sitekey } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (!sitekey) {
        return {
          status: false,
          error: "Sitekey parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      if (typeof sitekey !== "string" || sitekey.trim().length === 0) {
        return {
          status: false,
          error: "Sitekey parameter must be a non-empty string",
          code: 400,
        }
      }

      // Validasi format URL
      try {
        new URL(url.trim())
      } catch {
        return {
          status: false,
          error: "Invalid URL format",
          code: 400,
        }
      }

      try {
        const bypass = await solveBypass()
        const token = await bypass.solveTurnstileMin(url.trim(), sitekey.trim())

        if (!token) {
          return {
            status: false,
            error: "Failed to solve Turnstile challenge",
            code: 500,
          }
        }

        return {
          status: true,
          data: {
            url: url.trim(),
            sitekey: sitekey.trim(),
            token: token,
            solvedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Failed to solve Turnstile challenge",
          code: 500,
        }
      }
    },
  },
]