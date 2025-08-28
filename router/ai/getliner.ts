import { chromium } from "playwright"

interface LinerAIResponse {
  agentMessageId: string | null
  traceId: string | null
  userMessageId: string | null
  modelType: string | null
  statusCode: number | null
  isScholarlyQuery: boolean
  references: any[]
  referenceChunks: any[]
  answer: string
  followUpQuestions: any[]
  highlightPhrases: any[]
}

function parseSSEData(sseData: string): LinerAIResponse {
  const result: LinerAIResponse = {
    agentMessageId: null,
    traceId: null,
    userMessageId: null,
    modelType: null,
    statusCode: null,
    isScholarlyQuery: false,
    references: [],
    referenceChunks: [],
    answer: "",
    followUpQuestions: [],
    highlightPhrases: [],
  }

  const events = sseData.split("event:").map((event) => event.trim()).filter((event) => event)

  for (const event of events) {
    const [eventType, data] = event.split("\ndata:")
    if (!data) continue

    try {
      const parsedData = JSON.parse(data.trim())

      if (eventType.includes("data")) {
        if (parsedData.agentMessageId) result.agentMessageId = parsedData.agentMessageId
        if (parsedData.traceId) result.traceId = parsedData.traceId
        if (parsedData.userMessageId) {
          result.userMessageId = parsedData.userMessageId
          result.modelType = parsedData.modelType
          result.statusCode = parsedData.statusCode
          result.isScholarlyQuery = parsedData.isScholarlyQuery
        }
        if (parsedData.references) result.references = parsedData.references
        if (parsedData.referenceChunks) result.referenceChunks = parsedData.referenceChunks
        if (parsedData.answer) result.answer += parsedData.answer
        if (parsedData.followUpQuestion) {
          if (parsedData.followUpQuestion.status === "complete") {
            result.followUpQuestions = parsedData.followUpQuestion.queries
          }
        }
        if (parsedData.highlightPhrases) result.highlightPhrases = parsedData.highlightPhrases
      } else if (eventType.includes("finish_answer")) {
        result.answer = parsedData.answer
      }
    } catch (parseError) {
      continue
    }
  }

  return result
}

class LinerAI {
  private browser: any | null

  constructor() {
    this.browser = null
  }

  async query(queryText: string): Promise<LinerAIResponse> {
    let page: any
    let context: any

    try {
      if (!this.browser) {
        this.browser = await chromium.launch({ headless: true })
      }

      context = await this.browser.newContext()
      page = await context.newPage()

      await page.goto("https://getliner.com/", { waitUntil: "networkidle" })

      const editorSelector = ".ql-editor[contenteditable=\"true\"]"
      await page.waitForSelector(editorSelector, { state: "visible" })
      await page.fill(editorSelector, queryText)
      await page.keyboard.press("Enter")

      let sseResponseData = ""

      const responsePromise: Promise<LinerAIResponse> = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout"))
        }, 30000)

        page.on("response", async (response: any) => {
          if (response.url().includes("https://getliner.com/lisa/v2/answer") &&
            response.request().method() === "POST") {

            try {
              const body = await response.body()
              const text = body.toString("utf-8")
              sseResponseData += text

              if (text.includes("event:finish_answer")) {
                clearTimeout(timeout)
                const fullResponse = parseSSEData(sseResponseData)
                resolve(fullResponse)
              }
            } catch (error) {
              clearTimeout(timeout)
              reject(error)
            }
          }
        })
      })

      const result = await responsePromise
      await context.close()
      return result

    } catch (error: any) {
      if (context) {
        await context.close()
      }
      throw new Error(`Query failed: ${error.message}`)
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

const linerAI = new LinerAI()

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/getliner",
    name: "getliner AI",
    category: "AI",
    description: "This API endpoint provides access to getliner AI, allowing users to get AI-generated responses by submitting text queries via URL parameters. It supports various getliner models for diverse AI capabilities, from general queries to more complex reasoning tasks. The 'text' parameter is mandatory for the user's input. The API will return the AI's response.",
    tags: ["AI", "getliner", "Natural Language Processing", "Generative AI", "Chatbot"],
    example: "?text=what%20is%20AI",
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
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text } = req.query || {}

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

      if (text.length > 2000) {
        return {
          status: false,
          error: "Text parameter must be less than or equal to 2000 characters",
          code: 400,
        }
      }

      try {
        const response = await linerAI.query(text.trim())
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
    endpoint: "/api/ai/getliner",
    name: "getliner AI",
    category: "AI",
    description: "This API endpoint allows users to interact with getliner AI by sending a text query within a JSON request body. It's designed for applications requiring structured and programmatic interaction with the AI for various tasks, including answering complex questions, generating creative content, or conducting research. The JSON request body must include a 'text' field for the user's input. The API will return the AI's generated response.",
    tags: ["AI", "getliner", "Natural Language Processing", "Generative AI", "Chatbot"],
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

      if (text.length > 2000) {
        return {
          status: false,
          error: "Text parameter must be less than or equal to 2000 characters",
          code: 400,
        }
      }

      try {
        const response = await linerAI.query(text.trim())
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