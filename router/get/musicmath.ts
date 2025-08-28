import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import * as cheerio from "cheerio"

puppeteer.use(StealthPlugin())

async function scrapeLyrics(url: string) {
  let browser: any
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    })

    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on("request", (req) => {
      if (["image", "stylesheet", "font"].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })

    const html = await page.content()
    const $ = cheerio.load(html)

    const songTitle = $('h1[data-testid="lyrics-track-title"]').text().trim() || "Unknown Title"

    const lyricsSections: { section: string; performers: string; lines: string[] }[] = []
    let currentSection: string | null = null
    let currentLines: string[] = []
    let currentPerformers: string[] = []

    $('div[class*="r-kbtpn4"] > div, div[class*="r-zd98yo"] > div').each((i, el) => {
      const $el = $(el)
      const text = $el.text().trim()
      const classAttr = $el.attr("class") || ""

      if ($el.find("h3").length > 0) {
        const sectionText = $el.find("h3").text().trim().toUpperCase()
        if (sectionText.match(/^(VERSE|CHORUS|HOOK|BRIDGE|OUTRO|INTRO)$/i)) {
          if (currentSection && currentLines.length > 0) {
            lyricsSections.push({
              section: currentSection,
              performers: currentPerformers.join(", "),
              lines: currentLines,
            })
          }
          currentSection = sectionText
          currentLines = []
          currentPerformers = []
        }
      } else if ($el.find('div[class*="css-146c3p1"][style*="color: var(--mxm-contentPrimary)"]').length > 0) {
        const performerText = $el.find('div[class*="css-146c3p1"][style*="color: var(--mxm-contentPrimary)"]').text().trim()
        if (performerText && !currentPerformers.includes(performerText)) {
          currentPerformers.push(performerText)
        }
      } else if ($el.find('div[dir="auto"]').length > 0) {
        const lineText = $el.find('div[dir="auto"]').text().trim()
        if (lineText && !lineText.match(/^(Show more|Writer\(s\)|Moods|Rating|Musixmatch|©|\d+\n|Add lyrics|Products|Company|Community|Artists:)/i)) {
          currentLines.push(lineText)
        }
      }
    })

    if (currentSection && currentLines.length > 0) {
      lyricsSections.push({
        section: currentSection,
        performers: currentPerformers.join(", "),
        lines: currentLines,
      })
    }

    let lyricsOutput = ""
    lyricsSections.forEach(({ section, performers, lines }) => {
      lyricsOutput += `\n${section}${performers ? " - " + performers : ""}\n`
      lyricsOutput += lines.join("\n") + "\n"
    })

    return {
      songTitle,
      lyrics: lyricsOutput.trim(),
    }
  } catch (error: any) {
    console.error("Error scraping lyrics:", error.message)
    return null
  } finally {
    if (browser) await browser.close()
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/get/musixmatch",
    name: "Get Data From Musixmatch",
    category: "Get Data",
    description: "This API endpoint retrieves song lyrics, artist, and album information from Musixmatch. Users provide the Musixmatch URL of a song, and the API scrapes the page to extract the song title and segmented lyrics, including sections like VERSE, CHORUS, and associated performers. This is valuable for applications needing to display lyrics or analyze song structures. The API uses Puppeteer with Stealth Plugin to avoid bot detection, ensuring reliable data extraction. The response includes the song title and a formatted string of lyrics.",
    tags: ["MUSIC", "LYRICS", "INFORMATION", "SCRAPING", "MUSIXMATCH"],
    example: "?url=https://www.musixmatch.com/lyrics/Maman-Fvndy-4/Garam-Dan-Madu?utm_source=application&utm_campaign=api&utm_medium=musixmatch-community%3A1409608317702",
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
        description: "The Musixmatch URL of the song lyrics to scrape.",
        example: "https://www.musixmatch.com/lyrics/Maman-Fvndy-4/Garam-Dan-Madu?utm_source=application&utm_campaign=api&utm_medium=musixmatch-community%3A1409608317702",
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
        const result = await scrapeLyrics(url.trim())
        if (result) {
          return {
            status: true,
            data: result,
            timestamp: new Date().toISOString(),
          }
        } else {
          return {
            status: false,
            error: "Could not retrieve data for the provided URL or song not found.",
            code: 404,
          }
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
    endpoint: "/api/get/musixmatch",
    name: "Get Data From Musixmatch",
    category: "Get Data",
    description: "This API endpoint facilitates the retrieval of song lyrics, artist, and album information from Musixmatch via a POST request. Users submit the Musixmatch URL of a song in the request body. The API then employs Puppeteer with Stealth Plugin to navigate to the provided URL and scrape the song's title and detailed lyrics, organized into sections like VERSE, CHORUS, and including performer credits. This method is suitable for applications that prefer sending data in the request body for enhanced security or more complex integrations. The API returns the extracted song title and formatted lyrics.",
    tags: ["MUSIC", "LYRICS", "INFORMATION", "SCRAPING", "MUSIXMATCH"],
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
                description: "The Musixmatch URL of the song lyrics to scrape.",
                example: "https://www.musixmatch.com/lyrics/Maman-Fvndy-4/Garam-Dan-Madu?utm_source=application&utm_campaign=api&utm_medium=musixmatch-community%3A1409608317702",
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
        const result = await scrapeLyrics(url.trim())
        if (result) {
          return {
            status: true,
            data: result,
            timestamp: new Date().toISOString(),
          }
        } else {
          return {
            status: false,
            error: "Could not retrieve data for the provided URL or song not found.",
            code: 404,
          }
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