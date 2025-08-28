import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import * as cheerio from "cheerio"

puppeteer.use(StealthPlugin())

async function scrape(search: string) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

    await page.goto(`https://www.apple.com/us/search/${encodeURIComponent(search)}?src=globalnav`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })

    const htmlContent = await page.content()
    const $ = cheerio.load(htmlContent)
    const applications: any[] = []

    $(".rf-serp-curated-product").each((index, element) => {
      const $element = $(element)

      const title = $element.find(".rf-serp-productname-link").text().trim()
      const link = $element.find(".rf-serp-productname-link").attr("href")
      const image = $element.find(".rf-serp-explore-image").attr("src")
      const description = $element.find(".rf-serp-productdescription").text().trim()
      const analyticsTitle = $element.find(".rf-serp-productname-link").attr("data-analytics-title")

      if (title && link) {
        applications.push({
          title: title,
          link: link.startsWith("http") ? link : `https://apps.apple.com${link}`,
          image: image || null,
          description: description || "No description available",
          analyticsTitle: analyticsTitle || title,
          source: "Apple App Store",
        })
      }
    })

    if (applications.length === 0) {
      $(".rf-serp-explore-organic .rf-serp-productitem").each((index, element) => {
        const $element = $(element)

        const title = $element.find("h3").text().trim() || $element.find(".rf-serp-productname").text().trim()
        const link = $element.find("a").attr("href")
        const image = $element.find("img").attr("src")
        const description = $element.find("p").text().trim()

        if (title && link) {
          applications.push({
            title: title,
            link: link.startsWith("http") ? link : `https://apps.apple.com${link}`,
            image: image || null,
            description: description || "No description available",
            analyticsTitle: title,
            source: "Apple App Store",
          })
        }
      })
    }

    await browser.close()
    return applications
  } catch (error: any) {
    console.error("Apple Store Scraper Error:", error.message)
    throw new Error("Failed to get response from Apple Store API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/apk/appstore",
    name: "app store",
    category: "APK",
    description: "This API endpoint allows you to search for applications on Apple App Store. It utilizes Puppeteer with Stealth Plugin to bypass bot detection and scrape the Apple website based on your provided search query. It returns a list of relevant applications, including their title, direct link to the App Store page, image, description, and analytics information. This API is useful for developers and users looking to programmatically discover and retrieve information about various applications and games available on the Apple App Store.",
    tags: ["Apple", "App Store", "Search", "iOS", "Apps", "Games"],
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
        description: "Search query for applications on Apple App Store",
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
            error: "No result returned from Apple Store API",
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
    endpoint: "/api/apk/appstore",
    name: "app store",
    category: "APK",
    description: "This API endpoint allows you to search for applications on Apple App Store using a POST request. It utilizes Puppeteer with Stealth Plugin to bypass bot detection and scrape the Apple website based on your provided search query in the request body. It returns a list of relevant applications, including their title, direct link to the App Store page, image, description, and analytics information. This API is useful for developers and users looking to programmatically discover and retrieve information about various applications and games available on the Apple App Store.",
    tags: ["Apple", "App Store", "Search", "iOS", "Apps", "Games"],
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
                description: "The search term for applications on Apple App Store",
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
            error: "No result returned from Apple Store API",
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