import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

puppeteer.use(StealthPlugin())

const VALID_MODELS = [
  "r1-1776",
  "sonar-pro",
  "sonar",
  "sonar-reasoning-pro",
  "sonar-reasoning",
]

async function askPerplexity(text: string, model: string = "r1-1776"): Promise<any> {
  if (!VALID_MODELS.includes(model)) {
    throw new Error(`Model tidak valid: ${model}. Pilihan: ${VALID_MODELS.join(", ")}`)
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()
  const client = await page.target().createCDPSession()
  await client.send("Network.enable")

  let lastMessageTime = Date.now()
  const TIMEOUT = 30000

  const timeoutChecker = setInterval(async () => {
    if (Date.now() - lastMessageTime > TIMEOUT) {
      clearInterval(timeoutChecker)
      await browser.close()
      throw new Error("Timeout: Tidak ada pesan final dalam 30 detik.")
    }
  }, 5000)

  return new Promise<any>(async (resolve, reject) => {
    client.on("Network.webSocketFrameReceived", async ({ response }) => {
      try {
        const payload = response.payloadData
        if (payload.startsWith("42")) {
          const [, jsonString] = payload.match(/^42(.+)$/) || []
          if (!jsonString) return

          const [eventName, eventData] = JSON.parse(jsonString)
          lastMessageTime = Date.now()

          if (
            typeof eventData === "object" &&
            eventData.final === true &&
            eventData.status === "completed"
          ) {
            clearInterval(timeoutChecker)
            await browser.close()
            resolve(eventData)
          }
        }
      } catch (err: any) {
        clearInterval(timeoutChecker)
        await browser.close()
        reject(err)
      }
    })

    try {
      await page.goto("https://playground.perplexity.ai/", { waitUntil: "networkidle2" })

      await page.waitForSelector("select#lamma-select")
      await page.select("select#lamma-select", model)

      await page.waitForSelector('textarea[placeholder="Ask anything…"]')
      await page.type('textarea[placeholder="Ask anything…"]', text)

      await page.waitForFunction(() => {
        const btn = document.querySelector('button[aria-label="Submit"]')
        return btn && !btn.disabled
      })

      await page.click('button[aria-label="Submit"]')
    } catch (err: any) {
      clearInterval(timeoutChecker)
      await browser.close()
      reject(err)
    }
  })
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/perplexity",
    name: "Perplexity AI",
    category: "AI",
    description: "This API endpoint provides access to Perplexity AI, allowing users to get AI-generated responses by submitting text queries via URL parameters. It supports various Perplexity models for diverse AI capabilities, from general queries to more complex reasoning tasks. The 'text' parameter is mandatory for the user's input, and an optional 'model' parameter can be used to specify the desired AI model. The API will return the AI's response.",
    tags: ["AI", "Perplexity", "Natural Language Processing", "Generative AI", "Chatbot"],
    example: "?text=apa%20itu%20AI&model=sonar",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "Text to ask the AI",
        example: "What is quantum physics?",
      },
      {
        name: "model",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["r1-1776", "sonar-pro", "sonar", "sonar-reasoning-pro", "sonar-reasoning"],
        },
        description: "The Perplexity model to use",
        example: "sonar-pro",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, model = "r1-1776" } = req.query || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter 'text' is required",
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

      if (typeof model !== "string" || (model && !VALID_MODELS.includes(model))) {
        return {
          status: false,
          error: `Invalid model: ${model}. Valid options are: ${VALID_MODELS.join(", ")}`,
          code: 400,
        }
      }

      try {
        const response = await askPerplexity(text.trim(), model)
        return {
          status: true,
          data: response,
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
    endpoint: "/api/ai/perplexity",
    name: "Perplexity AI",
    category: "AI",
    description: "This API endpoint allows users to interact with Perplexity AI by sending a text query and an optional model specification within a JSON request body. It's designed for applications requiring structured and programmatic interaction with the AI for various tasks, including answering complex questions, generating creative content, or conducting research. The JSON request body must include a 'text' field for the user's input, and an optional 'model' field can be provided to select the desired AI model. The API will return the AI's generated response.",
    tags: ["AI", "Perplexity", "Natural Language Processing", "Generative AI", "Chatbot"],
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
                description: "Text to ask the AI",
                example: "Explain the concept of black holes.",
                minLength: 1,
                maxLength: 2000,
              },
              model: {
                type: "string",
                description: "Model name (optional)",
                example: "sonar-pro",
                enum: ["r1-1776", "sonar-pro", "sonar", "sonar-reasoning-pro", "sonar-reasoning"],
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
      const { text, model = "r1-1776" } = req.body || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter 'text' is required",
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

      if (typeof model !== "string" || (model && !VALID_MODELS.includes(model))) {
        return {
          status: false,
          error: `Invalid model: ${model}. Valid options are: ${VALID_MODELS.join(", ")}`,
          code: 400,
        }
      }

      try {
        const response = await askPerplexity(text.trim(), model)
        return {
          status: true,
          data: response,
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