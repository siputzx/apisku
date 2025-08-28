import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeZodiak(zodiak: string) {
  try {
    const { data } = await axios.get(
      `https://primbon.com/zodiak/${zodiak}.htm`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        timeout: 10000,
      },
    )
    const $ = cheerio.load(data)

    let fetchText = $("#body")
      .text()
      .replace(/\s{2,}/g, " ")
      .replace(/[\n\r\t]+/g, " ")
      .replace(
        /\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\);/g,
        "",
      )
      .replace(/<<+\s*Kembali/g, "")
      .trim()

    const hasil = {
      zodiak: fetchText.split("Nomor Keberuntungan:")[0].trim(),
      nomor_keberuntungan: fetchText
        .split("Nomor Keberuntungan: ")[1]
        .split(" Aroma Keberuntungan:")[0]
        .trim(),
      aroma_keberuntungan: fetchText
        .split("Aroma Keberuntungan: ")[1]
        .split(" Planet Yang Mengitari:")[0]
        .trim(),
      planet_yang_mengitari: fetchText
        .split("Planet Yang Mengitari: ")[1]
        .split(" Bunga Keberuntungan:")[0]
        .trim(),
      bunga_keberuntungan: fetchText
        .split("Bunga Keberuntungan: ")[1]
        .split(" Warna Keberuntungan:")[0]
        .trim(),
      warna_keberuntungan: fetchText
        .split("Warna Keberuntungan: ")[1]
        .split(" Batu Keberuntungan:")[0]
        .trim(),
      batu_keberuntungan: fetchText
        .split("Batu Keberuntungan: ")[1]
        .split(" Elemen Keberuntungan:")[0]
        .trim(),
      elemen_keberuntungan: fetchText
        .split("Elemen Keberuntungan: ")[1]
        .split(" Pasangan Serasi:")[0]
        .trim(),
      pasangan_zodiak: fetchText
        .split("Pasangan Serasi: ")[1]
        .split("<<<< Kembali")[0]
        .trim(),
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
    endpoint: "/api/primbon/zodiak",
    name: "zodiak",
    category: "Primbon",
    description:
      "This API endpoint retrieves detailed information for a specific zodiac sign from Primbon. Users provide the name of a zodiac sign, and the API returns various attributes associated with it, including lucky numbers, lucky aromas, ruling planet, lucky flower, lucky color, lucky stone, lucky element, and compatible zodiac signs. This endpoint is useful for those interested in astrology and traditional Primbon insights related to zodiac signs.",
    tags: ["Primbon", "Zodiac", "Astrology", "Horoscope", "Lucky", "Fortune"],
    example: "?zodiak=gemini",
    parameters: [
      {
        name: "zodiak",
        in: "query",
        required: true,
        schema: {
          type: "string",
          enum: [
            "aries",
            "taurus",
            "gemini",
            "cancer",
            "leo",
            "virgo",
            "libra",
            "scorpio",
            "sagitarius",
            "capricorn",
            "aquarius",
            "pisces",
          ],
        },
        description: "The name of the zodiac sign (e.g., 'gemini').",
        example: "gemini",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { zodiak } = req.query || {}

      if (!zodiak) {
        return {
          status: false,
          error: "Parameter 'zodiak' is required",
          code: 400,
        }
      }

      if (typeof zodiak !== "string" || zodiak.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'zodiak' must be a non-empty string",
          code: 400,
        }
      }

      const lowerCaseZodiak = zodiak.toLowerCase()
      const validZodiacSigns = [
        "aries",
        "taurus",
        "gemini",
        "cancer",
        "leo",
        "virgo",
        "libra",
        "scorpio",
        "sagitarius",
        "capricorn",
        "aquarius",
        "pisces",
      ]

      if (!validZodiacSigns.includes(lowerCaseZodiak)) {
        return {
          status: false,
          error: `Invalid zodiac sign: '${zodiak}'. Please provide a valid zodiac sign from the list: ${validZodiacSigns.join(", ")}.`,
          code: 400,
        }
      }

      try {
        const result = await scrapeZodiak(lowerCaseZodiak)

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
    endpoint: "/api/primbon/zodiak",
    name: "zodiak",
    category: "Primbon",
    description:
      "This API endpoint retrieves detailed information for a specific zodiac sign from Primbon. Users provide the name of a zodiac sign in the request body, and the API returns various attributes associated with it, including lucky numbers, lucky aromas, ruling planet, lucky flower, lucky color, lucky stone, lucky element, and compatible zodiac signs. This endpoint is useful for those interested in astrology and traditional Primbon insights related to zodiac signs.",
    tags: ["Primbon", "Zodiac", "Astrology", "Horoscope", "Lucky", "Fortune"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["zodiak"],
            properties: {
              zodiak: {
                type: "string",
                description: "The name of the zodiac sign (e.g., 'gemini').",
                example: "gemini",
                enum: [
                  "aries",
                  "taurus",
                  "gemini",
                  "cancer",
                  "leo",
                  "virgo",
                  "libra",
                  "scorpio",
                  "sagitarius",
                  "capricorn",
                  "aquarius",
                  "pisces",
                ],
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
      const { zodiak } = req.body || {}

      if (!zodiak) {
        return {
          status: false,
          error: "Parameter 'zodiak' is required",
          code: 400,
        }
      }

      if (typeof zodiak !== "string" || zodiak.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'zodiak' must be a non-empty string",
          code: 400,
        }
      }

      const lowerCaseZodiak = zodiak.toLowerCase()
      const validZodiacSigns = [
        "aries",
        "taurus",
        "gemini",
        "cancer",
        "leo",
        "virgo",
        "libra",
        "scorpio",
        "sagitarius",
        "capricorn",
        "aquarius",
        "pisces",
      ]

      if (!validZodiacSigns.includes(lowerCaseZodiak)) {
        return {
          status: false,
          error: `Invalid zodiac sign: '${zodiak}'. Please provide a valid zodiac sign from the list: ${validZodiacSigns.join(", ")}.`,
          code: 400,
        }
      }

      try {
        const result = await scrapeZodiak(lowerCaseZodiak)

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