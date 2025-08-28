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

async function scrapeDetail(urlToScrape: string) {
  try {
    const baseUrl = await getBaseUrl()
    const finalUrl = urlToScrape.startsWith("http") ? urlToScrape : `${baseUrl}${urlToScrape}`
    const { data } = await axios.get(proxy() + finalUrl, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    return {
      title: $("h1.entry-title").text().trim(),
      altTitle: $('span:contains("Judul Alternatif:")').text().replace("Judul Alternatif:", "").trim(),
      status: $('span:contains("Status:")').text().replace("Status:", "").trim(),
      author: $('span:contains("Pengarang:")').text().replace("Pengarang:", "").trim(),
      genre: $(".genre-info a").map((_, el) => $(el).text().trim()).get(),
      description: $("#sinopsis .entry-content").text().trim(),
      imageUrl: $("div.thumb img").attr("src"),
      chapters: $("#chapter_list li").map((_, el) => ({
        chapter: $(el).find(".lchx").text().trim(),
        url: $(el).find("a").attr("href"),
      })).get(),
    }
  } catch (error: any) {
    throw new Error("Failed to scrape detail: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/komikindo-detail",
    name: "komikindo detail",
    category: "Anime",
    description: "This API endpoint allows you to retrieve detailed information about a specific comic or manga from the Komikindo website. By providing the URL of the detail page, the API scrapes key data points such as the title, alternative title, status, author, genre list, plot summary, cover image URL, and a list of available chapters with their respective URLs. It is designed to facilitate programmatic access to comic information for use in applications, databases, or content aggregators. The endpoint handles both direct URLs and relative paths, automatically resolving the base URL if needed. The output is a structured JSON object containing all the extracted data, making it easy to parse and integrate. It is an essential tool for developers building applications that require real-time comic data from Komikindo.",
    tags: ["ANIME", "MANGA", "KOMIKINDO"],
    example: "?url=https://komikindo.pw/komik/550578-solo-leveling/",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The URL of the anime detail page on Komikindo",
        example: "https://komikindo.pw/komik/550578-solo-leveling/",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {}
      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }
      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }
      try {
        const result = await scrapeDetail(url.trim())
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
    endpoint: "/api/anime/komikindo-detail",
    name: "komikindo detail",
    category: "Anime",
    description: "This API endpoint allows you to retrieve detailed information about a specific comic or manga from the Komikindo website. By providing the URL of the detail page, the API scrapes key data points such as the title, alternative title, status, author, genre list, plot summary, cover image URL, and a list of available chapters with their respective URLs. It is designed to facilitate programmatic access to comic information for use in applications, databases, or content aggregators. The endpoint handles both direct URLs and relative paths, automatically resolving the base URL if needed. The output is a structured JSON object containing all the extracted data, making it easy to parse and integrate. It is an essential tool for developers building applications that require real-time comic data from Komikindo.",
    tags: ["ANIME", "MANGA", "KOMIKINDO"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                description: "The URL of the anime detail page on Komikindo",
                example: "https://komikindo.pw/komik/550578-solo-leveling/",
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
      const { url } = req.body || {}
      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }
      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }
      try {
        const result = await scrapeDetail(url.trim())
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