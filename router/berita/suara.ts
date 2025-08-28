import got from "got"
import * as cheerio from "cheerio"

async function scrapeSuaraNews() {
  try {
    const response = await got("https://www.suara.com/news", {
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

    const headline = $(".headline-content")
    if (headline.length > 0) {
      const title = headline.find("h2 a").text().trim()
      const link = headline.find("h2 a").attr("href")
      const image = headline.find("img").attr("src")
      const category = headline.find(".kanal span").text().trim()
      const date = headline.find(".headline-date").text().trim()

      if (title && link) {
        results.push({
          title,
          link,
          image,
          category,
          date,
        })
      }
    }

    $(".list-item-x .item:not([style*=\"display:none\"])").each((_, element) => {
      const $item = $(element)

      const title = $item.find(".description h2 a").text().trim()
      const link = $item.find(".description h2 a").attr("href")
      const image = $item.find(".img-thumb-1 img").attr("src")
      const category = $item.find(".description span.c-default").text().trim()

      if (title && link) {
        results.push({
          title,
          link,
          image,
          category,
        })
      }
    })

    return results
  } catch (error: any) {
    console.error("Error scraping Suara News:", error)
    throw new Error(error.message || "Failed to scrape Suara News")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/suara",
    name: "suara news",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines and articles from Suara.com, a prominent Indonesian online news portal known for its coverage of politics, business, law, sports, entertainment, lifestyle, automotive, science, technology, and citizen journalism. It scrapes both the main headline news and other listed news items, extracting details such as the article title, direct link, associated image, category, and publication date for headlines. This API is valuable for developers building news aggregators, content analysis tools, or any application requiring real-time news updates from a diverse range of topics within Indonesia. The response delivers a structured JSON array of news items, facilitating easy integration and display.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS", "POLITICS", "LIFESTYLE"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeSuaraNews()
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
    endpoint: "/api/berita/suara",
    name: "suara news",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines and articles from Suara.com, a prominent Indonesian online news portal known for its coverage of politics, business, law, sports, entertainment, lifestyle, automotive, science, technology, and citizen journalism. It scrapes both the main headline news and other listed news items, extracting details such as the article title, direct link, associated image, category, and publication date for headlines. This API is valuable for developers building news aggregators, content analysis tools, or any application requiring real-time news updates from a diverse range of topics within Indonesia. The response delivers a structured JSON array of news items, facilitating easy integration and display.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS", "POLITICS", "LIFESTYLE"],
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
        const data = await scrapeSuaraNews()
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