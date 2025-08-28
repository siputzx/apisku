import axios from "axios"
import * as cheerio from "cheerio"

interface LinkData {
  title: string
  link: string
  thumb: string | undefined
  view: string
  vote: string
  tag: string
  comment: string
}

async function fetchDetailedData(linkData: LinkData) {
  try {
    const res = await axios.get(linkData.link, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(res.data)
    return {
      title: linkData.title,
      source: linkData.link,
      thumb: linkData.thumb,
      tag: $("div.site-main > div > header > div > div > p").text(),
      upload: $("div.site-main")
        .find("span.auth-posted-on > time:nth-child(2)")
        .text(),
      author: $("div.site-main").find("span.auth-name.mf-hide > a").text(),
      comment: linkData.comment,
      vote: linkData.vote,
      view: $("div.site-main")
        .find(
          "span.post-meta-item.post-views.s-post-views.size-lg > span.count",
        )
        .text(),
      video1: $("div.site-main").find("video > source").attr("src"),
      video2: $("div.site-main").find("video > a").attr("href"),
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Fetching detailed data failed")
  }
}

async function scrapSeegore() {
  try {
    const page = Math.floor(Math.random() * 228)
    const res = await axios.get(`https://seegore.com/gore/page/${page}`, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(res.data)
    const links: LinkData[] = $("ul > li > article")
      .map((i, el) => ({
        title: $(el).find("div.content > header > h2").text(),
        link: $(el).find("div.post-thumbnail > a").attr("href") || "",
        thumb: $(el).find("div.post-thumbnail > a > div > img").attr("src"),
        view: $(el)
          .find(
            "div.post-thumbnail > div.post-meta.bb-post-meta.post-meta-bg > span.post-meta-item.post-views",
          )
          .text(),
        vote: $(el)
          .find(
            "div.post-thumbnail > div.post-meta.bb-post-meta.post-meta-bg > span.post-meta-item.post-votes",
          )
          .text(),
        tag: $(el).find("div.content > header > div > div.bb-cat-links").text(),
        comment: $(el)
          .find("div.content > header > div > div.post-meta.bb-post-meta > a")
          .text(),
      }))
      .get()

    if (links.length === 0) {
      throw new Error("No links found on the scraped page.")
    }

    const randomLink = links[Math.floor(Math.random() * links.length)]

    const detailedData = await fetchDetailedData(randomLink)
    return detailedData
  } catch (error: any) {
    console.error("Scraping Error:", error.message)
    throw new Error("Scraping failed")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/seegore",
    name: "seegore",
    category: "Random",
    description: "This API endpoint provides random posts from Seegore, a website containing gore content. It scrapes a random page from the site, extracts details of available posts (title, link, thumbnail, views, votes, tags, comments), selects one randomly, and then fetches more detailed information including video sources. This endpoint is intended for specific applications that require access to such content, with a clear warning about its explicit nature.",
    tags: ["Random", "Gore", "Video", "Scraper", "Explicit"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await scrapSeegore()
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
    endpoint: "/api/r/seegore",
    name: "seegore",
    category: "Random",
    description: "This API endpoint allows you to retrieve random posts from Seegore, a website featuring gore content, via a POST request. It scrapes a random page, gathers post details like title, link, thumbnail, view count, vote count, tags, and comments. Subsequently, it selects a random post and retrieves its detailed information, including direct video links. This endpoint is designed for applications requiring explicit content, and developers should be aware of the nature of the data provided.",
    tags: ["Random", "Gore", "Video", "Scraper", "Explicit"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await scrapSeegore()
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