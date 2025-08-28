import axios from "axios"

declare const CloudflareAi: () => string | null

const classifyImage = async (imageUrl: string, model: string) => {
  try {
    const { data } = await axios.post(
      CloudflareAi() + "/image-classification",
      {
        model: model,
        imageUrl: imageUrl,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          Referer: "https://ai.clauodflare.workers.dev/",
        },
        timeout: 30000,
      },
    )
    return data.data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to classify image from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/cf/image-classification",
    name: "image classification",
    category: "CloudflareAi",
    description: "This API endpoint performs image classification using a Cloudflare AI model. Users provide an image URL, and the API returns a classification of the image's content. This is useful for automatically tagging images, content moderation, or organizing visual data. The default model is '@cf/microsoft/resnet-50', a powerful model for general image recognition. You can also specify a custom AI model.",
    tags: ["AI", "Image Processing", "Cloudflare", "Classification"],
    example: "?imageUrl=https://cataas.com/cat&model=@cf/microsoft/resnet-50",
    parameters: [
      {
        name: "imageUrl",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2048,
        },
        description: "The URL of the image to classify",
        example: "https://cataas.com/cat",
      },
      {
        name: "model",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Custom AI model to use for classification",
        example: "@cf/microsoft/resnet-50",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { imageUrl, model } = req.query || {}

      if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter 'imageUrl' is required and must be a non-empty string",
          code: 400,
        }
      }

      if (!/^https?:\/\/\S+$/.test(imageUrl.trim())) {
        return {
          status: false,
          error: "Invalid URL format for 'imageUrl'",
          code: 400,
        }
      }

      const classificationModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/microsoft/resnet-50"

      try {
        const result = await classifyImage(imageUrl.trim(), classificationModel)

        if (!result) {
          return {
            status: false,
            error: "No classification result for the provided image",
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
    endpoint: "/api/cf/image-classification",
    name: "image classification",
    category: "CloudflareAi",
    description: "This API endpoint performs image classification using a Cloudflare AI model. It accepts an image URL and an optional custom model in a JSON request body. The API returns a classification of the image's content, which is useful for automatically tagging images, content moderation, or organizing visual data. The default model is '@cf/microsoft/resnet-50', a powerful model for general image recognition.",
    tags: ["AI", "Image Processing", "Cloudflare", "Classification"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              imageUrl: {
                type: "string",
                format: "url",
                description: "The URL of the image to classify",
                example: "https://example.com/another-image.png",
                minLength: 1,
                maxLength: 2048,
              },
              model: {
                type: "string",
                description: "Custom AI model to use for classification",
                example: "@cf/microsoft/resnet-50",
                minLength: 1,
                maxLength: 100,
              },
            },
            required: ["imageUrl"],
            additionalProperties: false,
          },
          example: {
            imageUrl: "https://example.com/some-image.jpeg",
            model: "@cf/microsoft/resnet-50",
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { imageUrl, model } = req.body || {}

      if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
        return {
          status: false,
          error: "Request body must contain 'imageUrl' and it must be a non-empty string",
          code: 400,
        }
      }

      if (!/^https?:\/\/\S+$/.test(imageUrl.trim())) {
        return {
          status: false,
          error: "Invalid URL format for 'imageUrl'",
          code: 400,
        }
      }

      const classificationModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/microsoft/resnet-50"

      try {
        const result = await classifyImage(imageUrl.trim(), classificationModel)

        if (!result) {
          return {
            status: false,
            error: "No classification result for the provided image",
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