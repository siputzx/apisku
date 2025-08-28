import axios from "axios"
import * as cheerio from "cheerio"

interface MangaToonItem {
  title: string
  image: string | undefined
  link: string
}

interface MangaToonResultCategory {
  resultCount: string
  items: MangaToonItem[]
}

interface MangaToonSearchResult {
  internet: MangaToonResultCategory[]
  komik: MangaToonResultCategory[]
  novel: MangaToonResultCategory[]
}

const fetchMangatoon = async (q: string): Promise<MangaToonSearchResult> => {
  try {
    const url = `https://mangatoon.mobi/id/search?word=${encodeURIComponent(q)}`
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = response.data
    const $ = cheerio.load(html)

    const result: MangaToonSearchResult = {
      internet: [],
      komik: [],
      novel: [],
    }

    $(".comics-result").each((index, element) => {
      const typeTitle = $(element).find(".type-title").text().trim()
      const resultCount = $(element).find(".result-count").text().trim()
      const items: MangaToonItem[] = []

      $(element)
        .find(".recommend-item")
        .each((idx, el) => {
          const title = $(el).find(".recommend-comics-title span").text().trim()
          const image = $(el).find(".comics-image img").attr("data-src")
          const link = `https://mangatoon.mobi${$(el).find("a").attr("href")}`
          items.push({ title, image, link })
        })

      if (typeTitle.includes("Telusuri komik di internet")) {
        result.internet.push({ resultCount, items })
      } else if (typeTitle.includes("Komik")) {
        result.komik.push({ resultCount, items })
      }
    })

    $(".novel-result").each((index, element) => {
      const typeTitle = $(element).find(".type-title").text().trim()
      const resultCount = $(element).find(".result-count").text().trim()
      const items: MangaToonItem[] = []

      $(element)
        .find(".recommend-item")
        .each((idx, el) => {
          const title = $(el).find(".recommend-comics-title span").text().trim()
          const image = $(el).find(".comics-image img").attr("data-src")
          const link = `${$(el).find("a").attr("href")}`
          items.push({ title, image, link })
        })

      if (typeTitle.includes("Novel")) {
        result.novel.push({ resultCount, items })
      }
    })

    return result
  } catch (error: any) {
    console.error("Error:", error.message)
    throw new Error("Failed to fetch data from Mangatoon")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/mangatoon",
    name: "mangatoon",
    category: "Search",
    description: "This API endpoint allows users to search for comics and novels on Mangatoon. By providing a search query, the API returns categorized results including comics found on the internet, comics hosted directly on Mangatoon, and novels. Each result provides the title, cover image URL, and a direct link to the content. This endpoint is valuable for applications focused on manga and web novel discovery, content aggregation, or personal reading list management.",
    tags: ["Search", "Comics", "Novels", "Manga"],
    example: "?query=cat",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The search query for Mangatoon",
        example: "cat",
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
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await fetchMangatoon(query.trim())
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
    endpoint: "/api/s/mangatoon",
    name: "mangatoon",
    category: "Search",
    description: "This API endpoint allows users to search for comics and novels on Mangatoon by providing a search query in the request body. The API returns categorized results including comics found on the internet, comics hosted directly on Mangatoon, and novels. Each result provides the title, cover image URL, and a direct link to the content. This endpoint is valuable for applications focused on manga and web novel discovery, content aggregation, or personal reading list management.",
    tags: ["Search", "Comics", "Novels", "Manga"],
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
                description: "The search query for Mangatoon",
                example: "cat",
                minLength: 1,
                maxLength: 255,
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
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await fetchMangatoon(query.trim())
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