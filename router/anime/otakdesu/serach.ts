import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

const baseUrl = "https://otakudesu.cloud/"

async function searchAnime(query: string) {
  const url = `${baseUrl}/?s=${query}&post_type=anime`
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
    })
    const $ = cheerio.load(data)
    const animeList: any[] = []

    $(".chivsrc li").each((index, element) => {
      const title = $(element).find("h2 a").text().trim()
      const link = $(element).find("h2 a").attr("href")
      const imageUrl = $(element).find("img").attr("src")
      const genres = $(element)
        .find(".set")
        .first()
        .text()
        .replace("Genres : ", "")
        .trim()
      const status = $(element)
        .find(".set")
        .eq(1)
        .text()
        .replace("Status : ", "")
        .trim()
      const rating =
        $(element).find(".set").eq(2).text().replace("Rating : ", "").trim() ||
        "N/A"

      animeList.push({
        title,
        link,
        imageUrl,
        genres,
        status,
        rating,
      })
    })
    return animeList
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/otakudesu/search",
    name: "otakudesu search",
    category: "Anime",
    description: "This API endpoint allows users to search for anime on Otakudesu. By providing a search query, the API returns a list of matching anime, including their titles, direct links to their pages, thumbnail images, genres, current status (e.g., ongoing, completed), and ratings. This is useful for integrating anime search capabilities into applications, enabling users to quickly find specific anime titles and retrieve relevant information.",
    tags: ["Anime", "Otakudesu", "Search"],
    example: "?s=naruto",
    parameters: [
      {
        name: "s",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Anime search query",
        example: "naruto",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { s } = req.query || {}

      if (!s) {
        return {
          status: false,
          error: "Query parameter 's' is required",
          code: 400,
        }
      }

      if (typeof s !== "string" || s.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter 's' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await searchAnime(s.trim())
        return {
          status: true,
          data: data,
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
    endpoint: "/api/anime/otakudesu/search",
    name: "otakudesu search",
    category: "Anime",
    description: "This API endpoint enables users to search for anime on Otakudesu by providing a search query in the JSON request body. It returns a structured list of anime matching the query, including details such as their titles, direct links to their respective pages, thumbnail images, associated genres, current status (e.g., ongoing, completed), and ratings. This POST method is suitable for automated systems or complex applications that need to programmatically send search queries and retrieve anime information from Otakudesu.",
    tags: ["Anime", "Otakudesu", "Search"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["s"],
            properties: {
              s: {
                type: "string",
                description: "Anime search query",
                example: "naruto",
                minLength: 1,
                maxLength: 100,
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
      const { s } = req.body || {}

      if (!s) {
        return {
          status: false,
          error: "Query parameter 's' is required",
          code: 400,
        }
      }

      if (typeof s !== "string" || s.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter 's' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await searchAnime(s.trim())
        return {
          status: true,
          data: data,
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