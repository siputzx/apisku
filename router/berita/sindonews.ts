import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeLatestNews() {
  try {
    const response = await axios.get("https://www.sindonews.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const $ = cheerio.load(response.data)
    const articles: any[] = []

    $(".list-article").each((index, element) => {
      const title = $(element).find(".title-article").text().trim()
      const link = $(element).find("a").attr("href")
      const category = $(element).find(".sub-kanal").text().trim()
      const timestamp = $(element).find(".date-article").text().trim()
      const imageUrl = $(element).find("img.lazyload").attr("data-src")

      if (title && link) {
        articles.push({
          title,
          link,
          category,
          timestamp,
          imageUrl,
        })
      }
    })

    return articles
  } catch (error: any) {
    console.error("Error scraping Sindonews:", error.message)
    throw new Error(error.message || "Failed to scrape Sindonews")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/sindonews",
    name: "sindonews",
    category: "Berita",
    description:
      "This API endpoint provides access to the latest news headlines from Sindonews.com, a major Indonesian news portal. It scrapes the main page to gather essential details for each news article, including the title, the direct link to the full article, its category (e.g., Nasional, Ekonomi Bisnis, Internasional, Sports), the publication timestamp, and a thumbnail image URL. This API is highly valuable for applications that require real-time updates on Indonesian current events, news aggregators, or any service needing structured news data from a reputable source like Sindonews.com. The response delivers a clean JSON array of news items, facilitating easy consumption and display.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeLatestNews()
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
    endpoint: "/api/berita/sindonews",
    name: "sindonews",
    category: "Berita",
    description:
      "This API endpoint provides access to the latest news headlines from Sindonews.com, a major Indonesian news portal. It scrapes the main page to gather essential details for each news article, including the title, the direct link to the full article, its category (e.g., Nasional, Ekonomi Bisnis, Internasional, Sports), the publication timestamp, and a thumbnail image URL. This API is highly valuable for applications that require real-time updates on Indonesian current events, news aggregators, or any service needing structured news data from a reputable source like Sindonews.com. The response delivers a clean JSON array of news items, facilitating easy consumption and display.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS"],
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
        const data = await scrapeLatestNews()
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