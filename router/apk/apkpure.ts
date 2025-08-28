import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import * as cheerio from "cheerio"

puppeteer.use(StealthPlugin())

async function scrape(search: string) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] })
    const page = await browser.newPage()
    await page.goto(`https://apkpure.com/id/search?q=${encodeURIComponent(search)}&t=`, {
      waitUntil: "domcontentloaded",
    })

    const html = await page.content()
    const $ = cheerio.load(html)
    const applications: any[] = []

    $("#search-app-list ul.search-res > li").each((index, element) => {
      const $element = $(element)
      const $link = $element.find("a.dd")
      const app = {
        title: $element.find(".r .p1").text().trim(),
        developer: $element.find(".r .p2").text().trim(),
        link: $link.attr("href"),
        icon: $element.find("img").attr("src"),
        rating: {
          score: parseFloat($element.find(".star").text() || "0"),
          display:
            $element.find(".stars-search .score-search").attr("title") || "",
        },
      }
      applications.push(app)
    })

    $(".brand.is-brand").each((index, element) => {
      const $element = $(element)
      const $link = $element.find('a[href*="/id/"]').first()
      const app = {
        title: $link.find(".p1").text().trim(),
        developer: $element.find(".p2").text().trim(),
        link: $link.attr("href"),
        icon: $element.find("img.icon").attr("src"),
        version: $element.attr("data-dt-version"),
        fileSize: $element
          .find('li[data-dt-desc="FileSize"] .head')
          .text()
          .trim(),
        androidVersion: $element
          .find('li[data-dt-desc="AndroidOS"] .head')
          .text()
          .trim(),
        rating: {
          score: parseFloat($element.find(".star").text() || "0"),
          reviews: $element
            .find(".brand-middle li[data-dt-desc=\"Reviews\"] .desc span")
            .first()
            .text()
            .trim(),
        },
        downloadLink: $element.find(".right_button .da").attr("href"),
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
    endpoint: "/api/apk/apkpure",
    name: "apkpure",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on apkpure.com. It uses Puppeteer with Stealth Plugin to simulate a real browser and bypass detection, scraping application details such as title, developer, download link, icon, and rating information from the search results page. The API supports both standard search results and branded application listings on APKPure. This is useful for developers who need to programmatically access and retrieve information about applications available on APKPure.",
    tags: ["APK", "Search", "Android", "Application"],
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
        description: "Search term for applications",
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
    endpoint: "/api/apk/apkpure",
    name: "apkpure",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on apkpure.com using a POST request. It employs Puppeteer with Stealth Plugin to mimic a real browser and scrape application details such as title, developer, download link, icon, and rating information from the search results page based on your provided search query in the request body. The API supports both standard search results and branded application listings on APKPure. This is useful for developers who need to programmatically access and retrieve information about applications available on APKPure.",
    tags: ["APK", "Search", "Android", "Application"],
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
                description: "The search term for applications on apkpure.com",
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