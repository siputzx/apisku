import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeTafsirMimpi(mimpi: string) {
  try {
    const response = await axios.get(
      "https://www.primbon.com/tafsir_mimpi.php",
      {
        params: {
          mimpi: mimpi,
          submit: "+Submit+",
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        timeout: 10000,
      },
    )

    const $ = cheerio.load(response.data)
    const results: { mimpi: string; tafsir: string }[] = []

    const content = $("#body").text()
    const mimpiRegex = new RegExp(`Mimpi.*?${mimpi}.*?(?=Mimpi|$)`, "gi")
    const matches = content.match(mimpiRegex)

    if (matches) {
      matches.forEach((match) => {
        const cleanText = match
          .trim()
          .replace(/\s+/g, " ")
          .replace(/\n/g, " ")

        const parts = cleanText.split("=")
        if (parts.length === 2) {
          results.push({
            mimpi: parts[0].trim().replace(/^Mimpi\s+/, ""),
            tafsir: parts[1].trim(),
          })
        }
      })
    }

    const solusiMatch = $("#body").text().match(/Solusi.*?Amien\.\./s)
    const solusi = solusiMatch ? solusiMatch[0].trim() : null

    return {
      keyword: mimpi,
      hasil: results,
      total: results.length,
      solusi: solusi,
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/primbon/tafsirmimpi",
    name: "tafsir mimpi",
    category: "Primbon",
    description:
      "This API endpoint interprets dreams based on Primbon, a traditional Javanese and Balinese divination system. Users can input a keyword representing their dream, and the API will return a list of interpretations related to that keyword, along with a general solution or advice. This endpoint is useful for those seeking traditional insights into the meanings of their dreams.",
    tags: ["Primbon", "Dream", "Interpretation", "Tafsir Mimpi", "Divination", "Culture"],
    example: "?mimpi=bertemu",
    parameters: [
      {
        name: "mimpi",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "The dream keyword to interpret (e.g., 'bertemu' for meeting, 'ular' for snake).",
        example: "bertemu",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { mimpi } = req.query || {}

      if (!mimpi) {
        return {
          status: false,
          error: "Parameter 'mimpi' is required",
          code: 400,
        }
      }

      if (typeof mimpi !== "string" || mimpi.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'mimpi' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeTafsirMimpi(mimpi.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          message: "Success",
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
    endpoint: "/api/primbon/tafsirmimpi",
    name: "tafsir mimpi",
    category: "Primbon",
    description:
      "This API endpoint interprets dreams based on Primbon, a traditional Javanese and Balinese divination system. Users can input a keyword representing their dream in the request body, and the API will return a list of interpretations related to that keyword, along with a general solution or advice. This endpoint is useful for those seeking traditional insights into the meanings of their dreams.",
    tags: ["Primbon", "Dream", "Interpretation", "Tafsir Mimpi", "Divination", "Culture"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["mimpi"],
            properties: {
              mimpi: {
                type: "string",
                description: "The dream keyword to interpret (e.g., 'bertemu' for meeting, 'ular' for snake).",
                example: "bertemu",
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
      const { mimpi } = req.body || {}

      if (!mimpi) {
        return {
          status: false,
          error: "Parameter 'mimpi' is required",
          code: 400,
        }
      }

      if (typeof mimpi !== "string" || mimpi.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'mimpi' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeTafsirMimpi(mimpi.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          message: "Success",
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