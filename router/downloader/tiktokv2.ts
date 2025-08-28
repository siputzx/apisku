import axios from "axios"
import * as cheerio from "cheerio"

class TikTokScraper {
  private genericUserAgent: string

  constructor() {
    this.genericUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  }

  private async shortener(url: string): Promise<string> {
    return url
  }

  async getDownloadLinks(URL: string) {
    try {
      return new Promise<{ photo?: string[]; video?: string[]; audio?: string }>((resolve, reject) => {
        axios
          .get("https://musicaldown.com/id", {
            headers: {
              "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
            },
          })
          .then((res) => {
            const $ = cheerio.load(res.data)
            const url_name = $("#link_url").attr("name")
            const token_name = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("name")
            const token_ = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("value")
            const verify = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(3)").attr("value")
            let data: { [key: string]: string } = {
              [`${url_name}`]: URL,
              [`${token_name}`]: token_!,
              verify: verify!,
            }
            axios
              .request({
                url: "https://musicaldown.com/download",
                method: "post",
                data: new URLSearchParams(Object.entries(data)),
                headers: {
                  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
                  cookie: res.headers["set-cookie"],
                },
              })
              .then(async (respon) => {
                const ch = cheerio.load(respon.data)
                const downloadLinks: string[] = []
                ch("a.btn.waves-effect.waves-light.orange.download").each((i, elem) => {
                  const href = ch(elem).attr("href")
                  if (href) downloadLinks.push(href)
                })

                if (respon.request.path === "/photo/download") {
                  const images: string[] = []
                  ch("div.card-action.center > a").each((a, b) => {
                    images.push(ch(b).attr("href")!)
                  })
                  const mp3Link = ch("a.btn.waves-effect.waves-light.orange.download[data-event='mp3_download_click']").attr("href")
                  const result = {
                    photo: images.length > 0 ? await Promise.all(images.map((link) => this.shortener(link))) : [],
                    audio: mp3Link ? await this.shortener(mp3Link) : " ",
                  }
                  resolve(result)
                } else {
                  axios
                    .request({
                      url: "https://musicaldown.com/id/mp3",
                      method: "post",
                      headers: {
                        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
                        cookie: res.headers["set-cookie"],
                      },
                    })
                    .then(async (resaudio) => {
                      const hc = cheerio.load(resaudio.data)
                      const audioLink = hc("a.btn.waves-effect.waves-light.orange.download").attr("href")
                      const result = {
                        video: await Promise.all(downloadLinks.map((link) => this.shortener(link))),
                        audio: audioLink ? await this.shortener(audioLink) : " ",
                      }
                      resolve(result)
                    })
                    .catch((err) => reject({ error: err.message }))
                }
              })
              .catch((err) => {
                if (err.response && err.response.status === 302) {
                  axios
                    .request({
                      url: "https://musicaldown.com/photo/download",
                      method: "post",
                      data: new URLSearchParams(Object.entries(data)),
                      headers: {
                        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
                        cookie: res.headers["set-cookie"],
                      },
                    })
                    .then(async (photoRes) => {
                      const ph = cheerio.load(photoRes.data)
                      const images: string[] = []
                      ph("div.card-action.center > a").each((a, b) => {
                        images.push(ph(b).attr("href")!)
                      })
                      const mp3Link = ph("a.btn.waves-effect.waves-light.orange.download[data-event='mp3_download_click']").attr("href")
                      const result = {
                        photo: images.length > 0 ? await Promise.all(images.map((link) => this.shortener(link))) : [],
                        audio: mp3Link ? await this.shortener(mp3Link) : " ",
                      }
                      resolve(result)
                    })
                    .catch((photoErr) => reject({ error: photoErr.message }))
                } else {
                  reject({ error: err.message })
                }
              })
          })
          .catch((err) => reject({ error: err.message }))
      })
    } catch ({ message }) {
      return { error: message }
    }
  }

