import axios from "axios"
import * as cheerio from "cheerio"
import { URLSearchParams } from "url"

async function scrapeTwitter(videoUrl: string) {
  const apiUrl = "https://snaptwitter.com/action.php"
  try {
    const { data: html } = await axios.get("https://snaptwitter.com/")
    const $tok = cheerio.load(html)
    const tokenValue = $tok('input[name="token"]').attr("value")

    const formData = new URLSearchParams()
    formData.append("url", videoUrl)
    formData.append("token", tokenValue || "")

    const config = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
    const response = await axios.post(apiUrl, formData, config)
    const $ = cheerio.load(response.data.data)

    const result = {
      imgUrl: $(".videotikmate-left img").attr("src"),
      downloadLink: `${$(".abuttons a").attr("href")}`,
      videoTitle: $(".videotikmate-middle h1").text().trim(),
      videoDescription: $(".videotikmate-middle p span").text().trim(),
    }

    return result
  } catch (error: any) {
    console.error("Error downloading video:", error)
    throw new Error("Failed to download video data")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/twitter",
    name: "twitter",
    category: "Downloader",
    description: "This API endpoint allows users to download videos from Twitter by providing the video's URL. It fetches the necessary token from the SnapTwitter website, constructs a POST request with the video URL and token, and then scrapes the resulting HTML to extract the image URL, download link, video title, and description. This tool is useful for archiving Twitter videos or sharing them across platforms where direct Twitter links might not be easily accessible or playable.",
    tags: ["Downloader", "Twitter", "Video", "Social Media", "Media"],
    example: "?url=https://twitter.com/9GAG/status/1661175429859012608",
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
        description: "Twitter video URL",
        example: "https://twitter.com/9GAG/status/1661175429859012608",
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
        const result = await scrapeTwitter(url.trim())

        if (!result) {
          return {
            status: false,
            error: "Failed to download video data",
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
    endpoint: "/api/d/twitter",
    name: "twitter",
    category: "Downloader",
    description: "This API endpoint allows users to download videos from Twitter by providing the video's URL. It fetches the necessary token from the SnapTwitter website, constructs a POST request with the video URL and token, and then scrapes the resulting HTML to extract the image URL, download link, video title, and description. This tool is useful for archiving Twitter videos or sharing them across platforms where direct Twitter links might not be easily accessible or playable.",
    tags: ["Downloader", "Twitter", "Video", "Social Media", "Media"],
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
                description: "Twitter video URL",
                example: "https://twitter.com/9GAG/status/1661175429859012608",
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
        const result = await scrapeTwitter(url.trim())

        if (!result) {
          return {
            status: false,
            error: "Failed to download video data",
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