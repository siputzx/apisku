import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeSpotify(url: string, turnstileToken: string) {
  try {
    const resHome = await axios.get("https://spotimate.io/")
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

    const resApi = await axios.post("https://spotimate.io/action", formData, {
      headers: {
        "authority": "spotimate.io",
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "cookie": `session_data=${sessionData}`,
        "origin": "https://spotimate.io",
        "referer": "https://spotimate.io/",
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

    const songTitle = $result("h3 div").text().trim()
    const artist = $result("p span").text().trim()
    const coverImage = $result("img").first().attr("src")

    const mp3Link = $result("a").filter((i, el) => {
      const href = $(el).attr("href")
      const text = $(el).text()
      return href && href.includes("/dl?token=") && text.includes("Download Mp3")
    }).first().attr("href")

    const coverLink = $result("a").filter((i, el) => {
      const href = $(el).attr("href")
      const text = $(el).text()
      return href && href.includes("/dl?token=") && text.includes("Download Cover")
    }).first().attr("href")

    let spotifyData = {}
    try {
      const resSpotifyData = await axios.get(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        },
      })
      const $$ = cheerio.load(resSpotifyData.data)
      
      const title = $$('meta[property="og:title"]').attr("content") || ""
      const description = $$('meta[property="og:description"]').attr("content") || ""
      const image = $$('meta[property="og:image"]').attr("content") || ""
      const spotifyUrl = $$('meta[property="og:url"]').attr("content") || url
      
      spotifyData = {
        title,
        description,
        image,
        url: spotifyUrl
      }
    } catch (spotifyError: any) {
      console.log("Could not fetch Spotify data:", spotifyError.message)
    }

    return {
      url: (spotifyData as any).url || url,
      title: (spotifyData as any).title || songTitle,
      description: (spotifyData as any).description || "",
      songTitle: songTitle,
      artist: artist,
      coverImage: (spotifyData as any).image || coverImage,
      mp3DownloadLink: mp3Link ? `${mp3Link}` : null,
      coverDownloadLink: coverLink ? `${coverLink}` : null,
    }
  } catch (error: any) {
    console.error("Error details:", error.response?.data || error.message)
    throw new Error(`Terjadi kesalahan: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/spotifyv2",
    name: "spotify v2",
    category: "Downloader",
    description: "This API endpoint allows users to retrieve music download links and metadata directly from a Spotify URL. It functions by scraping the provided Spotify page to extract relevant information such as song title, artist, album artwork, and metadata. This is useful for applications that need to integrate music download capabilities or display detailed information about Spotify tracks. The API handles the complexities of CSRF tokens and Cloudflare Turnstile CAPTCHA to ensure successful data retrieval. Users provide the Spotify URL as a query parameter.",
    tags: ["DOWNLOADER", "MUSIC", "SPOTIFY"],
    example: "?url=https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
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
        description: "Spotify URL",
        example: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
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
      const token = await bypass.solveTurnstileMin("https://spotimate.io/", "0x4AAAAAAA_b5m4iQN755mZw")

      try {
        const result = await scrapeSpotify(url.trim(), token)
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
    endpoint: "/api/d/spotifyv2",
    name: "spotify v2",
    category: "Downloader",
    description: "This API endpoint allows users to retrieve music download links and metadata directly from a Spotify URL. It functions by scraping the provided Spotify page to extract relevant information such as song title, artist, album artwork, and metadata. This is useful for applications that need to integrate music download capabilities or display detailed information about Spotify tracks. The API handles the complexities of CSRF tokens and Cloudflare Turnstile CAPTCHA to ensure successful data retrieval. Users provide the Spotify URL as a JSON object in the request body.",
    tags: ["DOWNLOADER", "MUSIC", "SPOTIFY"],
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
                description: "The Spotify URL to scrape",
                example: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
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
      const token = await bypass.solveTurnstileMin("https://spotimate.io/", "0x4AAAAAAA_b5m4iQN755mZw")

      try {
        const result = await scrapeSpotify(url.trim(), token)
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