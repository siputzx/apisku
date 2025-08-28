import axios from "axios"

async function searchSubdomains(domain: string) {
  const url = `https://crt.sh/?q=${domain}&output=json`
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = response.data
    const subdomains = data.map((entry: any) => entry.name_value)
    const uniqueSubdomains = [...new Set(subdomains)]
    uniqueSubdomains.sort()

    return uniqueSubdomains
  } catch (error: any) {
    console.error("Error fetching subdomains:", error.message)
    throw new Error("Failed to retrieve subdomains from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/subdomains",
    name: "subdomain finder",
    category: "Tools",
    description: "This API endpoint helps you discover subdomains associated with a given root domain. It queries public certificate transparency logs to identify domains that have had SSL/TLS certificates issued, often revealing active subdomains. This tool is valuable for cybersecurity researchers, penetration testers, and anyone performing reconnaissance on a domain. It provides a list of unique, sorted subdomains, aiding in understanding a domain's attack surface or infrastructure.",
    tags: ["TOOLS", "Subdomain", "Security"],
    example: "?domain=siputzx.my.id",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 3,
          maxLength: 253,
        },
        description: "Domain to search",
        example: "siputzx.my.id",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { domain } = req.query || {}

      if (!domain) {
        return {
          status: false,
          error: "Domain is required",
          code: 400,
        }
      }

      if (typeof domain !== "string" || domain.trim().length === 0) {
        return {
          status: false,
          error: "Domain must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await searchSubdomains(domain.trim())
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
    endpoint: "/api/tools/subdomains",
    name: "subdomain finder",
    category: "Tools",
    description: "This API endpoint helps you discover subdomains associated with a given root domain using a JSON request body. It queries public certificate transparency logs to identify domains that have had SSL/TLS certificates issued, often revealing active subdomains. This tool is valuable for cybersecurity researchers, penetration testers, and anyone performing reconnaissance on a domain. It provides a list of unique, sorted subdomains, aiding in understanding a domain's attack surface or infrastructure.",
    tags: ["TOOLS", "Subdomain", "Security"],
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
                description: "Domain to search",
                example: "siputzx.my.id",
                minLength: 3,
                maxLength: 253,
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
      const { domain } = req.body || {}

      if (!domain) {
        return {
          status: false,
          error: "Domain is required",
          code: 400,
        }
      }

      if (typeof domain !== "string" || domain.trim().length === 0) {
        return {
          status: false,
          error: "Domain must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await searchSubdomains(domain.trim())
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