import axios from "axios"
import * as cheerio from "cheerio"

async function downloadCapCutV2(videoUrl: string) {
    try {
        const mainPageResponse = await axios.get('https://anydownloader.com/en/online-capcut-video-downloader-without-watermark/')
        const $ = cheerio.load(mainPageResponse.data)
        const token = $('#token').val()
        
        const encodedUrl = Buffer.from(videoUrl).toString('base64')
        const hash = encodedUrl + '1037YWlvLWRs'
        
        const apiResponse = await axios.post('https://anydownloader.com/wp-json/aio-dl/video-data/', 
            `url=${encodeURIComponent(videoUrl)}&token=${token}&hash=${Buffer.from(hash).toString('base64')}`,
            {
                headers: {
                    'authority': 'anydownloader.com',
                    'accept': '*/*',
                    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': 'https://anydownloader.com',
                    'referer': 'https://anydownloader.com/en/online-capcut-video-downloader-without-watermark/',
                    'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
                    'sec-ch-ua-mobile': '?1',
                    'sec-ch-ua-platform': '"Android"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
                }
            }
        )
        
        const data = apiResponse.data
        const { duration, source, sid, ...filteredData } = data
        return filteredData
    } catch (error) {
        throw error
    }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/capcutv2",
    name: "capcutv2",
    category: "Downloader",
    description: "Alternative CapCut video downloader using third-party service. This API endpoint allows you to download CapCut videos with different quality options including HD No Watermark, No Watermark, and Watermark versions. It provides direct download URLs, file sizes, and format information.",
    tags: ["DOWNLOADER", "CapCut", "Video Download"],
    example: "?url=https://www.capcut.com/tv2/ZSSCR6UFU/",
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
        example: "https://www.capcut.com/tv2/ZSSCR6UFU/",
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
        const result = await downloadCapCutV2(url.trim())
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
    endpoint: "/api/d/capcutv2",
    name: "capcutv2",
    category: "Downloader",
    description: "Alternative CapCut video downloader using third-party service via POST request. This API endpoint allows you to download CapCut videos with different quality options including HD No Watermark, No Watermark, and Watermark versions by providing the URL in the request body.",
    tags: ["DOWNLOADER", "CapCut", "Video Download"],
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
                description: "The CapCut video URL to download",
                example: "https://www.capcut.com/tv2/ZSSCR6UFU/",
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
        const result = await downloadCapCutV2(url.trim())
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