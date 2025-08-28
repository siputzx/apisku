import got from "got"
import * as cheerio from "cheerio"

async function scrapeCNBCIndonesiaNews() {
  try {
    const response = await got("https://www.cnbcindonesia.com/news", {
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

    $("article").each((_, element) => {
      const $article = $(element)
      const $link = $article.find("a")

      const link = $link.attr("href")
      const image = $link.find("img").attr("src")
      const category = $link.find("span.text-cnbc-support-orange").text().trim() || ""
      const title = $link.find("h2").text().trim()

      const label = $link.find("span.bg-cnbc-primary-blue").text().trim()
      const date = $link.find("span.text-gray").text().trim()

      const cleanCategory = category.replace("Video", "").trim()

      const cleanLabel = label.replace(/\s+/g, " ").trim()

      const cleanDate = date.replace(/\s+/g, " ").trim()

      if (title && link) {
        results.push({
          title,
          link,
          image,
          category: cleanCategory || "",
          label: cleanLabel || "",
          date: cleanDate || "",
          type: category.toLowerCase().includes("video") ? "video" : "article",
        })
      }
    })

    return results
  } catch (error: any) {
    console.error("Error scraping CNBC Indonesia News:", error)
    throw new Error(error.message || "Failed to scrape CNBC Indonesia News")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/cnbcindonesia",
    name: "cnbc indonesia",
    category: "Berita",
    description:
      "This API endpoint provides access to the latest news headlines from CNBC Indonesia, focusing on business and financial news. It scrapes data from the CNBC Indonesia 'News' section, extracting information such as article title, URL, associated image, category, any special labels (e.g., 'Live'), and publication date. The API categorizes content as either 'video' or 'article' based on the source. It is ideal for developers building news aggregators, financial analysis tools, or any application requiring real-time updates on Indonesian business and economic news. The response delivers a structured JSON array of news items, each with comprehensive details for easy integration and display.",
    tags: ["BERITA", "NEWS", "FINANCE", "INDONESIA"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeCNBCIndonesiaNews()
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
    endpoint: "/api/berita/cnbcindonesia",
    name: "cnbc indonesia",
    category: "Berita",
    description:
      "This API endpoint provides access to the latest news headlines from CNBC Indonesia, focusing on business and financial news. It scrapes data from the CNBC Indonesia 'News' section, extracting information such as article title, URL, associated image, category, any special labels (e.g., 'Live'), and publication date. The API categorizes content as either 'video' or 'article' based on the source. It is ideal for developers building news aggregators, financial analysis tools, or any application requiring real-time updates on Indonesian business and economic news. The response delivers a structured JSON array of news items, each with comprehensive details for easy integration and display.",
    tags: ["BERITA", "NEWS", "FINANCE", "INDONESIA"],
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
        const data = await scrapeCNBCIndonesiaNews()
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