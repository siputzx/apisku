import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function scrapeDetail(url: string) {
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const title = $(".entry-title").text().trim()
    const thumbnail = $(".thumb img").attr("src")
    const rating = $(".rating strong").text().replace("Rating ", "").trim()
    const followers = $(".bmc").text().replace("Followed ", "").replace(" people", "").trim()
    const synopsis = $(".synp .entry-content").text().trim()
    const alternativeTitles = $(".alter").text().trim()
    const status = $(".info-content .spe span:contains(\"Status\")").text().replace("Status:", "").trim()
    const network = $(".info-content .spe span:contains(\"Network\") a").text().trim()
    const studio = $(".info-content .spe span:contains(\"Studio\") a").text().trim()
    const released = $(".info-content .spe span:contains(\"Released\")").text().replace("Released:", "").trim()
    const duration = $(".info-content .spe span:contains(\"Duration\")").text().replace("Duration:", "").trim()
    const season = $(".info-content .spe span:contains(\"Season\") a").text().trim()
    const country = $(".info-content .spe span:contains(\"Country\") a").text().trim()
    const type = $(".info-content .spe span:contains(\"Type\")").text().replace("Type:", "").trim()
    const episodes = $(".info-content .spe span:contains(\"Episodes\")").text().replace("Episodes:", "").trim()
    const genres = $(".genxed a").map((_, el) => $(el).text().trim()).get()

    return {
      title,
      thumbnail,
      rating,
      followers,
      synopsis,
      alternativeTitles,
      status,
      network,
      studio,
      released,
      duration,
      season,
      country,
      type,
      episodes,
      genres,
    }
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/anichin-detail",
    name: "anichin detail",
    category: "Anime",
    description: "This API endpoint allows you to retrieve detailed information about an anime from Anichin by providing its URL. It scrapes various data points such as title, thumbnail, rating, followers, synopsis, alternative titles, status, network, studio, release date, duration, season, country, type, number of episodes, and genres. This can be used by applications needing to display comprehensive anime details from Anichin.",
    tags: ["ANIME", "SCRAPING", "DETAIL"],
    example: "?url=https://anichin.forum/renegade-immortal-episode-69-subtitle-indonesia/",
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
        description: "Anime URL",
        example: "https://anichin.forum/renegade-immortal-episode-69-subtitle-indonesia/",
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
          error: "URL is required",
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
        const data = await scrapeDetail(url.trim())

        return {
          status: true,
          data: data,
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
    endpoint: "/api/anime/anichin-detail",
    name: "anichin detail",
    category: "Anime",
    description: "This API endpoint allows you to retrieve detailed information about an anime from Anichin by providing its URL in the request body. It scrapes various data points such as title, thumbnail, rating, followers, synopsis, alternative titles, status, network, studio, release date, duration, season, country, type, number of episodes, and genres. This can be used by applications needing to display comprehensive anime details from Anichin.",
    tags: ["ANIME", "SCRAPING", "DETAIL"],
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
                description: "Anime URL",
                example: "https://anichin.forum/renegade-immortal-episode-69-subtitle-indonesia/",
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
          error: "URL is required",
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
        const data = await scrapeDetail(url.trim())

        return {
          status: true,
          data: data,
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