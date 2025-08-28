import axios from "axios"
import * as cheerio from "cheerio"

async function getQuotesAnime() {
  try {
    const page = Math.floor(Math.random() * 184)
    const { data } = await axios.get("https://otakotaku.com/quote/feed/" + page, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const hasil: any[] = []
    $("div.kotodama-list").each(function (l, h) {
      hasil.push({
        link: $(h).find("a").attr("href"),
        gambar: $(h).find("img").attr("data-src"),
        karakter: $(h).find("div.char-name").text().trim(),
        anime: $(h).find("div.anime-title").text().trim(),
        episode: $(h).find("div.meta").text(),
        up_at: $(h).find("small.meta").text(),
        quotes: $(h).find("div.quote").text().trim(),
      })
    })

    if (hasil.length === 0) {
      throw new Error("No quotes found for the given page.")
    }

    return hasil
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get anime quotes from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/quotesanime",
    name: "animequotes",
    category: "Random",
    description: "This API endpoint provides random anime quotes. It scrapes quotes from a Japanese anime quote website, extracting details like the quote text, character, anime title, episode, image, and original link. This can be used by developers to integrate dynamic and engaging anime-related content into their applications, bots, or websites, offering a unique user experience with fresh quotes every time.",
    tags: ["Random", "Anime", "Quotes", "Scraper"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await getQuotesAnime()
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
    endpoint: "/api/r/quotesanime",
    name: "animequotes",
    category: "Random",
    description: "This API endpoint retrieves random anime quotes using a POST request. It scrapes various details such as quote text, character name, anime title, episode, associated image, and source link from a Japanese anime quote website. This is suitable for applications that prefer POST requests for content retrieval, allowing for dynamic integration of anime quotes into platforms, bots, or other services, providing users with engaging and unique content.",
    tags: ["Random", "Anime", "Quotes", "Scraper"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await getQuotesAnime()
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