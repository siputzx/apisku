import axios from "axios"
import * as cheerio from "cheerio"

async function PlayStore(search: string) {
  try {
    const { data } = await axios.get(
      `https://play.google.com/store/search?q=${search}&c=apps`,
      {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )
    const hasil: any[] = []
    const $ = cheerio.load(data)
    $(
      ".ULeU3b > .VfPpkd-WsjYwc.VfPpkd-WsjYwc-OWXEXe-INsAgc.KC1dQ.Usd1Ac.AaN0Dd.Y8RQXd > .VfPpkd-aGsRMb > .VfPpkd-EScbFb-JIbuQc.TAQqTe > a",
    ).each((i, u) => {
      const linkk = $(u).attr("href")
      const nama = $(u).find(".j2FCNc > .cXFu1 > .ubGTjb > .DdYX5").text()
      const developer = $(u)
        .find(".j2FCNc > .cXFu1 > .ubGTjb > .wMUdtb")
        .text()
      let img = $(u).find(".j2FCNc > img").attr("src")

      if (img && img.includes("=s64")) {
        img = img.replace("=s64", "=w480-h960-rw")
      }

      const rate = $(u)
        .find(".j2FCNc > .cXFu1 > .ubGTjb > div")
        .attr("aria-label")
      const rate2 = $(u)
        .find(".j2FCNc > .cXFu1 > .ubGTjb > div > span.w2kbF")
        .text()
      const link = `https://play.google.com${linkk}`

      hasil.push({
        link: link,
        nama: nama ? nama : "No name",
        developer: developer ? developer : "No Developer",
        img: img ? img : "https://i.ibb.co/G7CrCwN/404.png",
        rate: rate ? rate : "No Rate",
        rate2: rate2 ? rate2 : "No Rate",
        link_dev: `https://play.google.com/store/apps/developer?id=${developer.split(" ").join("+")}`,
      })
    })
    if (hasil.every((x) => x === undefined))
      throw new Error("No result found!")
    return hasil
  } catch (err: any) {
    throw err
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/apk/playstore",
    name: "playstore",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on the Google Play Store. It scrapes the Play Store based on your provided search query and returns a list of matching applications, including their link, name, developer, image, and rating information. This API is useful for developers who need to programmatically search and retrieve information about applications available on the Google Play Store.",
    tags: ["APK", "Search", "Google Play", "Android", "Apps"],
    example: "?query=free fire",
    parameters: [
      {
        name: "query",
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
      const { query } = req.query || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 255) {
        return {
          status: false,
          error: "Query must be less than 255 characters",
          code: 400,
        }
      }

      try {
        const result = await PlayStore(query.trim())

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
    endpoint: "/api/apk/playstore",
    name: "playstore",
    category: "APK",
    description: "This API endpoint allows you to search for Android applications on the Google Play Store using a POST request. It scrapes the Play Store based on your provided search query in the request body and returns a list of matching applications, including their link, name, developer, image, and rating information. This API is useful for developers who need to programmatically search and retrieve information about applications available on the Google Play Store.",
    tags: ["APK", "Search", "Google Play", "Android", "Apps"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "The search query for applications on Google Play Store",
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
      const { query } = req.body || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 255) {
        return {
          status: false,
          error: "Query must be less than 255 characters",
          code: 400,
        }
      }

      try {
        const result = await PlayStore(query.trim())

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