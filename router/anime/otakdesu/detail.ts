import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function getAnimeDetail(url: string) {
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
    })
    const $ = cheerio.load(data)

    const animeInfo = {
      title: $(".fotoanime .infozingle p span b:contains('Judul')")
        .parent()
        .text()
        .replace("Judul: ", "")
        .trim(),
      japaneseTitle: $(".fotoanime .infozingle p span b:contains('Japanese')")
        .parent()
        .text()
        .replace("Japanese: ", "")
        .trim(),
      score: $(".fotoanime .infozingle p span b:contains('Skor')")
        .parent()
        .text()
        .replace("Skor: ", "")
        .trim(),
      producer: $(".fotoanime .infozingle p span b:contains('Produser')")
        .parent()
        .text()
        .replace("Produser: ", "")
        .trim(),
      type: $(".fotoanime .infozingle p span b:contains('Tipe')")
        .parent()
        .text()
        .replace("Tipe: ", "")
        .trim(),
      status: $(".fotoanime .infozingle p span b:contains('Status')")
        .parent()
        .text()
        .replace("Status: ", "")
        .trim(),
      totalEpisodes: $(
        ".fotoanime .infozingle p span b:contains('Total Episode')",
      )
        .parent()
        .text()
        .replace("Total Episode: ", "")
        .trim(),
      duration: $(".fotoanime .infozingle p span b:contains('Durasi')")
        .parent()
        .text()
        .replace("Durasi: ", "")
        .trim(),
      releaseDate: $(
        ".fotoanime .infozingle p span b:contains('Tanggal Rilis')",
      )
        .parent()
        .text()
        .replace("Tanggal Rilis: ", "")
        .trim(),
      studio: $(".fotoanime .infozingle p span b:contains('Studio')")
        .parent()
        .text()
        .replace("Studio: ", "")
        .trim(),
      genres: $(".fotoanime .infozingle p span b:contains('Genre')")
        .parent()
        .text()
        .replace("Genre: ", "")
        .trim(),
      imageUrl: $(".fotoanime img").attr("src"),
    }

    const episodes: any[] = []
    $(".episodelist ul li").each((index, element) => {
      const episodeTitle = $(element).find("span a").text()
      const episodeLink = $(element).find("span a").attr("href")
      const episodeDate = $(element).find(".zeebr").text()
      episodes.push({
        title: episodeTitle,
        link: episodeLink,
        date: episodeDate,
      })
    })

    return {
      animeInfo,
      episodes,
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/otakudesu/detail",
    name: "otakudesu detail",
    category: "Anime",
    description: "This API endpoint provides comprehensive details and a full episode list for a specific anime from Otakudesu. Users can retrieve extensive information such as the anime's title (English and Japanese), score, producer, type, status, total episodes, duration, release date, studio, genres, and image URL. Additionally, it lists all episodes with their titles, links, and release dates. This is highly valuable for applications that require detailed anime data from Otakudesu for display, tracking, or database integration.",
    tags: ["Anime", "Otakudesu", "Detail"],
    example: "?url=https://otakudesu.cloud/anime/borto-sub-indo/",
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
        description: "Otakudesu anime detail URL",
        example: "https://otakudesu.cloud/anime/borto-sub-indo/",
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
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await getAnimeDetail(url.trim())
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
    endpoint: "/api/anime/otakudesu/detail",
    name: "otakudesu detail",
    category: "Anime",
    description: "This API endpoint enables users to retrieve comprehensive details and an exhaustive episode list for a specific anime from Otakudesu by submitting the anime's URL in the JSON request body. It provides rich data including the anime's title (English and Japanese), score, producer, type, status, total episodes, duration, release date, studio, genres, and image URL. Additionally, it furnishes a complete list of episodes, each with its title, link, and release date. This POST route is ideal for automated systems or applications that dynamically fetch anime information from Otakudesu for detailed analysis or integration into various platforms.",
    tags: ["Anime", "Otakudesu", "Detail"],
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
                description: "Otakudesu anime detail URL",
                example: "https://otakudesu.cloud/anime/borto-sub-indo/",
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
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await getAnimeDetail(url.trim())
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