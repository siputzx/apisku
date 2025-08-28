import axios from "axios"
import { wrapper } from "axios-cookiejar-support"
import * as tough from "tough-cookie"
import * as cheerio from "cheerio"

const jar = new tough.CookieJar()
const client = wrapper(axios.create({ jar }))

class ThreadsScraper {
  private cookieJar: tough.CookieJar
  private axiosInstance: ReturnType<typeof wrapper>

  constructor() {
    this.cookieJar = new tough.CookieJar()
    this.axiosInstance = wrapper(
      axios.create({
        jar: this.cookieJar,
        withCredentials: true,
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
        },
      }),
    )
  }

  async scrapeProfile(username: string) {
    try {
      const url = `https://www.threads.net/@${username}`
      const response = await this.axiosInstance.get(url)
      if (response.status !== 200) return null

      const $ = cheerio.load(response.data)
      const scriptData = this.extractScriptData($)
      if (scriptData) {
        const userData = this.extractUserData(scriptData)
        return this.cleanUserData(userData)
      } else {
        const alternativeData = this.extractAlternativeData($)
        return this.cleanUserData(alternativeData)
      }
    } catch (error) {
      return null
    }
  }

  extractScriptData($: cheerio.CheerioAPI) {
    let foundData: any = null
    $('script[data-sjs]').each((_, element) => {
      const content = $(element).html()
      if (content && content.includes("user") && content.includes("profile_pic_url")) {
        const match = content.match(/\{"require":\[\[.*\]\]\}/)
        if (match) {
          try {
            foundData = JSON.parse(match[0])
            return false
          } catch (e) {}
        }
      }
    })

    if (!foundData) {
      $('script[type="application/json"]').each((_, element) => {
        const content = $(element).html()
        if (content && content.includes("profile_pic_url") && content.includes("username")) {
          try {
            foundData = JSON.parse(content)
            return false
          } catch (e) {}
        }
      })
    }

    return foundData
  }

  extractAlternativeData($: cheerio.CheerioAPI) {
    let userData: any = null
    $("script").each((_, element) => {
      const content = $(element).html()
      if (content && content.includes("profile_pic_url")) {
        const match = content.match(
          /"username":"([^"]+)".*?"full_name":"([^"]+)".*?"profile_pic_url":"([^"]+)"/,
        )
        if (match) {
          userData = {
            username: match[1],
            full_name: match[2],
            profile_pic_url: match[3].replace(/\\u002F/g, "/").replace(/\\/g, ""),
          }
          return false
        }
      }
    })
    return userData
  }

  extractUserData(jsonData: any) {
    try {
      const require = jsonData.require
      if (!require || !Array.isArray(require)) return null

      for (let item of require) {
        if (Array.isArray(item) && item.length >= 4) {
          const data = item[3]
          if (data && Array.isArray(data)) {
            for (let subItem of data) {
              const bbox = (subItem as any).__bbox
              if (bbox?.require && Array.isArray(bbox.require)) {
                for (let reqItem of bbox.require) {
                  if (Array.isArray(reqItem) && reqItem.length >= 4) {
                    const reqData = reqItem[3]
                    if (reqData && Array.isArray(reqData) && reqData.length >= 2) {
                      const result = reqData[1]
                      if ((result as any)?.__bbox?.result?.data?.user) {
                        return (result as any).__bbox.result.data.user
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      const str = JSON.stringify(jsonData)
      const match = str.match(/"user":\s*(\{(?:[^{}]|{[^{}]*})*\})/)
      if (match) return JSON.parse(match[1])

      return null
    } catch (e) {
      return null
    }
  }

  cleanUserData(data: any) {
    if (!data) return null
    return {
      id: data.pk || data.id || null,
      username: data.username || null,
      name: data.full_name || null,
      bio: data.biography || null,
      profile_picture: data.profile_pic_url || null,
      hd_profile_picture: data.hd_profile_pic_versions?.[0]?.url || null,
      is_verified: data.is_verified || false,
      followers: data.follower_count || 0,
      links: (data.bio_links || []).map((link: any) => link.url),
    }
  }
}

async function scrapeThreads(username: string) {
  const scraper = new ThreadsScraper()
  return scraper.scrapeProfile(username)
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/threads",
    name: "threads",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a Threads user by providing their username as a query parameter. It scrapes data such as their ID, username, full name, biography, profile pictures (standard and HD), verification status, follower count, and external links in their bio. This is ideal for applications needing to display Threads user profiles or analyze public Threads data.",
    tags: ["Stalker", "Threads", "User", "Profile"],
    example: "?q=google",
    parameters: [
      {
        name: "q",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The Threads username (without @)",
        example: "google",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.query || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter (username) is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter (username) must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await scrapeThreads(q.trim())
        if (!data) {
          return {
            status: false,
            error: "User not found or failed to extract data",
            code: 404,
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
    endpoint: "/api/stalk/threads",
    name: "threads",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a Threads user by providing their username in a JSON request body. It scrapes data such as their ID, username, full name, biography, profile pictures (standard and HD), verification status, follower count, and external links in their bio. This is ideal for applications needing to display Threads user profiles or analyze public Threads data.",
    tags: ["Stalker", "Threads", "User", "Profile"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["q"],
            properties: {
              q: {
                type: "string",
                description: "The Threads username (without @)",
                example: "google",
                minLength: 1,
                maxLength: 255,
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
      const { q } = req.body || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter (username) is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter (username) must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await scrapeThreads(q.trim())
        if (!data) {
          return {
            status: false,
            error: "User not found or failed to extract data",
            code: 404,
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