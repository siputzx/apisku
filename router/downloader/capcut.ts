import axios from "axios"
import { CookieJar } from "tough-cookie"
import { wrapper } from "axios-cookiejar-support"
import * as cheerio from "cheerio"

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

async function getTemplateId(capcutUrl: string) {
  try {
    const response = await client.get(encodeURI(capcutUrl), {
      headers: {
        "authority": "www.capcut.com",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      },
      maxRedirects: 10,
      validateStatus: function (status) {
        return status >= 200 && status < 400
      },
    })

    const redirectedUrl = response.request.res.responseUrl || capcutUrl

    let id: string | null = null

    if (redirectedUrl) {
      const redirectedDetailNumericIdMatch = redirectedUrl.match(/\/template-detail\/(?:[a-zA-Z0-9-]+)?\/(\d+)|\/templates\/(\d+)/)
      if (redirectedDetailNumericIdMatch) {
        id = redirectedDetailNumericIdMatch[1] || redirectedDetailNumericIdMatch[2]
        return id
      }

      const redirectedDetailStringIdMatch = redirectedUrl.match(/\/template-detail\/([a-zA-Z0-9-]+)/)
      if (redirectedDetailStringIdMatch && !id) {
        id = redirectedDetailStringIdMatch[1]
        return id
      }

      const urlParams = new URLSearchParams(new URL(redirectedUrl).search)
      const templateIdParam = urlParams.get("template_id")
      if (templateIdParam) {
        id = templateIdParam
        return id
      }
    }

    if (id) {
      return id
    } else {
      return null
    }
  } catch (error: any) {
    console.error("Error fetching CapCut URL:", error)
    return null
  }
}

async function getMeta(shortUrl: string) {
  try {
    const response = await axios.get(shortUrl, {
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      },
    })

    const html = response.data
    const $ = cheerio.load(html)

    let templateDataJson: any = null

    $('script').each((i, el) => {
      const scriptText = $(el).html()
      if (scriptText && scriptText.includes('window._ROUTER_DATA')) {
        try {
          const startIndex = scriptText.indexOf('{', scriptText.indexOf('window._ROUTER_DATA'))
          if (startIndex !== -1) {
            let jsonDataString = scriptText.substring(startIndex)

            let bracketCount = 0
            let endIndex = -1
            for (let j = 0; j < jsonDataString.length; j++) {
              if (jsonDataString[j] === '{') {
                bracketCount++
              } else if (jsonDataString[j] === '}') {
                bracketCount--
                if (bracketCount === 0) {
                  endIndex = j + 1
                  break
                }
              }
            }
            if (endIndex !== -1) {
              jsonDataString = jsonDataString.substring(0, endIndex)
              templateDataJson = JSON.parse(jsonDataString)
              return false
            }
          }
        } catch (e: any) {
          console.error("Error parsing JSON:", e)
        }
      }
    })

    if (templateDataJson && templateDataJson.loaderData && templateDataJson.loaderData['template-detail_$'] && templateDataJson.loaderData['template-detail_$'].templateDetail && templateDataJson.loaderData['template-detail_$'].templateDetail.videoUrl) {
      let template = templateDataJson.loaderData['template-detail_$'].templateDetail

      let result = {
        title: template.title,
        desc: template.desc,
        like: template.likeAmount,
        play: template.playAmount,
        duration: template.templateDuration,
        usage: template.usageAmount,
        createTime: template.createTime,
        coverUrl: template.coverUrl,
        videoRatio: template.videoRatio,
        author: template.author,
      }

      return result
    } else {
      throw new Error('Video URL tidak ditemukan')
    }
  } catch (error: any) {
    console.error('Error fetching CapCut URL:', error)
    throw error
  }
}

async function capcutdl(capcutUrl: string, meta = true) {
  try {
    if (!capcutUrl) throw new Error('Mana URLnya?')

    const templateId = await getTemplateId(capcutUrl)

    if (!templateId) {
      throw new Error('Template ID tidak ditemukan dari URL')
    }

    const response = await axios.get(`https://www.capcut.com/templates/${templateId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      },
    })

    const html = response.data
    const $ = cheerio.load(html)

    let videoData: any = null

    $('script[type="application/ld+json"]').each((i, el) => {
      const scriptText = $(el).html()
      try {
        videoData = JSON.parse(scriptText as string)
        return false
      } catch (e: any) {
        console.error("Error parsing JSON:", e)
      }
    })

    if (videoData) {
      if (meta) {
        try {
          const metaData = await getMeta(capcutUrl)
          videoData = { ...videoData, meta: metaData }
        } catch (metaError: any) {
          console.warn('Error getting meta data:', metaError.message)
        }
      }

      const outputData = {
        url: capcutUrl,
        templateId: templateId,
        timestamp: new Date().toISOString(),
        data: videoData,
      }

      return videoData
    } else {
      throw new Error('Data VideoObject tidak ditemukan dalam LD+JSON')
    }
  } catch (error: any) {
    console.error('Error fetching CapCut URL:', error)
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/capcut",
    name: "capcut",
    category: "Downloader",
    description: "This API endpoint allows you to retrieve comprehensive metadata for a CapCut video by providing its URL. It scrapes the CapCut website to extract details such as the video's title, description, like count, play count, duration, usage statistics, creation time, cover image URL, video ratio, and author information. This is useful for applications needing to display CapCut video details or integrate CapCut content.",
    tags: ["DOWNLOADER", "CapCut", "Video Metadata"],
    example: "?url=https://www.capcut.com/tv2/ZSBwF9X2g/ perlu di ingat",
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
        description: "CapCut video URL",
        example: "https://www.capcut.com/tv2/ZSBwF9X2g/ perlu di ingat",
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

      try {
        const result = await capcutdl(url.trim())
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          return {
            status: false,
            error: "Invalid URL or video not found.",
            code: 404,
          }
        }
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
    endpoint: "/api/d/capcut",
    name: "capcut",
    category: "Downloader",
    description: "This API endpoint allows you to retrieve comprehensive metadata for a CapCut video by providing its URL in the request body. It scrapes the CapCut website to extract details such as the video's title, description, like count, play count, duration, usage statistics, creation time, cover image URL, video ratio, and author information. This is useful for applications needing to display CapCut video details or integrate CapCut content, especially when dealing with structured data payloads.",
    tags: ["DOWNLOADER", "CapCut", "Video Metadata"],
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
                description: "The CapCut video URL to fetch metadata from",
                example: "https://www.capcut.com/tv2/ZSBwF9X2g/ perlu di ingat",
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

      try {
        const result = await capcutdl(url.trim())
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          return {
            status: false,
            error: "Invalid URL or video not found.",
            code: 404,
          }
        }
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]