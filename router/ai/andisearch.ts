import { chromium } from "playwright"

async function searchAndi(query: string) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-web-security", "--disable-features=VizDisplayCompositor", "--no-sandbox"],
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  let streamData = ""
  let streamComplete = false

  page.on("response", async (response) => {
    if (response.url().includes("write.andisearch.com/v1/write_streaming")) {
      try {
        const body = await response.body()
        streamData += body.toString("utf-8")
        streamComplete = true
      } catch (error) {
        streamComplete = true
      }
    }
  })

  try {
    await page.goto("https://andisearch.com/", { waitUntil: "domcontentloaded" })
    await page.waitForSelector(".rcw-input", { timeout: 10000 })
    await page.fill(".rcw-input", query)
    await page.click(".rcw-send")

    const firstResponse = await page.waitForResponse(
      (response) =>
        response.url().includes("runtime.lex.us-west-2.amazonaws.com") &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 30000 },
    ).then((response) => response.json())

    let message = firstResponse.message

    if (firstResponse.sessionAttributes?.currentSearchResult) {
      await page.waitForSelector(".lw-chat-action-buttons", { timeout: 15000 })

      const buttons = {
        generate: await page.$('.lw-chat-actions[data-andi-channel="Generate Answer"]'),
        summarize: await page.$('.lw-chat-actions[data-andi-channel="Summarize Results"]'),
        tellMore: await page.$('.lw-chat-actions[data-andi-channel="Tell Me More"]'),
      }

      const clickButton = async (button: any) => {
        streamData = ""
        streamComplete = false
        await button.click()

        let waitTime = 0
        while (!streamComplete && waitTime < 60000) {
          await page.waitForTimeout(1000)
          waitTime += 1000
        }
        return streamData
      }

      if (buttons.generate) {
        message = await clickButton(buttons.generate)
      } else if (buttons.summarize) {
        message = await clickButton(buttons.summarize)

        await page.waitForTimeout(2000)
        const tellMoreAfter = await page.$('.lw-chat-actions[data-andi-channel="Tell Me More"]')
        if (tellMoreAfter) {
          const additionalData = await clickButton(tellMoreAfter)
          message += additionalData
        }
      } else if (buttons.tellMore) {
        message = await clickButton(buttons.tellMore)
      }
    }

    return { message }
  } catch (error: any) {
    return { message: `Error: ${error.message}` }
  } finally {
    await context.close()
    await browser.close()
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/andi",
    name: "andiserach",
    category: "AI",
    description:
      "This API endpoint allows users to interact with the Andi Search AI to get answers to their queries. It functions by automating a browser to simulate user input on the Andi Search website, extracting the AI-generated response. This can be used for various applications such as intelligent chatbots, automated information retrieval, or integrating AI-powered search capabilities into other systems. The API takes a single query parameter 'q' representing the user's question, and returns the AI's response in a structured JSON format.",
    tags: ["AI", "Search", "Automation"],
    example: "?q=What is the capital of France?",
    parameters: [
      {
        name: "q",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The query to ask Andi AI",
        example: "What is the capital of France?",
      },
    ],
    isPremium: true,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.query || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      if (q.length > 1000) {
        return {
          status: false,
          error: "Query parameter must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const data = await searchAndi(q.trim())
        return {
          status: true,
          data: data,
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
    endpoint: "/api/ai/andi",
    name: "andiserach",
    category: "AI",
    description:
      "This API endpoint allows users to interact with the Andi Search AI to get answers to their queries. It functions by automating a browser to simulate user input on the Andi Search website, extracting the AI-generated response. This can be used for various applications such as intelligent chatbots, automated information retrieval, or integrating AI-powered search capabilities into other systems. The API takes a single query parameter 'q' representing the user's question, and returns the AI's response in a structured JSON format.",
    tags: ["AI", "Search", "Automation"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["q"],
            properties: {
              q: {
                type: "string",
                description: "The query to ask Andi AI",
                example: "What is the capital of France?",
                minLength: 1,
                maxLength: 1000,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: true,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.body || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      if (q.length > 1000) {
        return {
          status: false,
          error: "Query parameter must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const data = await searchAndi(q.trim())
        return {
          status: true,
          data: data,
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