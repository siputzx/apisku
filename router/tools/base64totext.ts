import { Buffer } from "buffer";

async function scrape(base64: string) {
  try {
    const text = Buffer.from(base64, "base64").toString("utf-8");
    return { text: text };
  } catch (error: any) {
    throw new Error("Invalid Base64 string provided.");
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/base642text",
    name: "base642text",
    category: "Tools",
    description: "This API endpoint decodes a Base64 encoded string into plain text. Users can provide a Base64 string as a query parameter, and the API will return the decoded text. This is a simple utility for converting Base64 encoded data back to its original string format, useful for various data manipulation and decoding tasks.",
    tags: ["TOOLS", "ENCODING", "DECODING", "BASE64"],
    example: "?base64=SGVsbG8gV29ybGQ=",
    parameters: [
      {
        name: "base64",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 5000,
        },
        description: "The Base64 encoded string to decode",
        example: "SGVsbG8gV29ybGQ=",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { base64 } = req.query || {};

      if (!base64) {
        return {
          status: false,
          error: "Base64 parameter is required",
          code: 400,
        };
      }

      if (typeof base64 !== "string" || base64.trim().length === 0) {
        return {
          status: false,
          error: "Base64 parameter must be a non-empty string",
          code: 400,
        };
      }

      try {
        const result = await scrape(base64.trim());
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/base642text",
    name: "base642text",
    category: "Tools",
    description: "This API endpoint decodes a Base64 encoded string into plain text using a JSON request body. Users can send a Base64 string in the request body, and the API will return the decoded text. This method is suitable for programmatic interactions where Base64 data is sent as part of a structured request, offering a convenient way to convert encoded strings.",
    tags: ["TOOLS", "ENCODING", "DECODING", "BASE64"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["base64"],
            properties: {
              base64: {
                type: "string",
                description: "The Base64 encoded string to decode",
                example: "SGVsbG8gV29ybGQ=",
                minLength: 1,
                maxLength: 5000,
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
      const { base64 } = req.body || {};

      if (!base64) {
        return {
          status: false,
          error: "Base64 parameter is required",
          code: 400,
        };
      }

      if (typeof base64 !== "string" || base64.trim().length === 0) {
        return {
          status: false,
          error: "Base64 parameter must be a non-empty string",
          code: 400,
        };
      }

      try {
        const result = await scrape(base64.trim());
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
];