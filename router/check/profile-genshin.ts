import { chromium } from "playwright-extra"
import stealth from "puppeteer-extra-plugin-stealth"
import * as cheerio from "cheerio"
import fs from "fs"

async function scrapeEnkaNetwork(uid: string) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(`https://enka.network/u/${uid}/`, {
      waitUntil: "networkidle",
    })
    await page.waitForSelector(".PlayerInfo")
    const content = await page.content()
    const $ = cheerio.load(content)

    const playerData = {
      username: $(".PlayerInfo h1").text().trim(),
      avatar: "https://enka.network" + $(".PlayerInfo figure.avatar-icon img").attr("src"),
      adventureRank: $(".PlayerInfo .ar").text().split("WL")[0].trim(),
      worldLevel: "WL " + $(".PlayerInfo .ar").text().split("WL")[1].trim(),
      signature: $(".PlayerInfo .signature").text().trim(),
      stats: {
        totalAchievement: $(".stats .stat").eq(0).find("td").first().text().trim(),
        spiralAbyss: $(".stats .stat").eq(1).find("td").first().text().trim(),
        theater: $(".stats .stat").eq(2).find("td").first().text().trim(),
      },
    }

    const cardElements = await page.$$(".card-scroll .Card")
    const characterCards: string[] = []

    for (let i = 0; i < cardElements.length; i++) {
      const cardScreenshot = await cardElements[i].screenshot()
      characterCards.push(cardScreenshot.toString("base64"))
    }

    await browser.close()

    return {
      playerData,
      characterCards,
    }
  } catch (error: any) {
    await browser.close()
    throw new Error("Error scraping Enka Network: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/check/genshin",
    name: "check genshin",
    category: "Check",
    description:
      "This API endpoint allows you to retrieve detailed Genshin Impact player information from Enka.Network using their in-game UID via query parameters. It provides player statistics like username, adventure rank, world level, signature, and combat stats. Additionally, it captures screenshots of the player's character build cards, which are then converted into accessible image URLs. This is useful for players and communities looking to quickly view and share Genshin Impact character builds and player progress.",
    tags: ["CHECK", "Genshin Impact", "Enka Network", "Player Stats"],
    example: "?uid=856012067",
    parameters: [
      {
        name: "uid",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 20,
        },
        description: "The UID of the Genshin Impact player",
        example: "856012067",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, saveMedia }) {
      const { uid } = req.query || {}

      if (!uid) {
        return {
          status: false,
          error: "Parameter 'uid' is required.",
          code: 400,
        }
      }

      if (typeof uid !== "string" || uid.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'uid' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const result = await scrapeEnkaNetwork(uid.trim())

        const characterCardURLs: string[] = []
        for (let i = 0; i < result.characterCards.length; i++) {
          const cardURL = await saveMedia(
            Buffer.from(result.characterCards[i], "base64"),
            "png",
          )
          characterCardURLs.push(cardURL)
        }
        result.characterCards = characterCardURLs

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Failed to scrape Enka Network data.",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/check/genshin",
    name: "check genshin",
    category: "Check",
    description:
      "This API endpoint allows you to retrieve detailed Genshin Impact player information from Enka.Network using their in-game UID via a JSON request body. It provides player statistics like username, adventure rank, world level, signature, and combat stats. Additionally, it captures screenshots of the player's character build cards, which are then converted into accessible image URLs. This is useful for players and communities looking to quickly view and share Genshin Impact character builds and player progress.",
    tags: ["CHECK", "Genshin Impact", "Enka Network", "Player Stats"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["uid"],
            properties: {
              uid: {
                type: "string",
                description: "The UID of the Genshin Impact player",
                example: "856012067",
                minLength: 1,
                maxLength: 20,
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
    async run({ req, saveMedia }) {
      const { uid } = req.body || {}

      if (!uid) {
        return {
          status: false,
          error: "Parameter 'uid' is required in the JSON body.",
          code: 400,
        }
      }

      if (typeof uid !== "string" || uid.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'uid' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const result = await scrapeEnkaNetwork(uid.trim())

        const characterCardURLs: string[] = []
        for (let i = 0; i < result.characterCards.length; i++) {
          const cardURL = await saveMedia(
            Buffer.from(result.characterCards[i], "base64"),
            "png",
          )
          characterCardURLs.push(cardURL)
        }
        result.characterCards = characterCardURLs

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Failed to scrape Enka Network data.",
          code: 500,
        }
      }
    },
  },
]