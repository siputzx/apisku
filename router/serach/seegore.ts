import axios from "axios"
import * as cheerio from "cheerio"

async function ssearchgore(query: string) {
  try {
    const dataa = await axios.get("https://seegore.com/?s=" + query)
    const $$$ = cheerio.load(dataa.data)
    let pagina = $$$(
      "#main > div.container.main-container > div > div.bb-col.col-content > div > div > div > div > nav > ul > li:nth-child(4) > a",
    ).text()
    let slink = "https://seegore.com/?s=" + query
    const { data } = await axios.get(slink)
    const $ = cheerio.load(data)
    const link: string[] = []
    const judul: string[] = []
    const uploader: string[] = []
    const format: {
      judul: string
      uploader: string
      thumb: string
      link: string
    }[] = []
    const thumb: string[] = []
    $("#post-items > li > article > div.content > header > h2 > a").each(
      function (a, b) {
        link.push($(b).attr("href") as string)
      },
    )
    $("#post-items > li > article > div.content > header > h2 > a").each(
      function (c, d) {
        let jud = $(d).text()
        judul.push(jud)
      },
    )
    $(
      "#post-items > li > article > div.content > header > div > div.bb-cat-links > a",
    ).each(function (e, f) {
      let upl = $(f).text()
      uploader.push(upl)
    })
    $(
      "#post-items > li > article > div.post-thumbnail > a > div > img",
    ).each(function (g, h) {
      thumb.push($(h).attr("src") as string)
    })
    for (let i = 0; i < link.length; i++) {
      format.push({
        judul: judul[i],
        uploader: uploader[i],
        thumb: thumb[i],
        link: link[i],
      })
    }
    return format
  } catch (error: any) {
    throw new Error(`Error searching Seegore: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/seegore",
    name: "seegore",
    category: "Search",
    description:
      "This API allows users to search for videos on Seegore.com using a search query. It scrapes the website for relevant video results and returns details such as video title, uploader, thumbnail, and a direct link to the video. This can be used to integrate Seegore search functionality into applications or bots, providing access to their video content based on user-defined keywords.",
    tags: ["Search", "Video", "Scraper"],
    example: "?query=train",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Search query",
        example: "train",
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

      if (query.length > 100) {
        return {
          status: false,
          error: "Query must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await ssearchgore(query.trim())

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
    endpoint: "/api/s/seegore",
    name: "seegore",
    category: "Search",
    description:
      "This API allows users to search for videos on Seegore.com using a search query via a POST request with a JSON body. It scrapes the website for relevant video results and returns details such as video title, uploader, thumbnail, and a direct link to the video. This can be used to integrate Seegore search functionality into applications or bots, providing access to their video content based on user-defined keywords.",
    tags: ["Search", "Video", "Scraper"],
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
                description: "Search query",
                example: "train",
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

      if (query.length > 100) {
        return {
          status: false,
          error: "Query must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await ssearchgore(query.trim())

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