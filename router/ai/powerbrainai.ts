import axios from "axios"
import qs from "qs"

async function scrape(query: string) {
  try {
    const data = qs.stringify({
      message: query,
      messageCount: "1",
    })

    const config = {
      method: "POST",
      url: "https://powerbrainai.com/chat.php",
      headers: {
        "User-Agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
        "Content-Type": "application/x-www-form-urlencoded",
        "accept-language": "id-ID",
        "referer": "https://powerbrainai.com/chat.html",
        "origin": "https://powerbrainai.com",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "priority": "u=0",
        "te": "trailers",
      },
      data: data,
      timeout: 30000,
    }

    const response = await axios.request(config)
    return response.data.response
  } catch (error: any) {
    console.error("Scraping error:", error.message)
    throw new Error("Failed to get response from PowerBrain AI.")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/powerbrainai",
    name: "powerbrainai",
    category: "AI",
    description: "This API endpoint allows users to get AI-powered responses from 'PowerBrain AI' by submitting a text query via a URL parameter. It's designed for quick integrations where AI conversational capabilities are needed, such as chatbots, virtual assistants, or quick information retrieval systems. The 'query' parameter is mandatory and should contain the text you want PowerBrain AI to process. The API will return PowerBrain AI's generated response.",
    tags: ["AI", "PowerBrain AI", "Chatbot", "Conversational AI", "Natural Language Processing"],
    example: "?query=Hello%20PowerBrain%20AI,%20how%20are%20you?",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The query to send to PowerBrain AI",
        example: "Tell me about the history of artificial intelligence.",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query } = req.query || {}

      if (!query) {
        return {
          status: false,
          error: "Parameter 'query' is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrape(query.trim())
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
    endpoint: "/api/ai/powerbrainai",
    name: "powerbrainai",
    category: "AI",
    description: "This API endpoint allows users to obtain AI-powered responses from 'PowerBrain AI' by submitting a text query within a JSON request body. It is ideal for applications requiring structured and programmatic interaction with the AI, such as integrating with backend systems, automated conversational flows, or intelligent data processing. The JSON request body must contain a 'query' field, which is the text input for PowerBrain AI to process. The API will respond with PowerBrain AI's generated output.",
    tags: ["AI", "PowerBrain AI", "Chatbot", "Conversational AI", "Natural Language Processing"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "The query to send to PowerBrain AI",
                example: "What are the benefits of renewable energy?",
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
      const { query } = req.body || {}

      if (!query) {
        return {
          status: false,
          error: "Parameter 'query' is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrape(query.trim())
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