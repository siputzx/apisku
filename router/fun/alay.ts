async function scrape(text: string) {
  const result = text
    .replace(/[a-z]/gi, (v) =>
      Math.random() > 0.5
        ? v[["toLowerCase", "toUpperCase"][Math.floor(2 * Math.random())]]()
        : v
    )
    .replace(/[abegiors]/gi, (v) => {
      if (Math.random() > 0.5) return v
      switch (v.toLowerCase()) {
        case "a":
          return "4"
        case "b":
          return Math.random() > 0.5 ? "8" : "13"
        case "e":
          return "3"
        case "g":
          return Math.random() > 0.5 ? "6" : "9"
        case "i":
          return "1"
        case "o":
          return "0"
        case "r":
          return "12"
        case "s":
          return "5"
        default:
          return v
      }
    })
  return result
}

export default [
  {
    metode: "GET",
    endpoint: "/api/fun/alay",
    name: "alay",
    category: "Fun",
    description:
      "This API converts standard text into 'alay' (a colloquial Indonesian slang style) format. It applies random capitalization and substitutes certain letters with numbers, mimicking the unique and informal writing style often used in Indonesian online communication. This can be used for entertainment purposes, simulating a specific text aesthetic, or generating creative text variations. The API takes a single text input and returns the transformed string.",
    tags: ["Fun", "Text Transformation", "Alay"],
    example: "?text=HelloWorld",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Text to convert",
        example: "HelloWorld",
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
          error: "Text parameter must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 1000) {
        return {
          status: false,
          error: "Text parameter must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(text.trim())
        return {
          status: true,
          data: { result },
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
    endpoint: "/api/fun/alay",
    name: "alay",
    category: "Fun",
    description:
      "This API converts standard text into 'alay' (a colloquial Indonesian slang style) format. It applies random capitalization and substitutes certain letters with numbers, mimicking the unique and informal writing style often used in Indonesian online communication. This can be used for entertainment purposes, simulating a specific text aesthetic, or generating creative text variations. The API takes a single text input as a JSON body and returns the transformed string.",
    tags: ["Fun", "Text Transformation", "Alay"],
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
                description: "Text to convert",
                example: "HelloWorld",
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
          error: "Text parameter must be a non-empty string",
          code: 400,
        }
      }

      if (text.length > 1000) {
        return {
          status: false,
          error: "Text parameter must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(text.trim())
        return {
          status: true,
          data: { result },
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