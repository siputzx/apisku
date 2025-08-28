async function scrape(content: string) {
  const binary2text = (binary: string) => {
    return binary
      .split(" ")
      .map((bin) => String.fromCharCode(parseInt(bin, 2)))
      .join("");
  };
  return binary2text(content);
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/binary2text",
    name: "binary2text",
    category: "Tools",
    description: "This API endpoint converts a binary code string into human-readable text. Users can provide a space-separated binary string as a query parameter, and the API will decode it to its corresponding text representation. This utility is useful for decoding binary messages or data back into a readable format.",
    tags: ["TOOLS", "ENCODING", "DECODING", "BINARY"],
    example: "?content=01001000 01100101 01101100 01101100 01101111",
    parameters: [
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 5000,
        },
        description: "The binary string to convert to text (e.g., \"01001000 01100101\")",
        example: "01001000 01100101 01101100 01101100 01101111",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { content } = req.query || {};

      if (!content) {
        return {
          status: false,
          error: "Parameter 'content' is required.",
          code: 400,
        };
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'content' must be a non-empty string.",
          code: 400,
        };
      }

      try {
        const result = await scrape(content.trim());
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
    endpoint: "/api/tools/binary2text",
    name: "binary2text",
    category: "Tools",
    description: "This API endpoint converts a binary code string into human-readable text using a JSON request body. Users can send a space-separated binary string in the request body, and the API will decode it to its corresponding text representation. This method is suitable for programmatic interactions where binary data is sent as part of a structured request.",
    tags: ["TOOLS", "ENCODING", "DECODING", "BINARY"],
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
                description: "The binary string to convert to text (e.g., \"01001000 01100101\")",
                example: "01001000 01100101 01101100 01101100 01101111",
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
      const { content } = req.body || {};

      if (!content) {
        return {
          status: false,
          error: "Parameter 'content' is required.",
          code: 400,
        };
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'content' must be a non-empty string.",
          code: 400,
        };
      }

      try {
        const result = await scrape(content.trim());
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