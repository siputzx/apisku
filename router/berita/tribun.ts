import got from "got"
import * as cheerio from "cheerio"

const base_url = "https://www.tribunnews.com"

async function scrapeTribunNews() {
  try {
    const response = await got(base_url, {
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
    let result: any[] = []
    const isi = $("li.art-list.pos_rel")

    isi.each((i, e) => {
      const title = $(e).children("div.mr140").children("h3").children("a").text().trim()
      const link = $(e).children("div.mr140").children("h3").children("a").attr("href")
      const image_thumbnail = $(e)
        .children("div.fr")
        .children("a")
        .children("img")
        .attr("src")
      const time = $(e).children("div.mr140").children(".grey").children("time").attr("title")

      if (title && link) {
        result.push({ title, link, image_thumbnail, time })
      }
    })

    return result
  } catch (error: any) {
    console.error("Error scraping Tribunnews:", error.message)
    throw new Error(error.message || "Failed to scrape Tribunnews")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/tribunnews",
    name: "tribunnews",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines from Tribunnews.com, a major Indonesian online news portal and part of the Kompas Gramedia Group. It scrapes the main page to extract essential details for each news article, including the title, the direct URL to the full article, a thumbnail image, and the publication timestamp. Tribunnews is known for its extensive network of local newspapers across Indonesia, providing a wide range of national and regional news. This API is ideal for applications requiring up-to-date general news from an authoritative Indonesian source, suitable for news aggregators, content analysis, or informational displays. The response delivers a structured JSON array of news items, facilitating easy integration and display.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS", "REGIONAL"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeTribunNews()
        return { status: true, data: data, timestamp: new Date().toISOString() }
      } catch (error: any) {
        return { status: false, error: error.message || "Internal Server Error", code: 500 }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/berita/tribunnews",
    name: "tribunnews",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines from Tribunnews.com, a major Indonesian online news portal and part of the Kompas Gramedia Group. It scrapes the main page to extract essential details for each news article, including the title, the direct URL to the full article, a thumbnail image, and the publication timestamp. Tribunnews is known for its extensive network of local newspapers across Indonesia, providing a wide range of national and regional news. This API is ideal for applications requiring up-to-date general news from an authoritative Indonesian source, suitable for news aggregators, content analysis, or informational displays. The response delivers a structured JSON array of news items, facilitating easy integration and display.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS", "REGIONAL"],
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
        const data = await scrapeTribunNews()
        return { status: true, data: data, timestamp: new Date().toISOString() }
      } catch (error: any) {
        return { status: false, error: error.message || "Internal Server Error", code: 500 }
      }
    },
  },
]