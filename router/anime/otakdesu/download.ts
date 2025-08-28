import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function getAnimeDownloadLinks(url: string) {
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
    })
    const $ = cheerio.load(data)

    const episodeInfo = {
      title: $(".download h4").text().trim(),
      downloads: [] as any[],
    }

    $(".download ul li").each((index, element) => {
      const quality = $(element).find("strong").text().trim()
      const links = $(element)
        .find("a")
        .map((i, el) => ({
          quality,
          link: $(el).attr("href"),
          host: $(el).text().trim(),
        }))
        .get()
      episodeInfo.downloads.push(...links)
    })
    return episodeInfo
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/otakudesu/download",
    name: "otakudesu download",
    category: "Anime",
    description: "This API endpoint retrieves available download links for a specific anime episode from Otakudesu. Users provide the URL of the anime's download page, and the API extracts the episode title and a list of download options, including different qualities, direct links, and hosting providers. This is highly beneficial for applications that aim to provide direct download access to anime content from Otakudesu, enabling users to download episodes in their preferred quality.",
    tags: ["Anime", "Otakudesu", "Download"],
    example: "?url=https://otakudesu.cloud/lengkap/btr-nng-sub-indo-part-1/",
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
        description: "Otakudesu anime download page URL",
        example: "https://otakudesu.cloud/lengkap/btr-nng-sub-indo-part-1/",
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
        const data = await getAnimeDownloadLinks(url.trim())
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
    endpoint: "/api/anime/otakudesu/download",
    name: "otakudesu download",
    category: "Anime",
    description: "This API endpoint provides access to download links for a specific anime episode available on Otakudesu. By submitting the URL of the anime's download page in the JSON request body, users can obtain the episode title and a structured list of download options, categorized by quality, along with their respective direct links and hosting providers. This POST route is designed for automated processes or applications that need to programmatically fetch download information for anime content from Otakudesu.",
    tags: ["Anime", "Otakudesu", "Download"],
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
                description: "Otakudesu anime download page URL",
                example: "https://otakudesu.cloud/lengkap/btr-nng-sub-indo-part-1/",
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
        const data = await getAnimeDownloadLinks(url.trim())
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