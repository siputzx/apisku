import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeKodepos(form: string) {
  try {
    const response = await axios.post(
      "https://kodepos.posindonesia.co.id/CariKodepos",
      new URLSearchParams({ kodepos: form }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Cache-Control": "max-age=0",
          "Origin": "https://kodepos.posindonesia.co.id",
          "Referer": "https://kodepos.posindonesia.co.id/",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
          "Cookie": "ci_session=aqlrvi6tdfajmfelsla8n974p1btd9pb",
        },
        timeout: 30000,
      },
    )

    const html = response.data
    const $ = cheerio.load(html)
    const result = $("tbody > tr")
      .map((_, el) => {
        const $td = $(el).find("td")
        const kodepos = $td.eq(1).text().trim()
        const desa = $td.eq(2).text().trim()
        const kecamatan = $td.eq(3).text().trim()
        const kota = $td.eq(4).text().trim()
        const provinsi = $td.eq(5).text().trim()
        return {
          kodepos,
          desa,
          kecamatan,
          kota,
          provinsi,
        }
      })
      .get()
    return result
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/kodepos",
    name: "kodepos",
    category: "Tools",
    description: "This API endpoint allows you to search for postal code information based on a given location name, such as a village or district. It queries the official Indonesian postal code database to retrieve details including the postal code, village, sub-district, city, and province. This service is essential for applications requiring address validation, delivery planning, or geographical data enrichment. By providing accurate postal code information, it helps ensure precise location identification for various logistical and administrative tasks.",
    tags: ["Tools", "Location", "Postal Code"],
    example: "?form=pasiran jaya",
    parameters: [
      {
        name: "form",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Location name",
        example: "pasiran jaya",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { form } = req.query || {}

      if (!form) {
        return {
          status: false,
          error: "Form parameter is required",
          code: 400,
        }
      }

      if (typeof form !== "string" || form.trim().length === 0) {
        return {
          status: false,
          error: "Form parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeKodepos(form.trim())

        if (!result || result.length === 0) {
          return {
            status: false,
            error: "No postal code information found for the given location",
            code: 404,
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
    endpoint: "/api/tools/kodepos",
    name: "kodepos",
    category: "Tools",
    description: "This API endpoint allows you to search for postal code information based on a given location name, such as a village or district, using a JSON request body. It queries the official Indonesian postal code database to retrieve details including the postal code, village, sub-district, city, and province. This service is essential for applications requiring address validation, delivery planning, or geographical data enrichment. By providing accurate postal code information, it helps ensure precise location identification for various logistical and administrative tasks.",
    tags: ["Tools", "Location", "Postal Code"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["form"],
            properties: {
              form: {
                type: "string",
                description: "The location name (e.g., village, district) to search for postal code",
                example: "pasiran jaya",
                minLength: 1,
                maxLength: 100,
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
      const { form } = req.body || {}

      if (!form) {
        return {
          status: false,
          error: "Form parameter is required",
          code: 400,
        }
      }

      if (typeof form !== "string" || form.trim().length === 0) {
        return {
          status: false,
          error: "Form parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeKodepos(form.trim())

        if (!result || result.length === 0) {
          return {
            status: false,
            error: "No postal code information found for the given location",
            code: 404,
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