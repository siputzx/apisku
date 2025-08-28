import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

const baseUrl = "https://oploverz.org"
const ongoingUrl = `${baseUrl}/ongoing/`

async function scrapeOploverzOngoing() {
  try {
    const { data } = await axios.get(proxy() + ongoingUrl, {
      headers: {
        "authority": "oploverz.org",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "max-age=0",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
      timeout: 30000,
    })
    const $ = cheerio.load(data)

    return $(".bg-white.shadow.xrelated.relative")
      .map((_, el) => ({
        title: $(el).find(".titlelist.tublok").text().trim(),
        url: $(el).find("a").attr("href"),
        imgSrc: $(el).find("img").attr("src"),
        episodes: $(el).find(".eplist").text().trim(),
        rating: $(el).find(".starlist").text().trim() || "N/A",
      }))
      .get()
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/oploverz-ongoing",
    name: "oploverz ongoing",
    category: "Anime",
    description: "This API endpoint provides a list of ongoing anime series from Oploverz. It scrapes the Oploverz website's ongoing anime section and extracts key details for each series, including the title, URL, image source, number of episodes, and rating. This endpoint is useful for applications that need to display currently airing anime and provide direct links to their respective pages on Oploverz, keeping users updated with the latest releases.",
    tags: ["Anime", "Ongoing", "Series"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const results = await scrapeOploverzOngoing()

        if (!results) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: results,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
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
    endpoint: "/api/anime/oploverz-ongoing",
    name: "oploverz ongoing",
    category: "Anime",
    description: "This API endpoint provides a list of ongoing anime series from Oploverz. It scrapes the Oploverz website's ongoing anime section and extracts key details for each series, including the title, URL, image source, number of episodes, and rating. This endpoint is useful for applications that need to display currently airing anime and provide direct links to their respective pages on Oploverz, keeping users updated with the latest releases.",
    tags: ["Anime", "Ongoing", "Series"],
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
        const results = await scrapeOploverzOngoing()

        if (!results) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: results,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]