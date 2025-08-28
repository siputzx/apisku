import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function scrapeLatestAnime() {
  try {
    const domain = "https://anichin.team/"
    const response = await axios.get(proxy() + domain, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $domain = cheerio.load(response.data)
    const redirectScriptContent = $domain("script").filter(function () {
      return $domain(this).html()?.includes("setTimeout")
    }).html()

    if (!redirectScriptContent) {
      throw new Error("Redirect script content not found")
    }

    const urlMatch = redirectScriptContent.match(/location\.href = '(https:\/\/[^']+)'/)
    if (!urlMatch || !urlMatch[1]) {
      throw new Error("Redirect URL not found in script")
    }

    const { data } = await axios.get(proxy() + urlMatch[1], {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)
    const results: { title: string | undefined, url: string | undefined, episode: string, thumbnail: string | undefined, type: string }[] = []

    $(".listupd.normal .bs").each((_, element) => {
      const linkElement = $(element).find("a")
      const title = linkElement.attr("title")
      const url = linkElement.attr("href")
      const episode = $(element).find(".bt .epx").text().trim()
      const thumbnail = $(element).find("img").attr("src")
      const type = $(element).find(".typez").text().trim()
      results.push({
        title: title,
        url: url,
        episode: episode,
        thumbnail: thumbnail,
        type: type,
      })
    })
    return results
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Error scraping latest anime: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/anichin-latest",
    name: "anichin latest",
    category: "Anime",
    description: "This API endpoint provides the latest anime updates from Anichin. It scrapes the main page to identify newly released episodes or series, including their titles, URLs, episode numbers, thumbnails, and types (e.g., 'TV', 'Movie'). This is useful for users or applications that want to stay updated with the newest anime content available on Anichin.",
    tags: ["ANIME", "LATEST", "SCRAPING"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeLatestAnime()

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
    endpoint: "/api/anime/anichin-latest",
    name: "anichin latest",
    category: "Anime",
    description: "This API endpoint provides the latest anime updates from Anichin. It scrapes the main page to identify newly released episodes or series, including their titles, URLs, episode numbers, thumbnails, and types (e.g., 'TV', 'Movie'). This is useful for users or applications that want to stay updated with the newest anime content available on Anichin.",
    tags: ["ANIME", "LATEST", "SCRAPING"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeLatestAnime()

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