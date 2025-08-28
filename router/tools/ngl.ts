import axios from "axios"
declare const proxy: () => string | null

async function submitAnswer(question: string, urlString: string) {
  try {
    const parsedUrl = new URL(urlString)
    const username = parsedUrl.pathname.split("/").filter(Boolean).pop()

    if (!username) {
      throw new Error("Invalid URL: Unable to extract username.")
    }

    const postData = new URLSearchParams({
      username,
      question,
      deviceId: "",
      gameSlug: "",
      referrer: "",
    })

    const axiosConfig = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
        Referer: urlString,
      },
      timeout: 30000,
    }

    const { data } = await axios.post(
      proxy() + "https://ngl.link/api/submit",
      postData.toString(),
      axiosConfig,
    )
    return data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(
      error.response?.data?.message || error.message || "Request Failed",
    )
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/ngl",
    name: "ngl",
    category: "Tools",
    description: "This API endpoint allows you to send anonymous messages to an NGL.link profile. Users can provide the NGL.link profile URL and the message text as query parameters. The API will then interact with the NGL.link service to deliver the message anonymously. This is useful for integrations where you want to automate sending anonymous feedback or questions to NGL profiles. The response will indicate the success or failure of the message submission.",
    tags: ["TOOLS", "MESSAGING", "ANONYMOUS"],
    example: "?link=https://ngl.link/xxxx&text=hai",
    parameters: [
      {
        name: "link",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The NGL.link profile URL",
        example: "https://ngl.link/xxxx",
      },
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The anonymous message to send",
        example: "hai",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { link, text } = req.query || {}

      if (!link) {
        return {
          status: false,
          error: "Link parameter is required",
          code: 400,
        }
      }

      if (typeof link !== "string" || link.trim().length === 0) {
        return {
          status: false,
          error: "Link must be a non-empty string",
          code: 400,
        }
      }

      if (!text) {
        return {
          status: false,
          error: "Text parameter is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await submitAnswer(text.trim(), link.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
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
    endpoint: "/api/tools/ngl",
    name: "ngl",
    category: "Tools",
    description: "This API endpoint allows you to send anonymous messages to an NGL.link profile using a JSON request body. Users can provide the NGL.link profile URL and the message text. The API will then interact with the NGL.link service to deliver the message anonymously. This is ideal for programmatic access where structured data is preferred for sending anonymous feedback or questions to NGL profiles. The response will indicate the success or failure of the message submission.",
    tags: ["TOOLS", "MESSAGING", "ANONYMOUS"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["link", "text"],
            properties: {
              link: {
                type: "string",
                description: "The NGL.link profile URL (e.g., https://ngl.link/xxxx)",
                example: "https://ngl.link/xxxx",
                minLength: 1,
                maxLength: 1000,
              },
              text: {
                type: "string",
                description: "The anonymous message to send",
                example: "hai",
                minLength: 1,
                maxLength: 1000,
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
      const { link, text } = req.body || {}

      if (!link) {
        return {
          status: false,
          error: "Link parameter is required",
          code: 400,
        }
      }

      if (typeof link !== "string" || link.trim().length === 0) {
        return {
          status: false,
          error: "Link must be a non-empty string",
          code: 400,
        }
      }

      if (!text) {
        return {
          status: false,
          error: "Text parameter is required",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await submitAnswer(text.trim(), link.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
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