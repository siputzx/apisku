import axios from "axios"
import * as cheerio from "cheerio"
import FormData from "form-data"
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

async function getSamehadakuDownload(url: string) {
  try {
    const baseUrl = await getBaseUrl()
    if (!/samehadaku\.\w+\/[\w-]+episode/gi.test(url)) {
      throw new Error("Invalid URL!")
    }

    const html = await axios.get(proxy() + url, {
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

    if (html.statusText !== "OK") throw new Error("Error Fetching")

    const $ = cheerio.load(html.data)
    const data = {
      title: $('h1[itemprop="name"]').text().trim(),
      link: url,
      downloads: [] as any[],
    }

    const downloadItems = $('div#server > ul > li').toArray()
    data.downloads = await Promise.all(
      downloadItems.map(async (el) => {
        const v = {
          name: $(el).find('span').text().trim(),
          post: $(el).find('div').attr('data-post') || '',
          nume: $(el).find('div').attr('data-nume') || '',
          type: $(el).find('div').attr('data-type') || '',
          link: "",
        }

        const formData = new FormData()
        formData.append("action", "player_ajax")
        formData.append("post", v.post)
        formData.append("nume", v.nume)
        formData.append("type", v.type)

        try {
          const res = await axios.post(proxy() + baseUrl + "/wp-admin/admin-ajax.php", formData, {
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
              "origin": new URL(baseUrl).origin,
              ...formData.getHeaders(),
            },
            timeout: 30000,
          })

          const iframe = cheerio.load(res.data)("iframe").attr("src")
          v.link = iframe || ""
        } catch (e: any) {
          v.link = ""
        }

        return v
      }),
    )

    return data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/anime/samehadaku/download",
    name: "samehadaku download",
    category: "Anime",
    description: "This API endpoint retrieves download links for a specific anime episode from Samehadaku. Users provide the URL of the episode page, and the API extracts the title, original link, and a list of available download options, including their names, and generated direct download links. This is useful for applications requiring direct download access to anime episodes from Samehadaku for offline viewing or integration into media libraries.",
    tags: ["Anime", "Samehadaku", "Download"],
    example: "?url=https://samehadaku.email/rekishi-ni-nokoru-akujo-ni-naru-zo-episode-9",
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
        description: "Anime episode URL",
        example: "https://samehadaku.email/rekishi-ni-nokoru-akujo-ni-naru-zo-episode-9",
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
        const data = await getSamehadakuDownload(url.trim())
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
    endpoint: "/api/anime/samehadaku/download",
    name: "samehadaku download",
    category: "Anime",
    description: "This API endpoint facilitates retrieving download links for a particular anime episode from Samehadaku. By providing the episode URL in the request body, users can obtain the episode's title, its original URL, and a list of various download options with their respective names and direct download links. This POST route is designed for scenarios where the episode URL is dynamically generated or part of a structured data submission, enabling seamless integration into automated anime content management systems or download managers.",
    tags: ["Anime", "Samehadaku", "Download"],
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
                description: "Anime episode URL",
                example: "https://samehadaku.email/rekishi-ni-nokoru-akujo-ni-naru-zo-episode-9",
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
        const data = await getSamehadakuDownload(url.trim())
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