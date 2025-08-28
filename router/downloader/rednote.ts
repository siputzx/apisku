import axios from "axios"

async function scrapeRednote(url: string) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0",
      },
      timeout: 30000,
    })

    const title =
      (data.match(/<title>(.*?)<\/title>/i) || [])[1]?.trim() || ""
    const desc =
      (data.match(/<meta\s+name="description"\s+content="(.*?)"/i) ||
        [])[1]?.trim() || ""
    const keywords =
      (data.match(/<meta\s+name="keywords"\s+content="(.*?)"/i) ||
        [])[1]?.trim() || ""
    const videoUrl =
      (data.match(/<meta\s+name="og:video"\s+content="(.*?)"/i) ||
        [])[1]?.trim() || ""
    const noteId =
      (data.match(/<meta\s+name="og:url"\s+content="(.*?)"/i) || [])[1]
        ?.trim()
        .split("/")
        .pop() || ""
    const duration =
      (data.match(/<meta\s+name="og:videotime"\s+content="(.*?)"/i) ||
        [])[1]?.trim() || ""
    const nickname =
      (data.match(/<meta\s+name="og:title"\s+content="(.*?)"/i) || [])[1]
        ?.trim()
        .split(" - ")[0] || ""

    const images: string[] = []
    const imgMatches =
      data.match(/<meta\s+name="og:image"\s+content="(.*?)"/gi) || []
    imgMatches.forEach((match: string) => {
      const img = (match.match(/content="(.*?)"/i) || [])[1]?.trim()
      if (img) images.push(img)
    })

    const noteComments =
      (data.match(/<meta\s+name="og:xhs:note_comment"\s+content="(.*?)"/i) ||
        [])[1]?.trim() || ""
    const noteLikes =
      (data.match(/<meta\s+name="og:xhs:note_like"\s+content="(.*?)"/i) ||
        [])[1]?.trim() || ""
    const noteCollects =
      (data.match(/<meta\s+name="og:xhs:note_collect"\s+content="(.*?)"/i) ||
        [])[1]?.trim() || ""

    return {
      noteId,
      nickname,
      title,
      desc,
      keywords,
      duration,
      engagement: {
        likes: noteLikes,
        comments: noteComments,
        collects: noteCollects,
      },
      images,
      downloads: videoUrl
        ? [
            {
              quality: "Original",
              url: videoUrl,
            },
          ]
        : [],
    }
  } catch (error: any) {
    console.error("Error scraping Rednote data:", error)
    throw new Error(error.message || "Failed to get response from API")
  }
}

const isValidRednoteUrl = (url: string): boolean => {
  return /^https?:\/\/(.*?)?(xhslink\.com|xiaohongshu\.com)\/[^\s]+/.test(url)
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/rednote",
    name: "rednote",
    category: "Downloader",
    description: "This API endpoint allows you to download information from a Rednote (XiaoHongShu) URL. It extracts details such as title, description, keywords, video URL (if available), note ID, duration, author's nickname, and engagement metrics like likes, comments, and collects. Additionally, it retrieves all associated images. This is useful for archiving content or analyzing Rednote posts.",
    tags: ["Downloader", "Social Media", "Video", "Image", "Rednote"],
    example: "?url=",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
        },
        description: "The Rednote URL to fetch information from",
        example: "",
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

      if (!isValidRednoteUrl(url.trim())) {
        return {
          status: false,
          error: "Invalid Rednote URL format",
          code: 400,
        }
      }

      try {
        const result = await scrapeRednote(url.trim())

        if (!result) {
          return {
            status: false,
            error: "Failed to fetch Rednote information",
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
    endpoint: "/api/d/rednote",
    name: "rednote",
    category: "Downloader",
    description: "This API endpoint allows you to download information from a Rednote (XiaoHongShu) URL by providing the URL in the request body as JSON. It extracts details such as title, description, keywords, video URL (if available), note ID, duration, author's nickname, and engagement metrics like likes, comments, and collects. Additionally, it retrieves all associated images. This is useful for archiving content or analyzing Rednote posts programmatically.",
    tags: ["Downloader", "Social Media", "Video", "Image", "Rednote"],
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
                description: "The Rednote URL to fetch information from",
                example: "",
                minLength: 1,
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

      if (!isValidRednoteUrl(url.trim())) {
        return {
          status: false,
          error: "Invalid Rednote URL format",
          code: 400,
        }
      }

      try {
        const result = await scrapeRednote(url.trim())

        if (!result) {
          return {
            status: false,
            error: "Failed to fetch Rednote information",
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