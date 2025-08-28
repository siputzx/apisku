import axios from "axios"
import * as cheerio from "cheerio"
import moment from "moment"

const base_url = "https://www.cnnindonesia.com"

async function scrapeCNNIndonesiaNews() {
  try {
    const response = await axios.get(base_url)
    const $ = cheerio.load(response.data)
    const isi = $("div.nhl-list article.flex-grow")
    const result: any[] = []

    for (let i = 0; i < isi.length; i++) {
      const e = isi[i]
      const tagA = $("a.flex", e)

      if (tagA && tagA.attr("dtr-ttl")) {
        const title = tagA.attr("dtr-ttl")?.replace("\n", "").trim()
        const image_thumbnail = $("img", tagA).attr("src")
        const link = tagA.attr("href")

        if (!title || !image_thumbnail || !link) {
          continue
        }

        const url = new URL(image_thumbnail)
        const search_params = url.searchParams
        search_params.set("w", "1024")
        search_params.set("q", "100")
        url.search = search_params.toString()
        const image_full = url.toString()

        const timeMatch = link.split("/")[4]?.split("-")[0]
        const newTime = timeMatch
          ? moment(timeMatch, "YYYYMMDDhh:mm:ss").format("YYYY-MM-DD hh:mm")
          : ""
        const slug = link ? link.replace(base_url, "") : ""

        let content = ""
        try {
          const detailResponse = await axios.get(link)
          const $detail = cheerio.load(detailResponse.data)
          const contentElement = $detail("div.detail-wrap.flex.gap-4.relative")

          $("script", contentElement).remove()
          $("style", contentElement).remove()
          $(".paradetail", contentElement).remove()
          $(".detail_ads", contentElement).remove()
          $(".linksisip", contentElement).remove()
          $(".embed.videocnn", contentElement).remove()

          content = contentElement
            .text()
            .replace(/\\n/g, "")
            .replace(/Bagikan:/g, "")
            .replace(/url telah tercopy/g, "")
            .replace(/dis\/tsa/g, "")
            .replace(/tim\/mik/g, "")
            .replace(/Gambas:Video CNN/g, "")
            .replace(/\s{2,}/g, " ")
            .trim()
        } catch (err: any) {
          console.error(`Failed to fetch content for link: ${link}`, err.message)
        }

        result.push({
          title: title,
          image_thumbnail: image_thumbnail,
          image_full: image_full,
          time: newTime,
          link: link,
          slug: slug,
          content: content,
        })
      }
    }

    return result
  } catch (error: any) {
    console.error("Error scraping CNN Indonesia News:", error)
    throw new Error(error.message || "Failed to scrape CNN Indonesia News")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/berita/cnn",
    name: "cnn Indonesia",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines and detailed content from CNN Indonesia. It scrapes the main news feed, extracting information such as the article title, thumbnail image, full-sized image, publication timestamp, original link, and a clean slug. Additionally, it attempts to fetch and sanitize the full article content, removing unwanted elements like scripts, styles, and advertisements, to provide a clean text representation. This API is valuable for news aggregation, content analysis, or any application requiring comprehensive and up-to-date news from CNN Indonesia.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeCNNIndonesiaNews()
        return { status: true, data: data, timestamp: new Date().toISOString() }
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
    endpoint: "/api/berita/cnn",
    name: "cnn Indonesia",
    category: "Berita",
    description:
      "This API endpoint allows you to retrieve the latest news headlines and detailed content from CNN Indonesia. It scrapes the main news feed, extracting information such as the article title, thumbnail image, full-sized image, publication timestamp, original link, and a clean slug. Additionally, it attempts to fetch and sanitize the full article content, removing unwanted elements like scripts, styles, and advertisements, to provide a clean text representation. This API is valuable for news aggregation, content analysis, or any application requiring comprehensive and up-to-date news from CNN Indonesia.",
    tags: ["BERITA", "NEWS", "INDONESIA", "CURRENT EVENTS"],
    example: "",
    requestBody: {
      required: false,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeCNNIndonesiaNews()
        return { status: true, data: data, timestamp: new Date().toISOString() }
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