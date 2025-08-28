import got from "got"
import * as cheerio from "cheerio"

async function scrapeMerdekaNews() {
  try {
    const response = await got("https://www.merdeka.com/peristiwa/", {
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

    $(".box-headline ul li.item").each((_, element) => {
      const $item = $(element)

      const title = $item.find(".item-title a").text().trim()
      let link = $item.find(".item-title a").attr("href")
      let image = $item.find(".item-img img").attr("src")
      const category = $item.find(".item-tag").text().trim()
      const date = $item.find(".item-date").text().trim()
      const description = $item.find(".item-description").text().trim()

      if (image && !image.startsWith("http")) {
        image = "https://www.merdeka.com" + image
      }

      if (link && !link.startsWith("http")) {
        link = "https://www.merdeka.com" + link
      }

      if (title && link) {
        results.push({
          title,
          link,
          image,
          category,
          date,
          description,
        })
      }
    })

    return results
  } catch (error: any) {
    console.error("Error scraping Merdeka News:", error)
    throw new Error(error.message || "Failed to scrape Merdeka News")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/merdeka",
    name: "merdeka news",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines from Merdeka.com, specifically from its 'Peristiwa' (Events) section, which often covers breaking news and current affairs. It extracts key details for each news item, including the article title, direct link, associated image (converted to an absolute URL), news category, publication date, and a brief description. This API is useful for applications that require up-to-date general news and events from an Indonesian perspective, such as news aggregators, content analysis tools, or informational displays. The response provides a structured JSON array of news articles, facilitating straightforward integration and display.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeMerdekaNews()
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
    endpoint: "/api/berita/merdeka",
    name: "merdeka news",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines from Merdeka.com, specifically from its 'Peristiwa' (Events) section, which often covers breaking news and current affairs. It extracts key details for each news item, including the article title, direct link, associated image (converted to an absolute URL), news category, publication date, and a brief description. This API is useful for applications that require up-to-date general news and events from an Indonesian perspective, such as news aggregators, content analysis tools, or informational displays. The response provides a structured JSON array of news articles, facilitating straightforward integration and display.",
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
        const data = await scrapeMerdekaNews()
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