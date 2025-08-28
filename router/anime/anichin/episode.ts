import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function scrapeEpisodeList(url: string) {
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const episodes: { episodeNumber: string, title: string, subStatus: string, releaseDate: string, link: string | undefined }[] = []

    $(".eplister ul li").each((_, element) => {
      const episodeNumber = $(element).find(".epl-num").text().trim()
      const title = $(element).find(".epl-title").text().trim()
      const subStatus = $(element).find(".epl-sub .status").text().trim()
      const releaseDate = $(element).find(".epl-date").text().trim()
      const link = $(element).find("a").attr("href")
      episodes.push({
        episodeNumber: episodeNumber,
        title: title,
        subStatus: subStatus,
        releaseDate: releaseDate,
        link: link,
      })
    })
    return episodes
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/anichin-episode",
    name: "anichin episode",
    category: "Anime",
    description: "This API endpoint allows you to retrieve a list of episodes for a specific anime from Anichin by providing the anime's URL. It scrapes details such as episode number, title, sub status (e.g., 'SUB INDO'), release date, and the link to the episode page. This is useful for applications that need to display episode lists and provide direct links to episode content.",
    tags: ["ANIME", "EPISODE LIST", "SCRAPING"],
    example: "?url=https://anichin.forum/renegade-immortal/",
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
        description: "Anime page URL",
        example: "https://anichin.forum/renegade-immortal/",
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
        const data = await scrapeEpisodeList(url.trim())

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
    endpoint: "/api/anime/anichin-episode",
    name: "anichin episode",
    category: "Anime",
    description: "This API endpoint allows you to retrieve a list of episodes for a specific anime from Anichin by providing the anime's URL in the request body. It scrapes details such as episode number, title, sub status (e.g., 'SUB INDO'), release date, and the link to the episode page. This is useful for applications that need to display episode lists and provide direct links to episode content.",
    tags: ["ANIME", "EPISODE LIST", "SCRAPING"],
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
                description: "Anime page URL",
                example: "https://anichin.forum/renegade-immortal/",
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
        const data = await scrapeEpisodeList(url.trim())

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