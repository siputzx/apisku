import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

const baseUrl = "https://otakudesu.cloud/"

async function getOngoingAnime() {
  try {
    const { data } = await axios.get(proxy() + baseUrl, {
      timeout: 30000,
    })
    const $ = cheerio.load(data)
    const results: any[] = []

    $(".venz ul li").each((index, element) => {
      const episode = $(element).find(".epz").text().trim()
      const type = $(element).find(".epztipe").text().trim()
      const date = $(element).find(".newnime").text().trim()
      const title = $(element).find(".jdlflm").text().trim()
      const link = $(element).find("a").attr("href")
      const image = $(element).find("img").attr("src")

      results.push({
        episode,
        type,
        date,
        title,
        link,
        image,
      })
    })

    return results
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/otakudesu/ongoing",
    name: "otakudesu ongoing",
    category: "Anime",
    description: "This API endpoint provides a list of ongoing anime series from Otakudesu. It fetches details for each ongoing anime, including the episode number, type, release date, title, a direct link to the anime page, and a thumbnail image. This is useful for applications that need to display currently airing anime, helping users to stay updated with the latest episodes as they are released.",
    tags: ["Anime", "Otakudesu", "Ongoing"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await getOngoingAnime()
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
    endpoint: "/api/anime/otakudesu/ongoing",
    name: "otakudesu ongoing",
    category: "Anime",
    description: "This API endpoint provides a list of ongoing anime series from Otakudesu. It fetches details for each ongoing anime, including the episode number, type, release date, title, a direct link to the anime page, and a thumbnail image. This POST route offers programmatic access to ongoing anime data, suitable for automated systems or services that need to periodically retrieve and process new ongoing anime releases without requiring any specific request body parameters.",
    tags: ["Anime", "Otakudesu", "Ongoing"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await getOngoingAnime()
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