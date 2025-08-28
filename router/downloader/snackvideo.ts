import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeSnackVideo(url: string) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 30000,
    })

    const $ = cheerio.load(html)
    const videoDataScript = $("#VideoObject").html()

    if (!videoDataScript) {
      throw new Error("Video data not found in the page.")
    }

    const videoData = JSON.parse(videoDataScript)

    const result = {
      url: videoData.url || "",
      title: videoData.name || "",
      description: videoData.description || "",
      thumbnail: videoData.thumbnailUrl ? videoData.thumbnailUrl[0] : "",
      uploadDate: videoData.uploadDate ? new Date(videoData.uploadDate).toISOString().split("T")[0] : "",
      videoUrl: videoData.contentUrl || "",
      duration: formatDuration(videoData.duration),
      interaction: {
        views:
          videoData.interactionStatistic?.find(
            (stat: any) => stat.interactionType["@type"] === "https://schema.org/WatchAction",
          )?.userInteractionCount || 0,
        likes:
          videoData.interactionStatistic?.find(
            (stat: any) => stat.interactionType["@type"] === "https://schema.org/LikeAction",
          )?.userInteractionCount || 0,
        shares:
          videoData.interactionStatistic?.find(
            (stat: any) => stat.interactionType["@type"] === "https://schema.org/ShareAction",
          )?.userInteractionCount || 0,
      },
      creator: {
        name: videoData.creator?.mainEntity?.name || "",
        profileUrl: videoData.creator?.mainEntity?.url || "",
        bio: videoData.creator?.mainEntity?.description || "",
      },
    }

    return result
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

function formatDuration(duration: string): string {
  const match = duration.match(/^PT(\d+)M(\d+)S$/)
  if (match) {
    return `${match[1]} minutes ${match[2]} seconds`
  }
  return duration
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/snackvideo",
    name: "snack video",
    category: "Downloader",
    description: "This API endpoint allows you to retrieve detailed information and the direct download link for a video hosted on Snack Video. By providing the Snack Video URL, the API scrapes the necessary data, including the video's title, description, thumbnail, upload date, direct video URL, duration, and interaction statistics (views, likes, shares). It also extracts information about the video's creator, such as their name, profile URL, and bio. This endpoint is designed for developers who need to integrate Snack Video content into their applications or services, offering a comprehensive data payload for each video.",
    tags: ["DOWNLOADER", "Snack Video", "Video Scraper", "Social Media"],
    example: "?url=https://s.snackvideo.com/p/dwlMd51U",
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
        description: "Snack Video URL",
        example: "https://s.snackvideo.com/p/dwlMd51U",
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

      if (!/^https?:\/\/(www\.)?s\.snackvideo\.com\//.test(url.trim())) {
        return {
          status: false,
          error: "Invalid Snack Video URL format",
          code: 400,
        }
      }

      try {
        const videoData = await scrapeSnackVideo(url.trim())
        if (!videoData) {
          return {
            status: false,
            error: "Video data not found",
            code: 404,
          }
        }

        return {
          status: true,
          data: videoData,
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
    endpoint: "/api/d/snackvideo",
    name: "snack video",
    category: "Downloader",
    description: "This API endpoint allows you to retrieve detailed information and the direct download link for a video hosted on Snack Video by providing its URL in the request body. By providing the Snack Video URL, the API scrapes the necessary data, including the video's title, description, thumbnail, upload date, direct video URL, duration, and interaction statistics (views, likes, shares). It also extracts information about the video's creator, such as their name, profile URL, and bio. This endpoint is designed for developers who need to integrate Snack Video content into their applications or services, offering a comprehensive data payload for each video.",
    tags: ["DOWNLOADER", "Snack Video", "Video Scraper", "Social Media"],
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
                description: "Snack Video URL",
                example: "https://s.snackvideo.com/p/dwlMd51U",
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

      if (!/^https?:\/\/(www\.)?s\.snackvideo\.com\//.test(url.trim())) {
        return {
          status: false,
          error: "Invalid Snack Video URL format",
          code: 400,
        }
      }

      try {
        const videoData = await scrapeSnackVideo(url.trim())
        if (!videoData) {
          return {
            status: false,
            error: "Video data not found",
            code: 404,
          }
        }

        return {
          status: true,
          data: videoData,
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