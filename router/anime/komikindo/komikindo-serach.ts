import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function getBaseUrl() {
  const url = "https://komikindo.cz/"
  try {
    const { data } = await axios.get(proxy() + url)
    const $ = cheerio.load(data)
    const href = $(".elementskit-btn.whitespace--normal").attr("href")
    if (!href) {
      throw new Error("Base URL not found on the page")
    }
    return href
  } catch (error: any) {
    throw new Error("Error fetching base URL: " + error.message)
  }
}

async function scrapeSearch(query: string) {
  try {
    const baseUrl = await getBaseUrl()
    const searchUrl = `${baseUrl}?s=${encodeURIComponent(query)}`
    const { data } = await axios.get(proxy() + searchUrl, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const results = $(".animepost").map((_, el) => {
      const $el = $(el)
      return {
        title: $el.find(".tt h4").text().trim(),
        href: $el.find("a").attr("href"),
        image: $el.find("img").attr("src"),
        type: $el.find(".typeflag").text().trim(),
        rating: $el.find(".rating span").text().trim() || "N/A",
      }
    }).get()
    if (results.length === 0) {
      throw new Error("No results found for the provided query")
    }
    return results
  } catch (error: any) {
    throw new Error("Failed to scrape search results: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/komikindo-search",
    name: "komikindo search",
    category: "Anime",
    description: "This API endpoint provides a powerful search function for comics and manga on the Komikindo website. Users can submit a search query via a URL parameter, and the API will scrape the search results page to return a structured list of matching titles. Each result includes essential details such as the title, a direct link to the detail page (href), a URL for the cover image, the type of media (e.g., Manhwa, Manga), and the user rating if available. This tool is perfect for applications that need to find comics based on user input, enabling features like search bars or recommendation systems. The endpoint ensures that the search query is properly encoded and handles cases where no results are found, providing clear error messages for a seamless developer experience.",
    tags: ["ANIME", "MANGA", "SEARCH"],
    example: "?query=solo leveling",
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
        description: "The search query for anime on Komikindo",
        example: "solo leveling",
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
        const results = await scrapeSearch(query.trim())
        return {
          status: true,
          data: results,
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
    endpoint: "/api/anime/komikindo-search",
    name: "komikindo search",
    category: "Anime",
    description: "This API endpoint provides a powerful search function for comics and manga on the Komikindo website. Users can submit a search query via a JSON body, and the API will scrape the search results page to return a structured list of matching titles. Each result includes essential details such as the title, a direct link to the detail page (href), a URL for the cover image, the type of media (e.g., Manhwa, Manga), and the user rating if available. This tool is perfect for applications that need to find comics based on user input, enabling features like search bars or recommendation systems. The endpoint ensures that the search query is properly encoded and handles cases where no results are found, providing clear error messages for a seamless developer experience.",
    tags: ["ANIME", "MANGA", "SEARCH"],
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
                description: "The search query for anime on Komikindo",
                example: "solo leveling",
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
        const results = await scrapeSearch(query.trim())
        return {
          status: true,
          data: results,
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