import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

const baseUrl = 'https://auratail.vip/anime/?status=&type=&order=update'

async function scrapeData() {
  try {
    const { data } = await axios.get(proxy() + baseUrl, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const results: any[] = []

    $('.listupd .bsx').each((_, el) => {
      const title = $(el).find('.tt h2').text().trim()
      const episode = $(el).find('.bt .epx').text().trim()
      const link = $(el).find('a').attr('href')
      const image =
        $(el).find('img').attr('data-src') || $(el).find('img').attr('src')
      results.push({ title, episode, link, image })
    })

    return results
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to scrape data from Auratail")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/auratail-latest",
    name: "auratail latest",
    category: "Anime",
    description: "This API endpoint provides the latest anime updates from the Auratail website. It scrapes the main page to extract details such as the title of the anime, the latest episode available, the direct link to the anime's page, and its cover image. This is ideal for applications needing to display recently updated anime.",
    tags: ["ANIME", "Latest", "Updates", "Scraping"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const results = await scrapeData()

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
    endpoint: "/api/anime/auratail-latest",
    name: "auratail latest",
    category: "Anime",
    description: "This API endpoint provides the latest anime updates from the Auratail website. It scrapes the main page to extract details such as the title of the anime, the latest episode available, the direct link to the anime's page, and its cover image. This is ideal for applications needing to display recently updated anime, and is accessible via a POST request.",
    tags: ["ANIME", "Latest", "Updates", "Scraping"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const results = await scrapeData()

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