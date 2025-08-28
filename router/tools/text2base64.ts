import { Buffer } from "buffer"

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/text2base64",
    name: "text2base64",
    category: "Tools",
    description: "This API endpoint converts any given plain text string into its Base64 encoded representation. Base64 encoding is a common method used to represent binary data in an ASCII string format, making it suitable for transmission over mediums that only handle text. This tool is useful for developers, system administrators, and anyone needing to encode data for various purposes such as data serialization, embedding images in HTML, or transmitting data over HTTP. The conversion is straightforward and efficient.",
    tags: ["TOOLS", "Encoding", "Utility"],
    example: "?text=Hello%20World",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10000,
        },
        description: "Text to encode",
        example: "Hello World",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text } = req.query || {}

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
        const base64 = Buffer.from(text.trim()).toString("base64")
        return {
          status: true,
          data: {
            base64: base64,
          },
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
    endpoint: "/api/tools/text2base64",
    name: "text2base64",
    category: "Tools",
    description: "This API endpoint converts any given plain text string provided in the request body into its Base64 encoded representation. Base64 encoding is a common method used to represent binary data in an ASCII string format, making it suitable for transmission over mediums that only handle text. This tool is useful for developers, system administrators, and anyone needing to encode data for various purposes such as data serialization, embedding images in HTML, or transmitting data over HTTP. The conversion is straightforward and efficient.",
    tags: ["TOOLS", "Encoding", "Utility"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["text"],
            properties: {
              text: {
                type: "string",
                description: "Text to encode",
                example: "Hello World",
                minLength: 1,
                maxLength: 10000,
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
      const { text } = req.body || {}

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
        const base64 = Buffer.from(text.trim()).toString("base64")
        return {
          status: true,
          data: {
            base64: base64,
          },
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