import axios from "axios"

async function amdata(url: string) {
  try {
    const match = url.match(/\/u\/([^\/]+)\/p\/([^\/\?#]+)/)
    if (!match) throw new Error("Invalid URL format. Expected: https://alight.link/u/UID/p/PID")

    const { data } = await axios.post(
      "https://us-central1-alight-creative.cloudfunctions.net/getProjectMetadata",
      {
        data: {
          uid: match[1],
          pid: match[2],
          platform: "android",
          appBuild: 1002592,
          acctTestMode: "normal",
        },
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )

    return data.result?.info
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API for Alight Motion data")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/get/ampreset",
    name: "Detail Alight Motion Preset",
    category: "Get Data",
    description: "This API endpoint allows you to retrieve detailed metadata for an Alight Motion project. By providing a valid Alight Motion project URL, the API scrapes the necessary information, including the User ID (UID) and Project ID (PID), to fetch details such as the project's name, creator, and other relevant properties. This is useful for developers who need to integrate Alight Motion project data into their applications or services. The API expects the URL as a query parameter and returns structured JSON data containing the project's information.",
    tags: ["Alight Motion", "Metadata", "Preset", "Project", "Get Data"],
    example: "?url=https://alight.link/u/123456/p/abcdef",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 200,
          pattern: "^https:\\/\\/alight\\.link\\/u\\/[^\\/]+\\/p\\/[^\\/\\?#]+$",
        },
        description: "Alight Motion project URL (e.g., https://alight.link/u/UID/p/PID)",
        example: "https://alight.link/u/123456/p/abcdef",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (!/^https:\/\/alight\.link\/u\/[^\/]+\/p\/[^\/\?#]+$/.test(url.trim())) {
        return {
          status: false,
          error: "Invalid URL format. Expected: https://alight.link/u/UID/p/PID",
          code: 400,
        }
      }

      try {
        const result = await amdata(url.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from Alight Motion API",
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
    endpoint: "/api/get/ampreset",
    name: "Detail Alight Motion Preset",
    category: "Get Data",
    description: "This API endpoint allows you to retrieve detailed metadata for an Alight Motion project using a POST request. By providing a valid Alight Motion project URL in the request body, the API processes the URL to extract the User ID (UID) and Project ID (PID). It then fetches relevant details about the project, such as its name, description, and creator. This method is ideal for applications that prefer sending data in the request body for more complex or secure interactions. The API returns structured JSON data containing the project's information.",
    tags: ["Alight Motion", "Metadata", "Preset", "Project", "Get Data"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                description: "Alight Motion project URL (e.g., https://alight.link/u/UID/p/PID)",
                example: "https://alight.link/u/123456/p/abcdef",
                minLength: 1,
                maxLength: 200,
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
      const { url } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (!/^https:\/\/alight\.link\/u\/[^\/]+\/p\/[^\/\?#]+$/.test(url.trim())) {
        return {
          status: false,
          error: "Invalid URL format. Expected: https://alight.link/u/UID/p/PID",
          code: 400,
        }
      }

      try {
        const result = await amdata(url.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from Alight Motion API",
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