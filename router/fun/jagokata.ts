import * as cheerio from "cheerio"
import axios from "axios"

async function scrape(q: string) {
  try {
    const response = await axios.post(
      "https://jagokata.com/kata-bijak/cari.html",
      new URLSearchParams({
        citaat: q,
        zoekbutton: "Zoeken",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 30000,
      },
    )
    const data = response.data
    const $ = cheerio.load(data)

    return $(
      "#main #content #content-container #images-container ul li, #main #content #content-container #citatenrijen li",
    )
      .map((_, el) => ({
        quote: $(el).find(".quotebody .fbquote").text().trim(),
        link: `https://jagokata.com${$(el).find("a").attr("href")}`,
        img: $(el).find(".quotebody img").attr("data-src"),
        author: $(el)
          .find(".citatenlijst-auteur > a, .auteurfbnaam")
          .text()
          .trim(),
        description: $(el)
          .find(".citatenlijst-auteur > .auteur-beschrijving")
          .text()
          .trim(),
        lifespan: $(el)
          .find(".citatenlijst-auteur > .auteur-gebsterf")
          .text()
          .trim(),
        votes: $(el).find(".votes-content > .votes-positive").text().trim(),
        category: $("#main").find("h1.kamus").text().trim(),
        tags: $(el).attr("id"),
      }))
      .get()
  } catch (error: any) {
    throw new Error("Error fetching data from JagoKata: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/fun/jagokata",
    name: "jagokata",
    category: "Fun",
    description:
      "This API endpoint allows you to search for quotes on jagokata.com, a popular Indonesian website for quotes and sayings. By providing a search query, you can retrieve a list of relevant quotes, along with details such as the author, description, lifespan, number of votes, category, and associated tags. This API is useful for applications that require a collection of wisdom, inspiration, or famous sayings.",
    tags: ["Fun", "Quotes", "Motivation", "Inspiration"],
    example: "?q=kesuksesan",
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
        description: "The query to search for quotes",
        example: "kesuksesan",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.query || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      if (q.length > 100) {
        return {
          status: false,
          error: "Query parameter must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(q.trim())
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
    endpoint: "/api/fun/jagokata",
    name: "jagokata",
    category: "Fun",
    description:
      "This API endpoint allows you to search for quotes on jagokata.com, a popular Indonesian website for quotes and sayings. By providing a search query in the request body, you can retrieve a list of relevant quotes, along with details such as the author, description, lifespan, number of votes, category, and associated tags. This API is useful for applications that require a collection of wisdom, inspiration, or famous sayings.",
    tags: ["Fun", "Quotes", "Motivation", "Inspiration"],
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
                description: "The query to search for quotes",
                example: "kesuksesan",
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

      if (!q) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      if (q.length > 100) {
        return {
          status: false,
          error: "Query parameter must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(q.trim())
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