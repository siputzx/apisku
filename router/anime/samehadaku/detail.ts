import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function getSamehadakuDetail(link: string) {
  try {
    const response = await axios.get(proxy() + link, {
      headers: {
        "authority": "samehadaku.care",
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
    if (response.statusText !== "OK") throw new Error("Failed to fetch data")
    const $ = cheerio.load(response.data)
    return {
      title: $("h1[itemprop='name']").text().trim(),
      thumbnail: $(".infoanime .thumb > img").attr("src") || "",
      published: $(".infoanime time[itemprop='datePublished']").attr("datetime") || "",
      rating: `${$(".infoanime span[itemprop='ratingValue']").text().trim()}/10`,
      description: $(".infox .desc").text().trim(),
      genres: $(".infox .genre-info > a")
        .map((_, el) => $(el).text().trim())
        .get(),
      episodes: $(".lstepsiode > ul > li")
        .map((_, el) => ({
          title: $(el).find(".lchx > a").text().trim(),
          date: $(el).find(".date").text().trim(),
          link: $(el).find(".eps > a").attr("href"),
        }))
        .get(),
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/samehadaku/detail",
    name: "samehadaku detail",
    category: "Anime",
    description: "This API endpoint provides detailed information and a list of episodes for a specific anime from Samehadaku. Users can retrieve data such as the anime's title, thumbnail, publication date, rating, description, genres, and a comprehensive list of available episodes with their titles, dates, and links. This is useful for developers building applications that require anime information from Samehadaku, allowing them to display details or create episode trackers.",
    tags: ["Anime", "Samehadaku", "Detail"],
    example: "?link=https://samehadaku.email/anime/blue-lock-season-2/",
    parameters: [
      {
        name: "link",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Anime detail URL",
        example: "https://samehadaku.email/anime/blue-lock-season-2/",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { link } = req.query || {}

      if (!link) {
        return {
          status: false,
          error: "Link parameter is required",
          code: 400,
        }
      }

      if (typeof link !== "string" || link.trim().length === 0) {
        return {
          status: false,
          error: "Link parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const details = await getSamehadakuDetail(link.trim())

        return {
          status: true,
          data: details,
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
    endpoint: "/api/anime/samehadaku/detail",
    name: "samehadaku detail",
    category: "Anime",
    description: "This API endpoint allows users to retrieve detailed information and a list of episodes for a specific anime from Samehadaku by providing the anime's URL in the request body. It returns data such as the anime's title, thumbnail, publication date, rating, description, genres, and a comprehensive list of available episodes with their titles, dates, and links. This POST route is suitable for programmatic access where the anime link might be dynamically generated or passed as part of a larger data payload.",
    tags: ["Anime", "Samehadaku", "Detail"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["link"],
            properties: {
              link: {
                type: "string",
                description: "Anime detail URL",
                example: "https://samehadaku.email/anime/blue-lock-season-2/",
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
      const { link } = req.body || {}

      if (!link) {
        return {
          status: false,
          error: "Link parameter is required",
          code: 400,
        }
      }

      if (typeof link !== "string" || link.trim().length === 0) {
        return {
          status: false,
          error: "Link parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const details = await getSamehadakuDetail(link.trim())

        return {
          status: true,
          data: details,
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