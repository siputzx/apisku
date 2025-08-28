import axios from "axios"
import * as cheerio from "cheerio"

async function scrape(url: string, turnstileToken: string) {
  try {
    const resHome = await axios.get("https://aplmate.com/")
    const $ = cheerio.load(resHome.data)

    const tokenInput = $("input[type=\"hidden\"]").filter((i, el) => {
      const name = $(el).attr("name")
      return name && name.startsWith("_")
    })

    const tokenName = tokenInput.attr("name")
    const tokenValue = tokenInput.attr("value")

    const cookies = resHome.headers["set-cookie"]
    let sessionData = ""

    if (cookies) {
      const sessionCookie = cookies.find((cookie: string) =>
        cookie.startsWith("session_data="),
      )
      if (sessionCookie) {
        sessionData = sessionCookie.split(";")[0].split("=")[1]
      }
    }

    if (!tokenName || !tokenValue) {
      throw new Error("CSRF token tidak ditemukan")
    }

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substr(2, 16)
    const formData = [
      `--${boundary}`,
      "Content-Disposition: form-data; name=\"url\"",
      "",
      url,
      `--${boundary}`,
      `Content-Disposition: form-data; name="${tokenName}"`,
      "",
      tokenValue,
      `--${boundary}`,
      "Content-Disposition: form-data; name=\"cf-turnstile-response\"",
      "",
      turnstileToken,
      `--${boundary}--`,
      "",
    ].join("\r\n")

    const resApi = await axios.post("https://aplmate.com/action", formData, {
      headers: {
        "authority": "aplmate.com",
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "cookie": `session_data=${sessionData}`,
        "origin": "https://aplmate.com",
        "referer": "https://aplmate.com/",
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
    })

    const $result = cheerio.load(resApi.data.html || resApi.data)

    const dataValue = $result("input[name=\"data\"]").attr("value")
    const baseValue = $result("input[name=\"base\"]").attr("value")
    const tokenValueTrack = $result("input[name=\"token\"]").attr("value")

    if (!dataValue || !baseValue || !tokenValueTrack) {
      throw new Error("Form data tidak ditemukan pada response pertama")
    }

    const trackBoundary = "----WebKitFormBoundary" + Math.random().toString(36).substr(2, 16)
    const trackFormData = [
      `--${trackBoundary}`,
      "Content-Disposition: form-data; name=\"data\"",
      "",
      dataValue,
      `--${trackBoundary}`,
      "Content-Disposition: form-data; name=\"base\"",
      "",
      baseValue,
      `--${trackBoundary}`,
      "Content-Disposition: form-data; name=\"token\"",
      "",
      tokenValueTrack,
      `--${trackBoundary}--`,
      "",
    ].join("\r\n")

    const resTrack = await axios.post("https://aplmate.com/action/track", trackFormData, {
      headers: {
        "authority": "aplmate.com",
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": `multipart/form-data; boundary=${trackBoundary}`,
        "cookie": `session_data=${sessionData}`,
        "origin": "https://aplmate.com",
        "referer": "https://aplmate.com/",
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
    })

    const $final = cheerio.load(resTrack.data.data || resTrack.data)

    const mp3Link = $final("a").filter((i, el) => {
      const href = $(el).attr("href")
      return href && href.includes("/dl?token=") && $(el).text().includes("Download Mp3")
    }).first().attr("href")

    const coverLink = $final("a").filter((i, el) => {
      const href = $(el).attr("href")
      return href && href.includes("/dl?token=") && $(el).text().includes("Download Cover")
    }).first().attr("href")

    const songTitle = $final("h3 div").text().trim()
    const artist = $final("p span").text().trim()
    const coverImage = $final("img").first().attr("src")

    let seoData = {}
    try {
      const resSeoData = await axios.get(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        },
      })
      const $$ = cheerio.load(resSeoData.data)
      const jsonData = $$("#serialized-server-data").html()

      if (jsonData) {
        const parsedData = JSON.parse(jsonData)
        seoData = parsedData[0]?.data?.seoData || {}
      }
    } catch (seoError: any) {
      console.log("Could not fetch SEO data:", seoError.message)
    }

    return {
      url: (seoData as any).url || url,
      pageTitle: (seoData as any).pageTitle || songTitle,
      description: (seoData as any).description || "",
      keywords: (seoData as any).keywords || "",
      songTitle: songTitle,
      artist: artist,
      artworkUrl: coverImage,
      appleTitle: (seoData as any).appleTitle || songTitle,
      appleDescription: (seoData as any).appleDescription || "",
      musicReleaseDate: (seoData as any).musicReleaseDate || "",
      mp3DownloadLink: mp3Link ? `https://aplmate.com${mp3Link}` : null,
      coverDownloadLink: coverLink ? `https://aplmate.com${coverLink}` : null,
    }
  } catch (error: any) {
    console.error("Error details:", error.response?.data || error.message)
    throw new Error(`Terjadi kesalahan: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/musicapple",
    name: "music apple",
    category: "Downloader",
    description: "This API endpoint allows users to retrieve music download links and SEO (Search Engine Optimization) data directly from an Apple Music URL. It functions by scraping the provided Apple Music page to extract relevant information such as song title, artist, album artwork, and metadata like page title, description, and keywords. This is useful for applications that need to integrate music download capabilities or display detailed information about Apple Music tracks. The API handles the complexities of CSRF tokens and Cloudflare Turnstile CAPTCHA to ensure successful data retrieval. Users provide the Apple Music URL as a query parameter.",
    tags: ["DOWNLOADER", "MUSIC", "APPLE"],
    example: "?url=https://music.apple.com/id/album/duka/1160727993?i=1160728286",
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
        description: "Apple Music URL",
        example: "https://music.apple.com/id/album/duka/1160727993?i=1160728286",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, solveBypass }) {
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
      
      const bypass = await solveBypass()
      const token = await bypass.solveTurnstileMin("https://aplmate.com/", "0x4AAAAAABdqfzl6we62dQyp")

      try {
        const result = await scrape(url.trim(), token)
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
    endpoint: "/api/d/musicapple",
    name: "music apple",
    category: "Downloader",
    description: "This API endpoint allows users to retrieve music download links and SEO (Search Engine Optimization) data directly from an Apple Music URL. It functions by scraping the provided Apple Music page to extract relevant information such as song title, artist, album artwork, and metadata like page title, description, and keywords. This is useful for applications that need to integrate music download capabilities or display detailed information about Apple Music tracks. The API handles the complexities of CSRF tokens and Cloudflare Turnstile CAPTCHA to ensure successful data retrieval. Users provide the Apple Music URL as a JSON object in the request body.",
    tags: ["DOWNLOADER", "MUSIC", "APPLE"],
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
                description: "The Apple Music URL to scrape",
                example: "https://music.apple.com/id/album/duka/1160727993?i=1160728286",
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
    async run({ req, solveBypass }) {
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
      
      const bypass = await solveBypass()
      const token = await bypass.solveTurnstileMin("https://aplmate.com/", "0x4AAAAAABdqfzl6we62dQyp")

      try {
        const result = await scrape(url.trim(), token)
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