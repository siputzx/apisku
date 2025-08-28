import got from "got"
import * as cheerio from "cheerio"

async function scrapeJKT48News() {
  try {
    const response = await got("https://jkt48.com/news/list?lang=id", {
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

    $(".entry-news__list").each((_, element) => {
      const $item = $(element)

      if ($item.hasClass("entry-news__list--pagination")) return

      const title = $item.find(".entry-news__list--item h3 a").text().trim()
      const link = "https://jkt48.com" + $item.find(".entry-news__list--item h3 a").attr("href")
      const date = $item.find(".entry-news__list--item time").text().trim()
      const icon = "https://jkt48.com" + $item.find(".entry-news__list--label img").attr("src")

      if (title && link) {
        results.push({
          title,
          link,
          date,
          icon,
        })
      }
    })

    return results
  } catch (error: any) {
    console.error("Error scraping JKT48 News:", error)
    throw new Error(error.message || "Failed to scrape JKT48 News")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/jkt48",
    name: "jkt48 news",
    category: "Berita",
    description:
      "This API endpoint allows you to fetch the latest news from the official JKT48 website. It scrapes the news list, extracting key details such as the news title, the direct link to the article, the publication date, and an icon representing the news category (e.g., general news, event updates). This API is ideal for fans, developers creating fan applications, or anyone interested in staying updated with the latest announcements, events, and activities of the Indonesian idol group JKT48. The response provides a structured array of news items, facilitating easy integration and display.",
    tags: ["BERITA", "NEWS", "JKT48", "ENTERTAINMENT", "INDONESIA"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeJKT48News()
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
    endpoint: "/api/berita/jkt48",
    name: "jkt48 news",
    category: "Berita",
    description:
      "This API endpoint allows you to fetch the latest news from the official JKT48 website. It scrapes the news list, extracting key details such as the news title, the direct link to the article, the publication date, and an icon representing the news category (e.g., general news, event updates). This API is ideal for fans, developers creating fan applications, or anyone interested in staying updated with the latest announcements, events, and activities of the Indonesian idol group JKT48. The response provides a structured array of news items, facilitating easy integration and display.",
    tags: ["BERITA", "NEWS", "JKT48", "ENTERTAINMENT", "INDONESIA"],
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
        const data = await scrapeJKT48News()
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