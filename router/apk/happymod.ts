import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import * as cheerio from "cheerio"

puppeteer.use(StealthPlugin())

async function scrape(search: string) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] })
    const page = await browser.newPage()

    await page.goto(`https://id.happymod.cloud/search.html?q=${search}`, {
      waitUntil: "domcontentloaded",
    })

    const htmlContent = await page.content()
    const $ = cheerio.load(htmlContent)
    const applications: any[] = []

    $(".col-12.col-md-6.col-xl-4.mb-3").each((index, element) => {
      const $element = $(element)
      const title = $element.find("h3.h6").text().trim()
      const link = $element.find("a.archive-post").attr("href")
      const image = $element.find("img.lozad").attr("data-src") || $element.find("img.lozad").attr("src")
      const version = $element.find("div.small.text-truncate.text-muted span.align-middle").eq(0).text().trim()
      const fileSize = $element.find("div.small.text-truncate.text-muted span.align-middle").eq(1).text().trim()
      const modFeatures = $element.find("div.small.text-truncate.text-muted").last().text().trim().replace("", "").trim()

      applications.push({
        title: title,
        link: link ? `https://apkcombo.com${link}` : null,
        image: image || null,
        version: version,
        fileSize: fileSize,
        modFeatures: modFeatures === version || modFeatures.includes('+') ? "N/A" : modFeatures,
      })
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
    endpoint: "/api/apk/happymod",
    name: "happymod",
    category: "APK",
    description: "This API endpoint allows you to search for modified Android applications (MOD APKs) on happymod.com. It utilizes Puppeteer with Stealth Plugin to bypass bot detection and scrape the website based on your provided search query. It returns a list of relevant applications, including their title, direct link to the HappyMod page, image, detected version, file size, and specific mod features (e.g., [Unlimited Money]). This API is useful for developers and users looking to programmatically discover and retrieve information about various modified applications and games available on HappyMod.",
    tags: ["APK", "Mod", "Search", "Android", "Games", "Apps"],
    example: "?search=pou",
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
        example: "pou",
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
    endpoint: "/api/apk/happymod",
    name: "happymod",
    category: "APK",
    description: "This API endpoint allows you to search for modified Android applications (MOD APKs) on happymod.com using a POST request. It utilizes Puppeteer with Stealth Plugin to bypass bot detection and scrape the website based on your provided search query in the request body. It returns a list of relevant applications, including their title, direct link to the HappyMod page, image, detected version, file size, and specific mod features (e.g., [Unlimited Money]). This API is useful for developers and users looking to programmatically discover and retrieve information about various modified applications and games available on HappyMod.",
    tags: ["APK", "Mod", "Search", "Android", "Games", "Apps"],
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
                description: "The search term for applications on happymod.com",
                example: "pou",
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