import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

const baseUrl = "https://oploverz.org"

async function scrapeOploverzDownload(episodeUrl: string) {
  try {
    const { data } = await axios.get(proxy() + episodeUrl + "/", {
      headers: {
        "authority": "oploverz.org",
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
    const $ = cheerio.load(data)

    const title = $("h1.title-post").text().trim()
    const date = $(".date").text().trim()
    const iframeSrc = $("#istream").attr("src")
    const downloadLinks = $("#contdl .links_table tbody tr")
      .map((_, row) => {
        const server = $(row).find("td").eq(0).text().trim().toLowerCase()
        const quality = $(row)
          .find("td")
          .eq(1)
          .text()
          .trim()
          .toLowerCase()
          .split(" ")[0]
        const link =
          baseUrl + ($(row).find("td").eq(2).find("a").attr("href") || "")
        return { server, quality, link }
      })
      .get()

    const formattedLinks = downloadLinks.reduce(
      (acc, { server, quality, link }) => {
        acc[server] = { ...acc[server], [quality]: link }
        return acc
      },
      {}
    )

    return {
      title,
      date,
      iframeSrc,
      downloadLinks: formattedLinks,
    }
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/oploverz-download",
    name: "oploverz download",
    category: "Anime",
    description: "This API endpoint provides download links and details for anime episodes from Oploverz. Users can retrieve information such as the episode title, release date, streaming iframe source, and a structured list of download links categorized by server and quality. This is useful for developers building anime streaming or download applications that require direct access to episode resources from Oploverz. The API scrapes the Oploverz website to extract the relevant data, ensuring up-to-date links.",
    tags: ["Anime", "Download", "Oploverz"],
    example: "?url=https://oploverz.org/anime/captain-tsubasa-season-2-junior-youth-hen-1-episode-30-subtitle-indonesia/",
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
        description: "Oploverz episode URL",
        example: "https://oploverz.org/anime/captain-tsubasa-season-2-junior-youth-hen-1-episode-30-subtitle-indonesia/",
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
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (!url.startsWith(baseUrl)) {
        return {
          status: false,
          error: `URL must be from ${baseUrl}`,
          code: 400,
        }
      }

      try {
        const result = await scrapeOploverzDownload(url.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: result,
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
    endpoint: "/api/anime/oploverz-download",
    name: "oploverz download",
    category: "Anime",
    description: "This API endpoint provides download links and details for anime episodes from Oploverz. Users can retrieve information such as the episode title, release date, streaming iframe source, and a structured list of download links categorized by server and quality. This is useful for developers building anime streaming or download applications that require direct access to episode resources from Oploverz. The API scrapes the Oploverz website to extract the relevant data, ensuring up-to-date links.",
    tags: ["Anime", "Download", "Oploverz"],
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
                description: "Oploverz episode URL",
                example: "https://oploverz.org/anime/captain-tsubasa-season-2-junior-youth-hen-1-episode-30-subtitle-indonesia/",
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
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (!url.startsWith(baseUrl)) {
        return {
          status: false,
          error: `URL must be from ${baseUrl}`,
          code: 400,
        }
      }

      try {
        const result = await scrapeOploverzDownload(url.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: result,
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