  async scrape(input: string) {
    let postId: string | null = null

    try {
      const response = await axios({
        method: "get",
        url: input,
        maxRedirects: 0,
        validateStatus: (status) => true,
        headers: {
          "user-agent": this.genericUserAgent,
        },
      })

      if (response.status === 301 || response.status === 302) {
        const redirectUrl = response.headers.location
        const match = redirectUrl.match(/\/(?:video|photo)\/(\d+)/)
        if (match && match[1]) {
          postId = match[1]
        }
      } else {
        const match = input.match(/\/(?:video|photo)\/(\d+)/)
        if (match && match[1]) {
          postId = match[1]
        } else {
          return { error: "invalid.tiktok.url", message: "This doesn't appear to be a valid TikTok URL" }
        }
      }

      if (!postId) {
        return { error: "id.not_found", message: "Could not extract post ID from URL" }
      }
    } catch (error: any) {
      console.error("Error fetching initial URL:", error.message)
      return { error: "fetch.fail", message: error.message }
    }

    try {
      const tiktokUrl = `https://www.tiktok.com/@i/video/${postId}`
      const [metadataResponse, downloadLinks] = await Promise.all([
        axios({
          method: "get",
          url: tiktokUrl,
          headers: {
            "user-agent": this.genericUserAgent,
          },
        }),
        this.getDownloadLinks(input),
      ])

      const html = metadataResponse.data

      if (!html.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__")) {
        return { error: "content.data_not_found" }
      }

      const json = html.split('<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">')[1].split("</script>")[0]

      const data = JSON.parse(json)
      const videoDetail = data["__DEFAULT_SCOPE__"]["webapp.video-detail"]

      if (!videoDetail) {
        return { error: "content.detail_not_found" }
      }

      if (videoDetail.statusMsg) {
        return { error: "content.post.unavailable" }
      }

      const item = videoDetail.itemInfo.itemStruct

      const result = {
        metadata: {
          stats: {
            likeCount: item.stats.diggCount,
            playCount: item.stats.playCount,
            commentCount: item.stats.commentCount,
            shareCount: item.stats.shareCount,
          },
          title: item.imagePost?.title || "",
          description: item.desc,
          hashtags: item.textExtra.filter((extra: any) => extra.type === 1).map((extra: any) => extra.hashtagName),
          locationCreated: item.locationCreated,
          suggestedWords: item.suggestedWords,
        },
        download: downloadLinks,
      }

      return {
        success: true,
        data: result,
        postId: postId,
      }
    } catch (error: any) {
      console.error("Error fetching content details:", error.message)
      return { error: "fetch.fail", message: error.message }
    }
  }
}

async function scrapeTiktokV2(url: string) {
  try {
    const scraper = new TikTokScraper()
    return await scraper.scrape(url)
  } catch (error: any) {
    console.error("Tiktok v2 scrape error:", error)
    return { error: "Failed to scrape TikTok data", message: error.message }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/tiktok/v2",
    name: "tiktok v2",
    category: "Downloader",
    description: "This API endpoint allows you to download TikTok videos and photos by providing a TikTok URL. It scrapes the necessary information from the TikTok page, including video/photo metadata and direct download links. This can be used for archival purposes, content analysis, or integrating TikTok content into other applications. The API supports both video and image posts, providing respective download links. It handles redirects and extracts the post ID to ensure accurate data retrieval. The response includes detailed metadata like like count, play count, comment count, share count, title, description, hashtags, and location created, along with direct download URLs for the media.",
    tags: ["DOWNLOADER", "TIKTOK", "VIDEO", "PHOTO", "SOCIAL MEDIA"],
    example: "?url=https://vt.tiktok.com/ZSjXNEnbC/",
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
        description: "TikTok URL",
        example: "https://vt.tiktok.com/ZSjXNEnbC/",
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
        const result = await scrapeTiktokV2(url.trim())

        if (result && "error" in result) {
          return {
            status: false,
            error: result.message || "Failed to scrape TikTok data",
            code: 500,
          }
        }

        return {
          status: true,
          data: result.data,
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
    endpoint: "/api/d/tiktok/v2",
    name: "tiktok v2",
    category: "Downloader",
    description: "This API endpoint allows you to download TikTok videos and photos by providing a TikTok URL in the request body. It scrapes the necessary information from the TikTok page, including video/photo metadata and direct download links. This can be used for archival purposes, content analysis, or integrating TikTok content into other applications. The API supports both video and image posts, providing respective download links. It handles redirects and extracts the post ID to ensure accurate data retrieval. The response includes detailed metadata like like count, play count, comment count, share count, title, description, hashtags, and location created, along with direct download URLs for the media.",
    tags: ["DOWNLOADER", "TIKTOK", "VIDEO", "PHOTO", "SOCIAL MEDIA"],
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
                description: "TikTok URL",
                example: "https://vt.tiktok.com/ZSjXNEnbC/",
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
        const result = await scrapeTiktokV2(url.trim())

        if (result && "error" in result) {
          return {
            status: false,
            error: result.message || "Failed to scrape TikTok data",
            code: 500,
          }
        }

        return {
          status: true,
          data: result.data,
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