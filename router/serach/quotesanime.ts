import axios from "axios"
import * as cheerio from "cheerio"

async function quotesAnime(q: string) {
  try {
    const { data } = await axios.get(
      `https://otakotaku.com/quote/search?q=${q}&q_filter=quote`,
    )
    const $ = cheerio.load(data)
    const hasil: any[] = []
    $("div.kotodama-list").each(function (l, h) {
      hasil.push({
        link: $(h).find("a").attr("href"),
        gambar: $(h)
          .find("img")
          .attr("data-src")
          ?.replace("52x71", "157x213"),
        karakter: $(h).find("div.char-name").text().trim(),
        anime: $(h).find("div.anime-title").text().trim(),
        episode: $(h).find("div.meta").text(),
        up_at: $(h).find("small.meta").text(),
        quotes: $(h).find("div.quote").text().trim(),
      })
    })
    return hasil
  } catch (error: any) {
    throw new Error(`Error fetching quotes: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/animequotes",
    name: "quoted anime",
    category: "Search",
    description:
      "This API endpoint allows you to search for anime quotes from Otakotaku.com. You can provide a query parameter to filter quotes based on keywords, character names, or anime titles. The endpoint will return a list of matching quotes, including details such as the quote itself, the character who said it, the anime and episode it's from, a link to the quote, and an associated image. This API is useful for developers building applications that need to display or analyze anime quotes, or for users looking for specific memorable lines from their favorite anime.",
    tags: ["Anime", "Quotes", "Search", "Otakotaku"],
    example: "?query=cat",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description:
          "The search query for anime quotes (e.g., 'sad', 'love', character name).",
        example: "fate",
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
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await quotesAnime(query.trim())
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
    endpoint: "/api/s/animequotes",
    name: "quoted anime",
    category: "Search",
    description:
      "This API endpoint allows you to search for anime quotes from Otakotaku.com by sending a JSON request body. You can provide a 'query' field within the JSON to filter quotes based on keywords, character names, or anime titles. The endpoint will return a list of matching quotes, including details such as the quote itself, the character who said it, the anime and episode it's from, a link to the quote, and an associated image. This API is suitable for programmatic access where the search query is sent as part of the request body, offering more flexibility for complex queries or automated processes.",
    tags: ["Anime", "Quotes", "Search", "Otakotaku"],
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
                description:
                  "The search query for anime quotes (e.g., 'sad', 'love', character name).",
                example: "fate",
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
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await quotesAnime(query.trim())
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