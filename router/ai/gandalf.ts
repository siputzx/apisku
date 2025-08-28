import axios from "axios"
import FormData from "form-data"

async function scrapeGandalf(prompt: string) {
  const form = new FormData()
  form.append("defender", "baseline")
  form.append("prompt", prompt)

  const headers = {
    ...form.getHeaders(),
    authority: "gandalf.lakera.ai",
    accept: "application/json",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    origin: "https://gandalf.lakera.ai",
    referer: "https://gandalf.lakera.ai/baseline",
    "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  }

  try {
    const response = await axios.post(
      "https://gandalf.lakera.ai/api/send-message",
      form,
      {
        headers,
      },
    )
    return response.data.answer
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/gandalf",
    name: "gandalf lakera",
    category: "AI",
    description: "This API endpoint provides access to the Gandalf Lakera AI, allowing users to submit a prompt via query parameters and receive an AI-generated response. Gandalf Lakera is designed to demonstrate and test the robustness of large language models against various adversarial prompts, focusing on security and alignment. This endpoint can be used to experiment with prompt engineering or to integrate a secure AI response mechanism into applications. The output is the AI's answer to the given prompt.",
    tags: ["AI", "Gandalf", "Lakera", "Prompt Engineering", "Security AI"],
    example: "?prompt=What is the capital of France?",
    parameters: [
      {
        name: "prompt",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The prompt to send to Gandalf Lakera",
        example: "Tell me a joke.",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { prompt } = req.query || {}

      if (!prompt) {
        return {
          status: false,
          error: "Parameter \"prompt\" is required.",
          code: 400,
        }
      }

      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return {
          status: false,
          error: "Prompt must be a non-empty string",
          code: 400,
        }
      }

      if (prompt.length > 1000) {
        return {
          status: false,
          error: "Prompt must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const answer = await scrapeGandalf(prompt.trim())
        return { status: true, data: answer, timestamp: new Date().toISOString() }
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
    endpoint: "/api/ai/gandalf",
    name: "gandalf lakera",
    category: "AI",
    description: "This API endpoint provides access to the Gandalf Lakera AI, allowing users to submit a prompt via a JSON request body and receive an AI-generated response. Gandalf Lakera is designed to test the robustness and security of large language models against various prompts. This endpoint is suitable for integrating a secure AI interaction mechanism into applications, enabling developers to experiment with prompt engineering and analyze the AI's responses in a controlled environment. The output is the AI's answer to the provided prompt.",
    tags: ["AI", "Gandalf", "Lakera", "Prompt Engineering", "Security AI"],
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
                description: "The prompt to send to Gandalf Lakera",
                example: "What is the capital of Japan?",
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
      const { prompt } = req.body || {}

      if (!prompt) {
        return {
          status: false,
          error: "Parameter \"prompt\" is required.",
          code: 400,
        }
      }

      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return {
          status: false,
          error: "Prompt must be a non-empty string",
          code: 400,
        }
      }

      if (prompt.length > 1000) {
        return {
          status: false,
          error: "Prompt must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const answer = await scrapeGandalf(prompt.trim())
        return { status: true, data: answer, timestamp: new Date().toISOString() }
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