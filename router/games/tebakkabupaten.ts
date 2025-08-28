import axios from "axios"
import * as cheerio from "cheerio"

const baseUrl = "https://id.m.wikipedia.org"

async function fetchImageUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = response.data
    const $ = cheerio.load(html)
    const src = $(
      "tr.mergedtoprow td.infobox-full-data.maptable div.ib-settlement-cols-row div.ib-settlement-cols-cell a.mw-file-description img.mw-file-element",
    ).attr("src")
    return src ? "https:" + src : null
  } catch (error: any) {
    console.error("Error fetching image URL:", error.message)
    return null
  }
}

async function scrape() {
  try {
    const response = await axios.get(baseUrl + "/wiki/Daftar_kabupaten_di_Indonesia", {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = response.data
    const $ = cheerio.load(html)
    const kabupatenList = $("td a[href^='/wiki/Kabupaten']")
      .map((_, element) => {
        const link = $(element).attr("href")
        const name = $(element).attr("title")
        return link && name ? { link: baseUrl + link, name: name } : null
      })
      .get()
      .filter((item) => item !== null) as { link: string; name: string }[]

    if (kabupatenList.length === 0) {
      throw new Error("No kabupaten found")
    }

    const randomKabupaten = kabupatenList[Math.floor(Math.random() * kabupatenList.length)]
    const imageUrl = await fetchImageUrl(randomKabupaten.link)
    const judulBaru = randomKabupaten.name.replace("Kabupaten ", "")
    const ukuranBaru = imageUrl ? imageUrl.replace(/\/\d+px-/, "/1080px-") : null

    return {
      link: randomKabupaten.link,
      title: judulBaru,
      url: ukuranBaru,
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to fetch kabupaten data")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/kabupaten",
    name: "tebak kabupaten",
    category: "Games",
    description: "This API endpoint provides a random Indonesian regency (kabupaten) for a guessing game, including its map image. Each request delivers the name of a regency and a high-resolution URL to its map. This endpoint is ideal for geography quizzes, educational applications, or any platform designed to test knowledge of Indonesian administrative divisions. The response will be a JSON object containing the regency's name, a link to its Wikipedia page, and the URL of its map image.",
    tags: ["Games", "Geography", "Indonesia", "Kabupaten", "Map", "Education"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

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
    endpoint: "/api/games/kabupaten",
    name: "tebak kabupaten",
    category: "Games",
    description: "This API endpoint provides a random Indonesian regency (kabupaten) for a guessing game, including its map image. Each request delivers the name of a regency and a high-resolution URL to its map. This endpoint is ideal for geography quizzes, educational applications, or any platform designed to test knowledge of Indonesian administrative divisions. The response will be a JSON object containing the regency's name, a link to its Wikipedia page, and the URL of its map image.",
    tags: ["Games", "Geography", "Indonesia", "Kabupaten", "Map", "Education"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

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