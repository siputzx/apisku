import axios from "axios"

async function scrape(domain: string, dnsServer: string) {
  try {
    const response = await axios.post(
      "https://www.nslookup.io/api/v1/records",
      {
        domain: domain,
        dnsServer: dnsServer,
      },
      {
        headers: {
          "accept": "application/json, text/plain, */*",
          "content-type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 30000,
      },
    )
    return response.data.result || response.data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/dns",
    name: "dns",
    category: "Tools",
    description: "This API endpoint allows you to retrieve DNS records for a specified domain. You can optionally choose a specific DNS server to perform the lookup. This is useful for debugging DNS issues, verifying domain ownership, or simply gathering information about a domain's DNS configuration. The API provides a structured response containing various types of DNS records such as A, AAAA, MX, NS, CNAME, TXT, and more, depending on what is configured for the domain. If no DNS server is specified, it defaults to Cloudflare's DNS.",
    tags: ["Tools", "Network", "DNS"],
    example: "?domain=google.com&dnsServer=cloudflare",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "Domain name",
        example: "google.com",
      },
      {
        name: "dnsServer",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          default: "cloudflare",
        },
        description: "DNS server",
        example: "cloudflare",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { domain, dnsServer } = req.query || {}

      if (!domain) {
        return {
          status: false,
          error: "Parameter 'domain' is required",
          code: 400,
        }
      }

      if (typeof domain !== "string" || domain.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'domain' must be a non-empty string",
          code: 400,
        }
      }

      if (dnsServer && typeof dnsServer !== "string") {
        return {
          status: false,
          error: "Parameter 'dnsServer' must be a string",
          code: 400,
        }
      }

      try {
        const result = await scrape(domain.trim(), (dnsServer as string || "cloudflare").trim())

        if (!result) {
          return {
            status: false,
            error: "No DNS records found for the specified domain",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/dns",
    name: "dns",
    category: "Tools",
    description: "This API endpoint allows you to retrieve DNS records for a specified domain using a JSON request body. You can optionally choose a specific DNS server to perform the lookup. This is useful for debugging DNS issues, verifying domain ownership, or simply gathering information about a domain's DNS configuration. The API provides a structured response containing various types of DNS records such as A, AAAA, MX, NS, CNAME, TXT, and more, depending on what is configured for the domain. If no DNS server is specified, it defaults to Cloudflare's DNS.",
    tags: ["Tools", "Network", "DNS"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["domain"],
            properties: {
              domain: {
                type: "string",
                description: "The domain to lookup DNS records for",
                example: "google.com",
                minLength: 1,
                maxLength: 255,
              },
              dnsServer: {
                type: "string",
                description: "The DNS server to use for the lookup (e.g., cloudflare, google)",
                example: "cloudflare",
                default: "cloudflare",
                minLength: 1,
                maxLength: 100,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { domain, dnsServer } = req.body || {}

      if (!domain) {
        return {
          status: false,
          error: "Parameter 'domain' is required",
          code: 400,
        }
      }

      if (typeof domain !== "string" || domain.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'domain' must be a non-empty string",
          code: 400,
        }
      }

      if (dnsServer && typeof dnsServer !== "string") {
        return {
          status: false,
          error: "Parameter 'dnsServer' must be a string",
          code: 400,
        }
      }

      try {
        const result = await scrape(domain.trim(), (dnsServer as string || "cloudflare").trim())

        if (!result) {
          return {
            status: false,
            error: "No DNS records found for the specified domain",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]