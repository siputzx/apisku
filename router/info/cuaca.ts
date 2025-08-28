import axios from "axios"

class WilayahService {
  private baseUrl: string
  private bmkgUrl: string

  constructor() {
    this.baseUrl =
      "https://raw.githubusercontent.com/kodewilayah/permendagri-72-2019/main/dist/base.csv"
    this.bmkgUrl = "https://api.bmkg.go.id/publik/prakiraan-cuaca"
  }

  private determineBMKGUrl(code: string): string {
    const dots = (code.match(/\./g) || []).length
    const admLevel = dots + 1
    return `${this.bmkgUrl}?adm${admLevel}=${code}`
  }

  private parseWilayahCode(code: string) {
    const parts = code.split(".")
    const levels = {
      adm1: parts[0],
      adm2: parts.length >= 2 ? parts.slice(0, 2).join(".") : null,
      adm3: parts.length >= 3 ? parts.slice(0, 3).join(".") : null,
      adm4: parts.length >= 4 ? parts.slice(0, 4).join(".") : null,
    }

    const highestLevel = Object.entries(levels)
      .reverse()
      .find(([_key, value]) => value !== null)

    return {
      ...levels,
      currentLevel: highestLevel ? highestLevel[0] : "adm1",
      bmkgUrl: this.determineBMKGUrl(code),
    }
  }

  private calculateSimilarity(searchQuery: string, targetText: string): number {
    const query = searchQuery.toLowerCase()
    const target = targetText.toLowerCase()

    const queryWords = query.split(" ").filter((w) => w.length > 0)
    const targetWords = target.split(" ").filter((w) => w.length > 0)

    let wordMatchScore = 0
    let exactMatchBonus = 0

    for (const queryWord of queryWords) {
      let bestWordScore = 0

      for (const targetWord of targetWords) {
        if (queryWord === targetWord) {
          bestWordScore = 1
          exactMatchBonus += 0.2
          break
        }

        if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) {
          const matchLength = Math.min(queryWord.length, targetWord.length)
          const maxLength = Math.max(queryWord.length, targetWord.length)
          const partialScore = matchLength / maxLength
          bestWordScore = Math.max(bestWordScore, partialScore)
        }
      }

      wordMatchScore += bestWordScore
    }

    const normalizedWordScore = wordMatchScore / queryWords.length
    return normalizedWordScore + exactMatchBonus
  }

  async searchWilayah(query: string) {
    try {
      const response = await axios.get(this.baseUrl)
      const data = response.data
      const rows = data.split("\n")

      const results = []

      for (const row of rows) {
        if (!row.trim()) continue

        const [kode, nama] = row.split(",")
        if (!nama) continue

        const similarity = this.calculateSimilarity(query, nama)
        const threshold = query.length <= 4 ? 0.4 : 0.3

        if (similarity > threshold) {
          const wilayahInfo = this.parseWilayahCode(kode)
          results.push({
            kode,
            nama,
            score: similarity,
            ...wilayahInfo,
          })
        }
      }

      results.sort((a, b) => b.score - a.score)

      return results.slice(0, 10)
    } catch (error: any) {
      console.error("Error dalam pencarian wilayah:", error.message)
      throw new Error("Failed to search wilayah data")
    }
  }

  async getWeatherData(wilayahCode: string) {
    try {
      const url = this.determineBMKGUrl(wilayahCode)
      const response = await axios.get(url, { timeout: 30000 })
      return response.data.data
    } catch (error: any) {
      console.error("Error dalam mengambil data cuaca:", error.message)
      throw new Error("Failed to get weather data from API")
    }
  }

  async scrape(query: string) {
    try {
      const wilayahResults = await this.searchWilayah(query)

      if (wilayahResults.length > 0) {
        const topResult = wilayahResults[0]
        const weatherData = await this.getWeatherData(topResult.kode)

        return {
          wilayah: topResult,
          weather: weatherData,
        }
      }
      return null
    } catch (error: any) {
      console.error("Error dalam pencarian wilayah dan cuaca:", error.message)
      throw new Error("Failed to get weather and location data")
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/info/cuaca",
    name: "cuaca",
    category: "Info",
    description:
      "This API endpoint provides weather information based on a location query. It searches for relevant administrative regions and retrieves current weather data from the BMKG (Indonesian Agency for Meteorology, Climatology, and Geophysics). Users can input a location name, and the API will return a list of matching regions with their codes, names, similarity scores, and associated weather data if available. This is useful for applications requiring location-specific weather forecasts.",
    tags: ["INFO", "WEATHER", "LOCATION"],
    example: "?q=pasiran jaya",
    parameters: [
      {
        name: "q",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Location query",
        example: "pasiran jaya",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.query || {}

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'q' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await new WilayahService().scrape(q.trim())
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
    endpoint: "/api/info/cuaca",
    name: "cuaca",
    category: "Info",
    description:
      "This API endpoint allows users to retrieve weather information by sending a location query in the request body. It performs a search for relevant administrative regions based on the provided query and fetches corresponding weather data from the BMKG (Indonesian Agency for Meteorology, Climatology, and Geophysics). The response includes matching regions with their codes, names, similarity scores, and associated weather data if available. This method is suitable for programmatic access where the query is sent as part of a JSON payload.",
    tags: ["INFO", "WEATHER", "LOCATION"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["q"],
            properties: {
              q: {
                type: "string",
                description: "The query string to search for a location",
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
      const { q } = req.body || {}

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'q' must be a non-empty string in the request body",
          code: 400,
        }
      }

      try {
        const result = await new WilayahService().scrape(q.trim())
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