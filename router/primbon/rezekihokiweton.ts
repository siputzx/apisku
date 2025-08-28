import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeRejekiHokiWeton(tgl: string, bln: string, thn: string) {
  try {
    const response = await axios({
      url: "https://primbon.com/rejeki_hoki_weton.php",
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      data: new URLSearchParams(Object.entries({ tgl, bln, thn, submit: " Submit! " })),
      timeout: 30000,
    })

    const $ = cheerio.load(response.data)
    const fetchText = $("#body").text()

    let hasil
    try {
      hasil = {
        hari_lahir: fetchText.split("Hari Lahir: ")[1].split(thn)[0].trim(),
        rejeki: fetchText.split(thn)[1].split("< Hitung Kembali")[0].trim(),
        catatan: "Rejeki itu bukan lah tentang ramalan tetapi tentang usaha dan ikhtiar seseorang.",
      }
    } catch (e) {
      hasil = {
        status: false,
        message: "Error, Mungkin Input Yang Anda Masukkan Salah",
      }
    }
    return hasil
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/primbon/rejeki_hoki_weton",
    name: "rejeki hoki weton",
    category: "Primbon",
    description:
      "This API endpoint provides luck and fortune predictions based on Javanese Wetons. Users input their birth day, month, and year, and the API returns their Weton (day of birth combination) and a prediction regarding their fortune or 'rejeki'. It also includes a philosophical note emphasizing effort over pure prediction. This endpoint is useful for those interested in Javanese cultural beliefs about destiny and prosperity.",
    tags: ["Primbon", "Weton", "Fortune", "Luck", "Javanese", "Culture", "Prediction"],
    example: "?tgl=1&bln=1&thn=2025",
    parameters: [
      {
        name: "tgl",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 31,
        },
        description: "Day of birth (e.g., 1).",
        example: "1",
      },
      {
        name: "bln",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 12,
        },
        description: "Month of birth (e.g., 1 for January).",
        example: "1",
      },
      {
        name: "thn",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 1900,
          maximum: 2025,
        },
        description: "Year of birth (e.g., 2025).",
        example: "2025",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { tgl, bln, thn } = req.query || {}

      if (!tgl || !bln || !thn) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' are required",
          code: 400,
        }
      }

      const parsedTgl = parseInt(tgl as string)
      const parsedBln = parseInt(bln as string)
      const parsedThn = parseInt(thn as string)

      if (isNaN(parsedTgl) || isNaN(parsedBln) || isNaN(parsedThn)) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' must be valid numbers",
          code: 400,
        }
      }

      if (parsedTgl < 1 || parsedTgl > 31) {
        return {
          status: false,
          error: "Day 'tgl' must be between 1 and 31",
          code: 400,
        }
      }

      if (parsedBln < 1 || parsedBln > 12) {
        return {
          status: false,
          error: "Month 'bln' must be between 1 and 12",
          code: 400,
        }
      }

      const currentYear = new Date().getFullYear()
      if (parsedThn < 1900 || parsedThn > currentYear) {
        return {
          status: false,
          error: `Year 'thn' must be between 1900 and ${currentYear}`,
          code: 400,
        }
      }

      try {
        const result = await scrapeRejekiHokiWeton(
          parsedTgl.toString(),
          parsedBln.toString(),
          parsedThn.toString(),
        )

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
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
    endpoint: "/api/primbon/rejeki_hoki_weton",
    name: "rejeki hoki weton",
    category: "Primbon",
    description:
      "This API endpoint provides luck and fortune predictions based on Javanese Wetons. Users input their birth day, month, and year in the request body, and the API returns their Weton (day of birth combination) and a prediction regarding their fortune or 'rejeki'. It also includes a philosophical note emphasizing effort over pure prediction. This endpoint is useful for those interested in Javanese cultural beliefs about destiny and prosperity.",
    tags: ["Primbon", "Weton", "Fortune", "Luck", "Javanese", "Culture", "Prediction"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["tgl", "bln", "thn"],
            properties: {
              tgl: {
                type: "integer",
                description: "Day of birth (e.g., 1).",
                example: 1,
                minimum: 1,
                maximum: 31,
              },
              bln: {
                type: "integer",
                description: "Month of birth (e.g., 1 for January).",
                example: 1,
                minimum: 1,
                maximum: 12,
              },
              thn: {
                type: "integer",
                description: "Year of birth (e.g., 2025).",
                example: 2025,
                minimum: 1900,
                maximum: 2025,
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
      const { tgl, bln, thn } = req.body || {}

      if (!tgl || !bln || !thn) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' are required",
          code: 400,
        }
      }

      const parsedTgl = tgl as number
      const parsedBln = bln as number
      const parsedThn = thn as number

      if (isNaN(parsedTgl) || isNaN(parsedBln) || isNaN(parsedThn)) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' must be valid numbers",
          code: 400,
        }
      }

      if (parsedTgl < 1 || parsedTgl > 31) {
        return {
          status: false,
          error: "Day 'tgl' must be between 1 and 31",
          code: 400,
        }
      }

      if (parsedBln < 1 || parsedBln > 12) {
        return {
          status: false,
          error: "Month 'bln' must be between 1 and 12",
          code: 400,
        }
      }

      const currentYear = new Date().getFullYear()
      if (parsedThn < 1900 || parsedThn > currentYear) {
        return {
          status: false,
          error: `Year 'thn' must be between 1900 and ${currentYear}`,
          code: 400,
        }
      }

      try {
        const result = await scrapeRejekiHokiWeton(
          parsedTgl.toString(),
          parsedBln.toString(),
          parsedThn.toString(),
        )

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
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