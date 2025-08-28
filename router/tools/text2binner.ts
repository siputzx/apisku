function text2binary(text: string): string {
  return text
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ")
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/text2binary",
    name: "text2binary",
    category: "Tools",
    description: "This API endpoint converts any given plain text string into its binary representation. Each character in the input text is converted into its 8-bit binary equivalent, padded with leading zeros if necessary, and separated by spaces. This tool is useful for educational purposes, understanding character encodings, or specific data manipulation tasks where binary representation is required. It provides a direct and clear conversion of textual data into a sequence of binary digits.",
    tags: ["TOOLS", "Binary", "Encoding"],
    example: "?content=Hello",
    parameters: [
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Text content",
        example: "Hello",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { content } = req.query || {}

      if (!content) {
        return {
          status: false,
          error: "Parameter 'content' is required.",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'content' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const binaryResult = text2binary(content.trim())
        return {
          status: true,
          data: binaryResult,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "An internal server error occurred.",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/text2binary",
    name: "text2binary",
    category: "Tools",
    description: "This API endpoint converts any given plain text string provided in the request body into its binary representation. Each character in the input text is converted into its 8-bit binary equivalent, padded with leading zeros if necessary, and separated by spaces. This tool is useful for educational purposes, understanding character encodings, or specific data manipulation tasks where binary representation is required. It provides a direct and clear conversion of textual data into a sequence of binary digits.",
    tags: ["TOOLS", "Binary", "Encoding"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["content"],
            properties: {
              content: {
                type: "string",
                description: "Text content",
                example: "Hello",
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
      const { content } = req.body || {}

      if (!content) {
        return {
          status: false,
          error: "Parameter 'content' is required.",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'content' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const binaryResult = text2binary(content.trim())
        return {
          status: true,
          data: binaryResult,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "An internal server error occurred.",
          code: 500,
        }
      }
    },
  },
]