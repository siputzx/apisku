import axios from "axios"
import * as cheerio from "cheerio"

async function driveScrape(url: string) {
  try {
    if (!/drive\.google\.com\/file\/d\//gi.test(url)) {
      throw new Error("Invalid URL")
    }
    const res = await axios.get(url, { timeout: 30000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" } }).then((v) => v.data)
    const $ = cheerio.load(res)
    const id = url.split("/")[5]
    const data = {
      name: $("head").find("title").text().split("-")[0].trim(),
      download: `https://drive.usercontent.google.com/uc?id=${id}&export=download`,
      link: url,
    }
    return data
  } catch (e: any) {
    console.error("API Error:", e.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/gdrive",
    name: "gdrive",
    category: "Downloader",
    description: "This API endpoint allows you to obtain a direct download link for a Google Drive file by providing its public URL. It scrapes the Google Drive page to extract the file name and constructs a direct download URL. This is useful for integrating Google Drive file downloads into applications or scripts without manual intervention. Ensure the Google Drive file is publicly accessible or shared with 'Anyone with the link' for the API to function correctly. The response will include the file name, the direct download link, and the original Google Drive link.",
    tags: ["DOWNLOADER", "Google Drive", "File Download"],
    example: "?url=https://drive.google.com/file/d/1YTD7Ymux9puFNqu__5WPlYdFZHcGI3Wz/view?usp=drivesdk",
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
        description: "Google Drive URL",
        example: "https://drive.google.com/file/d/1YTD7Ymux9puFNqu__5WPlYdFZHcGI3Wz/view?usp=drivesdk",
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

      if (!/drive\.google\.com\/file\/d\//gi.test(url.trim())) {
        return {
          status: false,
          error: "Invalid Google Drive URL format",
          code: 400,
        }
      }

      try {
        const result = await driveScrape(url.trim())

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
    endpoint: "/api/d/gdrive",
    name: "gdrive",
    category: "Downloader",
    description: "This API endpoint allows you to obtain a direct download link for a Google Drive file by providing its public URL in the request body. It scrapes the Google Drive page to extract the file name and constructs a direct download URL. This is useful for integrating Google Drive file downloads into applications or scripts without manual intervention. Ensure the Google Drive file is publicly accessible or shared with 'Anyone with the link' for the API to function correctly. The response will include the file name, the direct download link, and the original Google Drive link.",
    tags: ["DOWNLOADER", "Google Drive", "File Download"],
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
                description: "Google Drive URL",
                example: "https://drive.google.com/file/d/1YTD7Ymux9puFNqu__5WPlYdFZHcGI3Wz/view?usp=drivesdk",
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

      if (!/drive\.google\.com\/file\/d\//gi.test(url.trim())) {
        return {
          status: false,
          error: "Invalid Google Drive URL format",
          code: 400,
        }
      }

      try {
        const result = await driveScrape(url.trim())

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