import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeChordsSearch(music: string) {
  try {
    const searchUri = `https://www.gitagram.com/index.php?cat=&s=${encodeURIComponent(music)}`
    const { data } = await axios.get(searchUri, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(data)

    let results: { title: string, artist: string, link: string, type: string }[] = []
    $("table.table tbody tr").each((index, element) => {
      let title = $(element).find("span.title.is-6").text().trim()
      let artist = $(element)
        .find("span.subtitle.is-6")
        .text()
        .replace("&#8227; ", "")
        .trim()
      let link = $(element).find("a").attr("href")
      let type = $(element).find("span.title.is-7").text().trim()

      if (title && artist && link && type) {
        results.push({ title, artist, link, type })
      }
    })
    return results
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from Gitagram search API")
  }
}

async function scrapeChordsDetail(url: string) {
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(response.data)

    const chordsElement = $("pre[data-key]")
    const rawText = chordsElement.text()
    const lines = rawText.split("\n")

    let result = ""
    let currentSection = ""

    lines.forEach((line) => {
      const sectionMatch = line.match(/^\[([^\]]+)\]/)
      if (sectionMatch) {
        currentSection = sectionMatch[1]
        result += `[${currentSection}]\n`
        return
      }

      const chordMatch = line.match(
        /^(\s*(?:\[[^\]]+\])?(?:\s*[A-G][#m]* ?)*)/,
      )
      if (chordMatch && chordMatch[1].trim()) {
        result += line.trim() + "\n"
        return
      }

      const cleanLyric = line.replace(/<[^>]*>/g, "").trim()
      if (cleanLyric) {
        result += cleanLyric + "\n"
      }
    })
    return result.trim()
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from Gitagram detail API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/gitagram",
    name: "gitagram",
    category: "Search",
    description: "This API endpoint allows users to search for music chords on Gitagram by providing a music title or artist. It scrapes the search results from Gitagram and then retrieves the detailed chord information for each result, providing a comprehensive set of data including the song title, artist, direct link to the chords, type of content, and the full chord sheet. This API is useful for musicians, developers building music applications, or anyone looking to quickly access guitar or piano chords for a specific song.",
    tags: ["Search", "Music", "Chords"],
    example: "?search=sekuat%20hatimu",
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
        description: "Music title or artist",
        example: "sekuat hatimu",
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

      try {
        const results = await scrapeChordsSearch(search.trim())

        if (!results.length) {
          return {
            status: true,
            data: [],
            timestamp: new Date().toISOString(),
          }
        }

        const detailedResults: any[] = []
        for (let item of results) {
          const detail = await scrapeChordsDetail(item.link)
          detailedResults.push({
            ...item,
            detail,
          })
        }

        return {
          status: true,
          data: detailedResults,
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
    endpoint: "/api/s/gitagram",
    name: "gitagram",
    category: "Search",
    description: "This API endpoint allows users to search for music chords on Gitagram by providing a music title or artist in the request body. It scrapes the search results from Gitagram and then retrieves the detailed chord information for each result, providing a comprehensive set of data including the song title, artist, direct link to the chords, type of content, and the full chord sheet. This API is useful for musicians, developers building music applications, or anyone looking to quickly access guitar or piano chords for a specific song.",
    tags: ["Search", "Music", "Chords"],
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
                description: "Music title or artist",
                example: "sekuat hatimu",
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

      try {
        const results = await scrapeChordsSearch(search.trim())

        if (!results.length) {
          return {
            status: true,
            data: [],
            timestamp: new Date().toISOString(),
          }
        }

        const detailedResults: any[] = []
        for (let item of results) {
          const detail = await scrapeChordsDetail(item.link)
          detailedResults.push({
            ...item,
            detail,
          })
        }

        return {
          status: true,
          data: detailedResults,
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