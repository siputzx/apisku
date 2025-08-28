import got from "got"
import * as cheerio from "cheerio"

async function scrapeAntaraNews() {
  try {
    const response = await got("https://www.antaranews.com", {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
      },
      timeout: {
        request: 30000
      },
      retry: {
        limit: 3,
        methods: ["GET"],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        errorCodes: [
          "ETIMEDOUT",
          "ECONNRESET",
          "EADDRINUSE",
          "ECONNREFUSED",
          "EPIPE",
          "ENOTFOUND",
          "ENETUNREACH",
          "EAI_AGAIN",
        ],
        calculateDelay: (retryObject: { attemptCount: number }) => {
          return Math.min(1000 * Math.pow(2, retryObject.attemptCount), 10000)
        },
      },
    })

    const $ = cheerio.load(response.body)
    const results: any[] = []

    $("#editor_picks .item").each((_, element) => {
      const $item = $(element)

      const title = $item.find(".post_title a").text().trim()
      const link = $item.find(".post_title a").attr("href")
      const image = $item.find("img").data("src")
      const category = $item.find(".list-inline .text-primary").text().trim()
      const isInfographic = $item.find(".format-overlay").length > 0

      if (title && link) {
        results.push({
          title,
          link,
          image,
          category,
          type: isInfographic ? "infographic" : "article",
        })
      }
    })

    return results
  } catch (error: any) {
    console.error("Error scraping Antara News:", error)
    throw new Error(error.message || "Failed to scrape Antara News")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/antara",
    name: "antara news",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines and articles from Antara News, one of Indonesia's leading news agencies. It scrapes the 'Editor Picks' section of the Antara News website, providing key information such as the article title, link, associated image, category, and whether it's an infographic or a standard article. This API is useful for applications requiring up-to-date Indonesian news content, aggregation services, or data analysis on current events. It offers a structured JSON response containing a list of news items, each with relevant details for easy integration into various platforms.",
    tags: ["BERITA", "NEWS", "INDONESIA"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeAntaraNews()
        if (data.length === 0) {
          return {
            status: false,
            error: "No news found",
            code: 404,
          }
        }
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
    endpoint: "/api/berita/antara",
    name: "antara news",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines and articles from Antara News, one of Indonesia's leading news agencies. It scrapes the 'Editor Picks' section of the Antara News website, providing key information such as the article title, link, associated image, category, and whether it's an infographic or a standard article. This API is useful for applications requiring up-to-date Indonesian news content, aggregation services, or data analysis on current events. It offers a structured JSON response containing a list of news items, each with relevant details for easy integration into various platforms.",
    tags: ["BERITA", "NEWS", "INDONESIA"],
    example: "",
    requestBody: {
      required: false,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeAntaraNews()
        if (data.length === 0) {
          return {
            status: false,
            error: "No news found",
            code: 404,
          }
        }
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