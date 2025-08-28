import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import * as cheerio from "cheerio"

puppeteer.use(StealthPlugin())

async function scrape(search: string) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] })
    const page = await browser.newPage()

    await page.goto(`https://apkmody.com/search/${encodeURIComponent(search)}`, {
      waitUntil: "domcontentloaded",
    })

    const html = await page.content()
    const $ = cheerio.load(html)
    const applications: any[] = []

    $("article.flex-item").each((index, element) => {
      const $element = $(element)
      const $link = $element.find("a.app")
      const $icon = $element.find(".app-icon img")
      const $details = $element.find(".app-name")
      const stars = $element.find(".star.active").length

      const app = {
        title: $details.find("h2").text().trim(),
        link: $link.attr("href"),
        icon: $icon.attr("src"),
        version:
          $details
            .find(".app-sub-text")
            .text()
            .match(/v\d+\.\d+(\.\d+)?/)?.[0] || "N/A",
        genre: $details
          .find(".app-genre")
          .text()
          .trim()
          .replace("•", "")
          .trim(),
        features: $details
          .find(".app-sub-text")
          .text()
          .includes("Aim, No Recoil")
          ? "Aim, No Recoil"
          : "",
        rating: {
          stars: stars,
          percentage: (stars / 5) * 100,
        },
      }

      applications.push(app)
    })

    await browser.close()
    return applications
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/apk/apkmody",
    name: "apkmody",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on apkmody.com. It utilizes Puppeteer with Stealth Plugin to bypass bot detection and scrape the website based on your provided search query. It returns a list of relevant applications, including their title, download link, icon, version, genre, features (if any, like 'Aim, No Recoil'), and star rating. This API is useful for developers who need to programmatically search and retrieve information about modified Android applications from apkmody.com.",
    tags: ["APK", "Search", "Android", "Modded"],
    example: "?search=free fire",
    parameters: [
      {
        name: "search",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "Search query for applications",
        example: "free fire",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { search } = req.query || {}

      if (!search) {
        return {
          status: false,
          error: "Parameter 'search' is required",
          code: 400,
        }
      }

      if (typeof search !== "string" || search.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'search' must be a non-empty string",
          code: 400,
        }
      }

      if (search.length > 255) {
        return {
          status: false,
          error: "Parameter 'search' must be less than 255 characters",
          code: 400,
        }
      }

      try {
        const applications = await scrape(search.trim())

        if (!applications) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: applications,
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
    endpoint: "/api/apk/apkmody",
    name: "apkmody",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on apkmody.com using a POST request. It utilizes Puppeteer with Stealth Plugin to bypass bot detection and scrape the website based on your provided search query in the request body. It returns a list of relevant applications, including their title, download link, icon, version, genre, features (if any, like 'Aim, No Recoil'), and star rating. This API is useful for developers who need to programmatically search and retrieve information about modified Android applications from apkmody.com.",
    tags: ["APK", "Search", "Android", "Modded"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["search"],
            properties: {
              search: {
                type: "string",
                description: "The search term for applications on apkmody.com",
                example: "free fire",
                minLength: 1,
                maxLength: 255,
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
      const { search } = req.body || {}

      if (!search) {
        return {
          status: false,
          error: "Parameter 'search' is required",
          code: 400,
        }
      }

      if (typeof search !== "string" || search.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'search' must be a non-empty string",
          code: 400,
        }
      }

      if (search.length > 255) {
        return {
          status: false,
          error: "Parameter 'search' must be less than 255 characters",
          code: 400,
        }
      }

      try {
        const applications = await scrape(search.trim())

        if (!applications) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: applications,
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