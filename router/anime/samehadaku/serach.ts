import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function getBaseUrl() {
  try {
    const response = await axios.get(proxy() + "https://samehadaku.care/", {
      timeout: 30000,
    })
    const $ = cheerio.load(response.data)
    const scriptContent = $('script')
      .filter(function () {
        return $(this).html()!.includes("window.location.href")
      })
      .html()

    const urlMatch = scriptContent!.match(
      /window\.location\.href\s*=\s*['"]([^'"]+)['"]/,
    )
    if (urlMatch) {
      return urlMatch[1]
    } else {
      throw new Error("Base URL not found")
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

async function searchSamehadakuAnime(query: string) {
  try {
    const baseUrl = await getBaseUrl()
    const response = await axios.get(
      proxy() + baseUrl + "/?" + new URLSearchParams({ s: query }),
      {
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
      },
    )
    if (response.statusText !== "OK") throw new Error("Failed to fetch data")

    const $ = cheerio.load(response.data)

    if ($("main#main").find(".notfound").length) {
      throw new Error("Query not found")
    }

    const animeList: any[] = []
    $("main#main")
      .find("article.animpost")
      .each((i, el) => {
        animeList.push({
          title: $(el).find("img").attr("title")?.trim(),
          id: $(el).attr("id")?.split("-")[1] || "",
          thumbnail: $(el).find("img").attr("src") || "",
          description: $(el).find("div.ttls").text().trim(),
          genre: $(el)
            .find("div.genres > .mta > a")
            .map((i, el) => $(el).text().trim())
            .get(),
          type: $(el)
            .find("div.type")
            .map((i, el) => $(el).text().trim())
            .get(),
          star: $(el).find("div.score").text().trim(),
          views: $(el).find("div.metadata > span").eq(2).text().trim(),
          link: $(el).find("a").attr("href") || "",
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
    endpoint: "/api/anime/samehadaku/search",
    name: "samehadaku search",
    category: "Anime",
    description: "This API endpoint allows users to search for anime on Samehadaku. By providing a search query, the API returns a list of matching anime, including details such as their title, unique ID, thumbnail image, a brief description, genres, type, star rating, view count, and a direct link to the anime's page on Samehadaku. This is ideal for integrating anime search functionality into applications or bots, enabling users to quickly find anime titles and access their information.",
    tags: ["Anime", "Samehadaku", "Search"],
    example: "?query=naruto",
    parameters: [
      {
        name: "query",
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
      const { query } = req.query || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await searchSamehadakuAnime(query.trim())
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
    endpoint: "/api/anime/samehadaku/search",
    name: "samehadaku search",
    category: "Anime",
    description: "This API endpoint enables users to search for anime on Samehadaku by providing a search query within the JSON request body. Upon successful execution, it returns a structured list of matching anime, each containing details such as its title, unique identifier, thumbnail URL, a concise description, associated genres, anime type, star rating, view count, and the direct link to its page on Samehadaku. This POST method is particularly suitable for automated systems or complex applications that need to send search queries programmatically, allowing for more robust and flexible integration of Samehadaku's anime search capabilities.",
    tags: ["Anime", "Samehadaku", "Search"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
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
      const { query } = req.body || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await searchSamehadakuAnime(query.trim())
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