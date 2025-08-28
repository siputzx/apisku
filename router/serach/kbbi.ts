import fetch from "node-fetch"
import * as cheerio from "cheerio"

async function scrapeKbbi(q: string) {
  const response = await fetch(
    `https://kbbi.kemdikbud.go.id/entri/${encodeURIComponent(q)}`,
    {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    },
  )

  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText)
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const isExist = !/tidak ditemukan/i.test(
    $("body > div.container.body-content > h4[style=\"color:red\"]").text(),
  )

  if (!isExist) {
    throw new Error(`${q} does not exist!`)
  }

  const results: { index: number; title: string; means: string[] }[] = []
  let isContent = false
  let lastTitle: string | undefined

  $("body > div.container.body-content")
    .children()
    .each((_, el) => {
      const tag = el.tagName
      const elem = $(el)

      if (tag === "hr") {
        isContent = !isContent && !results.length
      }

      if (tag === "h2" && isContent) {
        const indexText = elem.find("sup").text().trim()
        const index = parseInt(indexText) || 0
        const title = elem.text().trim()
        results.push({
          index: index,
          title: title,
          means: [],
        })
        lastTitle = title
      }

      if ((tag === "ol" || tag === "ul") && isContent && lastTitle) {
        elem.find("li").each((_, liEl) => {
          const li = $(liEl).text().trim()
          const index = results.findIndex(({ title }) => title === lastTitle)
          if (index !== -1) {
            results[index].means.push(li)
          } else {
            console.log(li, lastTitle)
          }
        })
        lastTitle = undefined
      }
    })

  if (results.length === 0) {
    throw new Error(`${q} does not exist!`)
  }
  return results
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/kbbi",
    name: "kbbi",
    category: "Search",
    description: "This API endpoint allows users to search for definitions of words in the official Indonesian Dictionary (KBBI). By providing a word as a query, the API will return a structured list of definitions, including numerical indices for different meanings and sub-definitions. This endpoint is ideal for applications requiring access to the Indonesian language's authoritative lexicon, such as educational tools, natural language processing projects, or spell checkers.",
    tags: ["Search", "Dictionary", "Indonesian"],
    example: "?q=asu",
    parameters: [
      {
        name: "q",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "The word to search in KBBI",
        example: "asu",
      },
    ],
    isPremium: false,
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
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeKbbi(q.trim())
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
    endpoint: "/api/s/kbbi",
    name: "kbbi",
    category: "Search",
    description: "This API endpoint allows users to search for definitions of words in the official Indonesian Dictionary (KBBI) by providing a word in the request body. The API will return a structured list of definitions, including numerical indices for different meanings and sub-definitions. This endpoint is ideal for applications requiring access to the Indonesian language's authoritative lexicon, such as educational tools, natural language processing projects, or spell checkers.",
    tags: ["Search", "Dictionary", "Indonesian"],
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
                description: "The word to search in KBBI",
                example: "asu",
                minLength: 1,
                maxLength: 100,
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
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeKbbi(q.trim())
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