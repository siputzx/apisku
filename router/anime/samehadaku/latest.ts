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

async function getLatestSamehadakuAnime() {
  try {
    const baseUrl = await getBaseUrl()
    const url = baseUrl + "/anime-terbaru/"
    const response = await axios.get(proxy() + url, {
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

    if (response.statusText !== "OK") throw new Error("Website is down")

    const $ = cheerio.load(response.data)
    const ul = $("div.post-show > ul").children("li")

    const animeList: any[] = []
    ul.each((i, el) => {
      animeList.push({
        title: $(el)
          .find("h2.entry-title")
          .text()
          .trim()
          .split(" Episode")[0],
        thumbnail: $(el).find("div.thumb > a > img").attr("src") || "",
        postedBy: $(el)
          .find("span[itemprop='author'] > author")
          .text()
          .trim(),
        episode: $(el).find("span").eq(0).find("author").text().trim(),
        release: $(el)
          .find("span[itemprop='author']")
          .next()
          .contents()
          .eq(3)
          .text()
          .split(": ")[1]
          .trim(),
        link: $(el).find("a").attr("href") || "",
      })
    })

    return {
      total: animeList.length,
      anime: animeList,
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/samehadaku/latest",
    name: "samehadaku latest",
    category: "Anime",
    description: "This API endpoint provides a list of the latest released anime episodes from Samehadaku. It fetches information such as the anime's title, thumbnail, who posted it, episode number, release date, and a direct link to the episode page. This is highly useful for applications that need to keep users updated on new anime releases, allowing them to track and display the most recent content from Samehadaku.",
    tags: ["Anime", "Samehadaku", "Latest"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await getLatestSamehadakuAnime()
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
    endpoint: "/api/anime/samehadaku/latest",
    name: "samehadaku latest",
    category: "Anime",
    description: "This API endpoint provides a list of the latest released anime episodes from Samehadaku. It fetches information such as the anime's title, thumbnail, who posted it, episode number, release date, and a direct link to the episode page. This POST route offers programmatic access to the latest anime data, suitable for automated systems or services that need to periodically retrieve and process new anime releases without requiring any specific request body parameters.",
    tags: ["Anime", "Samehadaku", "Latest"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await getLatestSamehadakuAnime()
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