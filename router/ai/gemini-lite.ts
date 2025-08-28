import axios from "axios"
import { Buffer } from "buffer"

class GeminiAPI {
  private baseUrl: string
  private headers: { [key: string]: string }

  constructor() {
    this.baseUrl = "https://us-central1-infinite-chain-295909.cloudfunctions.net/gemini-proxy-staging-v1"
    this.headers = {
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9",
      "content-type": "application/json",
      "priority": "u=1, i",
      "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
    }
  }

  private async getImage(imgUrl: string) {
    try {
      const response = await axios.get(imgUrl, {
        responseType: "arraybuffer",
      })
      return {
        mime_type: response.headers["content-type"] as string,
        data: Buffer.from(response.data, "binary").toString("base64"),
      }
    } catch (error: any) {
      console.error("Error fetching image:", error)
      throw new Error(error.message || "Failed to fetch image")
    }
  }

  public async chat({
    prompt,
    model = "gemini-2.0-flash-lite",
    imgUrl,
  }: {
    prompt: string,
    model?: string,
    imgUrl?: string
  }) {
    try {
      const parts = imgUrl ? [{ inline_data: await this.getImage(imgUrl) }, { text: prompt }] : [{ text: prompt }]
      const requestData = {
        model,
        contents: [{ parts }],
      }
      const response = await axios.post(this.baseUrl, requestData, {
        headers: this.headers,
      })
      return response.data.candidates[0].content
    } catch (error: any) {
      console.error("Error during chat request:", error.response?.data || error.message)
      throw new Error(error.response?.data?.error?.message || "Failed to get response from API")
    }
  }
}

const gemini = new GeminiAPI()

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/gemini-lite",
    name: "gemini lite",
    category: "AI",
    description: "An advanced AI endpoint utilizing the Gemini model to provide conversational responses. It can handle text-based prompts and can also process images by accepting an image URL. This API is designed for a wide range of use cases including Q&A, content generation, and image analysis. Users can specify a prompt and, optionally, a model and an image URL. The API will respond with a generated text based on the input. This is a versatile tool for developers needing to integrate a powerful AI chat functionality into their applications. The endpoint performs comprehensive validation on all inputs to ensure data integrity and provides clear, structured error responses for easy debugging. This API ensures reliable performance with robust error handling for a seamless user experience.",
    tags: ["AI", "Gemini", "Chat", "Text Generation", "Image Analysis"],
    example: "?prompt=Hello, who are you?&model=gemini-2.0-flash-lite",
    parameters: [
      {
        name: "prompt",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10000,
        },
        description: "User prompt for the AI",
        example: "What is the capital of France?",
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
        description: "Gemini model to use",
        example: "gemini-2.0-flash-lite",
      },
      {
        name: "imgUrl",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
          format: "uri",
        },
        description: "URL of an image to analyze",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { prompt, model, imgUrl } = req.query || {}

      if (!prompt) {
        return {
          status: false,
          error: "The 'prompt' parameter is required",
          code: 400,
        }
      }

      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return {
          status: false,
          error: "'prompt' must be a non-empty string",
          code: 400,
        }
      }

      if (model && (typeof model !== "string" || model.trim().length === 0)) {
        return {
          status: false,
          error: "'model' must be a non-empty string",
          code: 400,
        }
      }

      if (imgUrl && (typeof imgUrl !== "string" || imgUrl.trim().length === 0)) {
        return {
          status: false,
          error: "'imgUrl' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const params = {
          prompt: prompt.trim(),
          ...(model && { model: model.trim() }),
          ...(imgUrl && { imgUrl: imgUrl.trim() }),
        }
        const data = await gemini.chat(params)
        return {
          status: true,
          data,
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
    endpoint: "/api/ai/gemini-lite",
    name: "gemini lite",
    category: "AI",
    description: "An advanced AI endpoint utilizing the Gemini model to provide conversational responses. It can handle text-based prompts and can also process images by accepting an image URL. This API is designed for a wide range of use cases including Q&A, content generation, and image analysis. Users can specify a prompt and, optionally, a model and an image URL. The API will respond with a generated text based on the input. This is a versatile tool for developers needing to integrate a powerful AI chat functionality into their applications. The endpoint performs comprehensive validation on all inputs to ensure data integrity and provides clear, structured error responses for easy debugging. This API ensures reliable performance with robust error handling for a seamless user experience.",
    tags: ["AI", "Gemini", "Chat", "Text Generation", "Image Analysis"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["prompt"],
            properties: {
              prompt: {
                type: "string",
                description: "User prompt for the AI",
                example: "What is the capital of France?",
                minLength: 1,
                maxLength: 10000,
              },
              model: {
                type: "string",
                description: "Gemini model to use",
                example: "gemini-2.0-flash-lite",
                minLength: 1,
                maxLength: 100,
              },
              imgUrl: {
                type: "string",
                description: "URL of an image to analyze",
                minLength: 1,
                maxLength: 2000,
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
      const { prompt, model, imgUrl } = req.body || {}

      if (!prompt) {
        return {
          status: false,
          error: "The 'prompt' parameter is required",
          code: 400,
        }
      }

      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return {
          status: false,
          error: "'prompt' must be a non-empty string",
          code: 400,
        }
      }

      if (model && (typeof model !== "string" || model.trim().length === 0)) {
        return {
          status: false,
          error: "'model' must be a non-empty string",
          code: 400,
        }
      }

      if (imgUrl && (typeof imgUrl !== "string" || imgUrl.trim().length === 0)) {
        return {
          status: false,
          error: "'imgUrl' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const params = {
          prompt: prompt.trim(),
          ...(model && { model: model.trim() }),
          ...(imgUrl && { imgUrl: imgUrl.trim() }),
        }
        const data = await gemini.chat(params)
        return {
          status: true,
          data,
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